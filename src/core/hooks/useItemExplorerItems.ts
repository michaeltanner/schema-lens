import { useMemo } from 'react';
import { HierarchyNode, SchemaSummary } from '@/types/schema';

export function useItemExplorerItems(
  summary: SchemaSummary | null,
  searchQuery: string,
  expandedFolders: Set<string>
) {
  return useMemo(() => {
    if (!summary) return [];

    const query = searchQuery.toLowerCase();
    
    const filterHierarchy = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.reduce((acc, node) => {
        const matchesSelf = node.name.toLowerCase().includes(query) || 
                            node.fullName.toLowerCase().includes(query);
        
        let filteredChildren: HierarchyNode[] = [];
        if (node.kind === 'folder' && node.children) {
          filteredChildren = filterHierarchy(node.children);
        }

        const hasMatchingChildren = filteredChildren.length > 0;

        if (matchesSelf || hasMatchingChildren) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
        return acc;
      }, [] as HierarchyNode[]);
    };

    const flattened: any[] = [];
    const walk = (nodes: HierarchyNode[], depth: number) => {
      nodes.forEach(node => {
        const isExpanded = query ? (node.kind === 'folder' && node.children && node.children.length > 0) : expandedFolders.has(node.fullName);
        flattened.push({ ...node, depth, isExpanded });
        
        if (node.kind === 'folder' && isExpanded && node.children) {
          walk(node.children, depth + 1);
        }
      });
    };

    const processSection = (title: string, count: number, originalHierarchy: HierarchyNode[]) => {
      const hierarchy = query ? filterHierarchy(originalHierarchy) : originalHierarchy;
      const categoryId = `__category__${title}`;
      const isExpanded = query ? hierarchy.length > 0 : expandedFolders.has(categoryId);

      if (hierarchy.length > 0 || !query) {
        flattened.push({
          kind: 'category',
          name: title,
          fullName: categoryId,
          count: query ? hierarchy.length : count,
          isExpanded,
          depth: 0
        });

        if (isExpanded) {
          walk(hierarchy, 0);
        }
      }
    };

    processSection('Elements', summary.totalElements, summary.elementHierarchy);
    processSection('Complex Types', summary.totalComplexTypes, summary.complexTypeHierarchy);
    processSection('Simple Types', summary.totalSimpleTypes, summary.simpleTypeHierarchy);

    return flattened;
  }, [summary, searchQuery, expandedFolders]);
}
