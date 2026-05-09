'use client';

import React from 'react';
import {
  FileCode2, CheckSquare, Square, Minus, FolderOpen, Folder
} from 'lucide-react';

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
  file?: any; // RemoteFile
}

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
  selected: Set<string>;
  onToggle: (path: string) => void;
  onToggleDir: (paths: string[]) => void;
  search: string;
  expanded: Set<string>;
  onExpand: (path: string) => void;
}

function getAllFilePaths(node: TreeNode): string[] {
  if (node.isFile) return [node.path];
  return node.children.flatMap(getAllFilePaths);
}

export const TreeNodeRow: React.FC<TreeNodeProps> = ({ 
  node, depth, selected, onToggle, onToggleDir, search, expanded, onExpand 
}) => {
  if (!node.isFile && node.children.length === 0) return null;

  const filePaths = getAllFilePaths(node);
  const allSelected = filePaths.length > 0 && filePaths.every(p => selected.has(p));
  const someSelected = filePaths.some(p => selected.has(p));
  const isExpanded = expanded.has(node.path);

  const matchesSearch = !search || node.name.toLowerCase().includes(search.toLowerCase());
  if (!matchesSearch && node.isFile) return null;

  const CheckIcon = node.isFile
    ? (selected.has(node.path) ? CheckSquare : Square)
    : (allSelected ? CheckSquare : someSelected ? Minus : Square);

  return (
    <div className="tree-entry">
      <div
        className={`tree-row depth-${Math.min(depth, 6)} ${node.isFile && selected.has(node.path) ? 'selected' : ''}`}
        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
        onClick={() => {
          if (node.isFile) onToggle(node.path);
          else {
            if (allSelected || someSelected) onToggleDir(filePaths);
            else onToggleDir(filePaths);
            onExpand(node.path);
          }
        }}
      >
        {!node.isFile && (
          <span className="expand-icon" onClick={(e) => { e.stopPropagation(); onExpand(node.path); }}>
            {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
          </span>
        )}
        <button
          className={`check-btn ${node.isFile && selected.has(node.path) ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (node.isFile) onToggle(node.path);
            else onToggleDir(filePaths);
          }}
        >
          <CheckIcon size={16} />
        </button>
        {node.isFile
          ? <FileCode2 size={16} className="file-icon" />
          : null
        }
        <span className={`entry-name ${node.isFile ? 'file' : 'dir'}`}>{node.name}</span>
        {node.isFile && node.file?.size && (
          <span className="entry-size">{(node.file.size / 1024).toFixed(1)} KB</span>
        )}
        {!node.isFile && (
          <span className="entry-count">{filePaths.length} files</span>
        )}
      </div>

      {!node.isFile && isExpanded && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
              onToggleDir={onToggleDir}
              search={search}
              expanded={expanded}
              onExpand={onExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};
