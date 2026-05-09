'use client';

import { useState, useCallback } from 'react';
import { initialWizardState } from '@/view/components/wizard/importWizardTypes';
import type { WizardSource, WizardState } from '@/view/components/wizard/importWizardTypes';
import type { RemoteFile } from '@/types/import';
import type { ImportFileResult } from '@/core/import/importService';

async function fetchTree(sourceId: string, customUrl?: string): Promise<RemoteFile[]> {
  const src = customUrl ? encodeURIComponent(customUrl) : sourceId;
  const res = await fetch(`/api/workspace/remote-tree?source=${src}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Server error ${res.status}`);
  }
  const data = await res.json();
  return data.files as RemoteFile[];
}

export const useImportWizard = (onImportComplete?: () => void) => {
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const loadTree = useCallback(async (sourceId: string, src: WizardSource | null, customUrl?: string) => {
    setLoadingPreset(sourceId);
    setState(s => ({ ...s, treeError: null, remoteFiles: [], selectedPaths: new Set() }));
    try {
      const files = await fetchTree(sourceId, customUrl);
      const initialSelected = new Set<string>();
      const initialExpanded = new Set<string>();
      const defaultKeywords = ['MessageDefinitions', 'SecurityMarkings', 'Versioning'];

      const dirCounts: Record<string, number> = {};
      files.forEach(f => {
        const dir = f.path.substring(0, f.path.lastIndexOf('/')) || '/';
        dirCounts[dir] = (dirCounts[dir] || 0) + 1;
      });

      const groups: Record<string, RemoteFile[]> = {};
      files.forEach(f => {
        const hasKeyword = defaultKeywords.some(k => f.path.includes(k));
        const isTemplate = f.path.includes('Template');
        if (hasKeyword && !isTemplate) {
          if (!groups[f.name]) groups[f.name] = [];
          groups[f.name].push(f);
        }
      });

      Object.values(groups).forEach(candidates => {
        candidates.sort((a, b) => {
          const dirA = a.path.substring(0, a.path.lastIndexOf('/')) || '/';
          const dirB = b.path.substring(0, b.path.lastIndexOf('/')) || '/';
          return dirCounts[dirA] - dirCounts[dirB];
        });
        
        const winner = candidates[0];
        initialSelected.add(winner.path);
        
        const parts = winner.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          initialExpanded.add(parts.slice(0, i).join('/'));
        }
      });

      setState(s => ({
        ...s,
        step: 'explore',
        source: src,
        remoteFiles: files,
        selectedPaths: initialSelected,
        expandedPaths: initialExpanded,
        treeError: null,
      }));
    } catch (err: any) {
      setState(s => ({ ...s, treeError: err?.message ?? 'Failed to load remote tree' }));
    } finally {
      setLoadingPreset(null);
    }
  }, []);

  const handleSelectPreset = useCallback((src: WizardSource) => {
    setState(s => ({ ...s, source: src }));
    loadTree(src.id, src);
  }, [loadTree]);

  const handleCustomUrlChange = useCallback((url: string) => {
    setState(s => ({ ...s, customUrl: url }));
  }, []);

  const handleCustomUrlSubmit = useCallback(() => {
    const url = state.customUrl.trim();
    if (!url) return;
    loadTree('custom', null, url);
  }, [state.customUrl, loadTree]);

  const handleToggle = useCallback((path: string) => {
    setState(s => {
      const next = new Set(s.selectedPaths);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return { ...s, selectedPaths: next };
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setState(s => {
      const allSelected = s.remoteFiles.every(f => s.selectedPaths.has(f.path));
      return {
        ...s,
        selectedPaths: allSelected
          ? new Set()
          : new Set(s.remoteFiles.map(f => f.path)),
      };
    });
  }, []);

  const handleToggleExpand = useCallback((path: string) => {
    setState(s => {
      const next = new Set(s.expandedPaths);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return { ...s, expandedPaths: next };
    });
  }, []);

  const handleBack = useCallback(() => {
    setState(s => ({ ...s, step: 'source', treeError: null }));
  }, []);

  const runImport = useCallback(async (forceOverwrite?: boolean) => {
    const selected = Array.from(state.selectedPaths);
    if (selected.length === 0) return;

    let existing: string[] = state.existingFiles;
    if (existing.length === 0) {
      try {
        const res = await fetch('/api/workspace/files');
        const data = await res.json();
        existing = data.map((f: any) => f.name);
      } catch (err) {
        console.error('Failed to fetch existing files:', err);
      }
    }

    const selectedFiles = state.remoteFiles.filter(f => state.selectedPaths.has(f.path));
    const seenInBatch = new Set<string>();
    let hasCollisions = false;

    const initialResults: ImportFileResult[] = selectedFiles.map(f => {
      const isInternalCollision = seenInBatch.has(f.name);
      const isWorkspaceCollision = existing.includes(f.name);
      
      if (isInternalCollision || isWorkspaceCollision) {
        hasCollisions = true;
      }
      
      seenInBatch.add(f.name);
      return { 
        path: f.path, 
        name: f.name, 
        originalName: f.name,
        renamed: false,
        status: 'pending',
        reason: isInternalCollision ? 'Duplicate in batch' : isWorkspaceCollision ? 'Already in workspace' : undefined
      };
    });

    const isOverwrite = forceOverwrite ?? state.overwrite;
    const needsReview = hasCollisions && !isOverwrite && !state.reviewMode;

    if (needsReview) {
      setState(s => ({
        ...s,
        step: 'import',
        importResults: initialResults,
        existingFiles: existing,
        reviewMode: true,
        importDone: false,
        importSummary: null
      }));
      return;
    }

    const currentResults = state.reviewMode ? state.importResults : initialResults;

    setState(s => ({
      ...s,
      step: 'import',
      importResults: currentResults,
      existingFiles: existing,
      importDone: false,
      importSummary: null,
      overwrite: isOverwrite,
      reviewMode: false
    }));

    const sourceId = state.source?.id ?? 'custom';
    const customUrl = !state.source ? state.customUrl : undefined;

    try {
      const body: Record<string, unknown> = {
        source: customUrl ?? sourceId,
        fileMappings: currentResults.map(r => ({
          path: r.path,
          name: r.name,
          shouldOverwrite: !!r.shouldOverwrite
        })),
        overwrite: forceOverwrite ?? state.overwrite,
      };

      const res = await fetch('/api/workspace/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.body) throw new Error('No stream body received');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'progress') {
              setState(s => ({
                ...s,
                importResults: s.importResults.map(r =>
                  r.path === event.result.path ? { ...r, ...event.result } : r
                ) as ImportFileResult[],
              }));
            } else if (event.type === 'complete') {
              setState(s => ({
                ...s,
                importDone: true,
                importSummary: {
                  imported: event.imported,
                  skipped: event.skipped,
                  failed: event.failed,
                },
              }));
              if (onImportComplete) {
                onImportComplete();
              }
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch {
            // malformed line
          }
        }
      }

      setState(s => {
        if (s.importDone) return s;
        return {
          ...s,
          importDone: true,
          importSummary: s.importSummary || { imported: 0, skipped: 0, failed: s.importResults.length }
        };
      });
    } catch (err: any) {
      setState(s => ({
        ...s,
        importDone: true,
        importResults: s.importResults.map(r =>
          r.status === 'pending' || r.status === 'downloading' || r.status === 'validating'
            ? { ...r, status: 'error', error: err?.message ?? 'Import failed' }
            : r
        ),
        importSummary: {
          imported: s.importResults.filter(r => r.status === 'saved').length,
          skipped: s.importResults.filter(r => r.status === 'skipped').length,
          failed: s.importResults.filter(r => r.status !== 'saved' && r.status !== 'skipped').length,
        },
      }));
    }
  }, [state, onImportComplete]);

  const updateResultName = useCallback((path: string, newName: string) => {
    const targetName = newName.trim();
    setState(s => ({
      ...s,
      importResults: s.importResults.map(r => 
        r.path === path ? { ...r, name: targetName, renamed: targetName !== r.originalName } : r
      )
    }));
  }, []);

  const toggleResultOverwrite = useCallback((path: string) => {
    setState(s => ({
      ...s,
      importResults: s.importResults.map(r => {
        if (r.path !== path) return r;
        const nextOverwrite = !r.shouldOverwrite;
        return { 
          ...r, 
          shouldOverwrite: nextOverwrite,
          name: (nextOverwrite ? r.originalName : r.name) || r.name,
          renamed: nextOverwrite ? false : r.renamed
        };
      })
    }));
  }, []);

  const handleRetry = useCallback(() => {
    setState(s => ({
      ...s,
      step: 'explore',
      importResults: [],
      importDone: false,
      importSummary: null,
    }));
  }, []);

  return {
    state,
    loadingPreset,
    handleSelectPreset,
    handleCustomUrlChange,
    handleCustomUrlSubmit,
    handleToggle,
    handleToggleAll,
    handleToggleExpand,
    handleBack,
    runImport,
    updateResultName,
    toggleResultOverwrite,
    handleRetry
  };
};
