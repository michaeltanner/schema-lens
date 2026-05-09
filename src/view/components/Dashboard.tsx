'use client';

import React from 'react';
import { useSchemaStore } from '@/core/store/useSchemaStore';
import { useNavigationStore } from '@/core/store/useNavigationStore';
import {
  ListTree, Search, ArrowRight, FileCode2, CloudDownload
} from 'lucide-react';
import { SchemaWorkspace } from './SchemaWorkspace';
import { StatsOverview } from './dashboard/StatsOverview';
import { SchemaHealth } from './dashboard/SchemaHealth';
import { ComplexityBreakdown } from './dashboard/ComplexityBreakdown';
import { PinnedItems } from './dashboard/PinnedItems';
import { RecentActivity } from './dashboard/RecentActivity';
import { Footer } from './Footer';
import '../styles/dashboard-home.css';
import '../styles/dashboard-actions.css';
import '../styles/dashboard-stats.css';
import '../styles/dashboard-health.css';
import '../styles/dashboard-recent.css';

export const Dashboard: React.FC = () => {
  const { summary, setSpotlightOpen, toggleSidebar, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, setImportDialogOpen } = useSchemaStore();
  const { recentActivity, bookmarks, navigate, removeFromRecent, removeBookmark } = useNavigationStore();

  if (!summary) return null;

  const isEmpty = summary.totalFilesCount === 0;

  if (isEmpty) {
    return (
      <div className="home-screen empty-workspace">
        <div className="empty-hero">
          <div className="empty-icon-wrapper">
            <div className="pulse-ring"></div>
            <CloudDownload size={80} className="main-empty-icon" />
          </div>
          
          <h1 className="hero-title">Ready to explore <span className="gradient-text">XML Schemas?</span></h1>
          <p className="hero-lead">
            Your workspace is empty. Import your XSD files to visualize hierarchies, 
            generate XML samples, and analyze complex dependencies.
          </p>

          <div className="empty-actions">
            <button 
              className="primary-cta" 
              onClick={() => setImportDialogOpen(true)}
            >
              <FileCode2 size={20} />
              <span>Import Schema Files</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div id="schema-workspace" className="workspace-anchor">
          <SchemaWorkspace />
        </div>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <div className="home-container">

        {/* ── Hero ── */}
        <header className="hero">
          <div className="hero-badge">Advanced Schema Navigator</div>
          <h1>The ultimate lens for <span className="gradient-text">complex XML Schemas</span></h1>
          <p className="hero-subtitle">
            Navigate complex XSD structures, resolve deep hierarchies, and search across thousands of items with ease.
          </p>

          <div className="main-actions">
            <div className="explore-card-container">
              <button className="explore-card" onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  toggleSidebar();
                }
              }}>
                <div className="explore-card-content">
                  <div className="explore-icon">
                    <ListTree size={28} />
                  </div>
                  <div className="explore-info">
                    <h3>Explore the Schema Hierarchy</h3>
                    <p>Toggle the sidebar to browse through the complete tree of messages and items.</p>
                  </div>
                  <div className="explore-arrow">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </button>
            </div>

            <div className="search-container">
              <button className="sleek-search-btn" onClick={() => setSpotlightOpen(true)}>
                <Search size={18} />
                <span>Search for a message, type, or field...</span>
                <kbd>/</kbd>
              </button>
            </div>
          </div>
        </header>

        <StatsOverview summary={summary} />
        
        <SchemaHealth summary={summary} />

        <ComplexityBreakdown summary={summary} />

        {/* ── Two-column lower area ── */}
        <div className="lower-grid">
          <div className="left-col" id="schema-workspace">
            <SchemaWorkspace />
            <PinnedItems bookmarks={bookmarks} navigate={navigate} onRemove={removeBookmark} />
          </div>

          <div className="right-col">
            <RecentActivity recentActivity={recentActivity} navigate={navigate} onRemove={removeFromRecent} />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};
