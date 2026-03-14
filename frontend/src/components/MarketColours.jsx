import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8000';

// Maps a pct_change value to a background colour intensity
function getTileColor(pct) {
  if (pct === null || pct === undefined) return { bg: '#1a1a1a', text: '#888888' };
  const abs = Math.abs(pct);
  const intensity = Math.min(abs / 3, 1); // saturates at ±3%

  if (pct > 0) {
    // Green scale: darker green → bright green
    const g = Math.round(50 + intensity * 180);
    const r = Math.round(0 + intensity * 10);
    const b = Math.round(0 + intensity * 30);
    const bg = `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.5})`;
    const border = `rgba(0, ${g}, ${b}, 0.6)`;
    return { bg, border, text: '#00E676' };
  } else if (pct < 0) {
    // Red scale: dark red → bright red
    const r = Math.round(80 + intensity * 175);
    const g = Math.round(0 + intensity * 20);
    const b = Math.round(0 + intensity * 20);
    const bg = `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.5})`;
    const border = `rgba(${r}, 0, 0, 0.6)`;
    return { bg, border, text: '#FF3B30' };
  } else {
    return { bg: '#1a1a1a', border: '#333', text: '#888888' };
  }
}

function formatPrice(price, ticker) {
  if (price === null || price === undefined) return 'N/A';
  // Currencies and rates need more decimals
  if (ticker && (ticker.includes('=X') || ticker.startsWith('^'))) {
    return price.toFixed(3);
  }
  return price.toFixed(2);
}

function AssetTile({ item }) {
  const { bg, border, text } = getTileColor(item.pct_change);
  const sign = item.pct_change > 0 ? '+' : '';
  const pctStr = item.pct_change !== null ? `${sign}${item.pct_change.toFixed(2)}%` : 'N/A';
  const priceStr = formatPrice(item.price, item.ticker);
  const changeSign = item.change > 0 ? '+' : '';
  const changeStr = item.change !== null ? `${changeSign}${item.change.toFixed(2)}` : '';

  return (
    <div
      className="mc-tile"
      style={{
        backgroundColor: bg,
        borderColor: border || '#333333',
      }}
      title={item.ticker}
    >
      <div className="mc-tile-label">{item.label}</div>
      <div className="mc-tile-price">{priceStr}</div>
      <div className="mc-tile-pct" style={{ color: text }}>{pctStr}</div>
      <div className="mc-tile-change" style={{ color: text }}>{changeStr}</div>
    </div>
  );
}

function AssetGroup({ name, items }) {
  return (
    <div className="mc-group">
      <div className="mc-group-header">
        <span className="mc-group-title">{name}</span>
        <span className="mc-group-count">{items.length} instruments</span>
      </div>
      <div className="mc-tiles-grid">
        {items.map(item => (
          <AssetTile key={item.ticker} item={item} />
        ))}
      </div>
    </div>
  );
}

// Section order for display
const SECTION_ORDER = [
  'Major Indices',
  'Sector Indices',
  'Countries',
  'Currencies',
  'Rates',
  'Commodities',
];

export function MarketColours() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/market-colours`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="mc-loading">
        <div className="mc-loading-text">FETCHING MARKET DATA<span className="mc-blink">_</span></div>
        <div className="mc-loading-sub">Loading ~60 instruments across 6 asset classes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mc-error">
        <div className="mc-error-title">// FEED ERROR</div>
        <div className="mc-error-msg">{error}</div>
        <button className="terminal-btn" onClick={() => fetchData()}>RETRY</button>
      </div>
    );
  }

  // Compute summary stats
  const allItems = data ? Object.values(data).flat() : [];
  const withData = allItems.filter(i => i.pct_change !== null);
  const advancers = withData.filter(i => i.pct_change > 0).length;
  const decliners = withData.filter(i => i.pct_change < 0).length;
  const unchanged = withData.filter(i => i.pct_change === 0).length;
  const avgChange = withData.length > 0
    ? (withData.reduce((s, i) => s + i.pct_change, 0) / withData.length).toFixed(2)
    : '0.00';

  return (
    <div className="mc-container">
      {/* Summary bar */}
      <div className="mc-summary-bar">
        <div className="mc-summary-item">
          <span className="mc-summary-label">ADVANCERS</span>
          <span className="mc-summary-val mc-green">{advancers}</span>
        </div>
        <div className="mc-summary-sep">|</div>
        <div className="mc-summary-item">
          <span className="mc-summary-label">DECLINERS</span>
          <span className="mc-summary-val mc-red">{decliners}</span>
        </div>
        <div className="mc-summary-sep">|</div>
        <div className="mc-summary-item">
          <span className="mc-summary-label">UNCHANGED</span>
          <span className="mc-summary-val">{unchanged}</span>
        </div>
        <div className="mc-summary-sep">|</div>
        <div className="mc-summary-item">
          <span className="mc-summary-label">AVG MOVE</span>
          <span className={`mc-summary-val ${parseFloat(avgChange) >= 0 ? 'mc-green' : 'mc-red'}`}>
            {avgChange > 0 ? '+' : ''}{avgChange}%
          </span>
        </div>
        <div className="mc-summary-spacer" />
        <div className="mc-summary-time">
          {lastUpdated && `LAST UPDATED: ${lastUpdated.toLocaleTimeString()}`}
        </div>
        <button
          className={`terminal-btn mc-refresh-btn ${refreshing ? 'mc-refreshing' : ''}`}
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          {refreshing ? 'REFRESHING...' : '↻ REFRESH'}
        </button>
      </div>

      {/* Legend */}
      <div className="mc-legend">
        <span className="mc-legend-label">COLOUR SCALE:</span>
        <div className="mc-legend-bar">
          <span className="mc-legend-neg">-3%</span>
          <div className="mc-legend-gradient" />
          <span className="mc-legend-pos">+3%</span>
        </div>
        <span className="mc-legend-note">| Daily change vs prior close</span>
      </div>

      {/* Asset class sections */}
      <div className="mc-sections">
        {SECTION_ORDER.map(section => (
          data[section] && (
            <AssetGroup key={section} name={section} items={data[section]} />
          )
        ))}
      </div>
    </div>
  );
}
