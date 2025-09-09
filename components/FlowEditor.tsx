'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, Connection, Edge, Node, MarkerType } from 'reactflow';
import StartNode from '@/components/nodes/StartNode';
import EndNode from '@/components/nodes/EndNode';
import OperatorNode from '@/components/nodes/OperatorNode';
import VarNode from '@/components/nodes/VarNode';
import ConstNode from '@/components/nodes/ConstNode';
import { flowToJsonLogic, jsonLogicToFlow } from '@/lib/logicFlow';

type Props = {
  initialJson: any;
  onJsonChange?: (next: any) => void;
};

export default function FlowEditor({ initialJson, onJsonChange }: Props) {
  const initial = useMemo(() => jsonLogicToFlow(initialJson), [initialJson]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(initial.edges);

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
    start: StartNode,
    end: EndNode,
    operator: OperatorNode,
    var: VarNode,
    const: ConstNode
  }), []);

  const onConnect = useCallback((connection: Connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return;
    if (sourceNode.type === 'end' || targetNode.type === 'start') return;
    const data: any = {};
    if (targetNode.type === 'operator') {
      const existing = edges.filter((e) => e.target === targetNode.id);
      const used = new Set(existing.map((e) => (e.data as any)?.argIndex).filter((x) => Number.isInteger(x)) as number[]);
      let idx = 0;
      while (used.has(idx)) idx++;
      data.argIndex = idx;
    }
    setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, data }, eds));
  }, [nodes, edges, setEdges]);

  const onDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected || n.type === 'start' || n.type === 'end'));
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

  useMemo(() => {
    onJsonChange?.(toJson());
  }, [nodes, edges]);

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 8, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => onAddNode('operator')} style={{ padding: '6px 10px' }}>Add Operator</button>
        <button onClick={() => onAddNode('var')} style={{ padding: '6px 10px' }}>Add Var</button>
        <button onClick={() => onAddNode('const')} style={{ padding: '6px 10px' }}>Add Const</button>
        <button onClick={onDeleteSelected} style={{ padding: '6px 10px' }}>Delete Selected</button>
      </div>
      <div style={{ height: '100%', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes.map((n) => ({ ...n, data: { ...n.data, onChangeOp, onChangeName, onChangeValue } }))}
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


