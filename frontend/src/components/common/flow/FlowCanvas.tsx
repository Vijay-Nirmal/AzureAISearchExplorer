import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  Position,
  ReactFlow,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeProps,
  type OnSelectionChangeFunc,
  type Node,
  type NodeChange,
  type EdgeTypes,
  type NodeTypes,
  type ReactFlowInstance
} from '@xyflow/react';

import dagre from '@dagrejs/dagre';

import { SmartEdge } from './SmartEdge';

import '@xyflow/react/dist/style.css';
import './flowTheme.css';

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onPaneClick?: (event: React.MouseEvent) => void;
  onSelectionChange?: OnSelectionChangeFunc;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  fitViewKey?: string;
  focusNodeId?: string | null;

  nodeChrome?: {
    enabled?: boolean;
    showSelectionRing?: boolean;
    getSelectionRingColor?: (node: { id: string; type?: string; data: unknown }) => string;

    showEditButton?: boolean;
    isNodeEditable?: (node: { id: string; type?: string; data: unknown }) => boolean;
    onEditNode?: (node: { id: string; type?: string; data: unknown }) => void;
  };

  autoLayout?: {
    enabled?: boolean;
    direction?: 'LR' | 'TB';
    nodesep?: number;
    ranksep?: number;
    margin?: number;
    getNodeSize?: (node: Node) => { width: number; height: number };
  };

  smartRouting?: {
    enabled?: boolean;
    padding?: number;
    laneStep?: number;
    maxAttempts?: number;
  };
}

type Rect = { x: number; y: number; w: number; h: number };

const expandRect = (r: Rect, pad: number): Rect => ({ x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 });

const segIntersectsRect = (ax: number, ay: number, bx: number, by: number, r: Rect) => {
  const minX = Math.min(ax, bx);
  const maxX = Math.max(ax, bx);
  const minY = Math.min(ay, by);
  const maxY = Math.max(ay, by);

  // Only supporting axis-aligned segments.
  if (ay === by) {
    const y = ay;
    if (y < r.y || y > r.y + r.h) return false;
    return !(maxX < r.x || minX > r.x + r.w);
  }
  if (ax === bx) {
    const x = ax;
    if (x < r.x || x > r.x + r.w) return false;
    return !(maxY < r.y || minY > r.y + r.h);
  }

  return false;
};

const pickLabelPoint = (pts: Array<{ x: number; y: number }>) => {
  if (pts.length < 2) return { x: 0, y: 0 };
  // Choose the midpoint of the longest segment to keep labels away from tight corners.
  let best = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  let bestLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i].x;
    const ay = pts[i].y;
    const bx = pts[i + 1].x;
    const by = pts[i + 1].y;
    const len = Math.abs(bx - ax) + Math.abs(by - ay);
    if (len > bestLen) {
      bestLen = len;
      best = { x: (ax + bx) / 2, y: (ay + by) / 2 };
    }
  }
  return best;
};

const mkPath = (pts: Array<{ x: number; y: number }>) => {
  if (!pts.length) return '';
  return `M ${pts[0].x},${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x},${p.y}`).join(' ');
};

const getDefaultNodeSize = (node: Node) => {
  const maybeMeasured = (node as unknown as { measured?: { width?: number; height?: number } }).measured;
  const width = maybeMeasured?.width;
  const height = maybeMeasured?.height;

  if (typeof width === 'number' && typeof height === 'number') return { width, height };
  return { width: 240, height: 120 };
};

const autoLayoutNodes = (nodes: Node[], edges: Edge[], opts: NonNullable<FlowCanvasProps['autoLayout']>) => {
  const direction = opts.direction ?? 'LR';
  const nodesep = opts.nodesep ?? 60;
  const ranksep = opts.ranksep ?? 140;
  const margin = opts.margin ?? 20;
  const getNodeSize = opts.getNodeSize ?? getDefaultNodeSize;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep,
    ranksep,
    marginx: margin,
    marginy: margin
  });

  for (const n of nodes) {
    const { width, height } = getNodeSize(n);
    g.setNode(n.id, { width, height });
  }
  for (const e of edges) g.setEdge(e.source, e.target);

  dagre.layout(g);

  return nodes.map((n) => {
    const nodeWithPos = g.node(n.id) as { x: number; y: number } | undefined;
    if (!nodeWithPos) return n;
    const { width, height } = getNodeSize(n);
    return {
      ...n,
      position: { x: nodeWithPos.x - width / 2, y: nodeWithPos.y - height / 2 },
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom
    };
  });
};

