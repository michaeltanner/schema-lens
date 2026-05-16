'use client';

import React from 'react';
import { Box, Layers, ArrowLeft, Star, ListTree, Code, Workflow, FileCode2 } from 'lucide-react';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { useUIStore } from '@/core/store/useUIStore';
import { useNavigationStore } from '@/core/store/useNavigationStore';

export const ItemDetailsHeader: React.FC = () => {
  const { selectedItem, historyDepth, goBack } = useSchemaStore();
  const { viewMode, setViewMode } = useUIStore();
  const { toggleBookmark, isBookmarked } = useNavigationStore();

  if (!selectedItem) return null;

  return (
    <header className="item-details-header">
      <div className="item-details-top-bar">
        <div className="item-details-nav">
          {historyDepth > 0 && (
            <button className="nav-button" onClick={goBack} title="Go Back">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className={`item-icon ${selectedItem.type}`}>
            {selectedItem.type === 'element' ? <Box size={20} /> : <Layers size={20} />}
          </div>
          <button 
            className={`bookmark-btn ${isBookmarked(selectedItem.name, selectedItem.type) ? 'active' : ''}`}
            onClick={() => toggleBookmark(selectedItem)}
            title={isBookmarked(selectedItem.name, selectedItem.type) ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <Star size={18} fill={isBookmarked(selectedItem.name, selectedItem.type) ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="item-details-title-area">
          <div className="breadcrumb">
            <span className="current">{selectedItem.name}</span>
          </div>
          <div className="header-metadata">
            <span className="item-tag-large">{selectedItem.type === 'element' ? 'Global Element' : 'Complex Type'}</span>
          </div>
        </div>

        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
            onClick={() => setViewMode('tree')}
            title="Tree View"
          >
            <ListTree size={16} />
            <span>Tree</span>
            <kbd className="shortcut-badge">1</kbd>
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'item' ? 'active' : ''}`}
            onClick={() => setViewMode('item')}
            title="Raw XSD Item"
          >
            <Code size={16} />
            <span>XSD</span>
            <kbd className="shortcut-badge">2</kbd>
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'topology' ? 'active' : ''}`}
            onClick={() => setViewMode('topology')}
            title="Topology Map"
          >
            <Workflow size={16} />
            <span>Map</span>
            <kbd className="shortcut-badge">3</kbd>
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'example' ? 'active' : ''}`}
            onClick={() => setViewMode('example')}
            title="Generate XML Example"
          >
            <FileCode2 size={16} />
            <span>XML</span>
            <kbd className="shortcut-badge">4</kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
