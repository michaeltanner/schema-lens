import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export const NamespaceNode = ({ data }: NodeProps) => {
  return (
    <div className="namespace-node">
      <Handle type="target" position={Position.Left} />
      <div className="namespace-node-label">{data.label as string}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
