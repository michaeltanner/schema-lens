import type { RemoteFile, RemoteRepo, RemoteTreeResponse } from '@/types/import';

/**
 * Default benchmark repository configuration for GitLab.
 * Uses GitLab's repository tree API with recursive=true.
 */
export const GITLAB_BENCHMARK_PRESET: RemoteRepo = {
  owner: 'modular-af',
  repo: 'UCI',
  branch: 'main',
  source: 'gitlab',
};

const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

/**
 * Parses a GitLab URL into a RemoteRepo config.
 * Accepts URLs of the form: https://gitlab.com/{owner}/{repo}[/-/tree/{branch}]
 */
export function parseGitLabUrl(url: string): RemoteRepo | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'gitlab.com') return null;

    // GitLab paths can be: /owner/repo or /owner/repo/-/tree/branch
    const parts = parsed.pathname
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .split('/')
      .filter(p => p !== '-' && p !== 'tree');

    if (parts.length < 2) return null;

    const [owner, repo, branch] = parts;
    return {
      owner,
      repo,
      branch: branch || 'main',
      source: 'gitlab',
    };
  } catch {
    return null;
  }
}

/**
 * Fetches the full recursive file tree from a GitLab repository.
 * Uses: GET /projects/{id}/repository/tree?recursive=true&per_page=100
 *
 * GitLab paginates results, so we loop through all pages.
 * The project ID is derived from the URL-encoded namespace/repo path.
 * Results are filtered to only include .xsd blob entries.
 */
export async function fetchGitLabTree(
  repo: RemoteRepo,
  gitlabToken?: string
): Promise<RemoteTreeResponse> {
  const { owner, repo: repoName, branch } = repo;

  // GitLab project ID can be specified as the URL-encoded namespace/path
  const projectId = encodeURIComponent(`${owner}/${repoName}`);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (gitlabToken) {
    headers['PRIVATE-TOKEN'] = gitlabToken;
  }

  const files: RemoteFile[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url =
      `${GITLAB_API_BASE}/projects/${projectId}/repository/tree` +
      `?recursive=true&ref=${branch}&per_page=100&page=${page}`;

    const response = await fetch(url, { headers, next: { revalidate: 300 } });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `GitLab repository not found: ${owner}/${repoName}@${branch}. ` +
          `Check that the repository is public and the branch name is correct.`
        );
      }
      if (response.status === 429) {
        throw new Error(
          `GitLab API rate limit exceeded. ` +
          `Consider setting a GITLAB_TOKEN environment variable to increase your quota.`
        );
      }
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    const items: any[] = await response.json();

    for (const item of items) {
      if (item.type === 'blob' && item.path.toLowerCase().endsWith('.xsd')) {
        files.push({
          path: item.path,
          name: item.name ?? item.path.split('/').pop() ?? item.path,
          type: 'blob',
          rawUrl: resolveGitLabRawUrl(repo, item.path),
        });
      }
    }

    // Check if there's a next page via the x-next-page header
    const nextPage = response.headers.get('x-next-page');
    hasMore = !!nextPage && nextPage !== '';
    page++;

    // Safety cap to avoid runaway pagination
    if (page > 50) break;
  }

  return {
    files,
    truncated: false,
  };
}

/**
 * Generates the raw content URL for a specific file in a GitLab repository.
 * Format: https://gitlab.com/{owner}/{repo}/-/raw/{branch}/{path}
 */
export function resolveGitLabRawUrl(repo: RemoteRepo, filePath: string): string {
  const { owner, repo: repoName, branch } = repo;
  return `https://gitlab.com/${owner}/${repoName}/-/raw/${branch}/${filePath}`;
}
