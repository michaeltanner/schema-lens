import React from 'react';
import { ItemNode } from '@/types/item';
import { AlertTriangle } from 'lucide-react';
import { useSchemaStore } from '@/core/store/useSchemaStore';

interface NodeMetadataProps {
  node: ItemNode;
}

export const NodeMetadata: React.FC<NodeMetadataProps> = ({ node }) => {
  const { goHome } = useSchemaStore();
  
  const formatHint = node.type?.includes('date') ? 'ISO 8601' : 
                    node.type?.includes('uuid') ? 'UUID' : null;

  return (
    <div className="node-details-internal">
      {node.documentation && (
        <div className="node-documentation">
          {node.documentation}
        </div>
      )}

      {node.isBroken && (
        <div className="node-error-alert">
          <AlertTriangle size={18} />
          <div className="error-alert-content">
            <strong>Reference Integrity Issue</strong>
            <p>{node.error}</p>
            <div className="error-tip">
              Tip: Ensure all relevant schema files are{' '}
              <button className="inline-link" onClick={() => { goHome(); setTimeout(() => document.getElementById('schema-workspace')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>uploaded and enabled</button>{' '}
              in your workspace.
            </div>
          </div>
        </div>
      )}

      {(node.pattern || node.regexExample || node.minInclusive || node.maxInclusive || node.minLength || node.maxLength || node.defaultValue || node.fixedValue || formatHint) && (
        <div className="node-properties">
          {formatHint && (
            <div className="property-badge hint" title="Standard Format Hint">
              <span className="prop-tag">Format</span>
              <code>{formatHint}</code>
            </div>
          )}

          {node.pattern && (
            <div className="property-badge pattern" title="Regular Expression Pattern">
              <span className="prop-tag">Regex</span>
              <code>{node.pattern}</code>
            </div>
          )}

          {node.regexExample && (
            <div className="property-badge example" title="Generated example of a valid entry">
              <span className="prop-tag">Example</span>
              <code>{node.regexExample}</code>
            </div>
          )}
          
          {(node.minInclusive || node.maxInclusive) && (
            <div className="property-badge range" title="Numeric Range">
              <span className="prop-tag">Range</span>
              <span>{node.minInclusive || '-\u221E'} to {node.maxInclusive || '+\u221E'}</span>
            </div>
          )}

          {(node.minLength || node.maxLength) && (
            <div className="property-badge length" title="String Length Constraints">
              <span className="prop-tag">Length</span>
              <span>{node.minLength || '0'}..{node.maxLength || 'unbounded'}</span>
            </div>
          )}

          {node.defaultValue && (
            <div className="property-badge default" title="Default Value">
              <span className="prop-tag">Default</span>
              <span>{node.defaultValue}</span>
            </div>
          )}

          {node.fixedValue && (
            <div className="property-badge fixed" title="Fixed Value">
              <span className="prop-tag">Fixed</span>
              <span>{node.fixedValue}</span>
            </div>
          )}

          {node.sourceFile && (
            <div className="property-badge source" title="Source XSD File">
              <span className="prop-tag">File</span>
              <span>{node.sourceFile}</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .node-documentation {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(var(--accent-rgb), 0.03);
          border-left: 3px solid var(--accent);
          border-radius: 0 4px 4px 0;
        }
        .node-error-alert {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 8px;
          color: #991b1b;
          margin-bottom: 1rem;
        }
        .error-alert-content strong {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.95rem;
        }
        .error-alert-content p {
          font-size: 0.9rem;
          margin: 0 0 0.75rem 0;
          opacity: 0.9;
        }
        .error-tip {
          font-size: 0.8rem;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #fecaca;
        }
        .inline-link {
          background: none;
          border: none;
          padding: 0;
          color: var(--accent);
          text-decoration: underline;
          cursor: pointer;
          font-size: inherit;
        }
        .node-properties {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .property-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.5rem;
          background: var(--surface-hover);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .prop-tag {
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.65rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }
        .property-badge code {
          font-family: 'JetBrains Mono', monospace;
          color: var(--accent);
        }
        .property-badge.example code {
          color: #10b981;
        }
        .property-badge.source {
          background: rgba(var(--accent-rgb), 0.05);
          border-color: rgba(var(--accent-rgb), 0.2);
        }
      `}</style>
    </div>
  );
};
