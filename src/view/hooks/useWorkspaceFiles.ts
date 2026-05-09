'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSchemaStore } from '@/core/store/useSchemaStore';

export interface SchemaFile {
  name: string;
  size: number;
  modified: string;
  enabled: boolean;
  source: 'project' | 'upload' | 'remote';
  remoteUrl?: string;
}

export const useWorkspaceFiles = () => {
  const { refreshSummary, confirm, lastUpdated } = useSchemaStore();
  const [files, setFiles] = useState<SchemaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (bootstrap: boolean = false) => {
    try {
      const res = await fetch(`/api/workspace/files?t=${Date.now()}${bootstrap ? '&bootstrap=true' : ''}`);
      const data = await res.json();
      setFiles(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load schema files');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, lastUpdated]);

  const handleUpload = async (filesToUpload: FileList | File[] | null) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    const filesArray = Array.from(filesToUpload);
    const xsdFiles = filesArray.filter(f => f.name.toLowerCase().endsWith('.xsd'));

    if (xsdFiles.length === 0) {
      setError('Only .xsd files are allowed');
      return;
    }

    const existingNames = files.map(f => f.name);
    const overwrites = xsdFiles.filter(f => existingNames.includes(f.name));

    if (overwrites.length > 0) {
      const names = overwrites.map(f => f.name).join(', ');
      const confirmed = await confirm(
        'Overwrite Existing Files',
        `The following files already exist in your workspace and will be overwritten:\n\n${names}\n\nDo you want to proceed?`,
        'warning',
        'Overwrite',
        'Cancel'
      );
      if (!confirmed) return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of xsdFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/workspace/files', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.error) throw new Error(`${file.name}: ${data.error}`);
      }

      await fetchFiles();
      await refreshSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to upload schema');
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (name: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/workspace/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, enabled }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFiles(prev => prev.map(f => f.name === name ? { ...f, enabled } : f));
      await refreshSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle schema');
    }
  };

  const handleDelete = async (name: string) => {
    const confirmed = await confirm(
      'Delete Schema',
      `Are you sure you want to remove ${name} from your workspace? This action cannot be undone.`,
      'error',
      'Delete',
      'Keep File'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/workspace/files?name=${name}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      await fetchFiles();
      await refreshSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to delete schema');
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = await confirm(
      'Delete All Schemas',
      'Are you sure you want to remove ALL schemas from your workspace? This action cannot be undone.',
      'error',
      'Delete Everything',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/workspace/files?all=true', { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      await fetchFiles();
      await refreshSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to delete all schemas');
    }
  };

  const handleDownload = (name: string) => {
    const link = document.createElement('a');
    link.href = `/api/workspace/files?name=${encodeURIComponent(name)}&download=true`;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (files.length === 0) return;
    const link = document.createElement('a');
    link.href = '/api/workspace/files?all=true';
    link.setAttribute('download', 'schemalens-workspace.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (name: string) => {
    window.open(`/api/workspace/files?name=${encodeURIComponent(name)}`, '_blank');
  };

  return {
    files,
    loading,
    uploading,
    error,
    setError,
    fetchFiles,
    handleUpload,
    handleToggle,
    handleDelete,
    handleDeleteAll,
    handleDownload,
    handleDownloadAll,
    handleView
  };
};
