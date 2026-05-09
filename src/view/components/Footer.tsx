'use client';

import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

import pkg from '../../../package.json';

import '../styles/footer.css';

import { GithubIcon } from './common/Icons';


export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-left">
          <div className="copyright">
            <span className="c-symbol">&copy;</span>
            <span className="c-year">{currentYear}</span>
            <span className="c-name">Michael Tanner</span>
          </div>
          <div className="footer-divider" />
          <div className="footer-tagline">
            XML Schema Definition (XSD) Navigator
          </div>
        </div>

        <div className="footer-right">
          <a 
            href="https://github.com/michaeltanner/schema-lens" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link github-link"
          >
            <GithubIcon size={18} />
            <span>GitHub Repository</span>
            <ExternalLink size={12} className="ext-icon" />
          </a>

          <div className="footer-divider" />
          <div className="footer-status">
            <ShieldCheck size={14} className="status-icon" />

            <span>v{pkg.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
