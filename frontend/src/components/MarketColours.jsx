import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8000';

const SECTION_ORDER = [
  'Major Indices',
  'Sector Indices',
  'Countries',
  'Currencies',
  'Rates',
  'Energy',
  'Metals',
  'Agriculture',
];

// Module-level cache — survives page switches (component unmount/remount)
const cache = {
  data: null,
  fetchedAt: null,
  activeSections: new Set(SECTION_ORDER), // persists toggle state across page switches
};

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCompact(v) {
  if (v == null) return '';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 10000)   return (v / 1000).toFixed(1) + 'k';
  if (v >= 1000)    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (v >= 1)       return v.toFixed(2);
  return v.toPrecision(3);
}

function pctColor(pct) {
  if (pct === null || pct === undefined) return '#666666';
  if (pct > 0) return '#00E676';
  if (pct < 0) return '#FF3B30';
  return '#888888';
}

function formatPrice(price, ticker) {
  if (price === null || price === undefined) return 'N/A';
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (ticker && (ticker.includes('=X') || ticker.startsWith('^'))) {
    return price.toFixed(3);
  }
  return price.toFixed(2);
}

// Z-score tiers — relative to the instrument's own 5-year vol distribution
function zscoreColor(z) {
  if (z === null || z === undefined) return '#555';
  if (z >=  2.0) return '#FF3B30'; // extreme — top ~2.5%
  if (z >=  1.0) return '#FF8F00'; // elevated — top ~16%
  if (z >= -1.0) return '#888888'; // normal range
  return '#4a9aba';                // unusually quiet — bottom ~16%
}

// ─── sub-components ─────────────────────────────────────────────────────────

function RangeCell({ pct, lo, hi }) {
  if (pct === null || pct === undefined) {
    return <span className="mct-range mct-range-na">—</span>;
  }
  const color = pct >= 80 ? '#00E676' : pct <= 20 ? '#FF3B30' : '#888888';
  const tooltip = `Low: ${formatCompact(lo)}  ·  High: ${formatCompact(hi)}  ·  Position: ${pct.toFixed(1)}%`;
  return (
    <span className="mct-range" title={tooltip}>
      <span className="mct-range-bar">
        <span className="mct-range-fill" style={{ width: `${pct}%`, background: color }} />
        <span className="mct-range-marker" style={{ left: `${pct}%`, background: color }} />
      </span>
      <span className="mct-range-pct" style={{ color }}>{pct.toFixed(0)}%</span>
    </span>
  );
}

function VolCell({ vol, zscore }) {
  if (vol === null || vol === undefined) {
    return <span className="mct-hvol mct-hvol-na">—</span>;
  }
  const color = zscoreColor(zscore);
  const fill = zscore !== null ? Math.min(Math.max(zscore / 3, 0), 1) * 100 : 0;
  const zLabel = zscore !== null
    ? `${zscore >= 0 ? '+' : ''}${zscore.toFixed(1)}σ`
    : '—';
  return (
    <span className="mct-hvol" style={{ color }}>
      <span className="mct-vol-bar">
        <span className="mct-vol-fill" style={{ width: `${fill}%`, background: color }} />
      </span>
      {vol.toFixed(1)}%
      <span className="mct-vol-z">{zLabel}</span>
    </span>
  );
}

function AssetRow({ item }) {
  const pct = item.pct_change;
  const sign = pct > 0 ? '+' : '';
  const pctStr = pct !== null ? `${sign}${pct.toFixed(2)}%` : 'N/A';
  const changeSign = item.change !== null && item.change > 0 ? '+' : '';
  const changeStr = item.change !== null ? `${changeSign}${item.change.toFixed(2)}` : '';
  const priceStr = formatPrice(item.price, item.ticker);
  const color = pctColor(pct);

  return (
    <div className="mct-row">
      <span className="mct-label">{item.label}</span>
      <span className="mct-ticker">{item.ticker}</span>
      <span className="mct-price">{priceStr}</span>
      <span className="mct-pct" style={{ color }}>{pctStr}</span>
      <span className="mct-change" style={{ color }}>{changeStr}</span>
      <VolCell vol={item.hvol} zscore={item.vol_zscore} />
      <RangeCell pct={item.year_pct}  lo={item.year_lo}  hi={item.year_hi} />
      <RangeCell pct={item.month_pct} lo={item.month_lo} hi={item.month_hi} />
    </div>
  );
}

