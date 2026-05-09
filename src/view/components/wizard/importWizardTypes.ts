import type { RemoteFile } from '@/types/import';
import type { ImportFileResult } from '@/core/import/importService';

// ─── Wizard Step ──────────────────────────────────────────────────────────────
export type WizardStep = 'source' | 'explore' | 'import';

// ─── Source Config ────────────────────────────────────────────────────────────
export interface WizardSource {
  id: string;
  label: string;
  description: string;
  url: string;
  provider: 'github' | 'gitlab';
  branch: string;
}

export const FEATURED_SOURCES: WizardSource[] = [
  {
    id: 'github',
    provider: 'github',
    label: 'UCI Benchmark (GitHub)',
    description: 'Reference modular-af/UCI repository on GitHub',
    url: 'https://github.com/modular-af/UCI',
    branch: 'main'
  },
  {
    id: 'gitlab',
    provider: 'gitlab',
    label: 'UCI Benchmark (GitLab)',
    description: 'Reference modular-af/UCI repository on GitLab',
    url: 'https://gitlab.com/modular-af/UCI',
    branch: 'main'
  },
];

// ─── Wizard State ─────────────────────────────────────────────────────────────
export interface WizardState {
  step: WizardStep;
  source: WizardSource | null;
  customUrl: string;
  remoteFiles: RemoteFile[];
  selectedPaths: Set<string>;
  expandedPaths: Set<string>;
  loadingTree: boolean;
  treeError: string | null;
  overwrite: boolean;
  importResults: ImportFileResult[];
  importDone: boolean;
  importSummary: { imported: number; skipped: number; failed: number } | null;
  /** True if we are pausing to let user resolve collisions */
  reviewMode: boolean;
  /** Files already in the workspace to check for collisions */
  existingFiles: string[];
}

export function initialWizardState(): WizardState {
  return {
    step: 'source',
    source: null,
    customUrl: '',
    remoteFiles: [],
    selectedPaths: new Set(),
    expandedPaths: new Set(),
    loadingTree: false,
    treeError: null,
    overwrite: false,
    importResults: [],
    importDone: false,
    importSummary: null,
    reviewMode: false,
    existingFiles: [],
  };
}
