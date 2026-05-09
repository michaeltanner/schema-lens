'use client';

import React from 'react';
import { Box, Folder, ChevronRight, ChevronDown, Layers, Hash, Code2, AlertTriangle } from 'lucide-react';
import { HighlightedText } from './HighlightedText';

interface ExplorerItemProps {
  item: any;
  selectedItemName?: string;
  searchQuery: string;
  onSelect: (name: string, type: any) => void;
  onToggleFolder: (name: string) => void;
}

export const ItemExplorerRow: React.FC<ExplorerItemProps> = ({
  item,
  selectedItemName,
  searchQuery,
  onSelect,
  onToggleFolder
}) => {
  if (item.kind === 'category') {
    return (
      <div
        className="sidebar-category"
        onClick={() => onToggleFolder(item.fullName)}
      >
        <div className="category-header">
          {item.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {item.name === 'Elements' && <Box size={14} style={{ color: 'var(--type-element)', opacity: 0.8 }} />}
          {item.name === 'Complex Types' && <Layers size={14} style={{ color: 'var(--type-message)', opacity: 0.8 }} />}
          {item.name === 'Simple Types' && <Hash size={14} style={{ color: 'var(--type-attribute)', opacity: 0.8 }} />}
          <span className="category-title">{item.name}</span>
          {item.hasError && <AlertTriangle size={12} style={{ color: '#ef4444', marginLeft: '4px' }} />}
        </div>
        <span className="category-count">{item.count}</span>
      </div>
    );
  }

  return (
    <div
      className={`sidebar-item ${item.kind} ${selectedItemName === item.fullName ? 'active' : ''} ${item.isItem ? 'is-item' : ''}`}
      style={{ paddingLeft: `${item.depth * 12 + 12}px` }}
      onClick={() => {
        if (item.kind === 'folder') {
          if (item.isItem) {
            onSelect(item.fullName, item.itemType);
          } else {
            onToggleFolder(item.fullName);
          }
        } else {
          onSelect(item.fullName, item.itemType);
        }
      }}
      title={item.isItem && item.kind === 'folder' ? `${item.name} is both a message and a category` : undefined}
    >
      <div 
        className="item-prefix"
        onClick={(e) => {
          if (item.kind === 'folder') {
            e.stopPropagation();
            onToggleFolder(item.fullName);
          }
        }}
      >
        {item.kind === 'folder' && (
          item.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        )}
      </div>
      <div className={`item-icon ${item.kind === 'folder' ? 'folder' : item.itemType}`}>
        {item.kind === 'folder' ? (
          <Folder size={14} />
        ) : item.itemType === 'element' ? (
          <Box size={14} />
        ) : item.itemType === 'complexType' ? (
          <Layers size={14} />
        ) : item.itemType === 'simpleType' ? (
          <Hash size={14} />
        ) : (
          <Code2 size={14} />
        )}
      </div>
      <div className="item-content">
        <div className="item-name-row">
          <HighlightedText 
            text={item.name} 
            highlight={searchQuery} 
            className="item-name" 
            title={item.fullName} 
          />
          {item.isItem && item.kind === 'folder' && (
            <div className="dual-purpose-indicator" title="This is both a category and a message" />
          )}
          {item.hasError && (
            <span title="This item has broken references">
              <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
            </span>
          )}
          {item.sourceFile && !searchQuery && (
            <span className="item-source" title={`Defined in ${item.sourceFile}`}>{item.sourceFile}</span>
          )}
        </div>
        {searchQuery && item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
          <span className="item-path">{item.fullName}</span>
        )}
      </div>
      {(item.kind === 'item' || item.isItem) && (
        <span className="item-tag">{item.itemType === 'element' ? 'E' : item.itemType === 'complexType' ? 'C' : 'S'}</span>
      )}
    </div>
  );
};
