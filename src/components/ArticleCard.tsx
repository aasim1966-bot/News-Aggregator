import React, { useState } from 'react';
import {
  ExternalLink,
  Bookmark,
  Clock,
  Sparkles,
  Layers,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { NewsArticle } from '../types';
import { SocialShareButtons } from './SocialShareButtons';

interface ArticleCardProps {
  article: NewsArticle;
  isBookmarked: boolean;
  onToggleBookmark: (article: NewsArticle) => void;
  onSelectArticle: (article: NewsArticle) => void;
  isFeatured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isBookmarked,
  onToggleBookmark,
  onSelectArticle,
  isFeatured = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const formatExactTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'opinion':
        return 'bg-purple-100 text-purple-950 border-purple-300 font-bold';
      case 'pakistan':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold';
      case 'oil & energy':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'gold & commodities':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'conflict zones':
        return 'bg-red-100 text-red-900 border-red-300 font-bold';
      case 'cricket':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'football':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'finance':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'business':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'technology':
        return 'bg-violet-100 text-violet-900 border-violet-300';
      case 'science':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'health':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'climate':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <article
      id={`article-card-${article.id}`}
      className={`group bg-white rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        isFeatured ? 'md:col-span-2 lg:col-span-2' : ''
      }`}
    >
      <div>
        {/* Story Picture (if available) */}
        {article.imageUrl && !imageError && (
          <div
            onClick={() => onSelectArticle(article)}
            className={`relative overflow-hidden cursor-pointer bg-stone-100 ${
              isFeatured ? 'h-64 sm:h-80' : 'h-48'
            }`}
          >
            <img
              src={article.imageUrl}
              alt={article.headline}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Category & Status Overlay on Image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse"></span>
                    Latest Story
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-md ${getCategoryBadgeClass(
                    article.category
                  )}`}
                >
                  {article.category}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {article.duplicateCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-stone-900/85 text-amber-300 px-2 py-0.5 rounded-full backdrop-blur-md border border-stone-700">
                    <Layers className="w-2.5 h-2.5" />
                    {article.duplicateCount + 1} Outlets Merged
                  </span>
                )}
                <span
                  title={new Date(article.publishedAt).toLocaleString()}
                  className="text-[10px] font-mono text-white/90 bg-stone-950/70 px-2 py-0.5 rounded-full backdrop-blur-md"
                >
                  {formatRelativeTime(article.publishedAt)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          {/* Header if no image */}
          {(!article.imageUrl || imageError) && (
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse"></span>
                    Latest Story
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                    article.category
                  )}`}
                >
                  {article.category}
                </span>

                {article.duplicateCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Layers className="w-2.5 h-2.5 text-amber-700" />
                    {article.duplicateCount + 1} Sources Merged
                  </span>
                )}
              </div>

              <span
                title={new Date(article.publishedAt).toLocaleString()}
                className="text-[11px] font-mono text-stone-400"
              >
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>
          )}

          {/* Headline */}
          <h3
            onClick={() => onSelectArticle(article)}
            className={`font-serif font-bold text-stone-950 group-hover:text-amber-900 transition-colors cursor-pointer leading-tight mb-2.5 ${
              isFeatured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
            }`}
          >
            {article.headline}
          </h3>

          {/* Executive Summary */}
          <p
            className={`text-stone-600 leading-relaxed mb-4 ${
              isFeatured ? 'text-sm sm:text-base' : 'text-xs line-clamp-3'
            }`}
          >
            {article.summary}
          </p>

          {/* Key Takeaway Snippet */}
          {article.keyTakeaways && article.keyTakeaways.length > 0 && (
            <div className="mb-4 bg-stone-50 rounded-xl p-3 border border-stone-200/70">
              <div className="text-[10px] font-bold tracking-wide uppercase text-stone-500 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Verified Fact</span>
              </div>
              <p className="text-xs text-stone-800 italic leading-snug">
                "{article.keyTakeaways[0]}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Original Attribution & Actions */}
      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-stone-100">
        <div className="flex items-center justify-between gap-2 mb-3 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">
              Reported by <strong className="text-stone-800 font-semibold">{article.primarySource.sourceName}</strong>
            </span>
          </div>
          <span className="shrink-0 text-[11px] font-mono text-stone-400">
            {article.readTimeMinutes} min read
          </span>
        </div>

        {/* References & Social Buttons */}
        <div className="flex items-center justify-between gap-2">
          {/* Outlets Links */}
          <div className="flex items-center gap-1 overflow-hidden">
            {article.allReferences.slice(0, 2).map((ref, idx) => (
              <a
                key={idx}
                href={ref.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded border border-stone-200 truncate transition-colors"
                title={`Original Outlets: ${ref.articleTitle} (${ref.sourceName})`}
              >
                <span>{ref.sourceName}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
              </a>
            ))}
            {article.allReferences.length > 2 && (
              <span className="text-[10px] text-stone-400 font-medium shrink-0">
                +{article.allReferences.length - 2}
              </span>
            )}
          </div>

          {/* Action buttons: Share, Bookmark, Read */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Real Social Share Menu */}
            <SocialShareButtons article={article} variant="compact" />

            {/* Bookmark button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(article);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'text-stone-400 border-stone-200 hover:text-stone-700 hover:bg-stone-50'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Read CTA */}
            <button
              onClick={() => onSelectArticle(article)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer ml-1 shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Digest</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
