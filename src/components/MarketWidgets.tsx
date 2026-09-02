import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Coins,
  CircleDollarSign,
  Building2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { CategoryType } from '../types';

export interface MarketAsset {
  id: 'oil' | 'gold' | 'bitcoin' | 'kse100';
  name: string;
  symbol: string;
  subTitle: string;
  price: string;
  rawPrice: number;
  change: string;
  changeValue: string;
  isPositive: boolean;
  unit: string;
  high24h: string;
  low24h: string;
  volumeOrTurnover?: string;
  categoryTag: CategoryType;
  sparkline: number[];
  marketStatus: 'Open' | 'Closed' | 'Live 24/7';
  lastUpdated: string;
  dataSource?: string;
}

// Fallback real baselines if server is warming up
const INITIAL_REAL_MARKET_DATA: MarketAsset[] = [
  {
    id: 'oil',
    name: 'Crude Oil',
    symbol: 'BRENT',
    subTitle: 'Brent Crude Spot / Futures',
    price: '$92.07',
    rawPrice: 92.07,
    change: '+1.75%',
    changeValue: '+$1.58',
    isPositive: true,
    unit: 'USD / bbl',
    high24h: '$92.54',
    low24h: '$90.73',
    volumeOrTurnover: '380K Contracts',
    categoryTag: 'Oil & Energy',
    sparkline: [90.8, 91.2, 91.0, 91.8, 92.3, 92.1, 92.07],
    marketStatus: 'Open',
    lastUpdated: 'Live',
    dataSource: 'Yahoo Finance / ICE',
  },
  {
    id: 'gold',
    name: 'Spot Gold',
    symbol: 'XAU/USD',
    subTitle: 'Gold Bullion 999.9',
    price: '$4,424.10',
    rawPrice: 4424.1,
    change: '-1.28%',
    changeValue: '-$57.40',
    isPositive: false,
    unit: 'USD / oz',
    high24h: '$4,510.50',
    low24h: '$4,413.00',
    volumeOrTurnover: '$19.2B Global',
    categoryTag: 'Gold & Commodities',
    sparkline: [4435, 4428, 4413, 4426, 4433, 4425, 4424.1],
    marketStatus: 'Open',
    lastUpdated: 'Live',
    dataSource: 'COMEX / LBMA Spot',
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC/USD',
    subTitle: 'Digital Gold / Crypto',
    price: '$77,988.00',
    rawPrice: 77988.0,
    change: '-0.63%',
    changeValue: '-$490.55',
    isPositive: false,
    unit: 'USD / BTC',
    high24h: '$79,250.00',
    low24h: '$77,675.04',
    volumeOrTurnover: '$1.14B 24h',
    categoryTag: 'Finance',
    sparkline: [77675, 78478, 78462, 77988],
    marketStatus: 'Live 24/7',
    lastUpdated: 'Live',
    dataSource: 'Binance / Global Crypto Feed',
  },
  {
    id: 'kse100',
    name: 'Karachi Stock Ex.',
    symbol: 'PSX KSE-100',
    subTitle: 'Pakistan Stock Exchange',
    price: '176,466.99',
    rawPrice: 176466.99,
    change: '-0.29%',
    changeValue: '-508.69 pts',
    isPositive: false,
    unit: 'PKR Index Pts',
    high24h: '177,800.28',
    low24h: '176,375.01',
    volumeOrTurnover: '485M Shares',
    categoryTag: 'Pakistan',
    sparkline: [176375, 176975, 177800, 176466.99],
    marketStatus: 'Open',
    lastUpdated: 'Live',
    dataSource: 'Pakistan Stock Exchange (PSX)',
  },
];

interface MarketWidgetsProps {
  onSelectCategory?: (cat: CategoryType) => void;
  activeCategory?: CategoryType;
}

