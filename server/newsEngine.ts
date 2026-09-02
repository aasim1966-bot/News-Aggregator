import Parser from 'rss-parser';
import { CategoryType, FeedSource, NewsArticle, SyncLog, SyncStatus } from '../src/types';
import { RELIABLE_SOURCES, INITIAL_CURATED_ARTICLES } from './sources';
import { deduplicateNewsItems, RawIngestedItem } from './deduplicator';
import { rewriteNewsArticle, resolveArticleImage, VALID_CATEGORIES } from './rewriter';

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_LOGS = 30;

function parseNormalizedDate(item: any): string {
  const candidate = item.isoDate || item.pubDate || item.date;
  if (candidate) {
    try {
      const parsed = new Date(candidate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      // ignore
    }
  }
  return new Date().toISOString();
}

function cleanHeadlineTitle(rawTitle: string): { title: string; detectedSource?: string } {
  if (!rawTitle) return { title: '' };
  let title = rawTitle.trim();
  // Strip trailing source attribution e.g. " - Reuters", " - Dawn", " - Geo News"
  const suffixMatch = title.match(/^(.*?)\s*[-|–—]\s*([A-Za-z0-9\s.&]+)$/);
  if (suffixMatch && suffixMatch[1] && suffixMatch[2]) {
    const trailing = suffixMatch[2].trim();
    if (trailing.length < 35) {
      return { title: suffixMatch[1].trim(), detectedSource: trailing };
    }
  }
  return { title };
}

function extractImageFromFeedItem(item: any): string | undefined {
  // 1. Check enclosure tag
  if (item.enclosure?.url && (item.enclosure.type?.includes('image') || item.enclosure.url.match(/\.(jpeg|jpg|gif|png|webp|avif)/i))) {
    return item.enclosure.url;
  }
  // 2. Check media:content
  if (item['media:content']?.['$']?.url) {
    return item['media:content']['$'].url;
  }
  if (Array.isArray(item['media:content'])) {
    const valid = item['media:content'].find((m: any) => m?.['$']?.url && !m['$'].url.includes('1x1'));
    if (valid?.['$']?.url) return valid['$'].url;
  }
  // 3. Check media:thumbnail
  if (item['media:thumbnail']?.['$']?.url) {
    return item['media:thumbnail']['$'].url;
  }
  if (Array.isArray(item['media:thumbnail'])) {
    const valid = item['media:thumbnail'].find((m: any) => m?.['$']?.url);
    if (valid?.['$']?.url) return valid['$'].url;
  }
  // 4. Check media:group
  if (item['media:group']?.['media:content']?.['$']?.url) {
    return item['media:group']['media:content']['$'].url;
  }
  if (item['media:group']?.['media:thumbnail']?.['$']?.url) {
    return item['media:group']['media:thumbnail']['$'].url;
  }
  // 5. Check image property or itunes image
  if (item.image?.url && typeof item.image.url === 'string') {
    return item.image.url;
  }
  if (item['itunes:image']?.['$']?.href) {
    return item['itunes:image']['$'].href;
  }
  // 6. Check HTML content, description, content:encoded for <img src="..." />
  const rawHtml = [
    item['content:encoded'],
    item.content,
    item.description,
    item.summary,
  ].filter(Boolean).join(' ');

  if (rawHtml) {
    // Unescape HTML entities if present (&lt;img ...)
    const decodedHtml = rawHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const match = decodedHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      const src = match[1].trim();
      if (
        src.startsWith('http') &&
        !src.includes('feedburner.com') &&
        !src.includes('doubleclick') &&
        !src.includes('google-analytics') &&
        !src.includes('pixel') &&
        !src.includes('tracking') &&
        !src.includes('1x1') &&
        !src.includes('gravatar')
      ) {
        return src;
      }
    }
  }

  return undefined;
}

export class NewsEngine {
  private static instance: NewsEngine;
  private parser: Parser;
  private articles: NewsArticle[] = [];
  private sources: FeedSource[] = [...RELIABLE_SOURCES];
  private logs: SyncLog[] = [];
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private nextSyncTime: string | null = null;
  private timer: NodeJS.Timeout | null = null;
  private totalArticlesIngested = 0;
  private duplicatesPrevented = 0;

  private constructor() {
    this.parser = new Parser({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NewsAggregator/2.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      customFields: {
        item: [
          ['media:content', 'media:content'],
          ['media:thumbnail', 'media:thumbnail'],
          ['media:group', 'media:group'],
          ['content:encoded', 'content:encoded'],
          ['dc:creator', 'creator'],
          ['enclosure', 'enclosure'],
          ['itunes:image', 'itunes:image'],
        ],
      },
      timeout: 12000,
    });

    this.initialize();
  }

  public static getInstance(): NewsEngine {
    if (!NewsEngine.instance) {
      NewsEngine.instance = new NewsEngine();
    }
    return NewsEngine.instance;
  }

