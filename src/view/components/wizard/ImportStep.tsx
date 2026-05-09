'use client';

import React from 'react';
import type { WizardState } from './importWizardTypes';
import { CollisionReview } from './CollisionReview';
import { ImportProgress } from './ImportProgress';

interface Props {
  state: WizardState;
  onClose: () => void;
  onRetry: () => void;
  onOverwrite: () => void;
  onUpdateName: (path: string, newName: string) => void;
  onToggleOverwrite: (path: string) => void;
  onStartImport: () => void;
}

export const ImportStep: React.FC<Props> = ({ 
  state, onClose, onRetry, onOverwrite, onUpdateName, onToggleOverwrite, onStartImport 
}) => {
  const { importResults, importDone, importSummary, reviewMode, existingFiles } = state;

  if (reviewMode) {
    return (
      <CollisionReview 
        importResults={importResults}
        existingFiles={existingFiles}
        onUpdateName={onUpdateName}
        onToggleOverwrite={onToggleOverwrite}
        onStartImport={onStartImport}
        onClose={onClose}
      />
    );
  }

  return (
    <ImportProgress 
      importResults={importResults}
      importDone={importDone}
      importSummary={importSummary}
      onRetry={onRetry}
      onClose={onClose}
    />
  );
};
