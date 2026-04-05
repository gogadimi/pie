'use client';

import { useState } from 'react';

interface ScrapeResult {
  success: boolean;
  price?: number;
  currency?: string;
  productName?: string;
  originalPrice?: number;
  discountPct?: number;
  inStock?: boolean;
  confidence?: number;
  error?: string;
  strategy?: string;
  duration?: number;
}

interface ScrapeLog {
  id: string;
  url: string;
  result: ScrapeResult;
  timestamp: string;
}

export default function ScrapingPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ScrapeLog[]>([]);

  const handleScrape = async () => {
    if (!url) return;
    setLoading(true);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          competitorId: 'manual',
          productId: 'manual',
          organizationId: 'manual',
        }),
      });

      const data = await response.json();
      const newLog: ScrapeLog = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        result: data,
        timestamp: new Date().toLocaleString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      setUrl('');
    } catch (error: any) {
      const newLog: ScrapeLog = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        result: { success: false, error: error.message },
        timestamp: new Date().toLocaleString(),
      };
      setLogs((prev) => [newLog, ...prev]);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🕷️ Scraping Engine</h1>
        <p className="text-slate-500 mt-1">Test scraper with any product URL</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Scrape a URL</h2>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/product"
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
          />
          <button
            onClick={handleScrape}
            disabled={loading || !url}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scraping...
              </span>
            ) : (
              '🚀 Scrape'
            )}
          </button>
        </div>
        <div className="mt-3 flex gap-2 text-xs text-slate-400">
          <span>Try:</span>
          {[
            'https://www.amazon.com/dp/B0BSHF7WHX',
            'https://www.apple.com/shop/buy-mac/macbook-air',
            'https://www.nike.com/t/air-max-90',
          ].map((testUrl) => (
            <button
              key={testUrl}
              onClick={() => setUrl(testUrl)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {new URL(testUrl).hostname}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {logs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Scrape Results ({logs.length})</h2>
          {logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-lg border p-5 ${
                log.result.success
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-red-200 bg-red-50/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {log.result.productName || new URL(log.url).hostname}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{log.url}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      log.result.success
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {log.result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
              </div>

              {log.result.success && log.result.price && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="text-lg font-bold text-slate-900">
                      {log.result.currency}{log.result.price.toFixed(2)}
                    </p>
                  </div>
                  {log.result.originalPrice && (
                    <div>
                      <p className="text-xs text-slate-500">Original</p>
                      <p className="text-sm text-slate-600 line-through">
                        {log.result.currency}{log.result.originalPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {log.result.discountPct && (
                    <div>
                      <p className="text-xs text-slate-500">Discount</p>
                      <p className="text-sm font-medium text-red-600">-{log.result.discountPct}%</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Stock</p>
                    <p
                      className={`text-sm font-medium ${
                        log.result.inStock ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {log.result.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                    </p>
                  </div>
                </div>
              )}

              {!log.result.success && log.result.error && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Error</p>
                  <p className="text-sm text-red-600">{log.result.error}</p>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/50">
                <span className="text-xs text-slate-400">
                  Strategy: <span className="font-mono font-medium text-slate-600">{log.result.strategy}</span>
                </span>
                <span className="text-xs text-slate-400">
                  Duration: <span className="font-mono font-medium text-slate-600">{log.result.duration}ms</span>
                </span>
                <span className="text-xs text-slate-400 ml-auto">{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scraper status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Scraper Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-xs text-indigo-600 font-medium">Active Strategies</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">3</p>
            <p className="text-xs text-indigo-500 mt-1">Puppeteer • Firecrawl • Static</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-600 font-medium">Max Concurrent</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">3</p>
            <p className="text-xs text-emerald-500 mt-1">Jobs in parallel</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-600 font-medium">Max Retries</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">3</p>
            <p className="text-xs text-amber-500 mt-1">Per URL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
