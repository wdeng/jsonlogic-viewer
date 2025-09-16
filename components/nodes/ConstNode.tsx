'use client';

import { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';

type Props = {
  id: string;
  data: {
    valueRaw?: string;
    onChangeValue?: (id: string, valueRaw: string) => void;
  };
};

export default function ConstNode({ id, data }: Props) {
  const [value, setValue] = useState<string>(String(data?.valueRaw ?? ''));
  useEffect(() => {
    setValue(String(data?.valueRaw ?? ''));
  }, [data?.valueRaw]);
  return (
    <div style={{ padding: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 8, minWidth: 160 }}>
      <input
        value={value}
        onChange={(e) => data.onChangeValue?.(id, e.target.value)}
        placeholder="const value (e.g., 42, true, 'abc')"
        style={{ width: '100%', outline: 'none', border: '1px solid #eee', borderRadius: 6, padding: '4px 6px', fontSize: 12 }}
      />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}


