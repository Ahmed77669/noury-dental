'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles } from 'lucide-react';

export default function SearchBar({ q, setQ, onSearch, t }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/v1/suggestions?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [q]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch();
  };

  const handleSuggestionClick = (val) => {
    setQ(val);
    setShowSuggestions(false);
    // Trigger search immediately on suggestion click
    setTimeout(() => onSearch(val), 50);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto" ref={suggestionRef}>
      <form onSubmit={handleSubmit} className="flex items-center bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl overflow-hidden focus-within:border-brand-500 shadow-xl transition-all p-1">
        <div className="flex-1 flex items-center px-4">
          <Search className="w-5 h-5 text-slate-400 mr-2 rtl:ml-2 rtl:mr-0" />
          <input
            type="text"
            className="w-full bg-transparent border-0 outline-none py-3 text-slate-100 placeholder-slate-400 text-lg"
            placeholder={t.placeholder}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/20 text-base"
        >
          {t.searchBtn}
        </button>
      </form>

      {/* Autocomplete suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden animate-fade-in-up">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left rtl:text-right px-5 py-3.5 hover:bg-slate-800 border-b border-slate-800/40 last:border-0 text-slate-300 hover:text-white flex items-center gap-2.5 transition-colors"
              onClick={() => handleSuggestionClick(item)}
            >
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
