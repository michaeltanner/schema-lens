import React, { useState } from 'react';
import { ItemNode } from '@/types/item';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { interpretRegex } from '@/core/utils/regexInterpreter';

interface NodeMetadataProps {
  node: ItemNode;
}

/**
 * Decodes HTML/XML character entities in a string to their Unicode equivalents,
 * but only when the resulting character is printable (code point ≥ 0x20 and not
 * the Unicode replacement character 0xFFFD).  Non-printable code points (control
 * characters, surrogates, etc.) are left as-is so the reader can still see them.
 *
 * Handles:
 *   &amp;  &lt;  &gt;  &quot;  &apos;   — named entities
 *   &#NNN;                              — decimal numeric references
 *   &#xHHHH;                            — hex numeric references (case-insensitive)
 */
function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  };

  return value.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|[a-z]+);/gi, (match, ref: string) => {
    if (ref.startsWith('#')) {
      const cp = ref[1].toLowerCase() === 'x'
        ? parseInt(ref.slice(2), 16)
        : parseInt(ref.slice(1), 10);
      // Only decode printable characters (≥ space, not replacement char)
      if (cp >= 0x20 && cp !== 0xFFFD) return String.fromCodePoint(cp);
      return match; // keep non-printable as-is
    }
    return named[ref.toLowerCase()] ?? match;
  });
}

export const NodeMetadata: React.FC<NodeMetadataProps> = ({ node }) => {
  const { goHome } = useSchemaStore();
  const [regexExpanded, setRegexExpanded] = useState(false);

  const formatHint = node.type?.includes('date') ? 'ISO 8601' : 
                    node.type?.includes('uuid') ? 'UUID' : null;

  const decodedPattern = node.pattern ? decodeHtmlEntities(node.pattern) : null;
  const interpretation = decodedPattern ? interpretRegex(decodedPattern) : null;

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

          {decodedPattern && (
            <div className="regex-badge-wrapper">
              <div className="property-badge pattern" title="Regular Expression Pattern">
                <span className="prop-tag">Regex</span>
                <code>{decodedPattern}</code>
                <button
                  className="regex-explain-btn"
                  title="Explain in plain English"
                  aria-expanded={regexExpanded}
                  onClick={() => setRegexExpanded(v => !v)}
                >
                  <HelpCircle size={13} />
                </button>
              </div>
              {regexExpanded && interpretation && (
                <div className="regex-explanation">
                  <div className="regex-explanation-summary">{interpretation.summary}</div>
                  {!interpretation.isFallback && interpretation.clauses.length > 1 && (
                    <ol className="regex-explanation-clauses">
                      {interpretation.clauses.map((clause, idx) => (
                        <li key={idx}>{clause}</li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
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
          /* Stretch to fill available width without overflowing */
          width: auto;
          min-width: 0;
          box-sizing: border-box;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: break-word;
          tab-size: 4;
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
        .regex-badge-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-width: 100%;
        }
        .regex-explain-btn {
          display: inline-flex;
          align-items: center;
          background: none;
          border: none;
          padding: 0 2px;
          cursor: pointer;
          color: var(--text-secondary);
          opacity: 0.6;
          transition: opacity 0.15s, color 0.15s;
          line-height: 1;
        }
        .regex-explain-btn:hover,
        .regex-explain-btn[aria-expanded="true"] {
          opacity: 1;
          color: var(--accent);
        }
        .regex-explanation {
          padding: 0.6rem 0.75rem;
          background: rgba(var(--accent-rgb), 0.05);
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--text-primary);
          line-height: 1.5;
          max-width: 480px;
        }
        .regex-explanation-summary {
          font-style: italic;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        .regex-explanation-clauses {
          margin: 0.4rem 0 0 1rem;
          padding: 0;
          list-style: decimal;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .regex-explanation-clauses li {
          margin-bottom: 0.15rem;
        }
      `}</style>
    </div>
  );
};
