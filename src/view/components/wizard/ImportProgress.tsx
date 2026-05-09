'use client';

import React from 'react';
import { 
  CheckCircle2, XCircle, SkipForward, 
  Loader2, RefreshCw, X 
} from 'lucide-react';
import type { ImportFileResult, ImportFileStatus } from '@/core/import/importService';

import { ClockIcon } from '../common/Icons';

const STATUS_CONFIG: Record<ImportFileStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending:     { icon: <ClockIcon size={13} />,              color: '#6b7280', label: 'Waiting'    },
  downloading: { icon: <Loader2 size={13} className="spin" />, color: '#60a5fa', label: 'Downloading' },
  validating:  { icon: <Loader2 size={13} className="spin" />, color: '#a78bfa', label: 'Validating' },
  saved:       { icon: <CheckCircle2 size={13} />,       color: '#34d399', label: 'Saved'      },
  error:       { icon: <XCircle size={13} />,            color: '#ef4444', label: 'Error'      },
  skipped:     { icon: <SkipForward size={13} />,        color: '#f59e0b', label: 'Skipped'    },
};

interface ImportProgressProps {
  importResults: ImportFileResult[];
  importDone: boolean;
  importSummary: any;
  onRetry: () => void;
  onClose: () => void;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({
  importResults,
  importDone,
  importSummary,
  onRetry,
  onClose
}) => {
  const totalFiles = importResults.length;
  const doneFiles = importResults.filter(r =>
    r.status === 'saved' || r.status === 'error' || r.status === 'skipped'
  ).length;
  const progress = totalFiles > 0 ? Math.round((doneFiles / totalFiles) * 100) : 0;

  return (
    <div className="import-step">
      <div className="progress-header">
        <div className="progress-label">
          <span>{importDone ? 'Import complete' : `Importing…`}</span>
          <span className="progress-pct">{progress}%</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${importDone ? 'done' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {importDone && importSummary && (
        <div className="summary-badges">
          <div className="badge saved">
            <CheckCircle2 size={13} />
            <span>{importSummary.imported} Imported</span>
          </div>
          {importSummary.skipped > 0 && (
            <div className="badge skipped">
              <SkipForward size={13} />
              <span>{importSummary.skipped} Skipped</span>
            </div>
          )}
          {importSummary.failed > 0 && (
            <div className="badge error">
              <XCircle size={13} />
              <span>{importSummary.failed} Failed</span>
            </div>
          )}
        </div>
      )}

      <div className="results-list">
        {importResults.map((result) => {
          const cfg = STATUS_CONFIG[result.status];
          return (
            <div key={result.path} className={`result-row status-${result.status}`}>
              <div className="result-main">
                <span className="result-icon" style={{ color: cfg.color }}>
                  {cfg.icon}
                </span>
                <span className="result-name">{result.name}</span>
                {result.status === 'saved' && result.overwritten && (
                  <span className="result-tag overwrite">overwritten</span>
                )}
                {result.status === 'saved' && result.renamed && (
                  <span className="result-tag renamed" title={`Original name: ${result.originalName}`}>renamed</span>
                )}
                {result.status === 'skipped' && result.reason && (
                  <span className="result-reason" title={result.reason}>
                    {result.reason}
                  </span>
                )}
                {result.error && (
                  <span className="result-error" title={result.error}>
                    {result.error.length > 60 ? result.error.slice(0, 58) + '…' : result.error}
                  </span>
                )}
              </div>
              <span className="result-status-label" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
        {importResults.length === 0 && !importDone && (
          <div className="results-empty">
            <Loader2 size={20} className="spin" style={{ opacity: 0.4 }} />
            <span>Starting import…</span>
          </div>
        )}
      </div>

      {importDone && (
        <div className="import-footer">
          <div className="footer-main">
            {(importSummary?.failed ?? 0) > 0 && (
              <button className="retry-btn" onClick={onRetry}>
                <RefreshCw size={13} /> Retry Failed
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={13} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
