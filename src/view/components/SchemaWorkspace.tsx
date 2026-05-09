'use client';

import React, { useState, useRef } from 'react';
import { 
  FileCode2, Trash2, Plus, Loader2, 
  AlertCircle, X, Info, Download
} from 'lucide-react';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { useWorkspaceFiles } from '@/view/hooks/useWorkspaceFiles';
import { FileCard } from './schema-workspace-ui/FileCard';
import { ImportChoiceModal } from './schema-workspace-ui/ImportChoiceModal';
import { DropOverlay } from './schema-workspace-ui/DropOverlay';
import '../styles/workspace-modal.css';
import '../styles/workspace-manager.css';
import '../styles/workspace-grid.css';

export const SchemaWorkspace: React.FC = () => {
  const { 
    isParsing, 
    refreshSummary, 
    setImportDialogOpen,
    isImportDialogOpen,
    isImportWizardOpen,
    setImportWizardOpen
  } = useSchemaStore();
  
  const {
    files,
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
  } = useWorkspaceFiles();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleUpload(droppedFiles);
    }
  };

  return (
    <>
      <section 
        className={`workspace-manager ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="section-header">
          <div className="header-left">
            <FileCode2 size={16} className="section-icon" />
            <h3>Schema Manager</h3>
            <div className="workspace-info" title="Schemas are managed in a local workspace to protect your source files.">
              <Info size={12} />
              <span>Workspace</span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="download-all-btn" 
              onClick={handleDownloadAll} 
              disabled={files.length === 0}
              title="Download all files as a ZIP archive"
            >
              <Download size={12} />
              <span>Download All</span>
            </button>
            <button 
              className="delete-all-btn" 
              onClick={handleDeleteAll} 
              disabled={files.length === 0}
              title="Remove all schemas from the workspace"
            >
              <Trash2 size={12} />
              <span>Delete All</span>
            </button>
            {isParsing && (
              <div className="parsing-badge">
                <Loader2 size={12} className="animate-spin" />
                <span>Parsing...</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <div className="error-content">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
            <button className="dismiss-error-btn" onClick={() => setError(null)} title="Dismiss error">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="manager-content">
          <DropOverlay isDragging={isDragging} />

          <div className={`file-grid ${files.length === 0 ? 'is-empty' : ''}`}>
            {files.map((file) => (
              <FileCard 
                key={file.name}
                file={file}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onView={handleView}
              />
            ))}

            <button 
              className={`add-card upload-zone ${files.length === 0 ? 'hero-add' : ''}`} 
              onClick={() => setImportDialogOpen(true)}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 size={files.length === 0 ? 48 : 24} className="animate-spin" />
              ) : (
                <Plus size={files.length === 0 ? 48 : 24} />
              )}
              <div className="add-text">
                <span>{files.length === 0 ? 'Import Your First Schema' : 'Add Schemas'}</span>
                {files.length === 0 && <p>Featured examples or local XML Schema files</p>}
              </div>
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleUpload(e.target.files)} 
              accept=".xsd" 
              multiple
              hidden 
            />
          </div>
        </div>
      </section>

      {isImportDialogOpen && (
        <ImportChoiceModal 
          onClose={() => setImportDialogOpen(false)}
          onLocalUpload={() => fileInputRef.current?.click()}
          onRemoteImport={() => setImportWizardOpen(true)}
        />
      )}
    </>
  );
};
