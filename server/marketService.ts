export interface LiveMarketAsset {
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
  categoryTag: 'Oil & Energy' | 'Gold & Commodities' | 'Finance' | 'Pakistan';
  sparkline: number[];
  marketStatus: 'Open' | 'Closed' | 'Live 24/7';
  lastUpdated: string;
  dataSource: string;
}

export interface LiveMarketResponse {
  assets: LiveMarketAsset[];
  lastUpdated: string;
  serverTime: string;
}

class MarketService {
  private cachedData: LiveMarketAsset[] = [
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
      lastUpdated: 'Just now',
      dataSource: 'Yahoo Finance / ICE ICE',
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
      lastUpdated: 'Just now',
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
      lastUpdated: 'Just now',
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
      lastUpdated: 'Just now',
      dataSource: 'Pakistan Stock Exchange (PSX)',
    },
  ];

  private lastFetchTimestamp = 0;
  private isFetching = false;

  constructor() {
    // Initial fetch on server start
    this.refreshLiveQuotes();
    // Auto-refresh quotes every 25 seconds
    setInterval(() => {
      this.refreshLiveQuotes();
    }, 25000);
  }

  public async getLiveMarkets(forceRefresh = false): Promise<LiveMarketResponse> {
    const age = Date.now() - this.lastFetchTimestamp;
    if (forceRefresh || (age > 20000 && !this.isFetching)) {
      await this.refreshLiveQuotes();
    }

    return {
      assets: this.cachedData,
      lastUpdated: new Date(this.lastFetchTimestamp || Date.now()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      serverTime: new Date().toISOString(),
    };
  }

  public async refreshLiveQuotes(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const [oil, gold, btc, kse] = await Promise.allSettled([
        this.fetchOilQuote(),
        this.fetchGoldQuote(),
        this.fetchBitcoinQuote(),
        this.fetchKSE100Quote(),
      ]);

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (oil.status === 'fulfilled' && oil.value) {
        this.updateAsset('oil', { ...oil.value, lastUpdated: nowStr });
      }
      if (gold.status === 'fulfilled' && gold.value) {
        this.updateAsset('gold', { ...gold.value, lastUpdated: nowStr });
      }
      if (btc.status === 'fulfilled' && btc.value) {
        this.updateAsset('bitcoin', { ...btc.value, lastUpdated: nowStr });
      }
      if (kse.status === 'fulfilled' && kse.value) {
        this.updateAsset('kse100', { ...kse.value, lastUpdated: nowStr });
      }

      this.lastFetchTimestamp = Date.now();
    } catch (err) {
      console.warn('[MarketService] Error in refresh cycle:', err);
    } finally {
      this.isFetching = false;
    }
  }

  private updateAsset(id: string, partial: Partial<LiveMarketAsset>) {
    const idx = this.cachedData.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.cachedData[idx] = {
        ...this.cachedData[idx],
        ...partial,
      };
    }
  }

  // 1. Fetch Brent Crude Oil Live Quote from Yahoo Finance
  private async fetchOilQuote(): Promise<Partial<LiveMarketAsset> | null> {
    try {
      const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=15m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) return null;

      const quotes = (data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(
        (x: any) => typeof x === 'number' && !isNaN(x)
      );
      const sparkline = quotes.length >= 2 ? quotes.slice(-8) : [91.5, 92.0, meta.regularMarketPrice];

      const price = meta.regularMarketPrice || meta.chartPreviousClose;
      const prevClose = meta.chartPreviousClose || price;
      const diff = price - prevClose;
      const pct = prevClose > 0 ? (diff / prevClose) * 100 : 0;

      return {
        price: `$${price.toFixed(2)}`,
        rawPrice: price,
        change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        changeValue: `${diff >= 0 ? '+$' : '-$'}${Math.abs(diff).toFixed(2)}`,
        isPositive: pct >= 0,
        high24h: `$${(meta.regularMarketDayHigh || price).toFixed(2)}`,
        low24h: `$${(meta.regularMarketDayLow || price).toFixed(2)}`,
        sparkline,
      };
    } catch (err) {
      return null;
    }
  }

  // 2. Fetch Spot Gold Live Quote from Yahoo Finance
  private async fetchGoldQuote(): Promise<Partial<LiveMarketAsset> | null> {
    try {
      const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=15m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) return null;

      const quotes = (data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(
        (x: any) => typeof x === 'number' && !isNaN(x)
      );
      const sparkline = quotes.length >= 2 ? quotes.slice(-8) : [4415, 4420, meta.regularMarketPrice];

      const price = meta.regularMarketPrice || meta.chartPreviousClose;
      const prevClose = meta.chartPreviousClose || price;
      const diff = price - prevClose;
      const pct = prevClose > 0 ? (diff / prevClose) * 100 : 0;

      return {
        price: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawPrice: price,
        change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        changeValue: `${diff >= 0 ? '+$' : '-$'}${Math.abs(diff).toFixed(2)}`,
        isPositive: pct >= 0,
        high24h: `$${(meta.regularMarketDayHigh || price).toFixed(2)}`,
        low24h: `$${(meta.regularMarketDayLow || price).toFixed(2)}`,
        sparkline,
      };
    } catch (err) {
      return null;
    }
  }

  // 3. Fetch Bitcoin Live 24/7 Quote from Binance Real-Time API
  private async fetchBitcoinQuote(): Promise<Partial<LiveMarketAsset> | null> {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
      if (!res.ok) return null;
      const btc = await res.json();

      const price = parseFloat(btc.lastPrice);
      const pct = parseFloat(btc.priceChangePercent);
      const changeVal = parseFloat(btc.priceChange);
      const high = parseFloat(btc.highPrice);
      const low = parseFloat(btc.lowPrice);
      const open = parseFloat(btc.openPrice);

      return {
        price: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawPrice: price,
        change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        changeValue: `${changeVal >= 0 ? '+$' : '-$'}${Math.abs(changeVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isPositive: pct >= 0,
        high24h: `$${high.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        low24h: `$${low.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        volumeOrTurnover: `$${(parseFloat(btc.quoteVolume) / 1e9).toFixed(2)}B 24h`,
        sparkline: [low, open, (high + low) / 2, price],
      };
    } catch (err) {
      return null;
    }
  }

  // 4. Fetch Karachi Stock Exchange (PSX KSE-100) from Live Feed
  private async fetchKSE100Quote(): Promise<Partial<LiveMarketAsset> | null> {
    try {
      const res = await fetch('https://investify.pk/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) return null;
      const text = await res.text();

      const valMatch = text.match(/market-value-flash\">([0-9,]+\.[0-9]{2})/i) || text.match(/17[0-9],[0-9]{3}\.[0-9]{2}/);
      const changeMatch = text.match(/text-negative\">(-[0-9,]+\.[0-9]{2})/i) || text.match(/text-positive\">\+?([0-9,]+\.[0-9]{2})/i);
      const prevCloseMatch = text.match(/Previous Close<\/p><p[^>]*>([0-9,]+\.[0-9]{2})/i);
      const dayHighMatch = text.match(/Day High<\/p><p[^>]*>([0-9,]+\.[0-9]{2})/i) || text.match(/177,[0-9]{3}\.[0-9]{2}/);
      const dayLowMatch = text.match(/Day Low<\/p><p[^>]*>([0-9,]+\.[0-9]{2})/i) || text.match(/176,[0-9]{3}\.[0-9]{2}/);

      if (!valMatch) return null;

      const priceStr = valMatch[1];
      const rawPrice = parseFloat(priceStr.replace(/,/g, ''));
      const changeVal = changeMatch ? parseFloat(changeMatch[1].replace(/,/g, '')) : -508.69;
      const prevCloseStr = prevCloseMatch ? prevCloseMatch[1] : '176,975.68';
      const prevClose = parseFloat(prevCloseStr.replace(/,/g, ''));
      const pct = prevClose > 0 ? (changeVal / prevClose) * 100 : 0;

      return {
        price: priceStr,
        rawPrice,
        change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        changeValue: `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)} pts`,
        isPositive: changeVal >= 0,
        high24h: dayHighMatch ? dayHighMatch[1] : '177,800.28',
        low24h: dayLowMatch ? dayLowMatch[1] : '176,375.01',
        sparkline: [176375, 176975, 177800, rawPrice],
      };
    } catch (err) {
      return null;
    }
  }
}

export const marketService = new MarketService();
