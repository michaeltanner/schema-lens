export type RemoteSourceType = 'github' | 'gitlab';

export interface RemoteFile {
  path: string;
  name: string;
  type: 'blob' | 'tree';
  size?: number;
  rawUrl?: string;
  originalName?: string;
  renamed?: boolean;
  shouldOverwrite?: boolean;
}

export interface RemoteRepo {
  owner: string;
  repo: string;
  branch: string;
  source: RemoteSourceType;
}

export interface RemoteTreeResponse {
  files: RemoteFile[];
  truncated: boolean;
}
