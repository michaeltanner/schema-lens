import React from 'react';
import { Search, X } from 'lucide-react';

interface TopologyHeaderProps {
  rootNode?: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose?: () => void;
}

export const ItemGraphHeader: React.FC<TopologyHeaderProps> = ({
  rootNode,
  searchQuery,
  setSearchQuery,
  onClose
}) => {
  return (
    <header className="topology-header">
      <div className="header-left">
        <h2>Schema Topology {rootNode ? `(${rootNode.split(':')[1]})` : '(Macro View)'}</h2>
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search nodes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="topology-search-input"
          />
        </div>
      </div>
      {onClose && <button className="close-btn" onClick={onClose}><X size={20} /></button>}
    </header>
  );
};
