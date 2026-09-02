import React from 'react';
import { ShieldCheck, Clock, Layers, Sparkles, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenEngineModal: () => void;
  sourcesCount: number;
}

export const Footer: React.FC<FooterProps> = ({ onOpenEngineModal, sourcesCount }) => {
  return (
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-300 py-12 px-4 sm:px-8 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-700 bg-[#06152b] shrink-0">
              <img
                src="/logo.png"
                alt="thereviser.co Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="font-serif text-xl font-bold text-white">thereviser<span className="text-sky-400">.co</span></span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed max-w-md">
            An automated news synthesizer polling verified global and Pakistan publications every 15 minutes. All duplicate coverage across reporting outlets is clustered and rewritten with explicit journalistic attribution.
          </p>
          <div className="flex items-center gap-2 pt-2 text-xs text-amber-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Attribution Guarantee: Every fact links directly to original reporting.</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Platform Engine
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>15-Minute Polling Cycle</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Jaccard Headline Deduplication</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Synthesized Rewriting</span>
            </li>
            <li>
              <button
                onClick={onOpenEngineModal}
                className="text-amber-400 hover:underline inline-flex items-center gap-1 mt-1 font-semibold cursor-pointer"
              >
                Inspect Engine Metrics →
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Monitored Bureaus ({sourcesCount})
          </h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Ingesting verified feeds from Dawn News, The Express Tribune, The News International, Geo News, BBC News, NPR, The Guardian, TechCrunch, CNBC, MarketWatch, Phys.org, and Nature.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <div>
          © {new Date().getFullYear()} thereviser.co. Original articles remain copyright of their respective publishers.
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 font-mono text-[11px]">● SYSTEM HEALTHY</span>
        </div>
      </div>
    </footer>
  );
};
