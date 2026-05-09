import { HierarchyNode, SchemaError } from '@/types/schema';
import { SchemaIndexer } from './SchemaIndexer';
import path from 'path';

export class HierarchyBuilder {
  constructor(private indexer: SchemaIndexer) {}

  public build(items: string[], type: 'element' | 'complexType' | 'simpleType', errors: SchemaError[]): HierarchyNode[] {
    const root: HierarchyNode[] = [];

    const addItem = (fullName: string) => {
      const parts = fullName
        .replace(/_/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(' ')
        .filter(Boolean);

      let currentLevel = root;
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (isLast) {
          let existingFolder = currentLevel.find(n => n.kind === 'folder' && n.name === part);
          
          const typeObj = this.indexer.getTypeIndex().get(`${type}:${fullName}`);
          const sourceFile = typeObj ? path.basename(typeObj.file) : undefined;

          if (existingFolder) {
            existingFolder.isItem = true;
            existingFolder.itemType = type;
            existingFolder.fullName = fullName; 
            existingFolder.sourceFile = sourceFile;
          } else {
            const nodeHasError = errors.some(e => e.nodeName === fullName || (e.nodeName === part && e.type === 'DUPLICATE_ITEM'));
            
            currentLevel.push({
              name: part,
              fullName,
              kind: 'item',
              itemType: type,
              hasError: nodeHasError,
              sourceFile
            });
          }
        } else {
          let folder = currentLevel.find(n => n.kind === 'folder' && n.name === part);
          if (!folder) {
            let existingItemIndex = currentLevel.findIndex(n => n.kind === 'item' && n.name === part);
            if (existingItemIndex !== -1) {
              const existingItem = currentLevel[existingItemIndex];
              const newFolder: HierarchyNode = {
                ...existingItem,
                kind: 'folder',
                isItem: true,
                children: [],
              };
              currentLevel[existingItemIndex] = newFolder;
              folder = newFolder;
            } else {
              folder = {
                name: part,
                fullName: currentPath,
                kind: 'folder',
                children: [],
              };
              currentLevel.push(folder);
            }
          }
          currentLevel = folder.children!;
        }
      }
    };

    items.forEach(name => addItem(name));

    const sortNodes = (nodes: HierarchyNode[]) => {
      nodes.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(n => {
        if (n.children) sortNodes(n.children);
      });
    };

    sortNodes(root);
    const compressed = this.compress(root);
    
    const tagErrors = (nodes: HierarchyNode[]): boolean => {
      let hasError = false;
      for (const node of nodes) {
        if (node.kind === 'item') {
          const itemError = errors.find(e => e.nodeName === node.fullName);
          if (itemError) {
            node.hasError = true;
            hasError = true;
          }
        } else if (node.children) {
          if (tagErrors(node.children)) {
            node.hasError = true;
            hasError = true;
          }
        }
      }
      return hasError;
    };
    
    tagErrors(compressed);
    return compressed;
  }

  private compress(nodes: HierarchyNode[]): HierarchyNode[] {
    return nodes.map(node => {
      if (node.kind === 'folder' && node.children) {
        node.children = this.compress(node.children);

        if (node.children.length === 1) {
          const child = node.children[0];
          if (child.kind === 'folder') {
            return {
              ...child,
              name: `${node.name} ${child.name}`,
            };
          } else if (child.kind === 'item') {
            return {
              ...child,
              name: child.fullName,
            };
          }
        }
      }
      return node;
    });
  }
}
