import { Position } from '@xyflow/react';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 50;

export const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';

  if (nodes.length > 800) {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const newNodes = nodes.map((node, i) => ({
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: (i % cols) * (nodeWidth + 100),
        y: Math.floor(i / cols) * (nodeHeight + 100),
      },
    }));
    return { nodes: newNodes, edges };
  }

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight + 40 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export const analyzeConnectivity = (data: { nodes: any[], edges: any[] }, rootNode?: string | null) => {
  const nodesWithChildren = new Map<string, number>();
  data.edges.forEach((e: any) => {
    nodesWithChildren.set(e.source, (nodesWithChildren.get(e.source) || 0) + 1);
  });
  const nodesWithParents = new Set(data.edges.map((e: any) => e.target));

  return { nodesWithChildren, nodesWithParents };
};
