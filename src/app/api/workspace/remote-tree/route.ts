import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteTree, parseRemoteUrl, BENCHMARK_PRESETS } from '@/core/import/remoteResolver';
import { GITHUB_BENCHMARK_PRESET } from '@/core/import/githubFetcher';
import { GITLAB_BENCHMARK_PRESET } from '@/core/import/gitlabFetcher';
import type { RemoteRepo } from '@/types/import';

/**
 * GET /api/item/remote-tree
 *
 * Fetches the list of XSD files from a remote repository.
 *
 * Query parameters:
 *   source   - 'github' | 'gitlab' | a full repository URL
 *   owner    - (optional) repository owner  [ignored if source is a URL]
 *   repo     - (optional) repository name   [ignored if source is a URL]
 *   branch   - (optional) branch name       [defaults to 'main']
 *
 * Examples:
 *   GET /api/item/remote-tree?source=github               → UCI GitHub preset
 *   GET /api/item/remote-tree?source=gitlab               → UCI GitLab preset
 *   GET /api/item/remote-tree?source=https://github.com/org/repo
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get('source') ?? 'github';

  let repo: RemoteRepo | null = null;

  // Resolve the repo config from the query string
  if (source === 'github') {
    repo = GITHUB_BENCHMARK_PRESET;
  } else if (source === 'gitlab') {
    repo = GITLAB_BENCHMARK_PRESET;
  } else {
    // Try to parse as a full URL
    repo = parseRemoteUrl(source);
    if (!repo) {
      return NextResponse.json(
        { error: `Unrecognised source: "${source}". Provide 'github', 'gitlab', or a full repository URL.` },
        { status: 400 }
      );
    }
  }

  // Allow overriding owner/repo/branch via explicit query params
  const owner = searchParams.get('owner');
  const repoName = searchParams.get('repo');
  const branch = searchParams.get('branch');
  if (owner) repo = { ...repo, owner };
  if (repoName) repo = { ...repo, repo: repoName };
  if (branch) repo = { ...repo, branch };

  try {
    const result = await fetchRemoteTree(repo);
    return NextResponse.json({
      repo,
      ...result,
    });
  } catch (err: any) {
    const message = err?.message ?? 'Unknown error fetching remote tree';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * GET /api/item/remote-tree?presets=true
 *
 * Returns the list of built-in UCI preset configurations.
 * Used by the Import Wizard UI to populate source cards.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ presets: BENCHMARK_PRESETS });
}
