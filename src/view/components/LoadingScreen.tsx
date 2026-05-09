'use client';

import '@/view/styles/loading.css';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Initializing SchemaLens...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-wrapper">
          <img 
            src="/assets/logos/schemalens_logo.png" 
            alt="SchemaLens" 
            className="loading-logo" 
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
