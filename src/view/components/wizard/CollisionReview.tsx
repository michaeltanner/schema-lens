'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Check, CheckCircle2 } from 'lucide-react';
import type { ImportFileResult } from '@/core/import/importService';

interface CollisionReviewProps {
  importResults: ImportFileResult[];
  existingFiles: string[];
  onUpdateName: (path: string, newName: string) => void;
  onToggleOverwrite: (path: string) => void;
  onStartImport: () => void;
  onClose: () => void;
}

export const CollisionReview: React.FC<CollisionReviewProps> = ({
  importResults,
  existingFiles,
  onUpdateName,
  onToggleOverwrite,
  onStartImport,
  onClose
}) => {
  const [confirmOverwrite, setConfirmOverwrite] = React.useState(false);

  const getRowStatus = (result: ImportFileResult) => {
    const nameCount = importResults.filter(r => r.name.toLowerCase() === result.name.toLowerCase()).length;
    const collidesWithBatch = nameCount > 1;
    const collidesWithWorkspace = existingFiles.some(f => f.toLowerCase() === result.name.toLowerCase());
    
    if (result.shouldOverwrite) return 'mitigated';
    if (collidesWithBatch || collidesWithWorkspace) return 'colliding';
    if (result.renamed || (result.name !== result.path.split('/').pop())) return 'valid-renamed';
    return 'valid';
  };

  const isAllMitigated = importResults.every(r => getRowStatus(r) !== 'colliding');
  const hasGlobalOverwrites = importResults.some(r => r.shouldOverwrite);

  return (
    <div className="import-step review-mode">
      <div className="review-header">
        <div className="review-icon"><AlertTriangle size={20} /></div>
        <div className="review-title-group">
          <h3>Review Collisions</h3>
          <p>Conflicts detected. Resolve by renaming or choosing to overwrite.</p>
        </div>
      </div>

      <div className="results-list">
        {importResults.map((result) => {
          const status = getRowStatus(result);
          const isColliding = status === 'colliding';
          const isMitigated = status === 'mitigated';
          const isValidRenamed = status === 'valid-renamed';

          return (
            <div key={result.path} className={`result-row ${status}`}>
              <div className="result-main">
                <span className="result-icon">
                  {isColliding ? <AlertTriangle size={13} /> : isMitigated ? <RefreshCw size={13} /> : <Check size={13} />}
                </span>
                
                <div className="rename-input-group">
                  <div className={`rename-field-wrapper ${result.shouldOverwrite ? 'locked' : ''}`}>
                    <input 
                      className="rename-input"
                      value={result.name.replace(/\.xsd$/i, '')}
                      onChange={(e) => onUpdateName(result.path, e.target.value + '.xsd')}
                      placeholder="Target name..."
                      disabled={!!result.shouldOverwrite}
                    />
                    <span className="extension-badge">.xsd</span>
                  </div>
                  <span className="original-path">{result.path}</span>
                </div>
              </div>

              <div className="row-actions">
                {(isColliding || isMitigated) && (
                  <label className="row-overwrite-checkbox" title="Overwrite existing file">
                    <input 
                      type="checkbox" 
                      checked={!!result.shouldOverwrite} 
                      onChange={() => onToggleOverwrite(result.path)}
                    />
                    <span>Overwrite</span>
                  </label>
                )}
                {isValidRenamed && <span className="row-status-tag">Valid</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="import-footer review-footer">
        {!confirmOverwrite ? (
          <div className="footer-main">
            <button className="secondary-btn" onClick={onClose}>Cancel</button>
            <button 
              className="primary-btn" 
              onClick={() => hasGlobalOverwrites ? setConfirmOverwrite(true) : onStartImport()}
              disabled={!isAllMitigated}
            >
              <CheckCircle2 size={13} /> Start Import
            </button>
          </div>
        ) : (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <AlertTriangle size={20} className="confirm-icon" />
              <div className="confirm-content">
                <div className="confirm-title">Confirm Overwrites</div>
                <div className="confirm-text">
                  You have selected one or more files to be overwritten. This will replace existing schemas in your workspace.
                </div>
              </div>
              <div className="confirm-actions">
                <button className="cancel-btn" onClick={() => setConfirmOverwrite(false)}>Cancel</button>
                <button className="do-overwrite-btn" onClick={onStartImport}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
