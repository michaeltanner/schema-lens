'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';
import type { SchemaSummary } from '@/types/schema';

interface HealthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drawerRef: React.RefObject<HTMLDivElement>;
  summary: SchemaSummary | null;
  isHealthy: boolean;
  errorCount: number;
  onGoHome: () => void;
}

export const HealthDrawer: React.FC<HealthDrawerProps> = ({
  isOpen,
  onClose,
  drawerRef,
  summary,
  isHealthy,
  errorCount,
  onGoHome
}) => {
  return (
    <div
      ref={drawerRef}
      className={`health-drawer ${isOpen ? 'open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-drawer-title"
      aria-hidden={!isOpen}
    >
      <div className="drawer-content">
        <div className="drawer-header">
          <div className="drawer-title" id="health-drawer-title">
            {isHealthy ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            <h3>Workspace Integrity Report</h3>
          </div>
          <button 
            className="close-drawer" 
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {isHealthy ? (
            <div className="healthy-state">
              <div className="healthy-icon-large">
                <ShieldCheck size={48} />
              </div>
              <p>All references are successfully resolved. Your workspace is consistent.</p>
            </div>
          ) : (
            <div className="error-list">
              <p className="drawer-subtitle">We found {errorCount} issues that might break navigation:</p>
              {summary?.errors?.map((err, i) => (
                <div key={i} className="drawer-error-item">
                  <div className={`error-indicator ${err.type.toLowerCase()}`} />
                  <div className="error-details">
                    <span className="error-msg">
                      {err.type === 'DUPLICATE_ITEM' ? 'Duplicate Item' : 'Missing Reference'}
                    </span>
                    <span className="error-ref">{err.targetName || err.nodeName}</span>
                    <span className="error-file">in {err.sourceFile}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="footer-action" onClick={() => {
            onGoHome();
            onClose();
            setTimeout(() => {
              const el = document.getElementById('schema-health');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
          }}>
            View detailed report on Home
          </button>
        </div>
      </div>
    </div>
  );
};
