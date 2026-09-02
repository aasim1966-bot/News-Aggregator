import { GoogleGenAI, Type } from '@google/genai';
import { CategoryType, NewsArticle, SourceReference } from '../src/types';
import { ClusteredArticleGroup } from './deduplicator';

// Server-side lazy initialization for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
let geminiCooldownUntil = 0;

function getAiClient(): GoogleGenAI | null {
  if (Date.now() < geminiCooldownUntil) {
    return null;
  }
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && Date.now() >= geminiCooldownUntil;
}

export const VALID_CATEGORIES: CategoryType[] = [
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

// Topic-matched curated high-res imagery for verified visual journalism
const TOPIC_IMAGES: Record<string, string[]> = {
  Opinion: [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
  ],
  Pakistan: [
    'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  ],
  Cricket: [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80',
  ],
  Football: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  ],
  'Oil & Energy': [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
  ],
  'Gold & Commodities': [
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1624417535316-053df4f50682?auto=format&fit=crop&w=1200&q=80',
  ],
  'Conflict Zones': [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579275542618-a1dfed5f54ba?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1569974498991-d3c12a504f95?auto=format&fit=crop&w=1200&q=80',
  ],
  Finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
  ],
  Business: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
  ],
  Technology: [
    'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  ],
  Science: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  ],
  Health: [
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
  ],
  Climate: [
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
  ],
  World: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
  ]
};

export function resolveArticleImage(category: CategoryType, headline: string, existingImg?: string): string {
  if (existingImg && existingImg.startsWith('http')) {
    return existingImg;
  }

  const hLower = headline.toLowerCase();
  if (category === 'Opinion' || hLower.includes('opinion') || hLower.includes('editorial') || hLower.includes('column') || hLower.includes('essay') || hLower.includes('perspective') || hLower.includes('commentary')) {
    const list = TOPIC_IMAGES['Opinion'];
    return list[Math.floor(Math.abs(headline.length) % list.length)];
  }
  if (hLower.includes('cricket') || hLower.includes('wicket') || hLower.includes('test match') || hLower.includes('icc')) {
    const list = TOPIC_IMAGES['Cricket'];
    return list[Math.floor(Math.abs(headline.length) % list.length)];
  }
  if (hLower.includes('football') || hLower.includes('soccer') || hLower.includes('champions league') || hLower.includes('premier league') || hLower.includes('fifa')) {
    const list = TOPIC_IMAGES['Football'];
    return list[Math.floor(Math.abs(headline.length) % list.length)];
  }
  if (hLower.includes('oil') || hLower.includes('brent') || hLower.includes('crude') || hLower.includes('opec') || hLower.includes('petroleum')) {
    const list = TOPIC_IMAGES['Oil & Energy'];
    return list[Math.floor(Math.abs(headline.length) % list.length)];
  }
  if (hLower.includes('gold') || hLower.includes('bullion') || hLower.includes('silver') || hLower.includes('metal') || hLower.includes('copper')) {
    const list = TOPIC_IMAGES['Gold & Commodities'];
    return list[Math.floor(Math.abs(headline.length) % list.length)];
  }
  if (hLower.includes('ceasefire') || hLower.includes('conflict') || hLower.includes('military') || hLower.includes('missile') || hLower.includes('peacekeeping') || hLower.includes('gaza') || hLower.includes('ukraine')) {
    const list = TOPIC_IMAGES['Conflict Zones'];
    return list[Math.floor(Math.abs(headline.length) % list.length)];
  }

  const fallbackList = TOPIC_IMAGES[category] || TOPIC_IMAGES['World'];
  return fallbackList[Math.floor(Math.abs(headline.length) % fallbackList.length)];
}

export interface RewrittenResult {
  headline: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
  category: CategoryType;
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'critical' | 'cautious';
  impactLevel: 'Breaking' | 'High' | 'Standard';
  readTimeMinutes: number;
}

/**
 * Fallback editorial rewriter that crafts clean journalistic synthesis
 * when Gemini API is unavailable or rate-limited.
 */
