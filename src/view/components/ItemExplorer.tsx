'use client';

import React, { useMemo, useCallback, useState, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Search, Code2, ChevronsRight, ChevronsLeft, Minimize2, Maximize2, X, Target, Home } from 'lucide-react';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { useUIStore } from '@/core/store/useUIStore';
import { HierarchyNode, ItemType } from '@/types/schema';
import { ItemExplorerRow } from '@/view/components/ItemExplorerRow';
import { useItemExplorerItems } from '@/core/hooks/useItemExplorerItems';
import '@/view/styles/item-explorer.css';

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 600;

export const ItemExplorer: React.FC = () => {
  const { 
    summary, 
    searchQuery, 
    setSearchQuery, 
    selectedItem,
    historyDepth,
    setSelectedItem,
    expandedFolders,
    toggleFolder,
    collapseAll,
    expandAll,
    expandToSelectedItem,
    goHome,
    sidebarCollapsed,
    toggleSidebar
  } = useSchemaStore();

  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Resizable sidebar
  const { sidebarWidth, setSidebarWidth } = useUIStore();
  const isResizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(sidebarWidth);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = ev.clientX - resizeStartXRef.current;
      const next = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, resizeStartWidthRef.current + delta));
      setSidebarWidth(next);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);
  
  const displayItems = useItemExplorerItems(summary, searchQuery, expandedFolders);

  // Auto-focus search input when mobile menu or desktop sidebar opens
  React.useEffect(() => {
    const isSidebarVisible = mobileMenuOpen || !sidebarCollapsed;
    
    if (isSidebarVisible && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen, sidebarCollapsed]);

  const handleSelectItem = (name: string, type: ItemType) => {
    setSelectedItem(name, type);
    setMobileMenuOpen(false);
  };

  const handleGoHome = () => {
    goHome();
    setMobileMenuOpen(false);
  };

  const virtuosoRef = useRef<any>(null);
  // Composite key: name + historyDepth. Using only the name would skip scrolling
  // when navigating back/forward to an item that was previously visited (same name,
  // different depth). The depth changes on every navigation, so it acts as a
  // "navigation counter" while still being stable on folder expand/collapse.
  const lastScrolledKeyRef = useRef<string | null>(null);

  const scrollToActive = useCallback(() => {
    if (selectedItem) {
      setSearchQuery('');
      expandToSelectedItem();
      // Force a scroll on the next render after expand
      lastScrolledKeyRef.current = null;
    }
  }, [selectedItem, expandToSelectedItem, setSearchQuery]);

  React.useEffect(() => {
    if (!selectedItem || displayItems.length === 0) return;
    // Only scroll when either the item or the history position changes.
    // Folder expand/collapse does not change historyDepth, so it won't trigger a re-scroll.
    const scrollKey = `${selectedItem.name}::${historyDepth}`;
    if (lastScrolledKeyRef.current === scrollKey) return;
    lastScrolledKeyRef.current = scrollKey;

    const index = displayItems.findIndex(item => item.fullName === selectedItem.name);
    if (index !== -1 && virtuosoRef.current) {
      const timer = setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index,
          align: 'center',
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedItem, historyDepth, displayItems]);


  return (
    <div 
      className={`sidebar${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileMenuOpen ? ' mobile-open' : ''}`}
      style={sidebarCollapsed ? undefined : { width: sidebarWidth }}
    >
      <div className="mobile-sheet-grabber" onClick={() => setMobileMenuOpen(false)}>
        <div className="grabber-bar" />
      </div>

      {/* Full-height expand strip — only visible when sidebar is collapsed */}
      {sidebarCollapsed && (
        <div
          className="sidebar-expand-edge"
          onClick={toggleSidebar}
          title="Expand Sidebar"
          role="button"
          aria-label="Expand Sidebar"
        />
      )}

      <div className="sidebar-handle">
        <button
          className="rail-toggle-btn"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-inner">
        <div className="sidebar-header">
          <div className="sidebar-stats">
            <span className="visible-count">{displayItems.length} items</span>
            <div className="sidebar-actions">
              <button onClick={(e) => { e.stopPropagation(); handleGoHome(); }} className="action-btn" title="Go to Home">
                <Home size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); scrollToActive(); }} 
                className="action-btn" 
                title="Focus Active Item"
                disabled={!selectedItem}
              >
                <Target size={14} />
              </button>
              {!searchQuery && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); expandAll(summary); }} className="action-btn" title="Expand All">
                    <Maximize2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); collapseAll(); }} className="action-btn" title="Collapse All">
                    <Minimize2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search schema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-list">
          {summary && summary.totalFilesCount === 0 ? (
            <div className="sidebar-empty">
              <div className="sidebar-empty-icon"><Code2 size={32} /></div>
              <h4>Empty Workspace</h4>
              <p>Load XSD schemas to begin.</p>
              <button 
                className="sidebar-empty-btn"
                onClick={() => {
                  handleGoHome();
                  setTimeout(() => {
                    document.getElementById('schema-workspace')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Add Files
              </button>
            </div>
          ) : (
            <Virtuoso
              ref={virtuosoRef}
              style={{ height: '100%' }}
              data={displayItems}
              itemContent={(_, item) => (
                <ItemExplorerRow 
                  item={item}
                  selectedItemName={selectedItem?.name}
                  searchQuery={searchQuery}
                  onSelect={handleSelectItem}
                  onToggleFolder={toggleFolder}
                />
              )}
            />
          )}
        </div>
      </div>
      {!sidebarCollapsed && (
        <div
          className="sidebar-resize-handle"
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize sidebar"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
