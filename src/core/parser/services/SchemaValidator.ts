import path from 'path';
import { SchemaError } from '@/types/schema';
import { SchemaIndexer } from './SchemaIndexer';

export class SchemaValidator {
  constructor(private indexer: SchemaIndexer) {}

  public validate(schemaObjects: any[]): SchemaError[] {
    // Currently, validation is built into the Indexer for performance/simplicity.
    // In a future refactor, we can pull the validation loops here.
    // For now, this class can act as a wrapper or hold additional validation logic.
    return this.indexer.getErrors();
  }
}
