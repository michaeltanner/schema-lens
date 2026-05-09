import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Node, Edge, useReactFlow, useNodesState, useEdgesState } from '@xyflow/react';
import { analyzeConnectivity, getLayoutedElements } from './layoutUtils';

interface UseGraphDataProps {
  rootNode?: string | null;
  handleInspect: (label: string, type: any) => void;
  handleFocus: (nodeId: string) => void;
  toggleChildren: (nodeId: string) => void;
  toggleParents: (nodeId: string) => void;
  collapsedChildren: Set<string>;
  collapsedParents: Set<string>;
  setHoveredNodeId: (id: string | null) => void;
}

export function useGraphData({
  rootNode,
  handleInspect,
  handleFocus,
  toggleChildren,
  toggleParents,
  collapsedChildren,
  collapsedParents,
  setHoveredNodeId
}: UseGraphDataProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchTopology = useCallback(async () => {
    setLoading(true);
    try {
      const url = rootNode ? `/api/item/graph?node=${encodeURIComponent(rootNode)}` : '/api/item/graph';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      const { nodesWithChildren, nodesWithParents } = analyzeConnectivity(data);

      const enhancedNodes = data.nodes.map((n: any) => ({
        ...n,
        data: {
          ...n.data,
          isRoot: n.id === rootNode,
          childCount: nodesWithChildren.get(n.id) || 0,
          hasChildren: nodesWithChildren.has(n.id),
          hasParents: nodesWithParents.has(n.id),
          isChildrenCollapsed: collapsedChildren.has(n.id),
          isParentsCollapsed: collapsedParents.has(n.id),
          onInspect: handleInspect,
          onFocus: handleFocus,
          onToggleChildren: toggleChildren,
          onToggleParents: toggleParents,
          setHovered: setHoveredNodeId,
        }
      }));

      // Filter nodes based on collapsed state
      const hiddenNodes = new Set<string>();
      const hideDescendants = (parentId: string) => {
        data.edges.forEach((e: any) => {
          if (e.source === parentId) {
            hiddenNodes.add(e.target);
            hideDescendants(e.target);
          }
        });
      };
      
      const hideAncestors = (childId: string) => {
        data.edges.forEach((e: any) => {
          if (e.target === childId) {
            hiddenNodes.add(e.source);
            hideAncestors(e.source);
          }
        });
      };
      
      collapsedChildren.forEach(id => hideDescendants(id));
      collapsedParents.forEach(id => hideAncestors(id));

      const visibleNodes = enhancedNodes.filter((n: any) => !hiddenNodes.has(n.id));
      const visibleEdges = data.edges.filter((e: any) => !hiddenNodes.has(e.source) && !hiddenNodes.has(e.target));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(visibleNodes, visibleEdges, 'LR');

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      console.error('Failed to load topology', err);
    } finally {
      setLoading(false);
    }
  }, [rootNode, collapsedChildren, collapsedParents, handleInspect, handleFocus, toggleChildren, toggleParents, setHoveredNodeId]);

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  return { nodes, edges, loading, onNodesChange, onEdgesChange, setNodes, setEdges };
}
