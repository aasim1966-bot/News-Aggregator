import { SourceReference } from '../src/types';

// Common stop words to strip during headline normalization
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'after', 'before', 'says', 'said', 'new', 'over', 'into',
  'about', 'amid', 'against', 'out', 'up', 'down', 'first', 'how', 'why',
  'what', 'when', 'where', 'who', 'which', 'their', 'this', 'than', 'more',
  'most', 'report', 'reports', 'update', 'breaking', 'live', 'analysis'
]);

/**
 * Normalizes a headline into a clean list of salient keywords/tokens
 */
export function extractHeadlineTokens(headline: string): string[] {
  if (!headline) return [];

  // Remove HTML tags, brackets, publication prefixes like "BBC -", "[Update]", etc.
  const cleaned = headline
    .replace(/<[^>]*>/g, '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/\s*-\s*[A-Za-z\s]+$/, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  // Filter out stop words and single-character tokens
  return words.filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Calculates Jaccard Token Similarity (0.0 to 1.0)
 */
export function calculateJaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Calculates Bigram / Dice Coefficient for character sequence similarity
 */
export function calculateDiceSimilarity(strA: string, strB: string): number {
  const cleanA = strA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = strB.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanA === cleanB) return 1.0;
  if (cleanA.length < 2 || cleanB.length < 2) return 0.0;

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const bigramsA = getBigrams(cleanA);
  const bigramsB = getBigrams(cleanB);

  let intersection = 0;
  for (const [bigram, countA] of bigramsA.entries()) {
    if (bigramsB.has(bigram)) {
      intersection += Math.min(countA, bigramsB.get(bigram)!);
    }
  }

  const total = cleanA.length - 1 + (cleanB.length - 1);
  return (2.0 * intersection) / total;
}

/**
 * Determines whether two headlines describe the same news story/event
 */
export function areHeadlinesDuplicates(headlineA: string, headlineB: string): { isDuplicate: boolean; score: number; reason: string } {
  if (!headlineA || !headlineB) return { isDuplicate: false, score: 0, reason: 'empty' };

  // 1. Exact normalized match
  const normA = headlineA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normB = headlineB.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normA === normB) {
    return { isDuplicate: true, score: 1.0, reason: 'exact match' };
  }

  // 2. Token Jaccard Similarity
  const tokensA = extractHeadlineTokens(headlineA);
  const tokensB = extractHeadlineTokens(headlineB);
  const jaccard = calculateJaccardSimilarity(tokensA, tokensB);

  // 3. Dice Bigram Similarity
  const dice = calculateDiceSimilarity(headlineA, headlineB);

  // 4. Shared significant tokens count
  const sharedTokens = tokensA.filter(t => tokensB.includes(t));

  // Combined heuristic
  const compositeScore = (jaccard * 0.65) + (dice * 0.35);

  // If they share 4+ significant key words or composite score >= 0.48
  if (compositeScore >= 0.48 || (sharedTokens.length >= 4 && jaccard >= 0.38) || (tokensA.length <= 4 && jaccard >= 0.6)) {
    return {
      isDuplicate: true,
      score: compositeScore,
      reason: `composite similarity (${(compositeScore * 100).toFixed(0)}%, shared keywords: ${sharedTokens.slice(0, 3).join(', ')})`
    };
  }

  return { isDuplicate: false, score: compositeScore, reason: 'distinct' };
}

export interface RawIngestedItem {
  headline: string;
  snippet?: string;
  sourceId: string;
  sourceName: string;
  articleUrl: string;
  publishedAt: string;
  author?: string;
  category?: string;
  imageUrl?: string;
}

export interface ClusteredArticleGroup {
  leadItem: RawIngestedItem;
  duplicates: RawIngestedItem[];
  allReferences: SourceReference[];
}

/**
 * Deduplicates a list of incoming news items by clustering identical or highly overlapping headlines.
 * Guaranteed: No two items in the returned array will be duplicates of each other.
 */
export function deduplicateNewsItems(incomingItems: RawIngestedItem[]): {
  uniqueClusters: ClusteredArticleGroup[];
  duplicatesPreventedCount: number;
} {
  const clusters: ClusteredArticleGroup[] = [];
  let duplicatesPrevented = 0;

  for (const item of incomingItems) {
    let matchedCluster: ClusteredArticleGroup | null = null;

    for (const cluster of clusters) {
      // Compare incoming item against lead item and any duplicate in cluster
      const leadCheck = areHeadlinesDuplicates(item.headline, cluster.leadItem.headline);
      if (leadCheck.isDuplicate) {
        matchedCluster = cluster;
        break;
      }

      // Also check against duplicates in cluster
      for (const dup of cluster.duplicates) {
        const dupCheck = areHeadlinesDuplicates(item.headline, dup.headline);
        if (dupCheck.isDuplicate) {
          matchedCluster = cluster;
          break;
        }
      }
      if (matchedCluster) break;
    }

    const sourceRef: SourceReference = {
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      sourceUrl: item.articleUrl,
      articleTitle: item.headline,
      articleUrl: item.articleUrl,
      publishedAt: item.publishedAt,
      author: item.author || item.sourceName,
      snippet: item.snippet
    };

    if (matchedCluster) {
      // Merging duplicate headline into existing cluster
      matchedCluster.duplicates.push(item);
      // Avoid duplicate source URLs in references
      if (!matchedCluster.allReferences.some(ref => ref.articleUrl === item.articleUrl)) {
        matchedCluster.allReferences.push(sourceRef);
      }
      // If the incoming item has richer snippet/text, upgrade lead item snippet
      if ((item.snippet?.length || 0) > (matchedCluster.leadItem.snippet?.length || 0)) {
        matchedCluster.leadItem.snippet = item.snippet;
      }
      duplicatesPrevented++;
    } else {
      // New unique story
      clusters.push({
        leadItem: item,
        duplicates: [],
        allReferences: [sourceRef]
      });
    }
  }

  return {
    uniqueClusters: clusters,
    duplicatesPreventedCount: duplicatesPrevented
  };
}
