/**
 * remoteResolver.ts
 *
 * A unified entry point for all remote schema discovery operations.
 * Dispatches to the correct provider (GitHub / GitLab) based on the RemoteRepo source,
 * and exposes helpers for parsing user-supplied repository URLs.
 */

import type { RemoteFile, RemoteRepo, RemoteTreeResponse } from '@/types/import';

import {
  fetchGitHubTree,
  parseGitHubUrl,
  resolveGitHubRawUrl,
  GITHUB_BENCHMARK_PRESET,
} from './githubFetcher';

import {
  fetchGitLabTree,
  parseGitLabUrl,
  resolveGitLabRawUrl,
  GITLAB_BENCHMARK_PRESET,
} from './gitlabFetcher';

export { GITHUB_BENCHMARK_PRESET, GITLAB_BENCHMARK_PRESET };

// ─── Presets ─────────────────────────────────────────────────────────────────

/**
 * Built-in presets for known benchmark schema repositories.
 * These are displayed as clickable source cards in the Import Wizard UI (Phase 3).
 */
export const BENCHMARK_PRESETS: { label: string; description: string; repo: RemoteRepo }[] = [
  {
    label: 'UCI Benchmark (GitHub)',
    description: 'Official UCI schema repository hosted on GitHub (modular-af/UCI)',
    repo: GITHUB_BENCHMARK_PRESET,
  },
  {
    label: 'UCI Benchmark (GitLab)',
    description: 'Official UCI schema repository mirrored on GitLab (modular-af/UCI)',
    repo: GITLAB_BENCHMARK_PRESET,
  },
];

// ─── URL Parser ───────────────────────────────────────────────────────────────

/**
 * Attempts to parse a user-provided URL into a RemoteRepo config.
 * Automatically detects whether it is a GitHub or GitLab URL.
 * Returns null if the URL is not recognised.
 */
export function parseRemoteUrl(url: string): RemoteRepo | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'github.com') return parseGitHubUrl(url);
    if (parsed.hostname === 'gitlab.com') return parseGitLabUrl(url);
    return null;
  } catch {
    return null;
  }
}

// ─── Tree Fetcher ─────────────────────────────────────────────────────────────

/**
 * Fetches the list of XSD files available in a remote repository.
 * Dispatches to the correct provider based on repo.source.
 *
 * Tokens are read from environment variables if not passed directly:
 *   - GITHUB_TOKEN  → used for GitHub requests
 *   - GITLAB_TOKEN  → used for GitLab requests
 */
export async function fetchRemoteTree(
  repo: RemoteRepo,
  options: { githubToken?: string; gitlabToken?: string } = {}
): Promise<RemoteTreeResponse> {
  const githubToken = options.githubToken ?? process.env.GITHUB_TOKEN;
  const gitlabToken = options.gitlabToken ?? process.env.GITLAB_TOKEN;

  switch (repo.source) {
    case 'github':
      return fetchGitHubTree(repo, githubToken);
    case 'gitlab':
      return fetchGitLabTree(repo, gitlabToken);
    default:
      throw new Error(`Unknown remote source: ${(repo as RemoteRepo).source}`);
  }
}

// ─── Raw URL Resolver ─────────────────────────────────────────────────────────

/**
 * Resolves the direct download (raw content) URL for a given file
 * in a remote repository. Used to construct download requests for Phase 2.
 */
export function resolveRawUrl(repo: RemoteRepo, filePath: string): string {
  switch (repo.source) {
    case 'github':
      return resolveGitHubRawUrl(repo, filePath);
    case 'gitlab':
      return resolveGitLabRawUrl(repo, filePath);
    default:
      throw new Error(`Unknown remote source: ${(repo as RemoteRepo).source}`);
  }
}

// ─── File Downloader ──────────────────────────────────────────────────────────

/**
 * Downloads the raw content of a single remote file as a Buffer.
 * This is the primitive used by the Phase 2 import service to persist
 * files to the workspace.
 */
export async function downloadRemoteFile(file: RemoteFile): Promise<Buffer> {
  if (!file.rawUrl) {
    throw new Error(`No rawUrl available for file: ${file.path}`);
  }

  const response = await fetch(file.rawUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download ${file.name}: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
