'use client';

import { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';

type Props = {
  id: string;
  data: {
    name?: string;
    onChangeName?: (id: string, name: string) => void;
  };
};

export default function VarNode({ id, data }: Props) {
  const [value, setValue] = useState<string>(String(data?.name ?? ''));
  useEffect(() => {
    setValue(String(data?.name ?? ''));
  }, [data?.name]);
  return (
    <div style={{ padding: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 8, minWidth: 160 }}>
      <input
        value={value}
        onChange={(e) => data.onChangeName?.(id, e.target.value)}
        placeholder="var name"
        style={{ width: '100%', outline: 'none', border: '1px solid #eee', borderRadius: 6, padding: '4px 6px', fontSize: 12 }}
      />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}


