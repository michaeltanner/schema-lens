'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

export const CustomDialog: React.FC = () => {
  const { activeDialog } = useSchemaStore();

  useEffect(() => {
    if (activeDialog) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          activeDialog.resolve(false);
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [activeDialog]);

  if (!activeDialog) return null;

  const { title, message, type, severity = 'info', confirmLabel, cancelLabel, resolve } = activeDialog;

  const getIcon = () => {
    switch (severity) {
      case 'error': return <XCircle size={20} className="icon-error" />;
      case 'warning': return <AlertTriangle size={20} className="icon-warning" />;
      default: return <Info size={20} className="icon-info" />;
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`dialog-overlay severity-${severity}`} onClick={() => resolve(false)}>
      <div className="dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            {getIcon()}
            <span>{title}</span>
          </div>
          <button className="dialog-close" onClick={() => resolve(false)} title="Dismiss">
            <X size={16} />
          </button>
        </div>

        <div className="dialog-body">
          <p>{message}</p>
        </div>

        <div className="dialog-footer">
          {type === 'confirm' && (
            <button className="btn-cancel" onClick={() => resolve(false)}>
              {cancelLabel || 'Cancel'}
            </button>
          )}
          <button 
            className={`btn-confirm btn-${severity}`} 
            onClick={() => resolve(true)}
            autoFocus
          >
            {confirmLabel || 'OK'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: dialog-fade-in 0.2s ease-out;
        }

        @keyframes dialog-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .dialog-modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 1.5rem;
          width: 90%;
          max-width: 440px;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: dialog-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes dialog-slide-up {
          from { opacity: 0; transform: translateY(32px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Severity Colors & Gradients */
        .severity-info .dialog-header {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
        }
        .severity-warning .dialog-header {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%);
          border-bottom-color: rgba(245, 158, 11, 0.2);
        }
        .severity-error .dialog-header {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%);
          border-bottom-color: rgba(239, 68, 68, 0.2);
        }

        .dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .dialog-title {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--foreground);
        }

        .icon-info { color: #3b82f6; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4)); }
        .icon-warning { color: #f59e0b; filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4)); }
        .icon-error { color: #ef4444; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.4)); }

        .dialog-close {
          background: transparent;
          border: none;
          color: var(--foreground);
          opacity: 0.3;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .dialog-close:hover {
          opacity: 1;
          background: var(--surface-hover);
        }

        .dialog-body {
          padding: 1.5rem 1.75rem;
          font-size: 1rem;
          line-height: 1.6;
          color: var(--foreground);
          opacity: 0.85;
          white-space: pre-wrap;
        }

        .dialog-footer {
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: rgba(0, 0, 0, 0.15);
          border-top: 1px solid var(--border);
        }

        button {
          padding: 0.75rem 1.5rem;
          border-radius: 0.875rem;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }

        .btn-cancel {
          background: transparent;
          border-color: var(--border);
          color: var(--foreground);
          opacity: 0.6;
        }

        .btn-cancel:hover {
          opacity: 1;
          background: var(--surface-hover);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-info {
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
        }
        .btn-info:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
        }
        .btn-warning:hover {
          background: #d97706;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        }

        .btn-error {
          background: #ef4444;
          color: white;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
        }
        .btn-error:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
        }

        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>,
    document.body
  );
};
