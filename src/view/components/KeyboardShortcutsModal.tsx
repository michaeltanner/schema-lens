'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { Keyboard, X } from 'lucide-react';

import '@/view/styles/shortcuts-modal.css';

interface ShortcutRow {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutRow[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global Navigation',
    shortcuts: [
      { keys: ['/'], description: 'Spotlight search' },
      { keys: ['G', 'H'], description: 'Go Home' },
      { keys: ['G', 'B'], description: 'Go Back in history' },
      { keys: ['G', 'R'], description: 'Jump to Recent Activity' },
      { keys: ['G', 'S'], description: 'Jump to Pinned Items' },
      { keys: ['G', 'D'], description: 'Jump to Health Dashboard' },
      { keys: ['G', 'F'], description: 'Go to Schema Files' },
      { keys: ['Esc'], description: 'Close modal / Clear search' },
    ],
  },
  {
    title: 'Item Details',
    shortcuts: [
      { keys: ['S'], description: 'Star / Bookmark current item' },
      { keys: ['C'], description: 'Copy item name to clipboard' },
      { keys: ['1'], description: 'Switch to Tree view' },
      { keys: ['2'], description: 'Switch to Item view' },
      { keys: ['3'], description: 'Switch to Topology view' },
      { keys: ['4'], description: 'Switch to Example XML' },
      { keys: ['E'], description: 'Expand all nodes in Tree' },
      { keys: ['K'], description: 'Collapse all nodes in Tree' },
    ],
  },
  {
    title: 'Sidebar & Search',
    shortcuts: [
      { keys: ['['], description: 'Toggle sidebar collapse' },
      { keys: ['F'], description: 'Focus sidebar search' },
      { keys: ['↑', '↓'], description: 'Navigate search results' },
      { keys: ['Enter'], description: 'Select highlighted result' },
    ],
  },
  {
    title: 'Workspace',
    shortcuts: [
      { keys: ['U'], description: 'Upload new XSD files' },
      { keys: ['?'], description: 'Toggle this shortcuts help' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setShortcutsOpen } = useSchemaStore();

  if (!isShortcutsOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="ks-overlay" onClick={() => setShortcutsOpen(false)}>
      <div className="ks-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ks-header">
          <div className="ks-title">
            <Keyboard size={18} />
            <span>Keyboard Shortcuts</span>
          </div>
          <button className="ks-close" onClick={() => setShortcutsOpen(false)} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="ks-body">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="ks-group">
              <h3 className="ks-group-title">{group.title}</h3>
              {group.shortcuts.map((row, i) => (
                <div key={i} className="ks-row">
                  <span className="ks-desc">{row.description}</span>
                  <span className="ks-keys">
                    {row.keys.map((k, ki) => (
                      <React.Fragment key={ki}>
                        <kbd className="ks-key">{k}</kbd>
                        {ki < row.keys.length - 1 && <span className="ks-then">then</span>}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="ks-footer">
          Press <kbd className="ks-key ks-key--sm">?</kbd> or <kbd className="ks-key ks-key--sm">Esc</kbd> to dismiss
        </div>
      </div>

    </div>,
    document.body
  );
};
