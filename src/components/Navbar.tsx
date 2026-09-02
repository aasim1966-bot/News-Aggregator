import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, ShieldCheck, Search, Layers, Radio, Sparkles } from 'lucide-react';
import { SyncStatus } from '../types';

interface NavbarProps {
  syncStatus: SyncStatus | null;
  onSyncNow: () => void;
  onOpenEngineModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  syncStatus,
  onSyncNow,
  onOpenEngineModal,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('15:00');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );

      if (syncStatus?.nextSyncTime) {
        const diffMs = new Date(syncStatus.nextSyncTime).getTime() - now.getTime();
        if (diffMs <= 0) {
          setTimeRemaining('Syncing now...');
        } else {
          const totalSec = Math.floor(diffMs / 1000);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          setTimeRemaining(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [syncStatus?.nextSyncTime]);

  return (
    <header id="news-masthead" className="border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 transition-all">
      {/* Top utility ticker strip */}
      <div className="border-b border-stone-100 bg-stone-900 text-stone-300 text-xs px-4 sm:px-8 py-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[11px] font-medium tracking-wide">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            LIVE VERIFIED WIRE
          </span>
          <span className="hidden sm:inline-block text-stone-500">|</span>
          <span className="hidden sm:inline-block text-stone-300">{currentDateStr}</span>
          <span className="hidden md:inline-block text-stone-500">|</span>
          <span className="hidden md:inline-flex items-center gap-1 text-stone-300">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            15+ Reliable Global & Pakistan Feeds
          </span>
        </div>

        {/* 15-Minute Sync Monitor */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="engine-stats-trigger"
            onClick={onOpenEngineModal}
            className="flex items-center gap-1.5 text-stone-300 hover:text-white transition-colors bg-stone-800/80 px-2.5 py-0.5 rounded-full text-[11px]"
            title="Inspect 15-Minute Scheduler & Deduplication Engine"
          >
            <Clock className="w-3 h-3 text-sky-400" />
            <span>Next Auto-Update: <strong className="text-white font-mono">{timeRemaining}</strong></span>
          </button>

          <button
            id="sync-now-btn"
            onClick={onSyncNow}
            disabled={syncStatus?.isSyncing}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500 text-stone-950 hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus?.isSyncing ? 'animate-spin' : ''}`} />
            {syncStatus?.isSyncing ? 'Updating...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Main Publication Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden shadow-md border-2 border-stone-800 bg-[#06152b] shrink-0 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="thereviser.co Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-950 flex items-center gap-2">
              <span>thereviser<span className="text-sky-600">.co</span></span>
              <span className="text-[10px] sm:text-xs font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200 hidden xs:inline-block">
                15-Min Live Wire
              </span>
            </h1>
            <p className="text-xs text-stone-500 hidden sm:block">
              Synthesizing global & Pakistan reports every 15 minutes • Zero duplicates • Verified source attribution
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="deduplication-logs-btn"
            onClick={onOpenEngineModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden md:inline">Deduplication Engine</span>
            {syncStatus && syncStatus.duplicatesPrevented > 0 && (
              <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {syncStatus.duplicatesPrevented} saved
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