function AssetSection({ name, items }) {
  return (
    <div className="mct-section">
      <div className="mct-section-header">
        <span className="mct-section-title">{name}</span>
        <span className="mct-section-count">{items.length} instruments</span>
      </div>
      <div className="mct-col-headers">
        <span className="mct-label">NAME</span>
        <span className="mct-ticker">SYMBOL</span>
        <span className="mct-price">PRICE</span>
        <span className="mct-pct">DAY %</span>
        <span className="mct-change">CHANGE</span>
        <span className="mct-hvol">1M HVOL</span>
        <span className="mct-range">1Y RANGE</span>
        <span className="mct-range">1M RANGE</span>
      </div>
      {items.map(item => <AssetRow key={item.ticker} item={item} />)}
    </div>
  );
}

function CategoryFilter({ active, onToggle, onAll, onNone }) {
  return (
    <div className="mc-filter-bar">
      <span className="mc-filter-label">SHOW</span>
      {SECTION_ORDER.map(section => (
        <button
          key={section}
          className={`mc-filter-btn ${active.has(section) ? 'mc-filter-active' : ''}`}
          onClick={() => onToggle(section)}
        >
          {section}
        </button>
      ))}
      <div className="mc-filter-sep" />
      <button className="mc-filter-meta" onClick={onAll}>ALL</button>
      <button className="mc-filter-meta" onClick={onNone}>NONE</button>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function MarketColours() {
  const [data, setData] = useState(cache.data);
  const [loading, setLoading] = useState(cache.data === null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(cache.fetchedAt);
  const [refreshing, setRefreshing] = useState(false);
  // Mirror cache.activeSections into React state so toggling re-renders
  const [activeSections, setActiveSections] = useState(new Set(cache.activeSections));

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else if (cache.data === null) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/market-colours`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const now = new Date();
      cache.data = json;
      cache.fetchedAt = now;
      setData(json);
      setLastUpdated(now);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (cache.data === null) fetchData();
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleSection = useCallback((section) => {
    setActiveSections(prev => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      cache.activeSections = next;
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const next = new Set(SECTION_ORDER);
    cache.activeSections = next;
    setActiveSections(next);
  }, []);

  const selectNone = useCallback(() => {
    const next = new Set();
    cache.activeSections = next;
    setActiveSections(next);
  }, []);

  if (loading) {
    return (
      <div className="mc-loading">
        <div className="mc-loading-text">FETCHING MARKET DATA<span className="mc-blink">_</span></div>
        <div className="mc-loading-sub">Loading instruments across 8 asset classes...</div>
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

  const allItems = data ? Object.values(data).flat() : [];
  const withData = allItems.filter(i => i.pct_change !== null);
  const advancers = withData.filter(i => i.pct_change > 0).length;
  const decliners = withData.filter(i => i.pct_change < 0).length;
  const unchanged = withData.filter(i => i.pct_change === 0).length;
  const avgChange = withData.length > 0
    ? (withData.reduce((s, i) => s + i.pct_change, 0) / withData.length).toFixed(2)
    : '0.00';

  const visibleSections = SECTION_ORDER.filter(s => activeSections.has(s) && data?.[s]);

  return (
    <div className="mc-container">
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
        <div className="mc-summary-sep">|</div>
        <div className="mc-summary-item">
          <span className="mc-summary-label">1M HVOL</span>
          <span className="mc-summary-label" style={{ color: '#888' }}>
            z-score vs 5y rolling distribution
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

      <CategoryFilter
        active={activeSections}
        onToggle={toggleSection}
        onAll={selectAll}
        onNone={selectNone}
      />

      <div className="mc-sections">
        {visibleSections.length === 0 ? (
          <div className="mc-no-sections">NO CATEGORIES SELECTED</div>
        ) : (
          visibleSections.map(section => (
            <AssetSection key={section} name={section} items={data[section]} />
          ))
        )}
      </div>
    </div>
  );
}
