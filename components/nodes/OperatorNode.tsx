'use client';

import { useEffect, useMemo, useState } from 'react';
import { Handle, Position } from 'reactflow';

type Props = {
  id: string;
  data: {
    op?: string;
    onChangeOp?: (id: string, op: string) => void;
    outputCount?: number;
  };
};

export default function OperatorNode({ id, data }: Props) {
  const [value, setValue] = useState<string>(String(data?.op ?? ''));
  useEffect(() => {
    setValue(String(data?.op ?? ''));
  }, [data?.op]);

  const inputs = Math.max(0, Number((data as any)?.inputs ?? 2));
  const outputs = Math.max(1, Number((data as any)?.outputs ?? 1));

  return (
    <div style={{ padding: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 8, minWidth: 160 }}>
      {Array.from({ length: inputs }).map((_, i) => (
        <Handle key={`in-${i}`} type="target" position={Position.Left} id={`in-${i}`} style={{ top: 12 + i * 14 }} />
      ))}
      <div style={{ display: 'grid', gap: 6 }}>
        <input
          value={value}
          onChange={(e) => data.onChangeOp?.(id, e.target.value)}
          placeholder="operator (==, and, +, if)"
          style={{ width: '100%', outline: 'none', border: '1px solid #eee', borderRadius: 6, padding: '4px 6px', fontSize: 12 }}
        />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{ fontSize: 11, opacity: 0.7 }}>inputs:</label>
          <input
            type="number"
            min={0}
            max={8}
            value={inputs}
            onChange={(e) => {
              const next = Math.max(0, Math.min(8, Number(e.target.value || 0)));
              (data as any).inputs = next;
            }}
            style={{ width: 56, border: '1px solid #eee', borderRadius: 6, padding: '2px 4px', fontSize: 12 }}
          />
          <label style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>outputs:</label>
          <input
            type="number"
            min={1}
            max={8}
            value={outputs}
            onChange={(e) => {
              const next = Math.max(1, Math.min(8, Number(e.target.value || 1)));
              (data as any).outputs = next;
            }}
            style={{ width: 56, border: '1px solid #eee', borderRadius: 6, padding: '2px 4px', fontSize: 12 }}
          />
        </div>
      </div>
      {Array.from({ length: outputs }).map((_, i) => (
        <Handle key={`out-${i}`} type="source" position={Position.Right} id={`out-${i}`} style={{ top: 12 + i * 14 }} />
      ))}
    </div>
  );
}