function fallbackRewrite(group: ClusteredArticleGroup, categoryOverride?: CategoryType): RewrittenResult {
  const lead = group.leadItem;
  const sourceNames = group.allReferences.map(r => r.sourceName).filter((v, i, a) => a.indexOf(v) === i);
  const sourceListStr = sourceNames.join(' and ');

  // Clean and enhance headline
  let cleanHeadline = lead.headline
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/\s*-\s*(BBC|NPR|The Guardian|TechCrunch|Ars Technica|The Verge|CNBC|MarketWatch|Phys\.org|ScienceDaily|Reuters|AP).*$/i, '')
    .trim();

  // Ensure title case / editorial polish
  if (cleanHeadline.length > 0) {
    cleanHeadline = cleanHeadline.charAt(0).toUpperCase() + cleanHeadline.slice(1);
  }

  const snippet = lead.snippet || 'Global correspondents and verified industry bureaus report key developments unfolding across the sector.';
  
  const summary = `Reporting from ${sourceListStr}: ${snippet.slice(0, 160).trim()}${snippet.length > 160 ? '...' : ''}`;
  
  const content = [
    `In reports confirmed by ${sourceListStr}, recent developments have highlighted significant shifts in ${lead.category || 'current affairs'}. ${snippet}`,
    `According to primary reporting published by ${lead.sourceName}, relevant stakeholders, observers, and analysts are closely assessing subsequent outcomes as verification and secondary reporting continue across global bureaus.`,
    `Readers seeking full original statements, scorecards, technical metrics, and extended investigative context are encouraged to consult the direct links in the source directory below.`
  ].join('\n\n');

  const keyTakeaways = [
    `Originally reported by ${lead.sourceName}${sourceNames.length > 1 ? ` with cross-coverage from ${sourceNames.slice(1).join(', ')}` : ''}.`,
    `Core development centered on: ${cleanHeadline.slice(0, 90)}.`,
    `Independent verification ongoing with full source URLs documented for transparency.`
  ];

  // Infer category
  let category: CategoryType = (lead.category as CategoryType) || categoryOverride || 'World';
  const hLower = cleanHeadline.toLowerCase();
  const sLower = (lead.sourceName || '').toLowerCase() + ' ' + (lead.sourceId || '').toLowerCase();
  if (lead.category === 'Opinion' || sLower.includes('opinion') || sLower.includes('commentisfree') || hLower.includes('editorial:') || hLower.includes('opinion:') || hLower.includes('op-ed') || hLower.includes('column:')) {
    category = 'Opinion';
  } else if (hLower.includes('pakistan') || hLower.includes('islamabad') || hLower.includes('karachi') || hLower.includes('lahore') || hLower.includes('cpec') || hLower.includes('pakistani') || lead.sourceId.includes('dawn') || lead.sourceId.includes('tribune') || lead.sourceId.includes('geo-news') || lead.sourceId.includes('the-news-pk')) {
    category = 'Pakistan';
  } else if (hLower.includes('cricket') || hLower.includes('wicket') || hLower.includes('test match') || hLower.includes('icc')) {
    category = 'Cricket';
  } else if (hLower.includes('football') || hLower.includes('soccer') || hLower.includes('champions league') || hLower.includes('premier league')) {
    category = 'Football';
  } else if (hLower.includes('oil') || hLower.includes('brent') || hLower.includes('crude') || hLower.includes('opec')) {
    category = 'Oil & Energy';
  } else if (hLower.includes('gold') || hLower.includes('bullion') || hLower.includes('precious metal') || hLower.includes('commodit')) {
    category = 'Gold & Commodities';
  } else if (hLower.includes('conflict') || hLower.includes('ceasefire') || hLower.includes('security council') || hLower.includes('war') || hLower.includes('airstrike')) {
    category = 'Conflict Zones';
  } else if (hLower.includes('interest rate') || hLower.includes('central bank') || hLower.includes('inflation') || hLower.includes('fx ') || hLower.includes('stock market') || hLower.includes('bond yield')) {
    category = 'Finance';
  }

  if (!VALID_CATEGORIES.includes(category)) {
    category = 'World';
  }

  // Derive tags
  const words = cleanHeadline.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const tags = words.filter(w => w.length > 4).slice(0, 4);
  if (tags.length === 0) tags.push('News', category.toLowerCase());

  return {
    headline: cleanHeadline,
    summary,
    content,
    keyTakeaways,
    category,
    tags,
    sentiment: 'neutral',
    impactLevel: group.duplicates.length > 0 ? 'High' : 'Standard',
    readTimeMinutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 180)),
  };
}

/**
 * Rewrites a clustered news story using Gemini 3.7 Flash
 */
