import React from 'react';
import { Box, Layers, Hash, FileCode2 } from 'lucide-react';
import { SchemaSummary } from '@/types/schema';

interface StatsOverviewProps {
  summary: SchemaSummary;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ summary }) => {
  return (
    <section className="stats-grid">
      <div className="stat-card no-click">
        <div className="stat-icon stat-el"><Box size={22} /></div>
        <div className="stat-info">
          <span className="stat-value">{summary.totalElements}</span>
          <span className="stat-label">Global Elements</span>
        </div>
      </div>
      <div className="stat-card no-click">
        <div className="stat-icon stat-ct"><Layers size={22} /></div>
        <div className="stat-info">
          <span className="stat-value">{summary.totalComplexTypes}</span>
          <span className="stat-label">Complex Types</span>
        </div>
      </div>
      <div className="stat-card no-click">
        <div className="stat-icon stat-st"><Hash size={22} /></div>
        <div className="stat-info">
          <span className="stat-value">{summary.totalSimpleTypes}</span>
          <span className="stat-label">Simple Types</span>
        </div>
      </div>
      <div className="stat-card no-click">
        <div className="stat-icon stat-files"><FileCode2 size={22} /></div>
        <div className="stat-info">
          <span className="stat-value">
            {summary.activeFilesCount}
            <span className="stat-value-sub">/ {summary.totalFilesCount}</span>
          </span>
          <span className="stat-label">Active Schemas</span>
        </div>
      </div>
    </section>
  );
};
