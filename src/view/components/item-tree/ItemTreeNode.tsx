import React, { useState, useEffect, useRef } from 'react';
import { ItemNode } from '@/types/item';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { ChevronDown, ChevronRight, Box, Layers, List, Zap, Circle, HelpCircle, Loader2, Hash, AlertTriangle } from 'lucide-react';
import { useItemNode } from '@/view/hooks/useItemNode';
import { NodeMetadata } from '../item-details/NodeMetadata';
import { getFormat, isBuiltInType } from './treeUtils';

interface TreeNodeProps {
  node: ItemNode;
  isRoot?: boolean;
}

const getIcon = (nodeKind: string) => {
  switch (nodeKind) {
    case 'element': return <Box size={14} />;
    case 'complexType': return <Layers size={14} />;
    case 'simpleType': return <Hash size={14} />;
    case 'sequence': return <List size={14} />;
    case 'choice': return <Zap size={14} />;
    case 'all': return <HelpCircle size={14} />;
    case 'enumeration': return <Circle size={10} fill="currentColor" />;
    default: return <Circle size={14} />;
  }
};

export const ItemTreeNode: React.FC<TreeNodeProps> = React.memo(({ node, isRoot = false }) => {
  const [isExpanded, setIsExpanded] = useState(isRoot);
  const [inlineTypeToResolve, setInlineTypeToResolve] = useState<string | null>(null);
  const { itemNode: resolvedNode, isLoading } = useItemNode(inlineTypeToResolve || undefined, 'complexType');
  const hasChildren = (node.children && node.children.length > 0) || (resolvedNode?.children && resolvedNode.children.length > 0);
  
  const { navigate, itemExpansionSignal } = useSchemaStore();
  const lastProcessedSignalRef = useRef<number>(0);

  useEffect(() => {
    if (itemExpansionSignal && itemExpansionSignal.timestamp > lastProcessedSignalRef.current) {
      lastProcessedSignalRef.current = itemExpansionSignal.timestamp;
      if (itemExpansionSignal.type === 'expand') {
        if (!hasChildren && node.type && !isBuiltInType(node.type) && !inlineTypeToResolve) {
          const cleanName = node.type!.includes(':') ? node.type!.split(':')[1] : node.type!;
          setInlineTypeToResolve(cleanName);
        }
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    }
  }, [itemExpansionSignal, node.type, hasChildren, inlineTypeToResolve]);

  const toggleExpand = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!isExpanded && !hasChildren && node.type && !isBuiltInType(node.type) && !inlineTypeToResolve) {
      const cleanName = node.type!.includes(':') ? node.type!.split(':')[1] : node.type!;
      setInlineTypeToResolve(cleanName);
      setIsExpanded(true);
      return;
    }
    
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand();
    }
  };

  const handleTypeClick = (e: React.MouseEvent, typeName: string) => {
    e.stopPropagation();
    if (!isBuiltInType(typeName)) {
      toggleExpand();
    }
  };

  const handleJumpToType = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type && !isBuiltInType(node.type)) {
      const cleanName = node.type.includes(':') ? node.type.split(':')[1] : node.type;
      navigate(cleanName, 'complexType');
    }
  };

  const activeNode = resolvedNode || node;
  const formatHint = getFormat(activeNode.type) || getFormat(activeNode.base);
  const hasDoc = !!activeNode.documentation;
  const hasProps = !!(activeNode.pattern || activeNode.regexExample || activeNode.minInclusive || activeNode.maxInclusive || activeNode.minLength || activeNode.maxLength || activeNode.defaultValue || activeNode.fixedValue || formatHint);
  const isExpandable = hasChildren || (node.type && !isBuiltInType(node.type)) || hasDoc || hasProps || activeNode.isBroken;
  const isNamed = !!node.name;
  const showType = !!node.type;
  const isEnum = node.kind === 'enumeration';
  const isMandatory = node.kind === 'element' && (node.minOccurs === undefined || parseInt(node.minOccurs) > 0);

  return (
    <div className="tree-node">
      <div 
        className={`node-content ${isExpandable ? 'expandable' : ''} ${isExpanded ? 'active' : ''} ${isEnum ? 'enumeration' : ''}`} 
        onClick={isExpandable ? toggleExpand : undefined}
        onKeyDown={isExpandable ? handleKeyDown : undefined}
        role={isExpandable ? "button" : undefined}
        tabIndex={isExpandable ? 0 : undefined}
        aria-expanded={isExpandable ? isExpanded : undefined}
      >
        <div className="node-icon">
          {isExpandable ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div style={{ width: 14 }} />
          )}
        </div>
        
        <div className={`node-icon-kind ${node.kind}`}>
          {getIcon(node.kind)}
        </div>

        {isNamed && (
          <span className={`node-name ${isMandatory ? 'mandatory' : 'optional'}`}>
            {node.name}
            {isMandatory && <span className="mandatory-indicator" title="Required">*</span>}
          </span>
        )}
        
        {showType && (
          <span 
            className={`node-type ${isBuiltInType(node.type!) ? '' : 'expand-link'}`}
            onClick={isBuiltInType(node.type!) ? undefined : (e) => handleTypeClick(e, node.type!)}
            title={isBuiltInType(node.type!) ? undefined : "Click to expand inline"}
          >
            {node.type}
          </span>
        )}

        {node.type && !isBuiltInType(node.type) && (
          <button 
            className="jump-button" 
            onClick={handleJumpToType}
            title="Jump to type details"
          >
            <Zap size={10} />
          </button>
        )}

        {node.base && (
          <span 
            className="node-base link"
            onClick={(e) => {
              e.stopPropagation();
              const cleanName = node.base!.includes(':') ? node.base!.split(':')[1] : node.base!;
              navigate(cleanName, 'complexType');
            }}
          >
            extends {node.base}
          </span>
        )}

        {(node.minOccurs || node.maxOccurs) && (
          <span className="node-occurrence">
            [{node.minOccurs || '1'}..{node.maxOccurs || '1'}]
          </span>
        )}

        {!isNamed && <span className="node-kind-tag">{node.kind}</span>}
        
        {node.isBroken && (
          <div className="broken-badge" title={node.error}>
            <AlertTriangle size={12} />
            <span>Broken</span>
          </div>
        )}
        
        {isLoading && <Loader2 size={12} className="animate-spin ml-2 opacity-50" />}
      </div>

      {isExpanded && (
        <div className="node-details">
          <NodeMetadata node={activeNode} />
        </div>
      )}

      {isExpandable && isExpanded && (
        <div className="node-children">
          {isLoading && (
            <div className="loading-children-prominent">
              <div className="dot-pulse">
                <div className="dot-pulse__dot"></div>
                <div className="dot-pulse__dot"></div>
                <div className="dot-pulse__dot"></div>
              </div>
              <span className="loading-label">Resolving {node.type}...</span>
            </div>
          )}
          {(node.children || []).map((child, index) => (
            <ItemTreeNode key={`${child.name || child.kind}-${index}`} node={child} />
          ))}
          {resolvedNode?.children?.map((child, index) => (
            <div key={`resolved-${child.name || child.kind}-${index}`} className="resolved-branch">
              <ItemTreeNode node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ItemTreeNode.displayName = 'ItemTreeNode';

