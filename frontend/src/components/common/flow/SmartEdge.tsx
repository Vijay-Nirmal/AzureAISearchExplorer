import React from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

type SmartEdgeData = {
  path?: string;
  labelX?: number;
  labelY?: number;
};

export const SmartEdge: React.FC<EdgeProps> = (props) => {
  const data = (props.data ?? {}) as SmartEdgeData;
  const path = data.path;
  const labelX = typeof data.labelX === 'number' ? data.labelX : (props.sourceX + props.targetX) / 2;
  const labelY = typeof data.labelY === 'number' ? data.labelY : (props.sourceY + props.targetY) / 2;

  if (!path) {
    // Fallback to a straight-ish edge if caller forgot to provide path.
    const fallback = `M ${props.sourceX},${props.sourceY} L ${props.targetX},${props.targetY}`;
    return <BaseEdge path={fallback} markerEnd={props.markerEnd} style={props.style} />;
  }

  return (
    <>
      <BaseEdge path={path} markerEnd={props.markerEnd} style={props.style} />
      {props.label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              color: 'var(--xy-edge-label-color, var(--xy-edge-label-color-default))',
              background: 'var(--xy-edge-label-background-color, var(--xy-edge-label-background-color-default))',
              padding: '2px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.10)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {String(props.label)}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
};
