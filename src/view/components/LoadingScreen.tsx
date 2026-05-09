'use client';

import Image from 'next/image';
import '@/view/styles/loading.css';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Initializing SchemaLens...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-wrapper">
          <Image 
            src="/assets/logos/schemalens_logo.png" 
            alt="SchemaLens" 
            className="loading-logo" 
            width={120}
            height={120}
            priority
          />
        </div>
        
        <div className="loading-info">
          <h1 className="loading-title">SchemaLens</h1>
          <p className="loading-message">{message}</p>
          <div className="loading-bar-container">
            <div className="loading-bar-progress" />
          </div>
        </div>
      </div>
    </div>
  );
};
