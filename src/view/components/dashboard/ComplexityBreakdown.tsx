import React from 'react';
import { BarChart3 } from 'lucide-react';
import { SchemaSummary } from '@/types/schema';

interface ComplexityBreakdownProps {
  summary: SchemaSummary;
}

export const ComplexityBreakdown: React.FC<ComplexityBreakdownProps> = ({ summary }) => {
  const total = summary.totalElements + summary.totalComplexTypes + summary.totalSimpleTypes;
  
  const elPct  = total ? Math.round((summary.totalElements     / total) * 100) : 0;
  const ctPct  = total ? Math.round((summary.totalComplexTypes / total) * 100) : 0;
  const stPct  = total ? 100 - elPct - ctPct : 0;

  return (
    <section className="section breakdown-section">
      <div className="section-header">
        <BarChart3 size={16} className="section-icon" />
        <h3>Complexity Breakdown</h3>
        <span className="section-total">{total} total items</span>
      </div>
      <div className="breakdown-bar">
        <div className="bar-segment bar-el"  style={{ width: `${elPct}%`  }} title={`Elements: ${elPct}%`} />
        <div className="bar-segment bar-ct"  style={{ width: `${ctPct}%`  }} title={`Complex Types: ${ctPct}%`} />
        <div className="bar-segment bar-st"  style={{ width: `${stPct}%`  }} title={`Simple Types: ${stPct}%`} />
      </div>
      <div className="breakdown-legend">
        <span className="legend-item"><span className="legend-dot dot-el" />{elPct}% Messages</span>
        <span className="legend-item"><span className="legend-dot dot-ct" />{ctPct}% Complex Types</span>
        <span className="legend-item"><span className="legend-dot dot-st" />{stPct}% Simple Types</span>
      </div>
    </section>
  );
};
