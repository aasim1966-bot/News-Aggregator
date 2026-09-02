import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Layers,
  Clock,
  SplitSquareVertical,
  CheckCircle,
  FileText,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';
import { NewsArticle } from '../types';
import { SocialShareButtons } from './SocialShareButtons';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (article: NewsArticle) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [viewMode, setViewMode] = useState<'digest' | 'compare'>('digest');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset state when article opens or changes
    setIsPlayingAudio(false);
    setViewMode('digest');
    setImageError(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [article, onClose]);

  if (!article) return null;

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const textToRead = `${article.headline}. ${article.summary}. Key points: ${article.keyTakeaways.join(
        '. '
      )}. ${article.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        id="article-reader-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="border-b border-stone-200 px-5 sm:px-8 py-3.5 flex items-center justify-between bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
            <span className="font-semibold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200 text-[11px]">
              {article.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-stone-500 text-[11px]">
              <Clock className="w-3 h-3" />
              {article.readTimeMinutes} min read
            </span>
            <span>•</span>
            <span className="hidden sm:inline-block text-stone-500 text-[11px]">
              {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg text-xs font-medium mr-1">
              <button
                onClick={() => setViewMode('digest')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'digest' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Synthesized Story
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'compare' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reference Check</span>
              </button>
            </div>

            {/* Audio narration */}
            {'speechSynthesis' in window && (
              <button
                onClick={toggleSpeech}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
                title={isPlayingAudio ? 'Stop narration' : 'Listen to audio narration'}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(article)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
              title="Bookmark story"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-10 space-y-6">
          {viewMode === 'digest' ? (
            /* Standard Synthesized Story View */
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Header metadata */}
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    AI Rewritten & Verified
                  </span>
                  {article.duplicateCount > 0 && (
                    <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded border border-stone-200 inline-flex items-center gap-1">
                      <Layers className="w-3 h-3 text-stone-500" />
                      {article.duplicateCount + 1} Outlets Merged
                    </span>
                  )}
                  {article.impactLevel === 'Breaking' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full">
                      Breaking Story
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-950 leading-tight">
                  {article.headline}
                </h2>
              </div>

              {/* Story Picture (if available) */}
              {article.imageUrl && !imageError && (
                <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm">
                  <img
                    src={article.imageUrl}
                    alt={article.headline}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full max-h-96 object-cover"
                  />
                  <div className="p-2.5 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Verified editorial photo • {article.category} Section</span>
                    <span>Source: {article.primarySource.sourceName}</span>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50/60 rounded-r-xl">
                <p className="text-stone-800 text-base sm:text-lg font-medium leading-relaxed">
                  {article.summary}
                </p>
              </div>

              {/* Key Takeaways Box */}
              {article.keyTakeaways && article.keyTakeaways.length > 0 && (
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Key Verified Takeaways
                  </h4>
                  <ul className="space-y-2.5 text-sm text-stone-800">
                    {article.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-amber-600 mt-2 shrink-0" />
                        <span className="leading-relaxed">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Rewritten Article Content */}
              <div className="prose prose-stone max-w-none text-stone-800 text-base sm:text-lg leading-relaxed space-y-4">
                {article.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Real Social Sharing Hub */}
              <div className="pt-4">
                <SocialShareButtons article={article} variant="modal" />
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-4 border-t border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 mr-1">Topics:</span>
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md border border-stone-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Original References Directory (Explicit requirement: "mentioned their original reference") */}
              <div className="pt-6 border-t-2 border-stone-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    Original Source References ({article.allReferences.length})
                  </h4>
                  <span className="text-xs text-stone-500 font-medium">Direct reporting attribution</span>
                </div>

                <div className="space-y-3">
                  {article.allReferences.map((ref, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-50 rounded-xl p-4 border border-stone-200 hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                              {ref.sourceName}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                Primary Lead
                              </span>
                            )}
                            <span className="text-xs text-stone-400 font-mono">
                              {new Date(ref.publishedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <h5 className="font-semibold text-stone-900 text-sm">
                            {ref.articleTitle}
                          </h5>
                          {ref.author && (
                            <p className="text-xs text-stone-500">By {ref.author}</p>
                          )}
                        </div>

                        <a
                          href={ref.articleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-900 hover:text-white transition-all shrink-0 cursor-pointer shadow-2xs"
                        >
                          <span>Open Original</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Side-by-Side Comparison Inspector */
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                  <SplitSquareVertical className="w-4 h-4 text-amber-700" />
                  Editorial Synthesis vs Original Raw Coverage Comparison
                </div>
                <p>
                  Review the structured AI rewrite against the original reporting raw snippets to inspect factual preservation, neutral tone, and explicit attribution.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Original Raw Feeds */}
                <div className="space-y-4 bg-stone-50 rounded-2xl p-5 border border-stone-200">
                  <div className="border-b border-stone-200 pb-2">
                    <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-stone-600" />
                      Original Raw Feeds ({article.allReferences.length})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">As ingested from primary publisher feeds</p>
                  </div>

                  <div className="space-y-4">
                    {article.allReferences.map((ref, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border border-stone-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-900">{ref.sourceName}</span>
                          <a
                            href={ref.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-700 hover:underline flex items-center gap-1"
                          >
                            <span>Direct link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <h5 className="text-sm font-semibold text-stone-800 leading-snug">
                          {ref.articleTitle}
                        </h5>
                        {ref.snippet && (
                          <p className="text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                            "{ref.snippet}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Synthesized Story */}
                <div className="space-y-4 bg-amber-50/30 rounded-2xl p-5 border border-amber-200">
                  <div className="border-b border-amber-200/80 pb-2">
                    <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Synthesized & Rewritten Article
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">Engine: {article.rewriteModel}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-stone-950 text-lg leading-snug">
                      {article.headline}
                    </h4>
                    <p className="text-xs font-semibold text-stone-700 bg-white p-3 rounded-xl border border-stone-200">
                      {article.summary}
                    </p>
                    <div className="text-xs text-stone-700 space-y-2 leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200">
                      {article.content.split('\n\n').map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-3.5 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500 flex items-center gap-2">
            <span className="font-mono text-[11px]">Attribution: {article.primarySource.sourceName}</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">{article.sourceReliabilityScore}% Trust Score</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close Story
          </button>
        </div>
      </div>
    </div>
  );
};
