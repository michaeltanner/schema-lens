import fs from 'fs';
import path from 'path';

export interface WorkspaceFile {
  enabled: boolean;
  source: 'project' | 'upload' | 'remote';
  name: string;
  size: number;
  modified: Date;
}

export interface WorkspaceManifest {
  files: Record<string, { enabled: boolean; source: 'project' | 'upload' | 'remote'; remoteUrl?: string }>;
  bootstrapped: boolean;
}

export class WorkspaceManager {
  private workspaceRoot: string;
  private schemaDir: string;
  private manifestPath: string;
  private importManifestPath: string;
  private projectSchemaDir: string;

  constructor() {
    // Use an absolute path relative to the project root
    this.workspaceRoot = path.resolve(process.cwd(), '.schemalens-workspace');
    this.schemaDir = path.join(this.workspaceRoot, 'schemas');
    this.manifestPath = path.join(this.workspaceRoot, 'manifest.json');
    this.importManifestPath = path.join(this.schemaDir, 'import-manifest.json');
    this.projectSchemaDir = path.resolve(process.cwd(), 'schema');

    this.ensureDirectoryStructure();
  }

  public sanitizeName(name: string): string {
    // 1. Strip both types of slashes for better cross-platform compatibility
    const base = path.win32.basename(name);
    // 2. Remove any null bytes, control characters, or potentially dangerous sequences
    return base.replace(/[\x00-\x1F\x7F]/g, '').replace(/[<>:"|?*]/g, '_');
  }

  private getSafePath(name: string): string {
    const safeName = this.sanitizeName(name);
    const unsafePath = path.join(this.schemaDir, safeName);
    const safePath = path.resolve(unsafePath);
    const baseDir = path.resolve(this.schemaDir);
    
    // Ensure the resolved path is strictly within the schema directory
    if (!safePath.startsWith(baseDir + path.sep) && safePath !== baseDir) {
      throw new Error(`Security Error: Path traversal attempt detected for '${name}'`);
    }
    return safePath;
  }

  private ensureDirectoryStructure() {
    if (!fs.existsSync(this.workspaceRoot)) {
      fs.mkdirSync(this.workspaceRoot, { recursive: true });
    }
    if (!fs.existsSync(this.schemaDir)) {
      fs.mkdirSync(this.schemaDir, { recursive: true });
    }
    if (!fs.existsSync(this.manifestPath)) {
      this.saveManifest({ files: {}, bootstrapped: false });
    }
  }

  public bootstrap(force: boolean = false) {
    const manifest = this.getManifest();

    // Only bootstrap if it hasn't been done yet or force is true
    if (!manifest.bootstrapped || force) {
      if (force) {
        // Clear directory if forcing
        if (fs.existsSync(this.schemaDir)) {
          fs.rmSync(this.schemaDir, { recursive: true, force: true });
          fs.mkdirSync(this.schemaDir, { recursive: true });
        }
        manifest.files = {};
      }

      if (fs.existsSync(this.projectSchemaDir)) {
        const files = fs.readdirSync(this.projectSchemaDir).filter(f => f.endsWith('.xsd'));
        for (const file of files) {
          const src = path.join(this.projectSchemaDir, file);
          const dest = path.join(this.schemaDir, file);
          fs.copyFileSync(src, dest);

          manifest.files[file] = { enabled: true, source: 'project' };
        }
      }

      manifest.bootstrapped = true;
      this.saveManifest(manifest);
    }
  }

  public getManifest(): WorkspaceManifest {
    try {
      if (!fs.existsSync(this.manifestPath)) return { files: {}, bootstrapped: false };
      const content = fs.readFileSync(this.manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return { files: {}, bootstrapped: false };
    }
  }

  private saveManifest(manifest: WorkspaceManifest) {
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  public getFiles(): WorkspaceFile[] {
    this.bootstrap(false); // Ensure we have files
    const manifest = this.getManifest();

    if (!fs.existsSync(this.schemaDir)) return [];
    const diskFiles = fs.readdirSync(this.schemaDir).filter(f => f.endsWith('.xsd'));

    return diskFiles.map(f => {
      const stats = fs.statSync(path.join(this.schemaDir, f));
      const entry = manifest.files[f] || { enabled: true, source: 'upload' };
      return {
        name: f,
        enabled: entry.enabled,
        source: entry.source,
        remoteUrl: entry.remoteUrl,
        size: stats.size,
        modified: stats.mtime
      };
    });
  }

  public toggleFile(name: string, enabled: boolean) {
    const safeName = this.sanitizeName(name);
    const manifest = this.getManifest();
    if (manifest.files[safeName]) {
      manifest.files[safeName].enabled = enabled;
    } else {
      manifest.files[safeName] = { enabled, source: 'upload' };
    }
    this.saveManifest(manifest);
  }

  public addFile(name: string, buffer: Buffer, source: 'upload' | 'remote' = 'upload', remoteUrl?: string) {
    const safePath = this.getSafePath(name);
    const safeName = path.basename(safePath);
    
    fs.writeFileSync(safePath, buffer);

    const manifest = this.getManifest();
    manifest.files[safeName] = { enabled: true, source, remoteUrl };
    this.saveManifest(manifest);
  }

  public deleteFile(name: string) {
    const safePath = this.getSafePath(name);
    const safeName = path.basename(safePath);
    
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }

    const manifest = this.getManifest();
    delete manifest.files[safeName];
    this.saveManifest(manifest);
  }

  public deleteAllFiles(): void {
    if (fs.existsSync(this.schemaDir)) {
      fs.rmSync(this.schemaDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.schemaDir, { recursive: true });
    this.saveManifest({ files: {}, bootstrapped: true });
    this.saveImportManifest({ sources: {} });
  }

  public getFileContent(name: string): Buffer | null {
    const safePath = this.getSafePath(name);
    if (fs.existsSync(safePath)) {
      return fs.readFileSync(safePath);
    }
    return null;
  }

  public resolvePath(p: string): string {
    return path.resolve(p).toLowerCase();
  }

  public isWorkspacePath(p: string): boolean {
    const resolvedP = this.resolvePath(p);
    const resolvedSchemaDir = this.resolvePath(this.schemaDir);
    return resolvedP === resolvedSchemaDir ||
      resolvedP === resolvedSchemaDir + path.sep ||
      resolvedP + path.sep === resolvedSchemaDir;
  }

  public getSchemaDir(): string {
    return this.schemaDir;
  }

  public getEnabledFiles(): string[] {
    this.bootstrap(false); // Ensure we have files
    const manifest = this.getManifest();
    return Object.entries(manifest.files)
      .filter(([_, config]) => config.enabled)
      .map(([name]) => path.join(this.schemaDir, name))
      .filter(p => fs.existsSync(p));
  }

  // ─── Import Manifest (Phase 4) ─────────────────────────────────────────────

  public getImportManifest(): any {
    try {
      if (!fs.existsSync(this.importManifestPath)) return { sources: {} };
      const content = fs.readFileSync(this.importManifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return { sources: {} };
    }
  }

  public saveImportManifest(manifest: any) {
    fs.writeFileSync(this.importManifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Records a successful import in the import-manifest.json.
   * This allows the system to know where files came from and check for updates.
   */
  public recordImport(sourceId: string, repoConfig: any, importedFiles: string[]) {
    const manifest = this.getImportManifest();
    const now = new Date().toISOString();

    // Group by source unique identifier
    const key = sourceId === 'custom' ? repoConfig.owner + '/' + repoConfig.repo : sourceId;

    if (!manifest.sources[key]) {
      manifest.sources[key] = {
        id: sourceId,
        repo: repoConfig,
        firstImport: now,
        lastImport: now,
        files: []
      };
    } else {
      manifest.sources[key].lastImport = now;
      manifest.sources[key].repo = repoConfig; // Update in case branch changed
    }

    // Merge file lists, avoiding duplicates
    const currentFiles = new Set(manifest.sources[key].files);
    importedFiles.forEach(f => currentFiles.add(f));
    manifest.sources[key].files = Array.from(currentFiles);

    this.saveImportManifest(manifest);
  }
}

// Global singleton pattern for Next.js
const globalForWorkspace = globalThis as unknown as {
  workspaceManager: WorkspaceManager | undefined;
};

export const workspaceManager = globalForWorkspace.workspaceManager ?? new WorkspaceManager();

if (process.env.NODE_ENV !== 'production') globalForWorkspace.workspaceManager = workspaceManager;
