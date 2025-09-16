'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, Connection, Edge, Node, MarkerType } from 'reactflow';
import EndNode from '@/components/nodes/EndNode';
import OperatorNode from '@/components/nodes/OperatorNode';
import VarNode from '@/components/nodes/VarNode';
import ConstNode from '@/components/nodes/ConstNode';
import { flowToJsonLogic, jsonLogicToFlow } from '@/lib/logicFlow';

type Props = {
  initialJson: any;
  onJsonChange?: (next: any) => void;
  onGraphChange?: (graph: { nodes: Node[]; edges: Edge[] }) => void;
};

export default function FlowEditor({ initialJson, onJsonChange, onGraphChange }: Props) {
  const initial = useMemo(() => jsonLogicToFlow(initialJson), [initialJson]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(initial.edges);

  // Rebuild graph when initialJson changes (Import JSON)
  useEffect(() => {
    const g = jsonLogicToFlow(initialJson);
    setNodes(g.nodes);
    setEdges(g.edges);
  }, [initialJson, setNodes, setEdges]);

  const onChangeOp = useCallback((nodeId: string, op: string) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, op } } : n)));
  }, [setNodes]);
  const onChangeName = useCallback((nodeId: string, name: string) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, name } } : n)));
  }, [setNodes]);
  const onChangeValue = useCallback((nodeId: string, valueRaw: string) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, valueRaw } } : n)));
  }, [setNodes]);

  const nodeTypes = useMemo(() => ({
    end: EndNode,
    operator: OperatorNode,
    var: VarNode,
    const: ConstNode
  }), []);

  const onConnect = useCallback((connection: Connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return;
    if (sourceNode.type === 'end') return;
    if (targetNode.type === 'var' || targetNode.type === 'const') return; // leaves cannot accept inputs
    if (targetNode.id === 'dst' && edges.some((e) => e.target === 'dst')) return; // single result edge

    const data: any = {};
    let next: Connection = { ...connection };
    if (targetNode.type === 'operator') {
      const existing = edges.filter((e) => e.target === targetNode.id);
      const used = new Set(
        existing
          .map((e) => Number((e.data as any)?.argIndex))
          .filter((x) => Number.isFinite(x) && x >= 0) as number[]
      );
      const op = String((targetNode.data as any)?.op ?? '');
      const isVariadic = op === 'and' || op === 'or' || op === '+';
      const maxInputs = op === '!' || op === '!!' ? 1 : (op === 'if' || op === '?:') ? 3 : isVariadic ? Infinity : 2;
      if (maxInputs !== Infinity && used.size >= maxInputs) return; // cannot add more
      let idx = 0;
      const limit = maxInputs === Infinity ? Number.MAX_SAFE_INTEGER : (maxInputs as number);
      while (idx < limit && used.has(idx)) idx++;
      if (maxInputs !== Infinity && idx >= (maxInputs as number)) return;
      data.argIndex = idx;
      next = { ...next, targetHandle: `in-${idx}` };
    }
    setEdges((eds) => addEdge({ ...next, markerEnd: { type: MarkerType.ArrowClosed }, data }, eds));
  }, [nodes, edges, setEdges]);

  const onDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected || n.type === 'end'));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  const toJson = useCallback(() => flowToJsonLogic(nodes, edges), [nodes, edges]);

  const onAddNode = useCallback((type: Node['type']) => {
    const pos = { x: 400, y: 120 + Math.random() * 320 };
    const id = `${type}-${Date.now().toString(36).slice(-5)}`;
    const base: Node = { id, type, position: pos, data: {} } as Node;
    if (type === 'operator') base.data = { op: '==', onChangeOp };
    if (type === 'var') base.data = { name: 'x', onChangeName };
    if (type === 'const') base.data = { valueRaw: '0', onChangeValue };
    setNodes((nds) => nds.concat(base));
  }, [setNodes, onChangeOp, onChangeName, onChangeValue]);

  useEffect(() => {
    onJsonChange?.(toJson());
    onGraphChange?.({ nodes, edges });
  }, [nodes, edges, onJsonChange, onGraphChange, toJson]);

  // Compute used arg indices for each operator for dynamic input handles
  const operatorUsedArgs = useMemo(() => {
    const map = new Map<string, number[]>();
    edges.forEach((e) => {
      const idxRaw = (e.data as any)?.argIndex;
      const idx = Number(idxRaw);
      if (Number.isFinite(idx) && typeof e.target === 'string') {
        if (!map.has(e.target)) map.set(e.target, []);
        map.get(e.target)!.push(idx);
      }
    });
    return map;
  }, [edges]);

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 8, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => onAddNode('operator')} style={{ padding: '6px 10px' }}>Add Operator</button>
        <button onClick={() => onAddNode('var')} style={{ padding: '6px 10px' }}>Add Var</button>
        <button onClick={() => onAddNode('const')} style={{ padding: '6px 10px' }}>Add Const</button>
        <button onClick={onDeleteSelected} style={{ padding: '6px 10px' }}>Delete Selected</button>
      </div>
      <div style={{ height: '100%', border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes.map((n) => (
            n.type === 'operator'
              ? { ...n, data: { ...n.data, onChangeOp, usedArgIndices: operatorUsedArgs.get(n.id) || [] } }
              : { ...n, data: { ...n.data, onChangeName, onChangeValue } }
          ))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView
          style={{ width: '100%', height: '100%' }}
          defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }}
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}


