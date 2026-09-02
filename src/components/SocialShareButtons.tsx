import React, { useState } from 'react';
import {
  Share2,
  Check,
  Copy,
  Mail,
  Send,
  ExternalLink,
} from 'lucide-react';
import { NewsArticle } from '../types';

interface SocialShareProps {
  article: NewsArticle;
  variant?: 'inline' | 'compact' | 'modal';
  onShareCompleted?: () => void;
}

export const SocialShareButtons: React.FC<SocialShareProps> = ({
  article,
  variant = 'inline',
  onShareCompleted,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  // Generate shareable URL - prefer the actual reference URL or current window URL
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/#story=${article.id}`
      : article.primarySource.articleUrl;

  const shareTitle = `${article.headline} (via thereviser.co - Verified Digest)`;
  const shareSummary = article.summary;

  const socialLinks = [
    {
      name: 'X (Twitter)',
      color: 'bg-black text-white hover:bg-stone-800',
      iconText: '𝕏',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(article.primarySource.articleUrl || shareUrl)}`,
    },
    {
      name: 'WhatsApp',
      color: 'bg-emerald-600 text-white hover:bg-emerald-700',
      iconText: 'WA',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n\n' + shareSummary + '\n' + (article.primarySource.articleUrl || shareUrl))}`,
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600 text-white hover:bg-blue-700',
      iconText: 'fb',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.primarySource.articleUrl || shareUrl)}`,
    },
    {
      name: 'Reddit',
      color: 'bg-orange-600 text-white hover:bg-orange-700',
      iconText: 'r/',
      url: `https://reddit.com/submit?url=${encodeURIComponent(article.primarySource.articleUrl || shareUrl)}&title=${encodeURIComponent(article.headline)}`,
    },
    {
      name: 'Telegram',
      color: 'bg-sky-500 text-white hover:bg-sky-600',
      iconText: 'tg',
      url: `https://t.me/share/url?url=${encodeURIComponent(article.primarySource.articleUrl || shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
  ];

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${article.headline}\n\n${article.summary}\n\nOriginal Source (${article.primarySource.sourceName}): ${article.primarySource.articleUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onShareCompleted) onShareCompleted();
    }
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.headline,
          text: article.summary,
          url: article.primarySource.articleUrl || shareUrl,
        });
        if (onShareCompleted) onShareCompleted();
      } catch (err) {
        // user cancelled or failed
      }
    } else {
      handleCopyLink(e);
    }
  };

  const openShareWindow = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    if (onShareCompleted) onShareCompleted();
  };

  // Compact trigger for cards
  if (variant === 'compact') {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpenMenu(!isOpenMenu);
          }}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Share to social media"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {isOpenMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenMenu(false);
              }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 p-2 z-50 animate-fadeIn"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1 mb-1 border-b border-stone-100">
                Share Verified Story
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {socialLinks.map((social) => (
                  <button
                    key={social.name}
                    onClick={(e) => {
                      openShareWindow(social.url, e);
                      setIsOpenMenu(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${social.color}`}
                  >
                    <span className="font-mono text-xs">{social.iconText}</span>
                    <span>{social.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              <div className="pt-1 border-t border-stone-100 space-y-1">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary Link'}</span>
                  </span>
                </button>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={(e) => {
                      handleNativeShare(e);
                      setIsOpenMenu(false);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer font-medium"
                  >
                    <Share2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>More Apps...</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full rich toolbar for modal or inline view
  return (
    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-amber-700" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Share Story to Social Forums
          </h4>
        </div>
        <span className="text-[11px] text-stone-500 font-mono">Includes original attribution</span>
      </div>

      {/* Social Buttons Grid */}
      <div className="flex flex-wrap items-center gap-2">
        {socialLinks.map((social) => (
          <button
            key={social.name}
            onClick={(e) => openShareWindow(social.url, e)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer ${social.color}`}
            title={`Share to ${social.name}`}
          >
            <span className="font-mono text-xs">{social.iconText}</span>
            <span>{social.name}</span>
          </button>
        ))}

        <button
          onClick={(e) => openShareWindow(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareSummary + '\n\nRead original reporting at:\n' + article.primarySource.articleUrl)}`, e)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 text-stone-800 hover:bg-stone-300 transition-colors cursor-pointer"
          title="Share via Email"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email</span>
        </button>

        <button
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
          }`}
          title="Copy full reference link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
        </button>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
            title="Open device native sharing menu"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Device Share</span>
          </button>
        )}
      </div>
    </div>
  );
};
