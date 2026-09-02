export type CategoryType =
  | 'All'
  | 'Opinion'
  | 'Pakistan'
  | 'Business'
  | 'Finance'
  | 'Cricket'
  | 'Football'
  | 'Oil & Energy'
  | 'Gold & Commodities'
  | 'Conflict Zones'
  | 'World'
  | 'Technology'
  | 'Science'
  | 'Health'
  | 'Climate';

export interface SourceReference {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  articleTitle: string;
  articleUrl: string;
  publishedAt: string;
  author?: string;
  snippet?: string;
}

export interface NewsArticle {
  id: string;
  headline: string; // AI-rewritten concise, objective headline
  originalHeadline: string; // The primary raw headline
  summary: string; // Executive 1-2 sentence briefing
  content: string; // Full rewritten narrative (2-4 editorial paragraphs)
  keyTakeaways: string[]; // 3-4 bullet takeaways
  category: CategoryType;
  tags: string[];
  primarySource: SourceReference;
  allReferences: SourceReference[]; // Mentions of all original references / duplicates merged
  duplicateCount: number; // Number of cross-referenced duplicate headlines merged
  publishedAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  isRewritten: boolean;
  rewriteModel: string;
  sentiment: 'positive' | 'neutral' | 'critical' | 'cautious';
  impactLevel: 'Breaking' | 'High' | 'Standard';
  imageUrl?: string;
  sourceReliabilityScore: number; // e.g. 96%
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: CategoryType;
  homepage: string;
  reliabilityScore: number; // 0-100
  bias: 'Center' | 'Center-Left' | 'Center-Right' | 'Tech-Focused' | 'Science-Peer';
  country: string;
  lastChecked?: string;
  status: 'active' | 'syncing' | 'error';
  articlesCount: number;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: string;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  intervalMinutes: number; // 30
  isSyncing: boolean;
  totalArticlesIngested: number;
  uniqueArticlesCount: number;
  duplicatesPrevented: number;
  activeSourcesCount?: number;
  secondsUntilNextSync?: number;
  recentLogs: SyncLog[];
}

export interface NewsResponse {
  articles: NewsArticle[];
  syncStatus: SyncStatus;
  sources: FeedSource[];
  categories: CategoryType[];
}