  private async initialize() {
    this.log('info', 'Initializing News Engine with reliable reporting sources...');

    // Load initial curated baseline with multi-source coverage & pictures
    for (const seed of INITIAL_CURATED_ARTICLES) {
      const leadItem: RawIngestedItem = {
        headline: seed.originalHeadline,
        snippet: seed.snippet,
        sourceId: seed.sourceId,
        sourceName: seed.sourceName,
        articleUrl: seed.articleUrl,
        publishedAt: seed.publishedAt,
        author: seed.author,
        category: seed.category,
        imageUrl: seed.imageUrl,
      };

      const duplicates: RawIngestedItem[] = seed.duplicates.map(d => ({
        headline: d.articleTitle,
        sourceId: d.sourceId,
        sourceName: d.sourceName,
        articleUrl: d.articleUrl,
        publishedAt: d.publishedAt,
        author: d.author,
        category: seed.category,
      }));

      const allReferences = [
        {
          sourceId: leadItem.sourceId,
          sourceName: leadItem.sourceName,
          sourceUrl: leadItem.articleUrl,
          articleTitle: leadItem.headline,
          articleUrl: leadItem.articleUrl,
          publishedAt: leadItem.publishedAt,
          author: leadItem.author,
          snippet: leadItem.snippet,
        },
        ...duplicates.map(d => ({
          sourceId: d.sourceId,
          sourceName: d.sourceName,
          sourceUrl: d.articleUrl,
          articleTitle: d.headline,
          articleUrl: d.articleUrl,
          publishedAt: d.publishedAt,
          author: d.author,
        })),
      ];

      const rewritten = await rewriteNewsArticle({
        leadItem,
        duplicates,
        allReferences,
      });

      if (seed.imageUrl) {
        rewritten.imageUrl = seed.imageUrl;
      }

      this.articles.push(rewritten);
    }

    this.totalArticlesIngested = INITIAL_CURATED_ARTICLES.length + INITIAL_CURATED_ARTICLES.reduce((acc, a) => acc + a.duplicates.length, 0);
    this.duplicatesPrevented = INITIAL_CURATED_ARTICLES.reduce((acc, a) => acc + a.duplicates.length, 0);
    this.lastSyncTime = new Date().toISOString();
    this.nextSyncTime = new Date(Date.now() + SYNC_INTERVAL_MS).toISOString();

    // Ensure all seed articles are strictly sorted by latest publication time first
    this.articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    this.log('success', `Engine initialized with ${this.articles.length} verified rewritten stories (${this.duplicatesPrevented} duplicates merged across sections).`);

    // Run first background live fetch after a short startup delay
    setTimeout(() => {
      this.syncLiveFeeds();
    }, 2000);

    this.startScheduler();
  }

