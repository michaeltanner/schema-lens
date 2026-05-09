import React from 'react';
import { Box, Layers, Hash, History, AlertTriangle, X } from 'lucide-react';
import { useSchemaStore, useUIStore } from '@/core/store/useSchemaStore';

interface RecentActivityProps {
  recentActivity: any[];
  navigate: (name: string, type: 'element' | 'complexType' | 'simpleType') => void;
  onRemove: (name: string, type: string) => void;
}

const groupRecentActivity = (activity: any[]) => {
  const groups: Record<string, any[]> = { Today: [], Yesterday: [], Older: [] };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  activity.forEach(item => {
    if (!item.timestamp) {
      groups.Older.push(item);
      return;
    }
    const d = new Date(item.timestamp);
    if (d >= today) groups.Today.push(item);
    else if (d >= yesterday) groups.Yesterday.push(item);
    else groups.Older.push(item);
  });
  return groups;
};

const formatTimeAgo = (ts?: number) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ recentActivity, navigate, onRemove }) => {
  const { summary } = useSchemaStore();
  const { confirm } = useUIStore();
  if (!recentActivity || recentActivity.length === 0) return null;

  const groupedActivity = groupRecentActivity(recentActivity);

  return (
    <section className="section" id="recent-activity">
      <div className="section-header">
        <History size={16} className="section-icon" />
        <h3>Recent Activity</h3>
      </div>
      <div className="recent-grid scrollable-grid">
        {['Today', 'Yesterday', 'Older'].map(groupName => {
          const items = groupedActivity[groupName];
          if (!items || items.length === 0) return null;

          return (
            <div key={groupName} className="recent-group">
              <div className="recent-group-header">{groupName}</div>
              {items.map((item, i) => {
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
                      <span className="recent-timestamp">{formatTimeAgo(item.timestamp)}</span>
                    </button>
                    <button 
                      className="delete-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.name, item.type);
                      }}
                      title="Remove from history"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
};
