'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, CloudDownload } from 'lucide-react';
import { SourceStep } from './SourceStep';
import { ExploreStep } from './ExploreStep';
import { ImportStep } from './ImportStep';
import { useImportWizard } from '@/view/hooks/useImportWizard';
import '@/view/styles/wizard.css';

interface Props {
  onClose: () => void;
  onImportComplete?: () => void;
}

const STEP_LABELS: Record<string, string> = {
  source: 'Source',
  explore: 'Select Files',
  import: 'Import',
};

export const ImportWizard: React.FC<Props> = ({ onClose, onImportComplete }) => {
  const {
    state,
    loadingPreset,
    handleSelectPreset,
    handleCustomUrlChange,
    handleCustomUrlSubmit,
    handleToggle,
    handleToggleAll,
    handleToggleExpand,
    handleBack,
    runImport,
    updateResultName,
    toggleResultOverwrite,
    handleRetry
  } = useImportWizard(onImportComplete);

  const steps = ['source', 'explore', 'import'];
  const currentStepIdx = steps.indexOf(state.step);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wizard-modal">
        <div className="wizard-header">
          <div className="wizard-title">
            <CloudDownload size={18} className="wizard-icon" />
            <span>Schema Import Wizard</span>
          </div>
          <div className="wizard-stepper">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`step-pip ${i < currentStepIdx ? 'done' : i === currentStepIdx ? 'active' : ''}`}>
                  <span className="pip-num">{i + 1}</span>
                  <span className="pip-label">{STEP_LABELS[s]}</span>
                </div>
                {i < steps.length - 1 && <div className={`step-connector ${i < currentStepIdx ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>
          <button className="wizard-close" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="wizard-body">
          {state.step === 'source' && (
            <SourceStep
              state={state}
              onSelectPreset={handleSelectPreset}
              onCustomUrlChange={handleCustomUrlChange}
              onCustomUrlSubmit={handleCustomUrlSubmit}
              loadingPreset={loadingPreset}
            />
          )}
          {state.step === 'explore' && (
            <ExploreStep
              state={state}
              source={state.source}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              onBack={handleBack}
              onImport={() => runImport()}
              onExpand={handleToggleExpand}
            />
          )}
          {state.step === 'import' && (
            <ImportStep
              state={state}
              onClose={onClose}
              onRetry={handleRetry}
              onOverwrite={() => runImport(true)}
              onUpdateName={updateResultName}
              onToggleOverwrite={toggleResultOverwrite}
              onStartImport={() => runImport()}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
