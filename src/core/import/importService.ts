import { XMLValidator } from 'fast-xml-parser';
import { workspaceManager } from '@/core/workspace/workspaceManager';
import { downloadRemoteFile } from './remoteResolver';
import type { RemoteFile } from '@/types/import';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ImportFileStatus = 'pending' | 'downloading' | 'validating' | 'saved' | 'error' | 'skipped';

export interface ImportFileResult {
  path: string;
  name: string;
  status: ImportFileStatus;
  error?: string;
  sizeBytes?: number;
  /** True if a file with this name already existed and was overwritten */
  overwritten?: boolean;
  /** True if the file was auto-renamed to avoid a collision in the batch */
  renamed?: boolean;
  /** The original filename before auto-renaming */
  originalName?: string;
  /** Human-readable reason for skipping or special status */
  reason?: string;
  /** User-indicated intent to overwrite this specific file */
  shouldOverwrite?: boolean;
}

export interface ImportBatchResult {
  results: ImportFileResult[];
  imported: number;
  skipped: number;
  failed: number;
}

export interface ImportOptions {
  /** If true, overwrite files that already exist in the workspace. Defaults to false. */
  overwrite?: boolean;
  /**
   * Optional callback invoked after each file finishes processing.
   * Used by streaming routes to push progress to the client.
   */
  onProgress?: (result: ImportFileResult) => void;
}

// ─── XSD Validation ──────────────────────────────────────────────────────────

/**
 * Validates that the content is well-formed XML and looks like an XSD schema.
 * Returns null on success, or a descriptive error string on failure.
 */
export function validateXsd(content: string): string | null {
  // 1. Well-formed XML check via fast-xml-parser
  const xmlResult = XMLValidator.validate(content, {
    allowBooleanAttributes: true,
  });

  if (xmlResult !== true) {
    return `Malformed XML: ${xmlResult.err.msg} (line ${xmlResult.err.line})`;
  }

  // 2. Basic XSD identity check – must declare the XML Schema namespace
  const hasSchemaDecl =
    content.includes('xmlns:xs="http://www.w3.org/2001/XMLSchema"') ||
    content.includes("xmlns:xs='http://www.w3.org/2001/XMLSchema'") ||
    content.includes('xmlns:xsd="http://www.w3.org/2001/XMLSchema"') ||
    content.includes("xmlns:xsd='http://www.w3.org/2001/XMLSchema'") ||
    content.includes('http://www.w3.org/2001/XMLSchema');

  if (!hasSchemaDecl) {
    return 'File does not appear to be an XML Schema (missing W3C XMLSchema namespace declaration)';
  }

  return null;
}

// ─── Single-file import ───────────────────────────────────────────────────────

/**
 * Downloads, validates, and saves a single remote XSD file to the workspace.
 * Returns a detailed result object describing what happened.
 */
export async function importRemoteFile(
  file: RemoteFile,
  options: ImportOptions = {}
): Promise<ImportFileResult> {
  const result: ImportFileResult = {
    path: file.path,
    name: file.name,
    originalName: file.originalName,
    renamed: file.renamed,
    status: 'pending',
  };

  // ── Overwrite guard ────────────────────────────────────────────────────────
  const existing = workspaceManager.getFiles();
  const alreadyExists = existing.some(f => f.name === file.name);
  const skipBecauseExists = alreadyExists && !options.overwrite && !file.shouldOverwrite;

  if (skipBecauseExists) {
    result.status = 'skipped';
    result.overwritten = false;
    result.reason = 'Already exists (overwrite disabled)';
    options.onProgress?.(result);
    return result;
  }

  // ── Download ───────────────────────────────────────────────────────────────
  result.status = 'downloading';
  options.onProgress?.(result);

  let buffer: Buffer;
  try {
    buffer = await downloadRemoteFile(file);
    result.sizeBytes = buffer.length;
  } catch (err: any) {
    result.status = 'error';
    result.error = err?.message ?? 'Download failed';
    options.onProgress?.(result);
    return result;
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  result.status = 'validating';
  options.onProgress?.(result);

  const validationError = validateXsd(buffer.toString('utf-8'));
  if (validationError) {
    result.status = 'error';
    result.error = validationError;
    options.onProgress?.(result);
    return result;
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  try {
    workspaceManager.addFile(file.name, buffer, 'remote', file.rawUrl);
    result.status = 'saved';
    result.overwritten = alreadyExists;
  } catch (err: any) {
    result.status = 'error';
    result.error = err?.message ?? 'Failed to save file to workspace';
  }

  options.onProgress?.(result);
  return result;
}

// ─── Batch import ─────────────────────────────────────────────────────────────

/**
 * Imports a batch of remote XSD files into the workspace.
 * Files are processed sequentially to avoid overwhelming remote APIs.
 *
 * @param files     - List of remote files to import (from Phase 1 tree fetcher)
 * @param options   - Import options (overwrite, progress callback)
 * @returns         - Aggregated batch result
 */
export async function importRemoteFiles(
  files: RemoteFile[],
  options: ImportOptions = {}
): Promise<ImportBatchResult> {
  const results: ImportFileResult[] = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  // ── Detect internal collisions ───────────────────────────────────────────
  // Pass original files through. Collisions will be handled by options.overwrite
  const processedFiles = files.map(f => ({ 
    ...f, 
    originalName: f.originalName ?? f.name 
  }));

  for (const file of processedFiles) {
    const result = await importRemoteFile(file, options);
    results.push(result);

    if (result.status === 'saved') imported++;
    else if (result.status === 'skipped') skipped++;
    else if (result.status === 'error') failed++;
  }

  return { results, imported, skipped, failed };
}
