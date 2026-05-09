import React from 'react';
import { Box, Layers, Hash, Star, AlertTriangle, X } from 'lucide-react';
import { useSchemaStore, useUIStore } from '@/core/store/useSchemaStore';

interface PinnedItemsProps {
  bookmarks: any[];
  navigate: (name: string, type: 'element' | 'complexType' | 'simpleType') => void;
  onRemove: (name: string, type: string) => void;
}

export const PinnedItems: React.FC<PinnedItemsProps> = ({ bookmarks, navigate, onRemove }) => {
  const { summary } = useSchemaStore();
  const { confirm } = useUIStore();
  return (
    <section className="section bookmarks-section" id="pinned-items" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <Star size={16} className="section-icon" fill="currentColor" />
        <h3>Pinned Items</h3>
      </div>
      <div className="recent-grid">
        {(!bookmarks || bookmarks.length === 0) ? (
          <div className="empty-state-card">
            <Star size={24} className="empty-state-icon" />
            <p>No pinned items yet.</p>
            <span className="empty-state-hint">
              Click the star icon in the item details header to pin important items here for quick access.
            </span>
          </div>
        ) : (
          bookmarks.map((item, i) => {
            const isStale = summary && !(
              (item.type === 'element' && summary.elements?.includes(item.name)) ||
              (item.type === 'complexType' && summary.complexTypes?.includes(item.name)) ||
              (item.type === 'simpleType' && summary.simpleTypes?.includes(item.name))
            );

            return (
              <div key={i} className={`recent-item-container ${isStale ? 'stale' : ''}`}>
                <button 
                  className="recent-item" 
                  onClick={async () => {
                    if (isStale) {
                      const confirmed = await confirm(
                        'Missing Item',
                        'This item is missing from the current schema. Do you want to try to view it anyway?',
                        'warning',
                        'View Anyway',
                        'Stay Here'
                      );
                      if (confirmed) {
                        navigate(item.name, item.type);
                      }
                    } else {
                      navigate(item.name, item.type);
                    }
                  }}
                >
                  <div className="recent-icon">
                    {isStale ? (
                      <AlertTriangle size={14} className="stale-icon" />
                    ) : (
                      item.type === 'element' ? <Box size={14} /> : item.type === 'complexType' ? <Layers size={14} /> : <Hash size={14} />
                    )}
                  </div>
                  <div className="recent-info">
                    <span className="recent-name">{item.name}</span>
                    <span className="recent-type">
                      {isStale ? 'Missing from Schema' : (item.type === 'element' ? 'Message' : item.type === 'complexType' ? 'Complex Type' : 'Simple Type')}
                    </span>
                  </div>
                </button>
                <button 
                  className="delete-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.name, item.type);
                  }}
                  title="Remove from pins"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
