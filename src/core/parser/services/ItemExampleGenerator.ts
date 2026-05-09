import RandExp from 'randexp';
import { ItemNode } from '@/types/item';
import { SchemaIndexer } from './SchemaIndexer';
import path from 'path';

export class ItemExampleGenerator {
  constructor(private indexer: SchemaIndexer) {}

  public generateValue(node: ItemNode, depth: number = 0): string {
    if (depth > 50) return '...'; 
    if (node.fixedValue) return node.fixedValue;
    if (node.defaultValue) return node.defaultValue;
    if (node.regexExample) return node.regexExample;
    
    const rawType = (node.type || node.base || '').toLowerCase();
    if (!rawType) return '...';
    
    // Extract the core type name (after namespace)
    const cleanType = rawType.includes(':') ? rawType.split(':')[1] : rawType;

    // Standard XSD patterns (optimized for UCI)
    if (cleanType.includes('uuid')) {
      return '00000000-0000-0000-0000-000000000000'
        .replace(/[0]/g, () => (Math.floor(Math.random() * 16)).toString(16));
    }

    if (cleanType.includes('datetime')) return new Date().toISOString();
    if (cleanType.includes('date')) return new Date().toISOString().split('T')[0];
    if (cleanType.includes('time')) return new Date().toISOString().split('T')[1].replace('Z', '');
    if (cleanType.includes('duration')) return 'P1DT12H';
    
    if (cleanType.includes('string')) return 'Sample text';
    if (cleanType.includes('boolean')) return 'true';
    
    if (cleanType.includes('decimal') || cleanType.includes('float') || cleanType.includes('double')) return '123.45';
    if (cleanType.includes('int') || cleanType.includes('long') || cleanType.includes('short') || cleanType.includes('byte') || cleanType.includes('integer')) {
      return '42';
    }

    if (cleanType.includes('uri')) return 'https://example.com';
    if (cleanType.includes('base64')) return 'SGVsbG8gV29ybGQ=';
    if (cleanType.includes('hex')) return '48656c6c6f';

    // Fallback to basic primitives if the name suggests them
    if (cleanType.includes('name') || cleanType.includes('label') || cleanType.includes('desc')) return 'Sample text';
    if (cleanType.includes('count') || cleanType.includes('size') || cleanType.includes('index')) return '1';
    if (cleanType.includes('enabled') || cleanType.includes('active')) return 'true';

    return '...';
  }

  public generateXmlExample(node: ItemNode, depth: number = 0, includeOptional: boolean = true): string {
    if (depth > 100) return '';
    
    if (depth > 0 && !includeOptional && (node.minOccurs === '0' || node.minOccurs === 0 as any)) {
      return '';
    }
    
    const indent = '  '.repeat(depth);
    
    if (depth === 0 || node.kind === 'element') {
      const name = node.name || (node.kind === 'element' ? 'element' : 'Type');
      let children = node.children || [];
      
      if (children.length > 0) {
        const enums = children.filter(c => c.kind === 'enumeration');
        if (enums.length > 0) {
          return `${indent}<${name}>${enums[0].name}</${name}>`;
        }

        let innerXml = '';
        children.forEach(child => {
          const childXml = this.generateXmlExample(child, depth + 1, includeOptional);
          if (childXml) innerXml += `\n${childXml}`;
        });
        
        return `${indent}<${name}>${innerXml}\n${indent}</${name}>`;
      } else {
        const value = this.generateValue(node);
        return `${indent}<${name}>${value}</${name}>`;
      }
    } else if (['sequence', 'all', 'complexType', 'complexContent', 'simpleContent', 'extension'].includes(node.kind)) {
      let xml = '';
      if (node.children) {
        node.children.forEach(child => {
          const childXml = this.generateXmlExample(child, depth, includeOptional);
          if (childXml) {
            xml += (xml ? '\n' : '') + childXml;
          }
        });
      }
      return xml;
    } else if (node.kind === 'choice') {
      if (node.children && node.children.length > 0) {
        return this.generateXmlExample(node.children[0], depth, includeOptional);
      }
    }
    
    return '';
  }

  public generateRegexExample(name: string, type: string, base: string, pattern: string): string | undefined {
    const lowerType = (type || '').toLowerCase();
    const lowerBase = (base || '').toLowerCase();
    
    if (lowerType.includes('datetime') || lowerBase.includes('datetime')) return new Date().toISOString();
    if (lowerType.includes('date') || lowerBase.includes('date')) return new Date().toISOString().split('T')[0];
    if (lowerType.includes('time') || lowerBase.includes('time')) return new Date().toISOString().split('T')[1].replace('Z', '');
    if (lowerType.includes('boolean') || lowerBase.includes('boolean')) return 'true';
    if (lowerType.includes('uuid') || lowerBase.includes('uuid') || pattern.includes('0-9a-fA-F]{8}')) return '550e8400-e29b-41d4-a716-446655440000';

    try {
      const re = new RandExp(pattern);
      re.max = 5;
      re.defaultRange.subtract(0, 65535); 
      re.defaultRange.add(48, 57);   // 0-9
      re.defaultRange.add(65, 90);   // A-Z
      re.defaultRange.add(97, 122);  // a-z
      
      const example = re.gen();
      if (!example || example.length > 50) return undefined;
      return example;
    } catch (e) {
      return undefined;
    }
  }
}
