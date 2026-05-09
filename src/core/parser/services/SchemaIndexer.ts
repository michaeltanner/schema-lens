import path from 'path';
import { SchemaError, ItemType, RawSchemaObject } from '@/types/schema';
import { isBuiltInType } from '@/core/utils/schemaUtils';

export interface IndexedItem {
  item: any;
  file: string;
}

export interface ReferenceItem {
  name: string;
  type: ItemType;
}

export class SchemaIndexer {
  private typeIndex: Map<string, IndexedItem> = new Map();
  private referenceIndex: Map<string, ReferenceItem[]> = new Map();
  private errors: SchemaError[] = [];

  public clear() {
    this.typeIndex.clear();
    this.referenceIndex.clear();
    this.errors = [];
  }

  public buildIndexes(schemaObjects: RawSchemaObject[]) {
    this.clear();

    // 1. Build Type Index for fast item lookups
    schemaObjects.forEach(obj => {
      const name = obj.item['@_name'];
      if (name) {
        const key = `${obj.tag}:${name}`;
        
        // Detect Duplicate Items
        const existing = this.typeIndex.get(key);
        if (existing) {
          const fileName = path.basename(obj.file);
          const existingFileName = path.basename(existing.file);
          
          this.errors.push({
            type: 'DUPLICATE_ITEM',
            severity: 'error',
            message: `Duplicate ${obj.tag} '${name}' found in ${fileName}. Already defined in ${existingFileName}.`,
            sourceFile: fileName,
            nodeName: name
          });
        }
        
        this.typeIndex.set(key, { item: obj.item, file: obj.file });
      }
    });

    // 2. Build Reference Index (Reverse Lookup) and Validate Integrity
    schemaObjects.forEach(obj => {
      const defName = obj.item['@_name'];
      if (!defName) return;

      const foundRefs = new Set<string>();
      const fileName = path.basename(obj.file);
      
      const walk = (o: any, depth: number = 0) => {
        if (!o || typeof o !== 'object' || depth > 100) return;
        for (const key of Object.keys(o)) {
          if (key === '@_name' || key === 'annotation' || key === 'documentation') continue;
          
          const val = o[key];
          
          if (key.startsWith('@_')) {
            const attrName = key.substring(2);
            const isReferenceAttr = ['type', 'base', 'ref', 'substitutionGroup'].includes(attrName);

            if (isReferenceAttr && typeof val === 'string' && !isBuiltInType(val)) {
              const stripped = val.includes(':') ? val.split(':').pop()! : val;
              
              // Validation Pass
              const targetExists = this.typeIndex.has(`complexType:${stripped}`) || 
                                 this.typeIndex.has(`simpleType:${stripped}`) ||
                                 this.typeIndex.has(`element:${stripped}`);

              if (!targetExists) {
                this.errors.push({
                  type: 'MISSING_REFERENCE',
                  severity: 'error',
                  message: `Reference '${stripped}' not found. Did you forget to upload all required schema files?`,
                  sourceFile: fileName,
                  targetName: stripped,
                  nodeName: defName
                });
              }

              foundRefs.add(stripped);
            }
          } else {
            if (Array.isArray(val)) {
              for (const item of val) walk(item, depth + 1);
            } else {
              walk(val, depth + 1);
            }
          }
        }
      };

      walk(obj.item);

      foundRefs.forEach(targetName => {
        let list = this.referenceIndex.get(targetName);
        if (!list) {
          list = [];
          this.referenceIndex.set(targetName, list);
        }
        list.push({ 
          name: defName, 
          type: obj.tag
        });
      });
    });
  }

  public findType(name: string): IndexedItem | null {
    if (!name || isBuiltInType(name)) return null;
    const typeName = name.includes(':') ? name.split(':')[1] : name;
    
    return this.typeIndex.get(`complexType:${typeName}`) || 
           this.typeIndex.get(`simpleType:${typeName}`) || 
           null;
  }

  public getTypeIndex() { return this.typeIndex; }
  public getReferenceIndex() { return this.referenceIndex; }
  public getErrors() { return this.errors; }
}
