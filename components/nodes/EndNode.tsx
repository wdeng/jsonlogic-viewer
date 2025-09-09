'use client';

import { Handle, Position } from 'reactflow';

export default function EndNode() {
  return (
    <div style={{ padding: 8, background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: 999, fontSize: 12 }}>
      dst
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}


