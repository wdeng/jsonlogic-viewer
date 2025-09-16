import type { Edge, Node } from 'reactflow';

export type FlowGraph = { nodes: Node[]; edges: Edge[] };

function createIdGenerator(prefix: string) {
  let seq = 1;
  return () => `${prefix}-${seq++}`;
}

export const nextOpId = createIdGenerator('op');
export const nextVarId = createIdGenerator('var');
export const nextConstId = createIdGenerator('const');

export function jsonLogicToFlow(rule: any): FlowGraph {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const dst: Node = { id: 'dst', type: 'end', position: { x: 860, y: 240 }, data: {} };
  nodes.push(dst);

  let yCursor = 120;
  function place(): { x: number; y: number } {
    const p = { x: 320, y: yCursor };
    yCursor += 120;
    return p;
  }

  function build(exp: any): string {
    if (exp && typeof exp === 'object' && !Array.isArray(exp)) {
      const keys = Object.keys(exp);
      if (keys.length === 1) {
        const key = keys[0];
        if (key === 'var') {
          const id = nextVarId();
          nodes.push({ id, type: 'var', position: place(), data: { name: String(exp[key]) } });
          return id;
        }
        const id = nextOpId();
        const args: any[] = Array.isArray(exp[key]) ? exp[key] : [exp[key]];
        nodes.push({ id, type: 'operator', position: place(), data: { op: key } });
        args.forEach((arg, i) => {
          const childId = build(arg);
          edges.push({ id: `${childId}->${id}`, source: childId, target: id, targetHandle: `in-${i}`, data: { argIndex: i } });
        });
        return id;
      }
    }
    const id = nextConstId();
    nodes.push({ id, type: 'const', position: place(), data: { valueRaw: JSON.stringify(exp) } });
    return id;
  }

  const rootId = build(rule);
  edges.push({ id: `${rootId}->dst`, source: rootId, target: 'dst' });
  return { nodes, edges };
}

export function flowToJsonLogic(allNodes: Node[], allEdges: Edge[]): any {
  const idToNode = new Map(allNodes.map((n) => [n.id, n] as const));
  const incoming = new Map<string, Edge[]>();
  allEdges.forEach((e) => {
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e);
  });

  const intoDst = (incoming.get('dst') || [])[0];
  if (!intoDst) return {};
  const rootId: string = intoDst.source;

  function toValue(id: string): any {
    const node = idToNode.get(id);
    if (!node) return null;
    if (node.type === 'var') {
      return { var: String((node.data as any)?.name ?? '') };
    }
    if (node.type === 'const') {
      const raw = String((node.data as any)?.valueRaw ?? 'null');
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    if (node.type === 'operator') {
      const children = (incoming.get(node.id) || [])
        .slice()
        .sort((a, b) => {
          const ai = Number((a.data as any)?.argIndex ?? Number.MAX_SAFE_INTEGER);
          const bi = Number((b.data as any)?.argIndex ?? Number.MAX_SAFE_INTEGER);
          return ai - bi;
        })
        .filter((e) => Number.isFinite(Number((e.data as any)?.argIndex)));
      const args = children.map((e) => toValue(e.source));
      const op = String((node.data as any)?.op ?? '');
      return { [op]: args } as Record<string, unknown>;
    }
    return null;
  }

  return toValue(rootId);
}


