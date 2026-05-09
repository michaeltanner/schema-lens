'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigationStore } from '@/core/store/useNavigationStore';
import { useUIStore } from '@/core/store/useUIStore';
import { ItemGraphNode } from './item-graph/ItemGraphNode';
import { NamespaceNode } from './item-graph/NamespaceNode';
import { ItemGraphHeader } from './item-graph/ItemGraphHeader';
import { getLayoutedElements, analyzeConnectivity } from './item-graph/layoutUtils';
import { useGraphData } from './item-graph/useGraphData';
import '../styles/item-graph.css';

const nodeTypes = {
  itemNode: ItemGraphNode,
  namespace: NamespaceNode,
};

const nodeWidth = 250;
const nodeHeight = 50;

const TopologyInner: React.FC<{ onClose?: () => void; rootNode?: string | null; inline?: boolean }> = ({ onClose, rootNode, inline }) => {
  const [collapsedChildren, setCollapsedChildren] = useState<Set<string>>(new Set());
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  const { navigate } = useNavigationStore();
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();
  const nodesRef = useRef<Node[]>([]);

  const handleFocus = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node) {
      setCenter(node.position.x + nodeWidth / 2, node.position.y + nodeHeight / 2, { zoom: 1, duration: 800 });
    }
  }, [setCenter]);

  const handleInspect = useCallback((label: string, type: any) => {
    if (onClose) onClose();
    useUIStore.setState({ viewMode: 'tree' });
    navigate(label, type);
  }, [navigate, onClose]);

  const toggleChildren = useCallback((nodeId: string) => {
    setCollapsedChildren(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const toggleParents = useCallback((nodeId: string) => {
    setCollapsedParents(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const { nodes, edges, loading, onNodesChange, onEdgesChange, setNodes, setEdges } = useGraphData({
    rootNode,
    handleInspect,
    handleFocus,
    toggleChildren,
    toggleParents,
    collapsedChildren,
    collapsedParents,
    setHoveredNodeId,
  });

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);

  const activePathElements = useMemo(() => {
    if (!hoveredNodeId) return { nodes: new Set<string>(), edges: new Set<string>() };

    const activeNodes = new Set<string>([hoveredNodeId]);
    const activeEdges = new Set<string>();

    const findAncestors = (nodeId: string) => {
      edges.forEach(e => {
        if (e.target === nodeId) {
          activeNodes.add(e.source);
          activeEdges.add(e.id);
          findAncestors(e.source);
        }
      });
    };

    const findDescendants = (nodeId: string) => {
      edges.forEach(e => {
        if (e.source === nodeId) {
          activeNodes.add(e.target);
          activeEdges.add(e.id);
          findDescendants(e.target);
        }
      });
    };

    findAncestors(hoveredNodeId);
    findDescendants(hoveredNodeId);

    return { nodes: activeNodes, edges: activeEdges };
  }, [hoveredNodeId, edges]);

  const filteredNodes = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return nodes.map(n => {
      const isSearchMatch = !searchQuery || (n.data.label as string).toLowerCase().includes(lowerQuery);
      const isPathMatch = !hoveredNodeId || activePathElements.nodes.has(n.id);
      
      let opacity = 1;
      if (searchQuery && !isSearchMatch) opacity = 0.2;
      else if (hoveredNodeId && !isPathMatch) opacity = 0.3;

      return {
        ...n,
        style: { ...n.style, opacity }
      };
    });
  }, [nodes, searchQuery, hoveredNodeId, activePathElements]);

  const filteredEdges = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return edges.map(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      const isSearchMatch = !searchQuery || 
                            (sourceNode?.data.label as string)?.toLowerCase().includes(lowerQuery) || 
                            (targetNode?.data.label as string)?.toLowerCase().includes(lowerQuery);
      
      const isPathMatch = hoveredNodeId && activePathElements.edges.has(e.id);
      
      let opacity = 1;
      if (searchQuery && !isSearchMatch) opacity = 0.1;
      else if (hoveredNodeId && !isPathMatch) opacity = 0.1;

      return {
        ...e,
        animated: !!isPathMatch,
        style: { 
          ...e.style, 
          opacity,
          stroke: isPathMatch ? 'var(--accent)' : 'var(--border)',
          strokeWidth: isPathMatch ? 3 : 1.5,
        }
      };
    });
  }, [edges, nodes, searchQuery, hoveredNodeId, activePathElements]);

  return (
    <div className="topology-container" style={inline ? { boxShadow: 'none', border: 'none', borderRadius: 0 } : {}}>
      {!inline && (
        <ItemGraphHeader 
          rootNode={rootNode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={onClose}
        />
      )}
      
      <div className="topology-body">
        {loading ? (
          <div className="topology-loading">Loading graph...</div>
        ) : (
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            minZoom={0.1}
            attributionPosition="bottom-right"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border)" />
            <Controls />
            <MiniMap 
              nodeStrokeColor={() => 'var(--accent)'}
              nodeColor={() => 'var(--surface)'}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};

export const ItemGraphView: React.FC<{ onClose?: () => void; rootNode?: string | null; inline?: boolean }> = (props) => {
  return (
    <ReactFlowProvider>
      {props.inline ? (
        <div className="topology-inline-wrapper" style={{ height: '100%', position: 'relative' }}>
          <TopologyInner {...props} />
        </div>
      ) : (
        <div className="topology-overlay">
          <TopologyInner {...props} />
        </div>
      )}
    </ReactFlowProvider>
  );
};
