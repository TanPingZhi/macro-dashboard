import React, { useState, useRef, useEffect } from 'react';
import { SYMBOLS } from '../data/symbols';

export function TickerSearch({ onAdd }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const q = query.trim().toUpperCase();
    const filtered = SYMBOLS.filter(
      s => s.symbol.toUpperCase().includes(q) || s.label.toUpperCase().includes(q)
    ).slice(0, 10); // cap at 10 suggestions
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setActiveIndex(-1);
  }, [query]);

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
