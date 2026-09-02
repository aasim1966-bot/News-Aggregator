import React from 'react';
import { X, Bookmark, Trash2, BookOpen, ExternalLink } from 'lucide-react';
import { NewsArticle } from '../types';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: NewsArticle[];
  onRemoveBookmark: (article: NewsArticle) => void;
  onSelectArticle: (article: NewsArticle) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onSelectArticle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div
        id="bookmarks-drawer"
        className="bg-white w-full max-w-md h-full shadow-2xl border-l border-stone-200 flex flex-col justify-between"
      >
        {/* Header */}
        <div className="border-b border-stone-200 p-5 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-600 fill-current" />
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Saved Stories ({bookmarks.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1 space-y-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-stone-600">No saved stories yet</p>
              <p className="text-xs text-stone-400 mt-1">
                Click the bookmark icon on any news story to save it for reading later.
              </p>
            </div>
          ) : (
            bookmarks.map((article) => (
              <div
                key={article.id}
                className="bg-stone-50 rounded-xl p-4 border border-stone-200 hover:border-amber-400 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-semibold uppercase tracking-wider text-amber-800">
                    {article.category}
                  </span>
                  <span>{article.primarySource.sourceName}</span>
                </div>

                <h4
                  onClick={() => {
                    onSelectArticle(article);
                    onClose();
                  }}
                  className="font-serif font-bold text-sm text-stone-900 hover:text-amber-900 cursor-pointer line-clamp-2 leading-snug"
                >
                  {article.headline}
                </h4>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs">
                  <button
                    onClick={() => {
                      onSelectArticle(article);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Digest</span>
                  </button>

                  <button
                    onClick={() => onRemoveBookmark(article)}
                    className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                    title="Remove from bookmarks"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 p-4 bg-stone-50 text-center">
          <p className="text-xs text-stone-500">Saved stories are stored locally on your device.</p>
        </div>
      </div>
    </div>
  );
};
