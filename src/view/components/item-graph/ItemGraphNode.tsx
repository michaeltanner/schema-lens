import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Layers, Hash, GitBranch, Target, Plus, Minus } from 'lucide-react';

export const ItemGraphNode = ({ data: anyData, id }: NodeProps) => {
  const data = anyData as any;
  const isRoot = data.isRoot;
  const hasChildren = data.hasChildren;
  const hasParents = data.hasParents;
  const isChildrenCollapsed = data.isChildrenCollapsed;
  const isParentsCollapsed = data.isParentsCollapsed;
  const [isHovered, setIsHovered] = useState(false);

  const typeColor = data.type === 'element' ? '#60a5fa' : data.type === 'complexType' ? '#a78bfa' : '#fbbf24';

  return (
    <div 
      className={`schema-node ${isRoot ? 'root-node' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => {
        setIsHovered(true);
        if (data.setHovered) data.setHovered(id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (data.setHovered) data.setHovered(null);
      }}
    >
      <div className="node-indicator" style={{ backgroundColor: typeColor }} />

      <div className={`node-floating-actions ${isHovered ? 'visible' : ''}`}>
        <button 
          className="floating-action-btn" 
          onClick={(e) => {
            e.stopPropagation();
            if (data.onInspect) data.onInspect(data.label, data.type);
          }}
          title="Go to Tree View"
        >
          <GitBranch size={14} />
        </button>
        <button 
          className="floating-action-btn" 
          onClick={(e) => {
            e.stopPropagation();
            if (data.onFocus) data.onFocus(id);
          }}
          title="Center in View"
        >
          <Target size={14} />
        </button>
      </div>

      <div className={`node-tooltip ${isHovered ? 'visible' : ''}`}>
        <div className="tooltip-header">
          <span className="tooltip-type">{data.type as string}</span>
          {data.namespace && <span className="tooltip-ns">{(data.namespace as string).split('/').pop()}</span>}
        </div>
        {data.documentation && (
          <p className="tooltip-doc">{data.documentation as string}</p>
        )}
      </div>

      <div className="handle-wrapper left">
        <Handle type="target" position={Position.Left} />
        {hasParents && (
          <div 
            className={`handle-badge parents ${isParentsCollapsed ? 'collapsed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (data.onToggleParents) data.onToggleParents(id);
            }}
          >
            {isParentsCollapsed ? <Plus size={10} /> : <Minus size={10} />}
          </div>
        )}
      </div>
      
      <div className="schema-node-content">
        <div className="schema-node-main">
          <div className="schema-node-icon" style={{ background: `${typeColor}15`, color: typeColor }}>
            {data.type === 'element' ? <Box size={14} /> : data.type === 'complexType' ? <Layers size={14} /> : <Hash size={14} />}
          </div>
          <div className="schema-node-label-container">
            <span className="schema-node-label">{data.label as string}</span>
            <span className="schema-node-type-label">{data.type as string}</span>
          </div>
        </div>
      </div>

      <div className="handle-wrapper right">
        <Handle type="source" position={Position.Right} />
        {hasChildren && (
          <div 
            className={`handle-badge children ${isChildrenCollapsed ? 'collapsed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (data.onToggleChildren) data.onToggleChildren(id);
            }}
          >
            {isChildrenCollapsed ? (
              <span className="child-count-bubble">{data.childCount as number}</span>
            ) : (
              <Minus size={10} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
