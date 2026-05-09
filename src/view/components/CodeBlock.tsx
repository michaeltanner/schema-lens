'use client';

import React, { useEffect, useRef, useState } from 'react';
import Prism, { setupPrism } from '@/core/utils/prismSetup';
import { Copy, Check } from 'lucide-react';
import '@/view/styles/codeblock.css';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'markup', 
  filename,
  className = '',
  showLineNumbers = true
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);

  useEffect(() => {
    setupPrism();
  }, []);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language, isWrapped]);

  const handleCopy = async () => {
    const textToCopy = code.trim();
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`code-block-wrapper ${className}`}>
      <div className="code-block-header">
        {filename && <span className="code-filename">{filename}</span>}
        <div className="header-actions">
          <button 
            className={`copy-button ${copied ? 'copied' : ''}`} 
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button 
            className={`wrap-toggle ${isWrapped ? 'active' : ''}`} 
            onClick={() => setIsWrapped(!isWrapped)}
            title="Toggle Word Wrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 15 6 15 12 9 12 9 18 21 18" />
              <path d="M21 18l-3-3m0 6l3-3" />
            </svg>
            <span>Wrap</span>
          </button>
        </div>
      </div>
      <div className={`code-content ${isWrapped ? 'wrapped' : ''}`}>
        <pre className={`${showLineNumbers ? 'line-numbers' : ''} language-${language} ${isWrapped ? 'wrapped' : ''}`}>
          <code ref={codeRef} className={`language-${language}`}>
            {code.trim()}
          </code>
        </pre>
      </div>
    </div>
  );
};
