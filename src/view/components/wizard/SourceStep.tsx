'use client';

import React from 'react';
import { Link, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { WizardSource, WizardState } from './importWizardTypes';
import { FEATURED_SOURCES } from './importWizardTypes';

import { GithubIcon, GitlabIcon } from '../common/Icons';


interface Props {
  state: WizardState;
  onSelectPreset: (source: WizardSource) => void;
  onCustomUrlChange: (url: string) => void;
  onCustomUrlSubmit: () => void;
  loadingPreset: string | null;
}

export const SourceStep: React.FC<Props> = ({
  state, onSelectPreset, onCustomUrlChange, onCustomUrlSubmit, loadingPreset,
}) => {
  return (
    <div className="wizard-step source-step">
      <div className="step-intro">
        <h3>Choose a Remote Source</h3>
        <p>Try a benchmark example (e.g., UCI) or enter a custom GitHub / GitLab repository URL to browse available XSD schemas.</p>
      </div>

      <div className="preset-cards">
        {FEATURED_SOURCES.map((src) => {
          const isLoading = loadingPreset === src.id;
          const Icon = src.provider === 'github' ? GithubIcon : GitlabIcon;
          return (
            <button
              key={src.id}
              className={`preset-card ${state.source?.id === src.id ? 'selected' : ''}`}
              onClick={() => onSelectPreset(src)}
              disabled={!!loadingPreset}
            >
              <div className="preset-icon-wrap">
                <Icon />
              </div>
              <div className="preset-info">
                <span className="preset-label">{src.label}</span>
                <span className="preset-desc">{src.description}</span>
              </div>
              {isLoading
                ? <Loader2 size={16} className="animate-spin preset-arrow" />
                : <ChevronRight size={16} className="preset-arrow" />
              }
            </button>
          );
        })}
      </div>

      <div className="divider"><span>or use a custom URL</span></div>

      <div className="custom-url-row">
        <div className="custom-url-input-wrap">
          <Link size={14} className="custom-url-icon" />
          <input
            className="custom-url-input"
            type="url"
            placeholder="https://github.com/owner/repo  or  https://gitlab.com/owner/repo"
            value={state.customUrl}
            onChange={(e) => onCustomUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCustomUrlSubmit()}
            disabled={!!loadingPreset}
          />
        </div>
        <button
          className="browse-btn"
          onClick={onCustomUrlSubmit}
          disabled={!state.customUrl.trim() || !!loadingPreset}
        >
          {loadingPreset === 'custom'
            ? <Loader2 size={14} className="animate-spin" />
            : 'Browse'}
        </button>
      </div>

      {state.treeError && (
        <div className="step-error">
          <AlertCircle size={14} />
          <span>{state.treeError}</span>
        </div>
      )}

    </div>
  );
};