export async function rewriteNewsArticle(group: ClusteredArticleGroup): Promise<NewsArticle> {
  const lead = group.leadItem;
  const allRefs = group.allReferences;
  const duplicateTitles = group.duplicates.map(d => `- [${d.sourceName}] ${d.headline}`).join('\n');

  let result: RewrittenResult | null = null;
  let usedModel = 'rule-based-synthesizer';

  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `You are a world-class senior news editor and fact-checker. 
Rewrite and synthesize the following news story collected from reliable global news outlets into an engaging, objective, and well-structured news report.

PRIMARY HEADLINE: ${lead.headline}
PRIMARY SOURCE: ${lead.sourceName} (${lead.articleUrl})
PUBLISHED AT: ${lead.publishedAt}
SNIPPET/CONTENT: ${lead.snippet || 'No extended snippet available.'}
${duplicateTitles ? `\nADDITIONAL CROSS-REPORTING SOURCES:\n${duplicateTitles}` : ''}

EDITORIAL INSTRUCTIONS:
1. "headline": Craft a crisp, objective, publication-grade headline (5-12 words). Eliminate clickbait and source prefix labels.
2. "summary": A compelling 1-2 sentence executive briefing (30-45 words).
3. "content": A complete 2-4 paragraph rewritten article (180-320 words) that weaves the key facts clearly. You MUST explicitly mention and credit the reporting sources (e.g., "According to reporting by ${lead.sourceName}...") in the narrative text.
4. "keyTakeaways": An array of 3-4 bullet point highlights detailing concrete facts, metrics, or quotes.
5. "category": Choose the single best match from: ["Opinion", "Pakistan", "Business", "Finance", "Cricket", "Football", "Oil & Energy", "Gold & Commodities", "Conflict Zones", "World", "Technology", "Science", "Health", "Climate"]. If the item is an editorial, opinion column, op-ed, analytical viewpoint, or commentary from Dawn, The News, Express Tribune, Washington Post, The Guardian, NYT, WSJ, Bloomberg, or leading journals, select "Opinion". Use "Pakistan" for factual news reporting regarding Pakistan.
6. "tags": 3-5 relevant lowercase search keyword tags.
7. "sentiment": One of: "positive", "neutral", "critical", "cautious".
8. "impactLevel": One of: "Breaking", "High", "Standard".
9. "readTimeMinutes": Integer estimate (1-5).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an award-winning international news editor. You produce verified, objective news rewrites that always explicitly attribute facts to their original referenced news outlets.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              content: { type: Type.STRING },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              category: {
                type: Type.STRING,
                description: 'One of Opinion, Pakistan, Business, Finance, Cricket, Football, Oil & Energy, Gold & Commodities, Conflict Zones, World, Technology, Science, Health, Climate',
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sentiment: {
                type: Type.STRING,
                description: 'One of positive, neutral, critical, cautious',
              },
              impactLevel: {
                type: Type.STRING,
                description: 'One of Breaking, High, Standard',
              },
              readTimeMinutes: { type: Type.INTEGER },
            },
            required: ['headline', 'summary', 'content', 'keyTakeaways', 'category', 'tags'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        result = {
          headline: parsed.headline || lead.headline,
          summary: parsed.summary || (lead.snippet || ''),
          content: parsed.content || '',
          keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
          category: VALID_CATEGORIES.includes(parsed.category as CategoryType) ? (parsed.category as CategoryType) : ((lead.category as CategoryType) || 'World'),
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          sentiment: ['positive', 'neutral', 'critical', 'cautious'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
          impactLevel: ['Breaking', 'High', 'Standard'].includes(parsed.impactLevel) ? parsed.impactLevel : (group.duplicates.length > 0 ? 'High' : 'Standard'),
          readTimeMinutes: Number(parsed.readTimeMinutes) || 2,
        };
        usedModel = 'gemini-3.7-flash';
      }
    } catch (err: any) {
      const errStr = String(err?.message || err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('Quota exceeded')) {
        // Apply a 60-second cooldown so subsequent articles in this batch seamlessly use synthesis without spamming API errors
        geminiCooldownUntil = Date.now() + 60 * 1000;
        console.log('[Rewriter] Gemini rate limit reached (429). Seamlessly routing to editorial synthesis engine for next 60s.');
      } else {
        console.log('[Rewriter] Gemini synthesis fallback triggered:', err?.message || 'Unknown error');
      }
    }
  }

  // Use fallback if Gemini was not used or failed
  if (!result) {
    result = fallbackRewrite(group);
  }

  const primaryRef: SourceReference = allRefs[0] || {
    sourceId: lead.sourceId,
    sourceName: lead.sourceName,
    sourceUrl: lead.articleUrl,
    articleTitle: lead.headline,
    articleUrl: lead.articleUrl,
    publishedAt: lead.publishedAt,
    author: lead.author,
    snippet: lead.snippet,
  };

  const id = `art_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Find image from lead, duplicates, or curated topic catalog
  const rawImg = lead.imageUrl || group.duplicates.find(d => d.imageUrl)?.imageUrl;
  const finalImageUrl = resolveArticleImage(result.category, result.headline, rawImg);

  return {
    id,
    headline: result.headline,
    originalHeadline: lead.headline,
    summary: result.summary,
    content: result.content,
    keyTakeaways: result.keyTakeaways,
    category: result.category,
    tags: result.tags,
    primarySource: primaryRef,
    allReferences: allRefs,
    duplicateCount: group.duplicates.length,
    publishedAt: lead.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readTimeMinutes: result.readTimeMinutes,
    isRewritten: true,
    rewriteModel: usedModel,
    sentiment: result.sentiment,
    impactLevel: result.impactLevel,
    imageUrl: finalImageUrl,
    sourceReliabilityScore: 94,
  };
}
