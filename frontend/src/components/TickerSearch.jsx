import React, { useState, useRef, useEffect } from 'react';
import { SYMBOLS } from '../data/symbols';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function TickerSearch({ onAdd }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const [iwbSymbols, setIwbSymbols] = useState([]);

  // iShares-backed autocomplete: fetch once, then merge with the hardcoded symbols.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/autocomplete-symbols?limit=1000`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setIwbSymbols(Array.isArray(json.symbols) ? json.symbols : []);
      } catch {
        // If iShares fetching fails, we silently fall back to hardcoded symbols.
        if (cancelled) return;
        setIwbSymbols([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dedupeBySymbol = (items) => {
    const seen = new Set();
    const out = [];
    for (const item of items) {
      const sym = item?.symbol;
      if (!sym) continue;
      const key = sym.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  };

  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const q = query.trim().toUpperCase();
    const allSymbols = dedupeBySymbol([...SYMBOLS, ...iwbSymbols]);
    const filtered = allSymbols.filter(
      s => s.symbol.toUpperCase().includes(q) || s.label.toUpperCase().includes(q)
    ).slice(0, 10); // cap at 10 suggestions
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setActiveIndex(-1);
  }, [query, iwbSymbols]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (symbol) => {
    setQuery(symbol);
    setSuggestions([]);
    setOpen(false);
  };

  const submit = (e) => {
    e.preventDefault();
    const value = query.trim().toUpperCase();
    if (value) {
      onAdd(value);
      setQuery('');
      setSuggestions([]);
      setOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex].symbol);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <form className="ticker-search-form" onSubmit={submit} ref={containerRef}>
      <div className="ticker-search-wrapper">
        <input
          type="text"
          className="terminal-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="SEARCH TICKER OR SYMBOL..."
          autoComplete="off"
          spellCheck="false"
        />
        {open && (
          <ul className="autocomplete-dropdown">
            {suggestions.map((s, idx) => (
              <li
                key={s.symbol}
                className={`autocomplete-item${idx === activeIndex ? ' active' : ''}`}
                onMouseDown={() => select(s.symbol)}
              >
                <span className="autocomplete-symbol">{s.symbol}</span>
                <span className="autocomplete-label">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="terminal-btn">ADD CHART</button>
    </form>
  );
}
