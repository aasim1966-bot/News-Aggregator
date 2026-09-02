import React, { useState, useEffect } from 'react';
import { Zap, ChevronRight, ExternalLink } from 'lucide-react';
import { NewsArticle } from '../types';

interface BreakingTickerProps {
  articles: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ articles, onSelectArticle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const breakingArticles = sortedArticles.filter(
    (a) => a.impactLevel === 'Breaking' || a.impactLevel === 'High' || a.duplicateCount > 0
  );
  const displayArticles = breakingArticles.length > 0 ? breakingArticles : sortedArticles.slice(0, 6);

  useEffect(() => {
    if (displayArticles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displayArticles.length]);

  if (displayArticles.length === 0) return null;

  const current = displayArticles[currentIndex] || displayArticles[0];

  const timeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="bg-stone-100 border-y border-stone-200 py-2 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center gap-1 bg-red-600 text-white font-bold tracking-wider uppercase px-2 py-0.5 rounded text-[10px] shrink-0 animate-pulse">
            <Zap className="w-3 h-3 fill-current" />
            <span>DISPATCH WIRE</span>
          </div>

          <button
            onClick={() => onSelectArticle(current)}
            className="text-stone-800 hover:text-stone-950 font-medium text-left truncate hover:underline transition-all flex items-center gap-2"
          >
            <span className="truncate">{current.headline}</span>
            <span className="hidden md:inline-flex text-stone-500 font-normal text-[11px] shrink-0 items-center gap-1.5">
              <span>via {current.primarySource.sourceName}</span>
              <span className="text-stone-300">•</span>
              <span className="font-mono text-stone-600 font-medium bg-stone-200/80 px-1.5 py-0.2 rounded text-[10px]">
                {timeAgo(current.publishedAt)}
              </span>
              {current.duplicateCount > 0 && ` (+${current.duplicateCount} sources)`}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-stone-500 hidden sm:inline font-mono">
            {currentIndex + 1} / {displayArticles.length}
          </span>
          <button
            onClick={() => onSelectArticle(current)}
            className="inline-flex items-center text-amber-700 hover:text-amber-800 font-semibold text-[11px] gap-0.5"
          >
            Read <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
