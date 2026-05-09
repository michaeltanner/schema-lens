import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { SchemaSummary } from '@/types/schema';

interface SchemaHealthProps {
  summary: SchemaSummary;
}

export const SchemaHealth: React.FC<SchemaHealthProps> = ({ summary }) => {
  if (summary.errors && summary.errors.length > 0) {
    return (
      <section className="section health-section broken" id="schema-health">
        <div className="section-header">
          <AlertTriangle size={18} className="health-icon" />
          <h3>Schema Integrity Issues</h3>
          <span className="error-count">{summary.errors.length} Critical Issues</span>
        </div>
        <div className="error-list-container">
          <p className="health-desc">
            Detected <strong>{summary.errors.length}</strong> missing references. These will cause broken links and incomplete hierarchies. 
            <span className="health-tip">Tip: Ensure all relevant schema files are <button className="inline-link" onClick={() => document.getElementById('schema-workspace')?.scrollIntoView({ behavior: 'smooth' })}>uploaded and enabled</button> in your workspace.</span>
          </p>
          <div className="error-scroll-area">
            <table className="error-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Reference</th>
                  <th>Used In</th>
                </tr>
              </thead>
              <tbody>
                {summary.errors.map((err, i) => (
                  <tr key={i}>
                    <td className="mono-text">{err.sourceFile}</td>
                    <td className="error-cell">
                      <span className={`error-badge ${err.type.toLowerCase()}`}>
                        {err.type === 'DUPLICATE_ITEM' ? 'Duplicate' : 'Missing'}
                      </span>
                      <span className="error-text">
                        {err.type === 'DUPLICATE_ITEM' ? `Collision: ${err.nodeName}` : `Ref: ${err.targetName}`}
                      </span>
                    </td>
                    <td className="mono-text">
                      {err.type === 'DUPLICATE_ITEM' ? 'Multiple Files' : err.nodeName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section health-section healthy" id="schema-health">
      <div className="section-header">
        <ShieldCheck size={18} className="health-icon" />
        <h3>Schema Health</h3>
        <span className="health-status">Verified</span>
      </div>
      <div className="health-card">
        <p>All references were successfully resolved. Your schema ecosystem is consistent.</p>
      </div>
    </section>
  );
};
