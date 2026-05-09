export type ItemType = 'element' | 'complexType' | 'simpleType';

export interface RawSchemaObject {
  tag: ItemType;
  item: any;
  file: string;
  content: string;
  targetNamespace: string;
}

/**
 * Global Schema / Project Types
 */

export interface SchemaError {
  type: 'MISSING_REFERENCE' | 'DUPLICATE_ITEM' | 'PARSE_ERROR' | 'CIRCULAR_REF';
  severity: 'error' | 'warning';
  message: string;
  sourceFile: string;
  targetName?: string;
  nodeName?: string;
}

/**
 * Navigation / Hierarchy Types
 */
export interface HierarchyNode {
  name: string;
  fullName: string;
  kind: 'folder' | 'item';
  itemType?: 'element' | 'complexType' | 'simpleType';
  isItem?: boolean;
  children?: HierarchyNode[];
  hasError?: boolean;
  sourceFile?: string;
}

/**
 * Global State / Summary
 */
export interface SchemaSummary {
  files: string[];
  totalFilesCount: number;
  activeFilesCount: number;
  totalElements: number;
  totalComplexTypes: number;
  totalSimpleTypes: number;
  elements: string[];
  complexTypes: string[];
  simpleTypes: string[];
  elementHierarchy: HierarchyNode[];
  complexTypeHierarchy: HierarchyNode[];
  simpleTypeHierarchy: HierarchyNode[];
  itemOrigins: Record<string, string>;
  errors: SchemaError[];
  debugFiles?: string[];
}