  private startScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Schedule 15-minute interval updates
    this.timer = setInterval(() => {
      this.log('info', '15-minute interval reached: Initiating automated news synchronization cycle...');
      this.syncLiveFeeds();
    }, SYNC_INTERVAL_MS);
  }

  public async syncLiveFeeds(): Promise<{ newStoriesCount: number; duplicatesPrevented: number }> {
    if (this.isSyncing) {
      this.log('warn', 'Sync already in progress. Skipping overlapping request.');
      return { newStoriesCount: 0, duplicatesPrevented: 0 };
    }

    this.isSyncing = true;
    this.log('info', `Starting 15-minute update across ${this.sources.length} reliable news outlets...`);

    const rawFetchedItems: RawIngestedItem[] = [];

    // Parallel fetch with individual error handling
    await Promise.allSettled(
      this.sources.map(async (source) => {
        try {
          source.status = 'syncing';
          const feed = await this.parser.parseURL(source.url);
          source.status = 'active';
          source.lastChecked = new Date().toISOString();

          const items = (feed.items || []).slice(0, 10);
          source.articlesCount = items.length;

          for (const item of items) {
            if (!item.title || !item.link) continue;
            const cleaned = cleanHeadlineTitle(item.title);
            const headline = cleaned.title;
            if (!headline || headline.length < 10) continue;

            const img = extractImageFromFeedItem(item);
            const sourceName = cleaned.detectedSource || source.name;
            const publishedAt = parseNormalizedDate(item);

            rawFetchedItems.push({
              headline,
              snippet: item.contentSnippet || item.content || item.summary || '',
              sourceId: source.id,
              sourceName,
              articleUrl: item.link,
              publishedAt,
              author: item.creator || item.author || sourceName,
              category: source.category,
              imageUrl: img,
            });
          }
        } catch (err: any) {
          source.status = 'error';
          this.log('warn', `Could not fetch RSS from ${source.name}: ${err?.message || 'Network error'}`);
        }
      })
    );

    this.totalArticlesIngested += rawFetchedItems.length;
    this.log('info', `Ingested ${rawFetchedItems.length} raw articles. Running headline deduplication engine...`);

    // Run headline deduplication clustering
    const { uniqueClusters, duplicatesPreventedCount } = deduplicateNewsItems(rawFetchedItems);
    this.duplicatesPrevented += duplicatesPreventedCount;

    // Filter clusters that are already in our article repository (by headline or url)
    const newClustersToProcess = uniqueClusters.filter((cluster) => {
      const isAlreadySaved = this.articles.some(
        (existing) =>
          existing.originalHeadline.toLowerCase() === cluster.leadItem.headline.toLowerCase() ||
          existing.primarySource.articleUrl === cluster.leadItem.articleUrl ||
          existing.allReferences.some(r => r.articleUrl === cluster.leadItem.articleUrl)
      );
      return !isAlreadySaved;
    });

    // Sort incoming new clusters strictly newest first based on their publishedAt timestamp
    newClustersToProcess.sort((a, b) => new Date(b.leadItem.publishedAt).getTime() - new Date(a.leadItem.publishedAt).getTime());

    // Select a balanced mix of top stories across diverse categories so all sections stay fresh
    const selectedClusters: typeof newClustersToProcess = [];
    const categoryCounts: Record<string, number> = {};

    for (const cluster of newClustersToProcess) {
      const cat = cluster.leadItem.category || 'World';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      // Cap at 3 per category per sync batch to ensure all categories get representation
      if (categoryCounts[cat] <= 3 && selectedClusters.length < 18) {
        selectedClusters.push(cluster);
      }
    }

    // If slots remain, fill with remaining newest clusters
    if (selectedClusters.length < 18) {
      for (const cluster of newClustersToProcess) {
        if (!selectedClusters.includes(cluster)) {
          selectedClusters.push(cluster);
          if (selectedClusters.length >= 18) break;
        }
      }
    }

    let newCount = 0;
    const newRewrittenBatch: NewsArticle[] = [];

    // Rewrite and store top new stories
    for (const cluster of selectedClusters) {
      try {
        const rewritten = await rewriteNewsArticle(cluster);
        this.articles.unshift(rewritten);
        newRewrittenBatch.push(rewritten);
        newCount++;
        // Small 150ms spacing between rewrites
        if (selectedClusters.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      } catch (err: any) {
        this.log('warn', `Editorial note for "${cluster.leadItem.headline}": ${err?.message}`);
      }
    }

    // Ensure all articles in memory are strictly ordered newest first
    this.articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Keep maximum 80 latest stories in memory
    if (this.articles.length > 80) {
      this.articles = this.articles.slice(0, 80);
    }

    this.isSyncing = false;
    this.lastSyncTime = new Date().toISOString();
    this.nextSyncTime = new Date(Date.now() + SYNC_INTERVAL_MS).toISOString();

    this.log(
      'success',
      `Sync completed: ${newCount} new synthesized stories published across categories, ${duplicatesPreventedCount} duplicate headlines merged into references.`
    );

    return {
      newStoriesCount: newCount,
      duplicatesPrevented: duplicatesPreventedCount,
    };
  }

  public getArticles(category?: CategoryType, query?: string): NewsArticle[] {
    let result = [...this.articles];

    if (category && category !== 'All') {
      result = result.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.originalHeadline.toLowerCase().includes(q) ||
          a.allReferences.some((r) => r.sourceName.toLowerCase().includes(q) || r.articleTitle.toLowerCase().includes(q)) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Always guarantee newest first ordering
    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return result;
  }

  public getArticleById(id: string): NewsArticle | undefined {
    return this.articles.find((a) => a.id === id);
  }

  public getSyncStatus(): SyncStatus {
    const nextSyncMs = this.nextSyncTime ? new Date(this.nextSyncTime).getTime() : Date.now() + SYNC_INTERVAL_MS;
    const remainingSeconds = Math.max(0, Math.floor((nextSyncMs - Date.now()) / 1000));

    return {
      lastSyncTime: this.lastSyncTime || new Date().toISOString(),
      nextSyncTime: this.nextSyncTime || new Date(Date.now() + SYNC_INTERVAL_MS).toISOString(),
      intervalMinutes: 15,
      isSyncing: this.isSyncing,
      totalArticlesIngested: this.totalArticlesIngested,
      duplicatesPrevented: this.duplicatesPrevented,
      uniqueArticlesCount: this.articles.length,
      activeSourcesCount: this.sources.filter((s) => s.status === 'active' || s.status === 'syncing').length,
      recentLogs: [...this.logs],
      secondsUntilNextSync: remainingSeconds,
    };
  }

  public getSources(): FeedSource[] {
    return [...this.sources];
  }

  public getCategories(): CategoryType[] {
    return [
      'All',
      'Opinion',
      'Pakistan',
      'Business',
      'Finance',
      'Cricket',
      'Football',
      'Oil & Energy',
      'Gold & Commodities',
      'Conflict Zones',
      'World',
      'Technology',
      'Science',
      'Health',
      'Climate',
    ];
  }

  private log(type: 'info' | 'success' | 'warn' | 'error', message: string) {
    const entry: SyncLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      message,
      type,
    };
    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.pop();
    }
  }
}

export const newsEngine = NewsEngine.getInstance();
