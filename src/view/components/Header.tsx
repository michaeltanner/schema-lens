'use client';

import React from 'react';
import { useUIStore } from '@/core/store/useUIStore';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { 
  Search, 
  Home as HomeIcon, 
  Keyboard, 
  ShieldCheck,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { HealthDrawer } from './header/HealthDrawer';
import '@/view/styles/header.css';

export const Header: React.FC = () => {
  const { summary, goHome } = useSchemaStore();
  const { 
    viewMode, 
    setSpotlightOpen, 
    setShortcutsOpen,
    mobileMenuOpen,
    setMobileMenuOpen
  } = useUIStore();

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDrawerOpen && drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.health-btn')) {
          setIsDrawerOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDrawerOpen]);

  const errorCount = summary?.errors?.length || 0;
  const isHealthy = errorCount === 0;

  return (
    <nav className="main-header">
      <div className="header-left">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <button className="logo-btn" onClick={goHome} title="Go to Home Screen">
          <div className="logo-container hifi">
            <img src="/assets/logos/schemalens_logo.png" alt="SchemaLens Logo" className="logo-img" />
            <div className="logo-glow prism-hifi" />
          </div>
          <span className="logo-text">
            Schema<span className="text-accent">Lens</span>
          </span>
        </button>
      </div>

      <div className="header-center">
        <button className="command-search" onClick={() => setSpotlightOpen(true)} title="Search for types and elements">
          <div className="search-meta">
            <Search size={16} />
            <span>Quick Search...</span>
          </div>
          <div className="command-hint">
            <kbd>/</kbd>
          </div>
        </button>
      </div>

      <div className="header-right">
        <div className="actions-group">
          <button 
            className="icon-action-btn hide-mobile"
            onClick={goHome}
            title="Return to Dashboard"
          >
            <HomeIcon size={18} />
          </button>
          <button 
            className={`icon-action-btn health-btn ${!isHealthy ? 'broken' : ''} ${isDrawerOpen ? 'active' : ''}`}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            title={isHealthy ? "Workspace Healthy" : `${errorCount} Issues Detected`}
          >
            {isHealthy ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            {!isHealthy && <span className="health-badge">{errorCount}</span>}
          </button>
          <button
            className="icon-action-btn hide-mobile"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard Shortcuts"
          >
            <Keyboard size={18} />
            <kbd className="shortcut-badge">?</kbd>
          </button>
        </div>
      </div>

      <HealthDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        drawerRef={drawerRef}
        summary={summary}
        isHealthy={isHealthy}
        errorCount={errorCount}
        onGoHome={goHome}
      />
    </nav>
  );
};
