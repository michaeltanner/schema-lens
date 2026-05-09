'use client';

import React, { useEffect, useState } from 'react';
import { ItemExplorer } from '@/view/components/ItemExplorer';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { useNavigationStore } from '@/core/store/useNavigationStore';
import { AlertTriangle, Workflow } from 'lucide-react';
import { Dashboard } from '@/view/components/Dashboard';
import { Header } from '@/view/components/Header';
import { ItemDetailsHeader } from '@/view/components/item-details/ItemDetailsHeader';
import { ItemDetailsBody } from '@/view/components/item-details/ItemDetailsBody';
import { CustomDialog } from '@/view/components/CustomDialog';
import { ItemSpotlight } from '@/view/components/ItemSpotlight';
import { KeyboardShortcutsModal } from '@/view/components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from '@/view/hooks/useKeyboardShortcuts';
import { useUIStore } from '@/core/store/useUIStore';
import { LoadingScreen } from '@/view/components/LoadingScreen';
import { ImportWizard } from '@/view/components/wizard/ImportWizard';
import '@/view/styles/page.css';

export default function Home() {
  const { 
    summary, 
    setSummary, 
    selectedItem, 
    history, 
    goBack, 
    navigate, 
    goHome,
    refreshSummary
  } = useSchemaStore();

  const {
    sidebarCollapsed,
    viewMode,
    setViewMode,
    isXmlExampleOpen,
    setXmlExampleOpen,
    expandItemTree,
    collapseItemTree,
    resetItemExpansion,
    mobileMenuOpen,
    setMobileMenuOpen,
    isImportWizardOpen,
    setImportWizardOpen
  } = useUIStore();

  const { toggleBookmark, isBookmarked } = useNavigationStore();
  useKeyboardShortcuts();

  // Reset item expansion when item changes
  useEffect(() => {
    resetItemExpansion();
  }, [selectedItem?.name, selectedItem?.type, resetItemExpansion]);
  
  const [loading, setLoading] = useState(!summary);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (summary) return;

    // Small delay to let UI breathe
    const timer = setTimeout(() => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000);

      fetch('/api/workspace', { signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          setSummary(data);
          setLoading(false);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error('Initial load failed:', err);
          setError(err.name === 'AbortError' ? 'The request timed out. The server might be processing large schemas.' : err.message);
          setLoading(false);
        });
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [summary, setSummary]);


  if (loading) {
    return <LoadingScreen message="Analyzing Schemas..." />;
  }

  if (error) {
    return (
      <main className="initialization-error">
        <div className="error-card">
          <div className="error-icon">
            <AlertTriangle size={48} color="#ef4444" />
          </div>
          <h1>Initialization Failed</h1>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              className="retry-btn" 
              onClick={() => {
                setError(null);
                setLoading(true);
                // The useEffect will trigger again since summary is null and error is now null
              }}
            >
              <Workflow size={18} />
              <span>Retry Analysis</span>
            </button>
            <button 
              className="secondary-btn" 
              onClick={() => window.location.reload()}
            >
              <span>Refresh Page</span>
            </button>
          </div>
        </div>

      </main>
    );
  }

  return (
    <div className="layout-root">
      <Header />
      <div className="app-container">
        {mobileMenuOpen && (
          <div 
            className="mobile-sidebar-overlay" 
            onClick={() => setMobileMenuOpen(false)} 
          />
        )}
        <ItemExplorer />
      
      <main className="main-content">
        {!selectedItem ? (
          <Dashboard />
        ) : (
          <div className="item-details-view">
            <ItemDetailsHeader />

            
            <ItemDetailsBody />

          </div>
        )}
      </main>
      </div>
      <ItemSpotlight />
      <KeyboardShortcutsModal />
      <CustomDialog />
      
    {isImportWizardOpen && (
        <ImportWizard 
          onClose={() => setImportWizardOpen(false)}
          onImportComplete={() => refreshSummary()}
        />
      )}
    </div>
  );
}

