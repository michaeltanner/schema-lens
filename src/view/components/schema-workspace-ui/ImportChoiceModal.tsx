import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Info, CloudUpload, CloudDownload } from 'lucide-react';

interface ImportChoiceModalProps {
  onClose: () => void;
  onLocalUpload: () => void;
  onRemoteImport: () => void;
}

export const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({
  onClose,
  onLocalUpload,
  onRemoteImport
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="choice-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="choice-modal">
        <div className="choice-header">
          <div className="header-title">
            <Plus size={18} className="title-icon" />
            <h4>Add Schemas</h4>
          </div>
          <button className="choice-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="choice-body">
          <div className="workspace-tip choice-tip">
            <Info size={14} className="tip-icon" />
            <p>
              When importing modular schemas (like UCI), ensure you include all core definition files 
              (e.g., <code>MessageDefinitions</code>, <code>SecurityMarkings</code>) for complete type resolution.
            </p>
          </div>

          <button 
            className="choice-btn" 
            onClick={() => {
              onClose();
              onLocalUpload();
            }}
          >
            <div className="choice-icon-wrapper local">
              <CloudUpload size={24} />
            </div>
            <div className="choice-text">
              <span className="choice-label">Local Upload</span>
              <span className="choice-desc">Pick XSD files from your computer</span>
            </div>
          </button>

          <button 
            className="choice-btn recommended" 
            onClick={() => {
              onClose();
              onRemoteImport();
            }}
          >
            <div className="choice-icon-wrapper remote">
              <CloudDownload size={24} />
            </div>
            <div className="choice-text">
              <div className="label-row">
                <span className="choice-label">Remote Import</span>
                <span className="recommended-badge">Recommended (ASOT)</span>
              </div>
              <span className="choice-desc">Import from authoritative standard repositories or point to an alternative repo</span>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
