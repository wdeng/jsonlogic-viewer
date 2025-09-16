'use client';

import { useEffect, useMemo, useState } from 'react';
import { Handle, Position } from 'reactflow';

type Props = {
  id: string;
  data: {
    op?: string;
    onChangeOp?: (id: string, op: string) => void;
    usedArgIndices?: number[];
  };
};

export default function OperatorNode({ id, data }: Props) {
  const [value, setValue] = useState<string>(String(data?.op ?? ''));
  useEffect(() => {
    setValue(String(data?.op ?? ''));
  }, [data?.op]);

  const outputs = 1;
  const inputs = useMemo(() => {
    const op = String(data?.op ?? '');
    const used = Array.isArray(data?.usedArgIndices) ? data!.usedArgIndices!.filter((n) => Number.isFinite(n) && Number(n) >= 0) : [];
    const usedCount = new Set(used).size;
    if (op === 'if' || op === '?:') return 3; // cond, then, else
    if (op === '!' || op === '!!') return 1; // unary
    if (op === 'and' || op === 'or' || op === '+') return Math.max(2, usedCount + 1); // variadic: one spare
    return 2; // default binary
  }, [data?.op, data?.usedArgIndices]);
  const commonOps = useMemo(
    () => ['==', '!=', '>', '>=', '<', '<=', 'and', 'or', '+', '-', '*', '/', '!', '!!', 'if', '?:'],
    []
  );

  return (
    <div style={{ padding: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 8, minWidth: 160 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={value}
            onChange={(e) => data.onChangeOp?.(id, e.target.value)}
            style={{ flex: 1, border: '1px solid #eee', borderRadius: 6, padding: '4px 6px', fontSize: 12 }}
          >
            {commonOps.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>
        {/* Inputs/outputs are determined by operator type and existing connections */}
      </div>
      {Array.from({ length: inputs }).map((_, i) => (
        <Handle key={`in-${i}`} type="target" position={Position.Left} id={`in-${i}`} style={{ top: 12 + i * 14 }} />
      ))}
      {Array.from({ length: outputs }).map((_, i) => (
        <Handle key={`out-${i}`} type="source" position={Position.Right} id={`out-${i}`} style={{ top: 12 + i * 14 }} />
      ))}
    </div>
  );
}