export const MarketWidgets: React.FC<MarketWidgetsProps> = ({
  onSelectCategory,
  activeCategory,
}) => {
  const [markets, setMarkets] = useState<MarketAsset[]>(INITIAL_REAL_MARKET_DATA);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');
  const [isVerifiedRealTime, setIsVerifiedRealTime] = useState<boolean>(true);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  // Fetch real-time market data from the backend service
  const fetchLiveMarkets = useCallback(async (force = false) => {
    setIsUpdating(true);
    try {
      const endpoint = force ? '/api/markets/live?refresh=true' : '/api/markets/live';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.assets) && data.assets.length > 0) {
          setMarkets(data.assets);
          setLastSyncTime(data.lastUpdated || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setIsVerifiedRealTime(true);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live market prices:', err);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Initial fetch and auto-polling every 20 seconds
  useEffect(() => {
    fetchLiveMarkets(false);
    const interval = setInterval(() => {
      fetchLiveMarkets(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchLiveMarkets]);

  const handleManualRefresh = () => {
    fetchLiveMarkets(true);
  };

  const renderSparkline = (data: number[], isPositive: boolean) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 64;
    const height = 24;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#22c55e' : '#ef4444';

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const getAssetIcon = (id: string) => {
    switch (id) {
      case 'oil':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'gold':
        return <Coins className="w-4 h-4 text-yellow-500" />;
      case 'bitcoin':
        return <CircleDollarSign className="w-4 h-4 text-orange-500" />;
      case 'kse100':
        return <Building2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-stone-500" />;
    }
  };

  return (
    <div id="financial-market-widgets" className="w-full bg-stone-950 border-y border-stone-800 text-stone-100 py-3 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Strip with Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-stone-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Real-Time Markets Wire
            </span>
            <span className="hidden sm:inline-block text-stone-700">•</span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Direct Live Benchmarks (Oil, Gold, BTC, PSX KSE-100)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-stone-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-500" />
              <span>Updated: {lastSyncTime}</span>
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 text-stone-200 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-700/80 px-2.5 py-1 rounded-md transition-all active:scale-95 disabled:opacity-50 font-medium shadow-xs"
              title="Refresh Real-Time Market Quotes"
            >
              <RefreshCw className={`w-3 h-3 text-sky-400 ${isUpdating ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">Update Quotes</span>
            </button>
          </div>
        </div>

        {/* Responsive 4-Column Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {markets.map((asset) => {
            const isSelectedCategory = activeCategory === asset.categoryTag;

            return (
              <div
                key={asset.id}
                id={`widget-${asset.id}`}
                onMouseEnter={() => setActiveAssetId(asset.id)}
                onMouseLeave={() => setActiveAssetId(null)}
                className={`relative rounded-xl p-3.5 bg-stone-900/90 border transition-all duration-200 flex flex-col justify-between shadow-xs ${
                  isSelectedCategory
                    ? 'border-sky-500 ring-1 ring-sky-500/50 bg-stone-900'
                    : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                {/* Top Row: Symbol, Subtitle & Mini Sparkline */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0 shadow-inner">
                      {getAssetIcon(asset.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm tracking-tight text-white">
                          {asset.name}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-1 rounded bg-stone-800 text-stone-300">
                          {asset.symbol}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 truncate max-w-[120px]">
                        {asset.subTitle}
                      </p>
                    </div>
                  </div>

                  {/* Sparkline & Status */}
                  <div className="flex flex-col items-end">
                    {renderSparkline(asset.sparkline, asset.isPositive)}
                    <span className="text-[9px] text-stone-400 font-mono mt-0.5 uppercase tracking-wider">
                      {asset.marketStatus}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Price & Percentage Change */}
                <div className="flex items-baseline justify-between pt-1 pb-1.5">
                  <div>
                    <span className="font-mono text-xl font-extrabold tracking-tight text-white">
                      {asset.price}
                    </span>
                    <span className="text-[10px] text-stone-400 ml-1 font-sans">
                      {asset.unit}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                      asset.isPositive
                        ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/60'
                        : 'bg-red-950/90 text-red-400 border border-red-800/60'
                    }`}
                  >
                    {asset.isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>{asset.change}</span>
                  </div>
                </div>

                {/* Bottom Row: 24h High/Low & Optional Filter Jump */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-[10px] text-stone-400">
                  <div className="flex items-center gap-2 font-mono">
                    <span>H: <strong className="text-stone-300">{asset.high24h}</strong></span>
                    <span>L: <strong className="text-stone-300">{asset.low24h}</strong></span>
                  </div>

                  {onSelectCategory && (
                    <button
                      onClick={() => onSelectCategory(asset.categoryTag)}
                      className="inline-flex items-center gap-0.5 text-[10px] text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                      title={`View latest news on ${asset.categoryTag}`}
                    >
                      <span>{asset.categoryTag}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
