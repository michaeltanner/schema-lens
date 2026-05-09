'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { Search, Command, X } from 'lucide-react';
import FlexSearch from 'flexsearch';
import { ItemSpotlightRow } from '@/view/components/ItemSpotlightRow';
import '@/view/styles/item-spotlight.css';

export const ItemSpotlight: React.FC = () => {
  const { summary, isSpotlightOpen, setSpotlightOpen, navigate } = useSchemaStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState('');
  const [prevIsSpotlightOpen, setPrevIsSpotlightOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Initialize FlexSearch index
  const index = useMemo(() => {
    // @ts-ignore
    const doc = new FlexSearch.Document({
      document: {
        id: 'id',
        index: ['name'],
        store: ['name', 'type', 'file'],
      },
      tokenize: 'forward',
    });

    if (summary) {
      summary.elements.forEach((name, i) => {
        const file = summary.itemOrigins?.[`element:${name}`] || '';
        doc.add({ id: `e-${i}`, name, type: 'element', file });
      });
      summary.complexTypes.forEach((name, i) => {
        const file = summary.itemOrigins?.[`complexType:${name}`] || '';
        doc.add({ id: `t-${i}`, name, type: 'complexType', file });
      });
      summary.simpleTypes?.forEach((name, i) => {
        const file = summary.itemOrigins?.[`simpleType:${name}`] || '';
        doc.add({ id: `s-${i}`, name, type: 'simpleType', file });
      });
    }
    return doc;
  }, [summary]);

  // Reset query when spotlight opens
  if (isSpotlightOpen && !prevIsSpotlightOpen) {
    setPrevIsSpotlightOpen(true);
    setQuery('');
  } else if (!isSpotlightOpen && prevIsSpotlightOpen) {
    setPrevIsSpotlightOpen(false);
  }

  // Derive results from query
  const results = useMemo(() => {
    if (!query) return [];
    const searchResults = index.search(query, { enrich: true });
    if (searchResults.length > 0) {
      return searchResults[0].result.map((r: any) => r.doc);
    }
    return [];
  }, [query, index]);

  // Reset selection when query changes
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  useEffect(() => {
    if (isSpotlightOpen) {
      inputRef.current?.focus();
    }
  }, [isSpotlightOpen]);

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelectItem = (item: any) => {
    navigate(item.name, item.type);
    setSpotlightOpen(false);
  };

  if (!isSpotlightOpen || typeof document === 'undefined') return null;
  
  return createPortal(
    <div className="spotlight-overlay" onClick={() => setSpotlightOpen(false)}>
      <div className="spotlight-modal" onClick={(e) => e.stopPropagation()}>
        <div className="spotlight-header">
          <Search size={20} className="spotlight-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search messages and types... (Esc to clear/close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (query) {
                  e.stopPropagation();
                  setQuery('');
                } else {
                  setSpotlightOpen(false);
                }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (results.length > 0) {
                  setSelectedIndex((prev) => (prev + 1) % results.length);
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (results.length > 0) {
                  setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
                }
              } else if (e.key === 'PageDown') {
                e.preventDefault();
                if (results.length > 0) {
                  setSelectedIndex((prev) => Math.min(prev + 5, results.length - 1));
                }
              } else if (e.key === 'PageUp') {
                e.preventDefault();
                if (results.length > 0) {
                  setSelectedIndex((prev) => Math.max(prev - 5, 0));
                }
              } else if (e.key === 'Enter') {
                if (results.length > 0 && results[selectedIndex]) {
                  handleSelectItem(results[selectedIndex]);
                }
              }
            }}
            className="spotlight-input"
          />
          {query && (
            <button 
              className="spotlight-clear-btn" 
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="spotlight-results" ref={resultsRef}>
          {results.length > 0 ? (
            results.map((item, i) => (
              <ItemSpotlightRow 
                key={i}
                item={item}
                isSelected={i === selectedIndex}
                query={query}
                onSelect={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(i)}
              />
            ))
          ) : query ? (
            <div className="spotlight-empty">No results found for &quot;{query}&quot;</div>
          ) : (
            <div className="spotlight-hint">
              <Command size={14} />
              <span>Type to search the schema...</span>
            </div>
          )}
        </div>
        <div className="results-fade"></div>
      </div>
    </div>,
    document.body
  );
};
