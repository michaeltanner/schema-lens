'use client';

import React from 'react';
import { Box, Layers } from 'lucide-react';
import { HighlightedText } from './HighlightedText';

interface SpotlightItemProps {
  item: any;
  isSelected: boolean;
  query: string;
  onSelect: () => void;
  onMouseEnter: () => void;
}

export const ItemSpotlightRow: React.FC<SpotlightItemProps> = ({
  item,
  isSelected,
  query,
  onSelect,
  onMouseEnter
}) => {
  return (
    <div
      className={`spotlight-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <div className={`item-icon ${item.type}`}>
        {item.type === 'element' ? <Box size={16} /> : <Layers size={16} />}
      </div>
      <div className="item-info">
        <HighlightedText
          text={item.name}
          highlight={query}
          className="item-name"
        />
        <div className="item-sub">
          <span className="item-file"><span className="label">Source</span> {item.file}</span>
          <span className={`item-type-pill ${item.type}`}>
            {item.type === 'element' ? 'Element' : item.type === 'complexType' ? 'Complex' : 'Simple'}
          </span>
        </div>
      </div>
    </div>
  );
};
