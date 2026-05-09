import React, { useState, useEffect } from 'react';
import { ItemNode } from '@/types/item';
import { Code, Loader2, X, FileJson } from 'lucide-react';
import { CodeBlock } from '../CodeBlock';
import { useItemExample } from '@/view/hooks/useItemExample';
import { useUIStore } from '@/core/store/useUIStore';

interface XmlExampleViewProps {
  node: ItemNode;
}

export const XmlExampleView: React.FC<XmlExampleViewProps> = ({ node }) => {
  const [includeOptionalXml, setIncludeOptionalXml] = useState(false);
  const { fetchExample, isLoading } = useItemExample();
  const [xmlExample, setXmlExample] = useState<string | null>(null);

  useEffect(() => {
    setXmlExample(null);
    if (node.name) {
      const loadExample = async () => {
        const example = await fetchExample(node.name!, node.kind, includeOptionalXml);
        if (example) setXmlExample(example);
      };
      loadExample();
    }
  }, [node.name, node.kind, includeOptionalXml, fetchExample]);

  const handleOptionalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeOptionalXml(e.target.checked);
  };

  // Support elements, complexTypes, and simpleTypes
  if (!node.name && node.kind !== 'element') return null;

  return (
    <div className="xml-example-container">
      <div className="xml-example-header">
        <div className="header-label">
          <FileJson size={16} />
          <span>Auto-Generated XML Example</span>
        </div>
        
        <div className="header-actions">
          <label className="optional-toggle">
            <input 
              type="checkbox" 
              checked={includeOptionalXml} 
              onChange={handleOptionalToggle}
              disabled={isLoading}
            />
            Include Optional
          </label>
        </div>
      </div>
      
      <div className="xml-content-area">
        {isLoading ? (
          <div className="xml-loading-placeholder">
            <div className="dot-pulse">
              <div className="dot-pulse__dot"></div>
              <div className="dot-pulse__dot"></div>
              <div className="dot-pulse__dot"></div>
            </div>
            <span className="loading-label">Generating complex XML structure...</span>
          </div>
        ) : (
          <CodeBlock 
            code={xmlExample || 'Generating example...'}
            language="markup"
            filename={`${node.name}.xml`}
          />
        )}
      </div>

      <style jsx>{`
        .xml-example-container {
          margin-bottom: 2rem;
          background: var(--surface);
          border: 1px solid var(--accent);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .xml-example-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.25rem;
          background: rgba(var(--accent-rgb), 0.1);
          border-bottom: 1px solid rgba(var(--accent-rgb), 0.1);
        }

        .header-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .optional-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--foreground-muted);
          cursor: pointer;
        }

        .close-xml-btn {
          background: transparent;
          border: none;
          color: var(--foreground-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
        }

        .close-xml-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .xml-content-area {
          padding: 1rem;
        }

        .xml-loading-placeholder {
          background: var(--surface-hover);
          border-radius: 8px;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          border: 1px dashed var(--border);
        }
        .loading-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .dot-pulse {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dot-pulse__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent);
          animation: dot-pulse-anim 1.4s infinite ease-in-out;
        }

        .dot-pulse__dot:nth-child(1) { animation-delay: -0.32s; }
        .dot-pulse__dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes dot-pulse-anim {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
