/**
 * Individual Item Types
 */

export type NodeKind = 
  | 'element' 
  | 'sequence' 
  | 'choice' 
  | 'all' 
  | 'complexType' 
  | 'simpleType' 
  | 'simpleContent' 
  | 'complexContent' 
  | 'extension' 
  | 'restriction' 
  | 'enumeration';

export interface ItemConstraints {
  pattern?: string;
  minInclusive?: string;
  maxInclusive?: string;
  minLength?: string;
  maxLength?: string;
  totalDigits?: string;
  fractionDigits?: string;
  defaultValue?: string;
  fixedValue?: string;
}

export interface ItemMetadata {
  documentation?: string;
  sourceFile?: string;
  rawXml?: string;
  regexExample?: string;
}

/**
 * Structural Data Node representing an individual Item
 */
export interface ItemNode extends ItemConstraints, ItemMetadata {
  name?: string;
  type?: string;
  ref?: string;
  kind: NodeKind;
  base?: string;
  minOccurs?: string;
  maxOccurs?: string;
  children?: ItemNode[];
  
  // UI/State Augmentation
  isBroken?: boolean;
  error?: string;
}
