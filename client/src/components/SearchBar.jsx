import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar component with instant keyboard focus shortcut ('/')
 */
export function SearchBar({ value, onChange, onClear, totalNotes }) {
  const inputRef = useRef(null);

  // Global hotkey: '/' focuses the search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="search-box-container">
      <span className="search-icon-adornment">
        <Search size={16} aria-hidden="true" />
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Search ${totalNotes ? `${totalNotes} notes` : 'notes'} by title or content...`}
        aria-label="Search notes by title or content"
        className="search-input"
      />

      <div className="search-shortcuts">
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="search-clear-btn"
            aria-label="Clear search query"
          >
            <X size={15} />
          </button>
        )}
        <kbd className="kbd-badge" title="Press / to search">/</kbd>
      </div>
    </div>
  );
}

export default SearchBar;
