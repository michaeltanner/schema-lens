import { NextRequest, NextResponse } from 'next/server';
import { schemaParser } from '@/core/parser/schemaParser';
import { workspaceManager } from '@/core/workspace/workspaceManager';
import { parseRemoteUrl, fetchRemoteTree } from '@/core/import/remoteResolver';
import { importRemoteFiles } from '@/core/import/importService';
import { GITHUB_BENCHMARK_PRESET } from '@/core/import/githubFetcher';
import { GITLAB_BENCHMARK_PRESET } from '@/core/import/gitlabFetcher';
import type { RemoteRepo, RemoteFile } from '@/types/import';
import type { ImportFileResult } from '@/core/import/importService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/schema/import
 *
 * Imports one or more remote XSD files into the workspace.
 * Streams progress back to the client as NDJSON (newline-delimited JSON),
 * one JSON object per file, followed by a final summary line.
 *
 * Request body (JSON):
 * {
 *   source:    'github' | 'gitlab' | '<full repo URL>',
 *   owner?:    string,          // overrides preset owner
 *   repo?:     string,          // overrides preset repo name
 *   branch?:   string,          // overrides preset branch
 *   files:     string[],        // paths of selected files (from /api/schema/remote-tree)
 *   overwrite: boolean          // whether to overwrite existing workspace files
 * }
 *
 * Stream format (one JSON per line):
 *   { type: 'progress', result: ImportFileResult }
 *   { type: 'complete', imported: number, skipped: number, failed: number }
 *   { type: 'error',    message: string }
 */
export async function POST(request: NextRequest) {
  let body: {
    source?: string;
    owner?: string;
    repo?: string;
    branch?: string;
    files?: string[];
    fileMappings?: Array<{ path: string; name?: string; shouldOverwrite?: boolean }>;
    overwrite?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { source = 'github', fileMappings, files: selectedPaths, overwrite = false } = body;

  // ── Resolve repository config ──────────────────────────────────────────────
  let repoConfig: RemoteRepo | null = null;

  if (source === 'github') {
    repoConfig = GITHUB_BENCHMARK_PRESET;
  } else if (source === 'gitlab') {
    repoConfig = GITLAB_BENCHMARK_PRESET;
  } else {
    repoConfig = parseRemoteUrl(source);
    if (!repoConfig) {
      return NextResponse.json(
        { error: `Unrecognised source: "${source}". Provide 'github', 'gitlab', or a full repository URL.` },
        { status: 400 }
      );
    }
  }

  // Apply any explicit overrides from the request body
  if (body.owner) repoConfig = { ...repoConfig, owner: body.owner };
  if (body.repo)  repoConfig = { ...repoConfig, repo: body.repo };
  if (body.branch) repoConfig = { ...repoConfig, branch: body.branch };

  // ── Resolve file list ──────────────────────────────────────────────────────
  // If the caller sends specific paths, use them.
  // Otherwise, fetch the full tree and import everything.
  let filesToImport: RemoteFile[];

  try {
    const tree = await fetchRemoteTree(repoConfig);

    if (fileMappings && Array.isArray(fileMappings)) {
      const mappingMap = new Map();
      for (const m of fileMappings) {
        if (m.path) mappingMap.set(normalizePath(m.path), m);
      }

      filesToImport = tree.files
        .filter(f => mappingMap.has(normalizePath(f.path)))
        .map(f => {
          const mapping = mappingMap.get(normalizePath(f.path));
          const targetName = mapping?.name || f.name;
          
          return {
            ...f,
            name: targetName,
            originalName: f.name,
            renamed: targetName !== f.name,
            shouldOverwrite: !!mapping?.shouldOverwrite
          };
        });
    } else if (selectedPaths && selectedPaths.length > 0) {
      const selectedSet = new Set(selectedPaths.map(p => normalizePath(p)));
      filesToImport = tree.files.filter(f => selectedSet.has(normalizePath(f.path)));
    } else {
      return NextResponse.json({ error: 'No files selected' }, { status: 400 });
    }

    if (filesToImport.length === 0) {
      return NextResponse.json({ error: 'Files not found' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to fetch remote file tree' },
      { status: 502 }
    );
  }

  // ── Stream progress via NDJSON ─────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const push = (obj: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      try {
        const batchResult = await importRemoteFiles(filesToImport, {
          overwrite,
          onProgress: (result: ImportFileResult) => {
            push({ type: 'progress', result });
          },
        });

        // Trigger schema re-index after all files are written
        schemaParser.reset();

        // ── Record in Manifest (Phase 4) ───────────────────────────────────
        const successfulPaths = batchResult.results
          .filter(r => r.status === 'saved')
          .map(r => r.path);

        if (successfulPaths.length > 0) {
          workspaceManager.recordImport(source, repoConfig, successfulPaths);
        }

        push({
          type: 'complete',
          imported: batchResult.imported,
          skipped: batchResult.skipped,
          failed: batchResult.failed,
        });
      } catch (err: any) {
        push({ type: 'error', message: err?.message ?? 'Import failed unexpectedly' });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no', // Disable nginx response buffering for real-time streaming
    },
  });
}

/**
 * GET /api/schema/import
 *
 * Health check / capability endpoint.
 * Returns a list of supported sources so the UI can populate its source picker.
 */
export async function GET() {
  return NextResponse.json({
    supportedSources: ['github', 'gitlab', 'custom-url'],
    presets: [
      { id: 'github', label: 'UCI (GitHub)', url: 'https://github.com/modular-af/UCI' },
      { id: 'gitlab', label: 'UCI (GitLab)', url: 'https://gitlab.com/modular-af/UCI' },
    ],
  });
}

function normalizePath(p: string): string {
  if (!p) return '';
  return p.toLowerCase().replace(/^\/+/, '').replace(/\\/g, '/').trim();
}
