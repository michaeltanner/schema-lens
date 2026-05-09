'use client';

import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Search, Code2, ChevronsRight, ChevronsLeft, Minimize2, Maximize2, X, Target, Home } from 'lucide-react';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { useUIStore } from '@/core/store/useUIStore';
import { HierarchyNode, ItemType } from '@/types/schema';
import { ItemExplorerRow } from '@/view/components/ItemExplorerRow';
import { useItemExplorerItems } from '@/core/hooks/useItemExplorerItems';
import '@/view/styles/item-explorer.css';

export const ItemExplorer: React.FC = () => {
  const { 
    summary, 
    searchQuery, 
    setSearchQuery, 
    selectedItem, 
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
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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

  const virtuosoRef = React.useRef<any>(null);

  const scrollToActive = React.useCallback(() => {
    if (selectedItem) {
      setSearchQuery('');
      expandToSelectedItem();
    }
  }, [selectedItem, expandToSelectedItem, setSearchQuery]);

  React.useEffect(() => {
    if (selectedItem && displayItems.length > 0) {
      const index = displayItems.findIndex(item => item.fullName === selectedItem.name);
      if (index !== -1 && virtuosoRef.current) {
        const timer = setTimeout(() => {
          virtuosoRef.current.scrollToIndex({
            index,
            align: 'center',
            behavior: 'smooth'
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedItem, displayItems]);


  return (
    <div className={`sidebar${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileMenuOpen ? ' mobile-open' : ''}`}>
      <div className="mobile-sheet-grabber" onClick={() => setMobileMenuOpen(false)}>
        <div className="grabber-bar" />
      </div>

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
    </div>
  );
};
