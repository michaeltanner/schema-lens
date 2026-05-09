import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { SchemaSummary, RawSchemaObject } from '@/types/schema';
import { ItemNode, NodeKind } from '@/types/item';
import { workspaceManager } from '../workspace/workspaceManager';
import { SchemaIndexer } from './services/SchemaIndexer';
import { SchemaValidator } from './services/SchemaValidator';
import { ItemExampleGenerator } from './services/ItemExampleGenerator';
import { HierarchyBuilder } from './services/HierarchyBuilder';
import { SchemaMapper } from './services/SchemaMapper';
import { TopologyBuilder } from './services/TopologyBuilder';

export class SchemaParser {
  private parser: XMLParser;
  private schemaObjects: RawSchemaObject[] = [];
  private isInitialized: boolean = false;
  private schemaDirPath: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  // Specialized Services
  private indexer: SchemaIndexer;
  private validator: SchemaValidator;
  private exampleGenerator: ItemExampleGenerator;
  private hierarchyBuilder: HierarchyBuilder;
  private mapper: SchemaMapper;
  private topologyBuilder: TopologyBuilder;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      processEntities: false,
      removeNSPrefix: true,
    });

    this.indexer = new SchemaIndexer();
    this.validator = new SchemaValidator(this.indexer);
    this.exampleGenerator = new ItemExampleGenerator(this.indexer);
    this.hierarchyBuilder = new HierarchyBuilder(this.indexer);
    this.mapper = new SchemaMapper(this.indexer, this.exampleGenerator);
    this.topologyBuilder = new TopologyBuilder(this.indexer);
  }

  private async ensureInitialized(schemaDirPath: string, force: boolean = false) {
    const resolvedPath = workspaceManager.resolvePath(schemaDirPath);

    if (!force && this.isInitialized && this.schemaDirPath === resolvedPath) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      console.log(`[SchemaParser] Initialization starting for: ${resolvedPath}`);
      this.schemaObjects = [];
      this.indexer.clear();
      this.isInitialized = false;
      this.schemaDirPath = resolvedPath;

      const filePaths = this.discoverFiles(schemaDirPath);
      console.log(`[SchemaParser] Found ${filePaths.length} files to parse.`);

      for (const filePath of filePaths) {
        await this.parseSchemaFile(filePath);
      }

      console.log(`[SchemaParser] Building indexes for ${this.schemaObjects.length} objects...`);
      this.indexer.buildIndexes(this.schemaObjects);

      console.log(`[SchemaParser] Initialization complete.`);
      this.isInitialized = true;
      this.initializationPromise = null;
    })();

    return this.initializationPromise;
  }

  private discoverFiles(schemaDirPath: string): string[] {
    const isWorkspace = workspaceManager.isWorkspacePath(schemaDirPath);

    if (isWorkspace) {
      console.log(`[SchemaParser] Detecting files from workspace manifest...`);
      return workspaceManager.getEnabledFiles();
    } else {
      console.log(`[SchemaParser] Detecting files from directory: ${schemaDirPath}`);
      const files = fs.readdirSync(schemaDirPath).filter(f => f.endsWith('.xsd'));
      return files.map(f => path.join(schemaDirPath, f));
    }
  }

  private async parseSchemaFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      console.warn(`[SchemaParser] File not found: ${filePath}`);
      return;
    }

    try {
      const fileName = path.basename(filePath);
      console.log(`[SchemaParser] Parsing XML: ${fileName}...`);
      const content = fs.readFileSync(filePath, 'utf-8');
      const jsonObj = this.parser.parse(content);

      const schemaKey = Object.keys(jsonObj).find(k => k === 'schema' || k.endsWith(':schema'));
      const schema = schemaKey ? jsonObj[schemaKey] : null;

      if (!schema) {
        console.warn(`[SchemaParser] No schema tag found in ${fileName}`);
        return;
      }

      const targetNamespace = schema['@_targetNamespace'] || 'no-namespace';
      const keys = Object.keys(schema);
      let objectsFound = 0;

      for (const key of keys) {
        let tag: 'element' | 'complexType' | 'simpleType' | null = null;
        if (key === 'element') tag = 'element';
        else if (key === 'complexType') tag = 'complexType';
        else if (key === 'simpleType') tag = 'simpleType';

        if (tag) {
          const raw = schema[key];
          const list = Array.isArray(raw) ? raw : [raw];
          list.forEach((item: any) => {
            if (item && item['@_name']) {
              objectsFound++;
              this.schemaObjects.push({
                tag,
                item,
                file: filePath,
                content,
                targetNamespace
              });
            }
          });
        }
      }
      console.log(`[SchemaParser] Finished ${fileName}: Found ${objectsFound} top-level objects.`);
    } catch (err) {
      console.error(`[SchemaParser] Error parsing ${filePath}:`, err);
    }
  }

  public reset() {
    this.schemaObjects = [];
    this.indexer.clear();
    this.isInitialized = false;
    this.schemaDirPath = null;
    this.initializationPromise = null;
  }

  public async parseAll(schemaDirPath: string, force: boolean = false): Promise<SchemaSummary> {
    await this.ensureInitialized(schemaDirPath, force);

    const elementSet = new Set<string>();
    const complexTypeSet = new Set<string>();
    const simpleTypeSet = new Set<string>();
    const activeFileNames = new Set<string>();

    this.schemaObjects.forEach(obj => {
      activeFileNames.add(path.basename(obj.file));
      const name = obj.item['@_name'];
      if (!name) return;

      if (obj.tag === 'element') {
        elementSet.add(name);
      } else if (obj.tag === 'complexType') {
        complexTypeSet.add(name);
      } else if (obj.tag === 'simpleType') {
        simpleTypeSet.add(name);
      }
    });

    const elements = Array.from(elementSet).sort();
    const complexTypes = Array.from(complexTypeSet).sort();
    const simpleTypes = Array.from(simpleTypeSet).sort();

    const isWorkspace = workspaceManager.isWorkspacePath(schemaDirPath);
    const allWorkspaceFiles = workspaceManager.getFiles();
    const totalFilesCount = isWorkspace ? allWorkspaceFiles.length : Array.from(activeFileNames).length;
    const activeFilesCount = isWorkspace ? allWorkspaceFiles.filter(f => f.enabled).length : Array.from(activeFileNames).length;

    const itemOrigins: Record<string, string> = {};
    this.schemaObjects.forEach(obj => {
      const name = obj.item['@_name'];
      if (name) {
        itemOrigins[`${obj.tag}:${name}`] = path.basename(obj.file);
      }
    });

    const errors = this.validator.validate(this.schemaObjects);

    return {
      files: Array.from(activeFileNames),
      totalFilesCount,
      activeFilesCount,
      totalElements: elements.length,
      totalComplexTypes: complexTypes.length,
      totalSimpleTypes: simpleTypes.length,
      elements,
      complexTypes,
      simpleTypes,
      elementHierarchy: this.hierarchyBuilder.build(elements, 'element', errors),
      complexTypeHierarchy: this.hierarchyBuilder.build(complexTypes, 'complexType', errors),
      simpleTypeHierarchy: this.hierarchyBuilder.build(simpleTypes, 'simpleType', errors),
      itemOrigins,
      errors: errors,
      debugFiles: this.schemaObjects.map(o => path.basename(o.file)).filter((v, i, a) => a.indexOf(v) === i),
    };
  }

  public async getUsedIn(schemaDirPath: string, name: string): Promise<Array<{ name: string; type: 'element' | 'complexType' | 'simpleType' }>> {
    await this.ensureInitialized(schemaDirPath);
    return this.indexer.getReferenceIndex().get(name) || [];
  }

  public async getItem(schemaDirPath: string, name: string, type: 'element' | 'complexType' | 'simpleType', maxDepth: number = 1): Promise<ItemNode | null> {
    await this.ensureInitialized(schemaDirPath);

    let found = this.schemaObjects.find(obj =>
      obj.tag === type && obj.item['@_name'] === name
    );

    // Robust Fallback: If not found by specific type, try searching for any item with this name.
    // This handles cases where the UI might have a slightly incorrect guess about the kind (e.g. element vs complexType)
    if (!found) {
      found = this.schemaObjects.find(obj => obj.item['@_name'] === name);
    }

    if (found) {
      const node = this.mapper.mapNode(found.item, found.tag as any, 0, maxDepth, path.basename(found.file));

      const tagNamePattern = `(\\w+:)?${found.tag}`;
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchPattern = `<${tagNamePattern}[^>]*name="${escapedName}"`;
      const match = found.content.match(new RegExp(searchPattern));

      if (match) {
        const startIdx = match.index!;
        const matchedTag = match[0];
        const prefix = match[1] || '';
        const closingTag = `</${prefix}${found.tag}>`;
        const endIdx = found.content.indexOf(closingTag, startIdx);
        if (endIdx !== -1) {
          node.rawXml = found.content.substring(startIdx, endIdx + closingTag.length);
        } else {
          const selfClosingEnd = found.content.indexOf('/>', startIdx);
          if (selfClosingEnd !== -1 && selfClosingEnd < startIdx + 200) {
            node.rawXml = found.content.substring(startIdx, selfClosingEnd + 2);
          }
        }
      }

      return node;
    }
    return null;
  }

  public async getExample(schemaDirPath: string, name: string, type: 'element' | 'complexType' | 'simpleType', includeOptional: boolean): Promise<string | null> {
    await this.ensureInitialized(schemaDirPath);
    const itemNode = await this.getItem(schemaDirPath, name, type, 40); // Map up to 40 levels for full XML examples
    if (!itemNode) return null;
    return this.exampleGenerator.generateXmlExample(itemNode, 0, includeOptional);
  }

  public async getTopology(schemaDirPath: string, rootNode?: string | null) {
    await this.ensureInitialized(schemaDirPath);
    return this.topologyBuilder.build(rootNode);
  }
}

// Global singleton pattern for Next.js to prevent state loss during hot reloads
const globalForParser = globalThis as unknown as {
  schemaParser: SchemaParser | undefined;
};

export const schemaParser = globalForParser.schemaParser ?? new SchemaParser();

if (process.env.NODE_ENV !== 'production') globalForParser.schemaParser = schemaParser;



