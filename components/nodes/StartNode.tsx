'use client';

import { Handle, Position } from 'reactflow';

export default function StartNode() {
  return (
    <div style={{ padding: 8, background: '#e1f5fe', border: '1px solid #81d4fa', borderRadius: 999, fontSize: 12 }}>
      src
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}


