import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { MarketWidgets } from './components/MarketWidgets';
import { BreakingTicker } from './components/BreakingTicker';
import { CategoryBar } from './components/CategoryBar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleModal } from './components/ArticleModal';
import { SyncStatusDrawer } from './components/SyncStatusDrawer';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { Footer } from './components/Footer';
import { CategoryType, FeedSource, NewsArticle, NewsResponse, SyncStatus } from './types';
import { RefreshCw, Search, ShieldCheck, Layers, Newspaper, Sparkles, CheckCircle2, Zap } from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [categories, setCategories] = useState<CategoryType[]>([
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
  ]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [selectedOpinionJournal, setSelectedOpinionJournal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'sources' | 'quick'>('latest');
  const [timeTick, setTimeTick] = useState<number>(Date.now());

  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto tick to update relative time badges continuously
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTimeTick(Date.now());
    }, 15000);
    return () => clearInterval(tickInterval);
  }, []);

  // Load bookmarks from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('news_bookmarks');
      if (saved) {
        setBookmarks(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load bookmarks:', e);
    }
  }, []);

  // Save bookmarks to local storage
  const handleToggleBookmark = (article: NewsArticle) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === article.id);
      let updated: NewsArticle[];
      if (exists) {
        updated = prev.filter((b) => b.id !== article.id);
      } else {
        updated = [article, ...prev];
      }
      try {
        localStorage.setItem('news_bookmarks', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist bookmarks:', e);
      }
      return updated;
    });
  };

  // Fetch news
  const fetchNews = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();
      setArticles(data.articles || []);
      setSyncStatus(data.syncStatus || null);
      setSources(data.sources || []);
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to fetch news:', err);
      setErrorMessage('Unable to reach news wire server. Retrying...');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(true);

    // Poll status every 20 seconds to keep countdown and status live
    const statusInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync-status');
        if (res.ok) {
          const data = await res.json();
          setSyncStatus(data.syncStatus);
          // If a background sync just completed, refresh articles silently
          if (data.syncStatus && !data.syncStatus.isSyncing) {
            fetchNews(false);
          }
        }
      } catch (e) {
        // silent catch
      }
    }, 20000);

    return () => clearInterval(statusInterval);
  }, []);

  // Trigger manual sync
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const res = await fetch('/api/sync-now', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
      }
      if (data.syncStatus) {
        setSyncStatus(data.syncStatus);
      }
    } catch (err: any) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: articles.length };
    for (const art of articles) {
      counts[art.category] = (counts[art.category] || 0) + 1;
    }
    return counts;
  }, [articles]);

  // Filtered & Sorted articles (Strict chronological descending order)
  const filteredArticles = useMemo(() => {
    let list = [...articles];

    // Filter by Category
    if (selectedCategory !== 'All') {
      list = list.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by Opinion Journal (if Opinion category is active and a journal is picked)
    if (selectedCategory === 'Opinion' && selectedOpinionJournal) {
      const q = selectedOpinionJournal.toLowerCase();
      list = list.filter(
        (a) =>
          a.sourceName.toLowerCase().includes(q) ||
          a.headline.toLowerCase().includes(q) ||
          a.originalHeadline.toLowerCase().includes(q) ||
          a.allReferences.some(
            (r) => r.sourceName.toLowerCase().includes(q) || r.articleTitle.toLowerCase().includes(q)
          )
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.originalHeadline.toLowerCase().includes(q) ||
          a.allReferences.some((r) => r.sourceName.toLowerCase().includes(q) || r.articleTitle.toLowerCase().includes(q)) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'sources') {
      list.sort((a, b) => b.allReferences.length - a.allReferences.length);
    } else if (sortBy === 'quick') {
      list.sort((a, b) => a.readTimeMinutes - b.readTimeMinutes);
    } else {
      // Latest (Newest First)
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    return list;
  }, [articles, selectedCategory, selectedOpinionJournal, searchQuery, sortBy]);

  const latestArticleTimeAgo = useMemo(() => {
    if (filteredArticles.length === 0) return '';
    try {
      const diffMs = Date.now() - new Date(filteredArticles[0].publishedAt).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  }, [filteredArticles, timeTick]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-amber-200">
      <div>
        {/* Masthead & Navigation */}
        <Navbar
          syncStatus={syncStatus}
          onSyncNow={handleManualSync}
          onOpenEngineModal={() => setIsEngineModalOpen(true)}
        />

        {/* Real-Time Financial & Commodity Market Widgets (Oil, Gold, Bitcoin, KSE-100) */}
        <MarketWidgets
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSelectedOpinionJournal(null);
          }}
          activeCategory={selectedCategory}
        />

        {/* Breaking News Ticker */}
        <BreakingTicker articles={articles} onSelectArticle={(art) => setSelectedArticle(art)} />

        {/* Categories, Search & Filters */}
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            if (cat !== 'Opinion') {
              setSelectedOpinionJournal(null);
            }
          }}
          selectedOpinionJournal={selectedOpinionJournal}
          onSelectOpinionJournal={setSelectedOpinionJournal}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categoryCounts={categoryCounts}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          {errorMessage && (
            <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => fetchNews(true)}
                className="font-bold underline text-amber-950 hover:text-amber-800"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-24 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <p className="font-serif text-lg font-bold text-stone-800">
                Fetching & Synthesizing Verified Global News...
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Running 15-minute interval scheduler, filtering duplicate headlines, and delivering verified synthesized updates.
              </p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 p-8 my-4">
              <Newspaper className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">
                No stories match your criteria
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                Try clearing your search query or selecting a different news category.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section Lead Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-serif text-xl sm:text-2xl font-bold text-stone-950">
                    {selectedCategory === 'All' ? 'Top Verified Stories' : `${selectedCategory} News`}
                  </span>
                  {sortBy === 'latest' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Latest First</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  {latestArticleTimeAgo && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                      <span>Latest story:</span>
                      <strong className="text-stone-900 font-semibold">{latestArticleTimeAgo}</strong>
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Deduplicated & Source Referenced</span>
                  </div>
                </div>
              </div>

              {/* News Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((art, idx) => (
                  <ArticleCard
                    key={art.id}
                    article={art}
                    isFeatured={idx === 0 && !searchQuery.trim() && sortBy === 'latest'}
                    isBookmarked={bookmarks.some((b) => b.id === art.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onSelectArticle={(a) => setSelectedArticle(a)}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer
        onOpenEngineModal={() => setIsEngineModalOpen(true)}
        sourcesCount={sources.length}
      />

      {/* Deep Article Modal & Reference Inspector */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        isBookmarked={selectedArticle ? bookmarks.some((b) => b.id === selectedArticle.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* 15-Minute Engine & Deduplication Hub Modal */}
      <SyncStatusDrawer
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        syncStatus={syncStatus}
        sources={sources}
        onSyncNow={handleManualSync}
      />

      {/* Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleToggleBookmark}
        onSelectArticle={(art) => setSelectedArticle(art)}
      />
    </div>
  );
}
