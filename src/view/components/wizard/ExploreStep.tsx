'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, X, ArrowLeft, Download, CheckSquare, Square
} from 'lucide-react';
import type { RemoteFile } from '@/types/import';
import type { WizardSource, WizardState } from './importWizardTypes';
import { TreeNodeRow } from './TreeNodeRow';

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
  file?: RemoteFile;
}

function buildTree(files: RemoteFile[]): TreeNode {
  const root: TreeNode = { name: '', path: '', isFile: false, children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      let child = node.children.find(c => c.name === part);
      if (!child) {
        child = { name: part, path: parts.slice(0, i + 1).join('/'), isFile: isLast, children: [], file: isLast ? file : undefined };
        node.children.push(child);
      }
      node = child;
    }
  }
  return root;
}

interface Props {
  state: WizardState;
  source: WizardSource | null;
  onToggle: (path: string) => void;
  onToggleAll: () => void;
  onBack: () => void;
  onImport: () => void;
  onExpand: (path: string) => void;
}

export const ExploreStep: React.FC<Props> = ({
  state, source, onToggle, onToggleAll, onBack, onImport, onExpand,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return state.remoteFiles;
    return state.remoteFiles.filter(f => f.path.toLowerCase().includes(search.toLowerCase()));
  }, [state.remoteFiles, search]);

  const tree = useMemo(() => buildTree(state.remoteFiles), [state.remoteFiles]);

  const handleToggleDir = (paths: string[]) => {
    const allSel = paths.every(p => state.selectedPaths.has(p));
    paths.forEach(p => {
      const currentlySel = state.selectedPaths.has(p);
      if (allSel && currentlySel) {
        onToggle(p); // deselect
      } else if (!allSel && !currentlySel) {
        onToggle(p); // select
      }
    });
  };

  const allSelected = state.remoteFiles.length > 0 &&
    state.remoteFiles.every(f => state.selectedPaths.has(f.path));

  // Expand all folders that contain search matches
  const displayTree = search ? buildTree(filtered) : tree;

  return (
    <div className="explore-step">
      <div className="explore-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="explore-title">
          <span className="explore-repo">{source?.label ?? 'Remote Repository'}</span>
          <span className="explore-count">{state.remoteFiles.length} XSD files</span>
        </div>
      </div>

      <div className="explore-toolbar">
        <div className="search-wrap">
          <Search size={13} className="search-ico" />
          <input
            className="explore-search"
            placeholder="Filter files…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>
        <button className="select-all-btn" onClick={onToggleAll}>
          {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
          <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
        </button>
      </div>

      <div className="wizard-tree-container">
        {displayTree.children.length === 0 && (
          <div className="empty-tree">No XSD files match your search.</div>
        )}
        {displayTree.children.map(node => (
          <TreeNodeRow
            key={node.path}
            node={node}
            depth={0}
            selected={state.selectedPaths}
            onToggle={onToggle}
            onToggleDir={handleToggleDir}
            search={search}
            expanded={search ? new Set(displayTree.children.map(n => n.path)) : state.expandedPaths}
            onExpand={onExpand}
          />
        ))}
      </div>

      <div className="explore-footer">
        <span className="selected-count">
          {state.selectedPaths.size} of {state.remoteFiles.length} files selected
        </span>
        <button
          className="import-btn"
          onClick={onImport}
          disabled={state.selectedPaths.size === 0}
        >
          <Download size={14} />
          Import {state.selectedPaths.size > 0 ? `${state.selectedPaths.size} File${state.selectedPaths.size > 1 ? 's' : ''}` : 'Selected'}
        </button>
      </div>
    </div>
  );
};
