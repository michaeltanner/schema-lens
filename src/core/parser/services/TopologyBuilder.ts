import { SchemaIndexer, ReferenceItem } from './SchemaIndexer';

export class TopologyBuilder {
  constructor(private indexer: SchemaIndexer) {}

  public build(rootNode?: string | null) {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    const typeIndex = this.indexer.getTypeIndex();
    const refIndex = this.indexer.getReferenceIndex();

    if (!rootNode) {
      // Macro view: show all global schema nodes
      for (const [key, item] of typeIndex.entries()) {
        const [type, name] = key.split(':');
        nodes.push({ id: key, type: 'itemNode', data: { label: name, type } });
      }

      for (const [targetName, sources] of refIndex.entries()) {
        const targetId = this.resolveTargetId(targetName, typeIndex);
        if (targetId) {
          sources.forEach(src => {
            const sourceId = `${src.type}:${src.name}`;
            if (typeIndex.has(sourceId)) {
              edges.push({ id: `e-${sourceId}-${targetId}`, source: sourceId, target: targetId, type: 'default' });
            }
          });
        }
      }
    } else {
      // Micro view: Drill down from specific node
      const [type, name] = rootNode.split(':');
      nodes.push({ id: rootNode, type: 'itemNode', data: { label: name, type } });
      
      // 1. Find parents (what uses this node)
      const refs = refIndex.get(name);
      if (refs) {
        refs.forEach(ref => {
          const sourceId = `${ref.type}:${ref.name}`;
          if (!nodes.find(n => n.id === sourceId)) {
            nodes.push({ id: sourceId, type: 'itemNode', data: { label: ref.name, type: ref.type } });
          }
          edges.push({ id: `e-${sourceId}-${rootNode}`, source: sourceId, target: rootNode, type: 'default' });
        });
      }

      // 2. Find children (what this node uses) using BFS up to 3 levels deep
      const forwardIndex = this.buildForwardIndex(typeIndex, refIndex);
      const maxDepth = 3;
      const queue = [{ id: rootNode, name, type, depth: 0 }];
      const visited = new Set<string>();
      visited.add(rootNode);

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.depth >= maxDepth) continue;

        const children = forwardIndex.get(current.id) || [];
        for (const child of children) {
          if (!nodes.find(n => n.id === child.id)) {
            nodes.push({ id: child.id, type: 'itemNode', data: { label: child.name, type: child.type }});
          }
          
          const edgeId = `e-${current.id}-${child.id}`;
          if (!edges.find(e => e.id === edgeId)) {
            edges.push({ id: edgeId, source: current.id, target: child.id, type: 'default' });
          }

          if (!visited.has(child.id)) {
            visited.add(child.id);
            queue.push({ ...child, depth: current.depth + 1 });
          }
        }
      }
    }
    
    return { nodes, edges };
  }

  private resolveTargetId(targetName: string, typeIndex: Map<string, any>): string | null {
    const types = ['complexType', 'simpleType', 'element'];
    for (const t of types) {
      const id = `${t}:${targetName}`;
      if (typeIndex.has(id)) return id;
    }
    return null;
  }

  private buildForwardIndex(typeIndex: Map<string, any>, refIndex: Map<string, any>) {
    const forwardIndex = new Map<string, Array<{id: string, name: string, type: string}>>();
    for (const [targetName, sources] of refIndex.entries()) {
      const targetId = this.resolveTargetId(targetName, typeIndex);
      if (targetId) {
        const targetType = targetId.split(':')[0];
        sources.forEach((s: ReferenceItem) => {
          const sourceId = `${s.type}:${s.name}`;
          if (!forwardIndex.has(sourceId)) forwardIndex.set(sourceId, []);
          forwardIndex.get(sourceId)!.push({ id: targetId, name: targetName, type: targetType });
        });
      }
    }
    return forwardIndex;
  }
}
