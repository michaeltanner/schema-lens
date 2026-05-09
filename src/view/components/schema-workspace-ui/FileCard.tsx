import React from 'react';
import { Eye, EyeOff, ExternalLink, Download, CloudDownload, Trash2 } from 'lucide-react';

interface WorkspaceFile {
  name: string;
  size: number;
  modified: string;
  enabled: boolean;
  source: 'project' | 'upload' | 'remote';
  remoteUrl?: string;
}

interface FileCardProps {
  file: WorkspaceFile;
  onToggle: (name: string, enabled: boolean) => void;
  onDelete: (name: string) => void;
  onDownload: (name: string) => void;
  onView: (name: string) => void;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileCard: React.FC<FileCardProps> = ({ 
  file, 
  onToggle, 
  onDelete, 
  onDownload, 
  onView 
}) => {
  return (
    <div className={`file-card ${!file.enabled ? 'disabled' : ''}`}>
      <div className="file-info">
        <button 
          className={`toggle-state-btn ${file.enabled ? 'enabled' : 'disabled'}`}
          onClick={() => onToggle(file.name, !file.enabled)}
          title={file.enabled ? 'Unload Schema' : 'Load Schema'}
        >
          {file.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <div className="file-details">
          <div className="name-row">
            <span className="file-name" title={file.name}>{file.name}</span>
            <span className={`source-tag ${file.source}`}>{file.source}</span>
          </div>
          <span className="file-meta">
            {formatSize(file.size)} • {new Date(file.modified).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="card-actions">
        <button 
          className="view-btn" 
          onClick={() => onView(file.name)}
          title="View Source in New Tab"
        >
          <ExternalLink size={14} />
        </button>
        <button 
          className="download-btn" 
          onClick={() => onDownload(file.name)}
          title="Download File"
        >
          <Download size={14} />
        </button>
        {file.source === 'remote' && file.remoteUrl && (
          <a 
            className="remote-link-btn" 
            href={file.remoteUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            title="View Original Remote Source"
          >
            <CloudDownload size={14} />
          </a>
        )}
        <button 
          className="delete-btn" 
          onClick={() => onDelete(file.name)}
          title="Delete from Workspace"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
