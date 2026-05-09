'use client';

import React from 'react';
import { Maximize2, Minimize2, FileCode2, Link2, Loader2 } from 'lucide-react';
import { useUIStore } from '@/core/store/useUIStore';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { ItemTree } from '@/view/components/ItemTree';
import { ItemGraphView } from '@/view/components/ItemGraphView';
import { XmlExampleView } from '@/view/components/item-details/XmlExampleView';
import { CodeBlock } from '@/view/components/CodeBlock';
import { Footer } from '@/view/components/Footer';
import { useItemNode } from '@/view/hooks/useItemNode';
import { useItemUsedIn } from '@/view/hooks/useItemUsedIn';

export const ItemDetailsBody: React.FC = () => {
  const { selectedItem, navigate } = useSchemaStore();
  const { 
    viewMode, 
    expandItemTree, 
    collapseItemTree 
  } = useUIStore();

  const { itemNode, isLoading: defLoading } = useItemNode(selectedItem?.name, selectedItem?.type);
  const { usedIn, isLoading: usedInLoading } = useItemUsedIn(selectedItem?.name);

  if (!selectedItem) return null;

  return (
    <div className="item-details-body">
      {defLoading ? (
        <div className="loading-state">
          <div className="dot-pulse large">
            <div className="dot-pulse__dot"></div>
            <div className="dot-pulse__dot"></div>
            <div className="dot-pulse__dot"></div>
          </div>
          <p className="loading-text-large">Resolving type structure...</p>
        </div>
      ) : itemNode ? (
        <div className="item-details-layout">
          <div className="view-container">
            {viewMode === 'tree' ? (
              <div className="tree-container">
                <div className="tree-header-actions">
                  <button 
                    className="tree-action-btn" 
                    onClick={expandItemTree}
                    title="Expand all nodes"
                  >
                    <Maximize2 size={14} />
                    <span>Expand All</span>
                    <kbd className="shortcut-badge">E</kbd>
                  </button>
                  <button 
                    className="tree-action-btn" 
                    onClick={collapseItemTree}
                    title="Collapse all nodes"
                  >
                    <Minimize2 size={14} />
                    <span>Collapse All</span>
                    <kbd className="shortcut-badge">K</kbd>
                  </button>
                </div>
                <ItemTree node={itemNode} isRoot={true} />
              </div>
            ) : viewMode === 'topology' ? (
              <div className="topology-inline-container" style={{ height: '600px', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <ItemGraphView rootNode={`${selectedItem.type}:${selectedItem.name}`} inline />
              </div>
            ) : viewMode === 'example' ? (
              <div className="example-view">
                <XmlExampleView node={itemNode} />
              </div>
            ) : (
              <CodeBlock 
                code={itemNode.rawXml || 'Source not available'} 
                language="markup"
                filename={`${selectedItem.name}.xsd`}
              />
            )}


            {itemNode?.sourceFile && (
              <div className="provenance-section">
                <div className="section-header-mini">
                  <FileCode2 size={15} />
                  <h4>Provenance</h4>
                </div>
                <div className="provenance-card">
                  <span className="source-label">Source XSD:</span>
                  <span className="source-value">{itemNode.sourceFile}</span>
                </div>
              </div>
            )}

            <div className="used-in-section" id="referenced-by">
              <div className="used-in-header">
                <Link2 size={15} />
                <h4>Referenced By</h4>
                {!usedInLoading && <span className="used-in-count">{usedIn.length}</span>}
              </div>
              {usedInLoading ? (
                <div className="used-in-loading">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Scanning references…</span>
                </div>
              ) : usedIn.length === 0 ? (
                <p className="used-in-empty">Not referenced by any other type or element.</p>
              ) : (
                <div className="used-in-list">
                  {usedIn.map(ref => (
                    <button
                      key={`${ref.type}-${ref.name}`}
                      className={`used-in-chip ${ref.type}`}
                      onClick={() => navigate(ref.name, ref.type)}
                    >
                      <span className="chip-type-badge">{ref.type === 'element' ? 'el' : ref.type === 'complexType' ? 'ct' : 'st'}</span>
                      {ref.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Footer />
          </div>
        </div>
      ) : (
        <div className="error-state">
          <p>Could not load details for this item.</p>
        </div>
      )}
    </div>
  );
};