const routeEdgesSmart = (nodes: Node[], edges: Edge[], opts: NonNullable<FlowCanvasProps['smartRouting']>, getNodeSize?: (node: Node) => { width: number; height: number }) => {
  const padding = opts.padding ?? 12;
  const laneStep = opts.laneStep ?? 26;
  const maxAttempts = opts.maxAttempts ?? 18;
  const size = getNodeSize ?? getDefaultNodeSize;

  const boundsById = new Map<string, Rect>();
  for (const n of nodes) {
    const { width, height } = size(n);
    boundsById.set(n.id, { x: n.position.x, y: n.position.y, w: width, h: height });
  }

  const obstacleRects = Array.from(boundsById.entries()).map(([id, r]) => [id, expandRect(r, padding)] as const);

  const getAnchor = (nodeId: string, side: 'L' | 'R') => {
    const r = boundsById.get(nodeId);
    if (!r) return { x: 0, y: 0 };
    return {
      x: side === 'R' ? r.x + r.w : r.x,
      y: r.y + r.h / 2
    };
  };

  const isPathClear = (segments: Array<[number, number, number, number]>, sourceId: string, targetId: string) => {
    for (const [oid, rect] of obstacleRects) {
      if (oid === sourceId || oid === targetId) continue;
      for (const [ax, ay, bx, by] of segments) {
        if (segIntersectsRect(ax, ay, bx, by, rect)) return false;
      }
    }
    return true;
  };

  const edgeGroups = new Map<string, { count: number; seen: number }>();
  for (const e of edges) {
    const key = `${e.source}::${e.target}`;
    const entry = edgeGroups.get(key);
    if (entry) entry.count += 1;
    else edgeGroups.set(key, { count: 1, seen: 0 });
  }

  return edges.map((e) => {
    const key = `${e.source}::${e.target}`;
    const group = edgeGroups.get(key);
    const groupIndex = group ? group.seen : 0;
    const groupCount = group ? group.count : 1;
    if (group) group.seen += 1;
    const parallelOffset = (groupIndex - (groupCount - 1) / 2) * (laneStep * 0.65);

    const s = getAnchor(e.source, 'R');
    const t = getAnchor(e.target, 'L');

    const x1 = s.x + 28;
    const x2 = t.x - 28;
    const baseMid = (s.y + t.y) / 2 + parallelOffset;

    let chosenMid = baseMid;
    let points: Array<{ x: number; y: number }> = [];

    const buildCandidate = (midY: number) => {
      const pts = [
        { x: s.x, y: s.y },
        { x: x1, y: s.y },
        { x: x1, y: midY },
        { x: x2, y: midY },
        { x: x2, y: t.y },
        { x: t.x, y: t.y }
      ];
      const segs: Array<[number, number, number, number]> = [];
      for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y]);
      return { pts, segs };
    };

    if (t.x <= s.x + 20) {
      points = [
        { x: s.x, y: s.y },
        { x: s.x + 30, y: s.y + parallelOffset },
        { x: s.x + 30, y: t.y + parallelOffset },
        { x: t.x, y: t.y }
      ];
    } else {
      let found = false;
      for (let a = 0; a < maxAttempts; a++) {
        const offset = Math.ceil(a / 2) * laneStep * (a % 2 === 0 ? 1 : -1);
        const midY = baseMid + offset;
        const cand = buildCandidate(midY);
        if (isPathClear(cand.segs, e.source, e.target)) {
          chosenMid = midY;
          points = cand.pts;
          found = true;
          break;
        }
      }
      if (!found) points = buildCandidate(chosenMid).pts;
    }

    const path = mkPath(points);
    const labelPoint = pickLabelPoint(points);
    return {
      ...e,
      type: 'smart',
      data: { ...(e.data as Record<string, unknown> | undefined), path, labelX: labelPoint.x, labelY: labelPoint.y }
    } as Edge;
  });
};

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onPaneClick,
  onSelectionChange,
  nodeTypes,
  edgeTypes,
  fitViewKey,
  focusNodeId,
  autoLayout,
  smartRouting,
  nodeChrome
}) => {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [localNodes, setLocalNodes] = useState<Node[]>(nodes);
  const nodeChromeRef = React.useRef(nodeChrome);

  useEffect(() => {
    nodeChromeRef.current = nodeChrome;
  }, [nodeChrome]);

  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setLocalNodes((prev) => applyNodeChanges(changes, prev));
      onNodesChange?.(changes);
    },
    [onNodesChange]
  );
  const layoutedNodes = useMemo(() => {
    if (!autoLayout?.enabled) return localNodes;
    return autoLayoutNodes(localNodes, edges, autoLayout);
  }, [autoLayout, edges, localNodes]);

  const routedEdges = useMemo(() => {
    if (!smartRouting?.enabled) return edges;
    return routeEdgesSmart(layoutedNodes, edges, smartRouting, autoLayout?.getNodeSize);
  }, [autoLayout?.getNodeSize, edges, layoutedNodes, smartRouting]);

  const mergedEdgeTypes = useMemo(() => {
    if (!smartRouting?.enabled) return edgeTypes;
    return { ...(edgeTypes || {}), smart: SmartEdge } as EdgeTypes;
  }, [edgeTypes, smartRouting?.enabled]);

  const chromeNodeTypes = useMemo(() => {
    if (!nodeTypes) return nodeTypes;

    const chromeEnabled = nodeChrome?.enabled ?? false;
    if (!chromeEnabled) return nodeTypes;

    const wrap = (Inner: React.ComponentType<NodeProps>) => {
      const Wrapped: React.FC<NodeProps> = (props) => {
        const nodeRef = { id: props.id, type: props.type, data: props.data };
        const chrome = nodeChromeRef.current;
        const showRing = chrome?.showSelectionRing ?? true;
        const showEditButton = chrome?.showEditButton ?? true;
        const ringColor = chrome?.getSelectionRingColor?.(nodeRef) ?? 'rgba(0,120,212,0.85)';
        const canEdit =
          !!chrome?.onEditNode &&
          (chrome?.isNodeEditable ? chrome.isNodeEditable(nodeRef) : true);

        return (
          <div
            className={`flow-node-chrome${props.selected ? ' flow-node-chrome--selected' : ''}`}
            style={{
              position: 'relative',
              borderRadius: 14,
              zIndex: props.selected ? 50 : 1,
              boxShadow:
                showRing && props.selected
                  ? `0 0 0 2px ${ringColor}`
                  : 'none'
            }}
          >
            {showEditButton && canEdit && (
              <button
                type="button"
                className="flow-node-edit-btn"
                title="Edit"
                aria-label="Edit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  chrome?.onEditNode?.(nodeRef);
                }}
              >
                <i className="fas fa-pen" />
              </button>
            )}
            <Inner {...props} />
          </div>
        );
      };

      return Wrapped;
    };

    const next: Record<string, React.ComponentType<NodeProps>> = {};
    for (const [key, Comp] of Object.entries(nodeTypes)) {
      next[key] = wrap(Comp as unknown as React.ComponentType<NodeProps>);
    }
    return next as unknown as NodeTypes;
  }, [nodeTypes, nodeChrome?.enabled]);

  React.useEffect(() => {
    if (!focusNodeId || !rfInstance) return;
    const node = layoutedNodes.find((n) => n.id === focusNodeId);
    if (!node) return;
    const width = (node as unknown as { measured?: { width?: number } }).measured?.width ?? 240;
    const height = (node as unknown as { measured?: { height?: number } }).measured?.height ?? 120;
    const centerX = node.position.x + width / 2;
    const centerY = node.position.y + height / 2;

    requestAnimationFrame(() => {
      rfInstance.fitView({ nodes: [{ id: node.id }], padding: 0.6, duration: 500 });
      rfInstance.setCenter(centerX, centerY, { zoom: 1.1, duration: 500 });
    });
  }, [focusNodeId, layoutedNodes, rfInstance]);

  return (
    <div style={{ flex: 1, minHeight: 0, background: 'var(--bg-color)' }}>
      <ReactFlow
        key={fitViewKey}
        nodes={layoutedNodes}
        edges={routedEdges}
        onInit={setRfInstance}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={chromeNodeTypes}
        edgeTypes={mergedEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          animated: false,
          style: { stroke: 'rgba(255,255,255,0.34)', strokeWidth: 1.6 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: 'rgba(255,255,255,0.48)' }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="rgba(255,255,255,0.08)" />
        <MiniMap
          pannable
          zoomable
          nodeStrokeColor={(n) => {
            if (n.type === 'skill') return 'rgba(0,120,212,0.65)';
            if (n.type === 'selector') return 'rgba(110,220,140,0.65)';
            if (n.type === 'mapping') return 'rgba(255,210,120,0.55)';
            return 'rgba(255,255,255,0.18)';
          }}
          nodeColor={(n) => {
            if (n.type === 'skill') return 'rgba(0,120,212,0.22)';
            if (n.type === 'selector') return 'rgba(110,220,140,0.18)';
            if (n.type === 'mapping') return 'rgba(255,210,120,0.12)';
            return 'rgba(255,255,255,0.06)';
          }}
          maskColor="rgba(0,0,0,0.35)"
          style={{ background: 'rgba(30,30,30,0.92)', border: '1px solid rgba(255,255,255,0.10)' }}
        />
        <Controls style={{ background: 'rgba(30,30,30,0.92)', border: '1px solid rgba(255,255,255,0.10)' }} />
      </ReactFlow>
    </div>
  );
};
