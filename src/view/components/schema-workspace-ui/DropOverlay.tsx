import React from 'react';
import { CloudUpload } from 'lucide-react';

interface DropOverlayProps {
  isDragging: boolean;
}

export const DropOverlay: React.FC<DropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="drop-overlay">
      <div className="drop-content">
        <div className="drop-icon-wrapper">
          <CloudUpload size={48} className="drop-icon" />
        </div>
        <h4>Drop to Upload Schemas</h4>
        <p>Release to add your schemas to the workspace</p>
      </div>
    </div>
  );
};
