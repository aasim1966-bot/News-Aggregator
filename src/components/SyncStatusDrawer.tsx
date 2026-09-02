import React from 'react';
import {
  X,
  RefreshCw,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Activity,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { FeedSource, SyncStatus } from '../types';

interface SyncStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus | null;
  sources: FeedSource[];
  onSyncNow: () => void;
}

export const SyncStatusDrawer: React.FC<SyncStatusDrawerProps> = ({
  isOpen,
  onClose,
  syncStatus,
  sources,
  onSyncNow,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        id="engine-status-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold">15-Minute Engine & Deduplication Hub</h2>
              <p className="text-xs text-stone-400">Automated scheduling, reliable feed ingestion & headline clustering</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSyncNow}
              disabled={syncStatus?.isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus?.isSyncing ? 'animate-spin' : ''}`} />
              {syncStatus?.isSyncing ? 'Syncing...' : 'Trigger Sync Now'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Top Engine KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Interval Period</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
                {syncStatus?.intervalMinutes || 15} mins
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Automated background sync</div>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase mb-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Duplicates Filtered</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-700">
                {syncStatus?.duplicatesPrevented || 0}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Cross-source headlines merged</div>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase mb-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unique Stories</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
                {syncStatus?.uniqueArticlesCount || 0}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">AI-rewritten & verified</div>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Monitored Feeds</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-sky-700">
                {sources.length} Active
              </div>
              <div className="text-[11px] text-stone-500 mt-1">100% reliable curated sources</div>
            </div>
          </div>

          {/* Deduplication Logic Explanation */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-sm text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              How 15-Minute News Ingestion & Deduplication Works:
            </div>
            <p className="leading-relaxed">
              When raw articles are ingested every 15 minutes across leading agencies (Reuters, AFP, APP, NYT, WSJ, Washington Post, Bloomberg, Dawn), our multi-tier deduplication algorithm performs token normalization, extracts significant n-grams, and calculates token Jaccard similarity. Articles reporting on the same event across multiple publications are automatically clustered into a single synthesized digest while preserving all original references.
            </p>
          </div>

          {/* Monitored News Feeds Table */}
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-stone-600" />
              Verified Feed Directory ({sources.length})
            </h3>
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Publication</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Reliability</th>
                      <th className="py-2.5 px-3">Editorial Bias</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {sources.map((source) => (
                      <tr key={source.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2 px-4 font-semibold text-stone-900">
                          <a
                            href={source.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>{source.name}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                          </a>
                        </td>
                        <td className="py-2 px-3 text-stone-600">{source.category}</td>
                        <td className="py-2 px-3 font-mono font-medium text-emerald-700">
                          {source.reliabilityScore}%
                        </td>
                        <td className="py-2 px-3 text-stone-500">{source.bias}</td>
                        <td className="py-2 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              source.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : source.status === 'syncing'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {source.status === 'active' && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {source.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Real-time Activity Logs */}
          {syncStatus?.recentLogs && syncStatus.recentLogs.length > 0 && (
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-stone-600" />
                Live Ingestion & Clustering Log
              </h3>
              <div className="bg-stone-950 rounded-xl p-4 font-mono text-xs text-stone-300 max-h-48 overflow-y-auto space-y-2">
                {syncStatus.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-stone-500 text-[10px] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        log.type === 'success'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.type === 'warn'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : log.type === 'error'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-stone-200 leading-snug">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-3.5 bg-stone-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-500 font-mono">
            Last Sync: {syncStatus?.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : 'Pending'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
