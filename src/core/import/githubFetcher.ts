import type { RemoteFile, RemoteRepo, RemoteTreeResponse } from '@/types/import';

/**
 * Default benchmark repository configuration for GitHub.
 * Uses the recursive=1 tree API to retrieve the full repo listing in one request.
 */
export const GITHUB_BENCHMARK_PRESET: RemoteRepo = {
  owner: 'modular-af',
  repo: 'UCI',
  branch: 'main',
  source: 'github',
};

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Parses a GitHub URL into a RemoteRepo config.
 * Accepts URLs of the form: https://github.com/{owner}/{repo}[/tree/{branch}]
 */
export function parseGitHubUrl(url: string): RemoteRepo | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;

    const parts = parsed.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
    if (parts.length < 2) return null;

    const [owner, repo, , branch] = parts;
    return {
      owner,
      repo,
      branch: branch || 'main',
      source: 'github',
    };
  } catch {
    return null;
  }
}

/**
 * Fetches the full recursive file tree for a GitHub repository.
 * Uses: GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
 *
 * The response is filtered to only include .xsd blob entries.
 * If the tree is too large, GitHub may truncate it (truncated: true).
 */
export async function fetchGitHubTree(
  repo: RemoteRepo,
  githubToken?: string
): Promise<RemoteTreeResponse> {
  const { owner, repo: repoName, branch } = repo;

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`;

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }

  const response = await fetch(url, { headers, next: { revalidate: 300 } });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `GitHub repository not found: ${owner}/${repoName}@${branch}. ` +
        `Check that the repository is public and the branch name is correct.`
      );
    }
    if (response.status === 403 || response.status === 429) {
      throw new Error(
        `GitHub API rate limit exceeded. ` +
        `Consider setting a GITHUB_TOKEN environment variable to increase your quota.`
      );
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const files: RemoteFile[] = (data.tree || [])
    .filter((item: any) => item.type === 'blob' && item.path.toLowerCase().endsWith('.xsd'))
    .map((item: any): RemoteFile => ({
      path: item.path,
      name: item.path.split('/').pop() ?? item.path,
      type: 'blob',
      size: item.size,
      rawUrl: resolveGitHubRawUrl(repo, item.path),
    }));

  return {
    files,
    truncated: data.truncated ?? false,
  };
}

/**
 * Generates the raw content URL for a specific file in a GitHub repository.
 * Format: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
 */
export function resolveGitHubRawUrl(repo: RemoteRepo, filePath: string): string {
  const { owner, repo: repoName, branch } = repo;
  return `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${filePath}`;
}
