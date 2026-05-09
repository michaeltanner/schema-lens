import { ItemNode, NodeKind } from '@/types/item';
import { SchemaIndexer } from './SchemaIndexer';
import { ItemExampleGenerator } from './ItemExampleGenerator';
import path from 'path';
import { isBuiltInType } from '@/core/utils/schemaUtils';

export class SchemaMapper {
  constructor(
    private indexer: SchemaIndexer,
    private exampleGenerator: ItemExampleGenerator
  ) {}

  public mapNode(raw: any, kind: NodeKind, depth: number = 0, maxDepth: number = 1, sourceFile?: string): ItemNode {
    if (depth > 100) return { kind, name: '... (max depth)' };

    const node: ItemNode = {
      kind,
      name: raw['@_name'] || raw['@_value'] || (raw['@_ref'] ? (raw['@_ref'].includes(':') ? raw['@_ref'].split(':')[1] : raw['@_ref']) : undefined), 
      type: raw['@_type'],
      ref: raw['@_ref'],
      base: raw['@_base'],
      minOccurs: raw['@_minOccurs'],
      maxOccurs: raw['@_maxOccurs'],
      defaultValue: raw['@_default'],
      fixedValue: raw['@_fixed'],
      sourceFile: sourceFile,
    };

    if (raw['@_type'] && depth < maxDepth) {
      const typeResult = this.indexer.findType(raw['@_type']);
      if (typeResult) {
        const { item: typeDef, file: typeFile } = typeResult;
        const typeNode = this.mapNode(typeDef, typeDef['complexType'] ? 'complexType' : 'simpleType', depth + 1, maxDepth, path.basename(typeFile));
        
        const facets = ['pattern', 'minInclusive', 'maxInclusive', 'minLength', 'maxLength', 'totalDigits', 'fractionDigits', 'base', 'documentation', 'regexExample', 'sourceFile'];
        facets.forEach(f => {
          if ((typeNode as any)[f] && !(node as any)[f]) {
            (node as any)[f] = (typeNode as any)[f];
          }
        });

        if (typeNode.children && (!node.children || node.children.length === 0)) {
          node.children = typeNode.children;
        }
      } else if (!isBuiltInType(raw['@_type'])) {
        node.isBroken = true;
        node.error = `Type '${raw['@_type']}' not found. Did you forget to upload all required schema files?`;
      }
    }

    const children: ItemNode[] = [];

    const processChildren = (data: any, childKind: NodeKind) => {
      if (!data) return;
      const list = Array.isArray(data) ? data : [data];
      list.forEach((item: any) => {
        const child = this.mapNode(item, childKind, depth + 1, maxDepth);
        
        const isStructural = ['sequence', 'all', 'complexType', 'complexContent', 'simpleContent', 'extension', 'restriction'].includes(child.kind);
        if (isStructural && !child.name) {
          if (child.children) {
            children.push(...child.children);
          }
          
          const facets = ['pattern', 'minInclusive', 'maxInclusive', 'minLength', 'maxLength', 'totalDigits', 'fractionDigits', 'base', 'documentation'];
          facets.forEach(f => {
            if ((child as any)[f] && !(node as any)[f]) {
              (node as any)[f] = (child as any)[f];
            }
          });
        } else {
          children.push(child);
        }
      });
    };

    const restriction = raw['restriction'];
    if (restriction) {
      if (restriction['@_base'] && !node.base) {
        node.base = restriction['@_base'];
      }
      
      const facets = ['pattern', 'minInclusive', 'maxInclusive', 'minLength', 'maxLength', 'totalDigits', 'fractionDigits'];
      facets.forEach(facet => {
        const facetData = restriction[facet];
        if (facetData) {
          const val = Array.isArray(facetData) ? facetData[0]['@_value'] : facetData['@_value'];
          if (val !== undefined) {
            (node as any)[facet] = val;
            
            if (facet === 'pattern') {
              node.regexExample = this.exampleGenerator.generateRegexExample(node.name || '', node.type || '', node.base || '', val);
            }
          }
        }
      });

      processChildren(restriction['enumeration'], 'enumeration');
    }

    const annotation = raw['annotation'];
    if (annotation) {
      const doc = annotation['documentation'];
      if (doc) {
        node.documentation = typeof doc === 'string' ? doc : (doc['#text'] || JSON.stringify(doc));
      }
    }

    if (kind === 'extension') {
      const baseName = raw['@_base'];
      if (baseName) {
        const baseType = this.indexer.findType(baseName);
        if (baseType) {
          const baseNode = this.mapNode(baseType.item, 'complexType', depth + 1, maxDepth, path.basename(baseType.file));
          if (baseNode.children) {
            children.push(...baseNode.children);
          }
        } else {
          node.isBroken = true;
          node.error = `Base type '${baseName}' not found. Did you forget to upload all required schema files?`;
        }
      }
    }

    processChildren(raw['sequence'], 'sequence');
    processChildren(raw['choice'], 'choice');
    processChildren(raw['all'], 'all');
    processChildren(raw['element'], 'element');
    processChildren(raw['complexContent'], 'complexContent' as any);
    processChildren(raw['simpleContent'], 'simpleContent');
    processChildren(raw['extension'], 'extension');
    processChildren(raw['enumeration'], 'enumeration');

    if (children.some(c => c.kind === 'restriction')) {
      const flatChildren: ItemNode[] = [];
      children.forEach(c => {
        if (c.kind === 'restriction' && c.children) {
          flatChildren.push(...c.children);
        } else {
          flatChildren.push(c);
        }
      });
      return { ...node, children: flatChildren.length > 0 ? flatChildren : undefined };
    }

    if (children.length > 0) {
      node.children = children;
    }

    if (!node.regexExample && !children.length && (node.type || node.base)) {
      const generated = this.exampleGenerator.generateValue(node);
      if (generated && generated !== '...') {
        node.regexExample = generated;
      }
    }

    return node;
  }
}
