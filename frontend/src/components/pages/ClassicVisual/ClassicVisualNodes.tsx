import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

import type { BaseCardData, FieldNodeData, SelectorNodeData, SkillNodeData } from './ClassicVisualNodeTypes';

const resourceTagColors: Record<string, { bg: string; border: string; text: string }> = {
  'Indexer': { bg: 'rgba(0,120,212,0.22)', border: 'rgba(0,120,212,0.55)', text: 'rgba(235,245,255,0.95)' },
  'Index': { bg: 'rgba(90,200,250,0.18)', border: 'rgba(90,200,250,0.55)', text: 'rgba(230,250,255,0.95)' },
  'Skillset': { bg: 'rgba(120,160,255,0.20)', border: 'rgba(120,160,255,0.55)', text: 'rgba(235,240,255,0.95)' },
  'Data Source': { bg: 'rgba(160,110,255,0.18)', border: 'rgba(160,110,255,0.55)', text: 'rgba(240,230,255,0.95)' },
  'Alias': { bg: 'rgba(255,160,110,0.18)', border: 'rgba(255,160,110,0.55)', text: 'rgba(255,240,230,0.95)' },
  'Synonym Map': { bg: 'rgba(255,210,120,0.18)', border: 'rgba(255,210,120,0.60)', text: 'rgba(255,245,220,0.95)' }
};

const actionTagColors: Record<string, { bg: string; border: string; text: string }> = {
  'Pipeline': { bg: 'rgba(0,200,140,0.16)', border: 'rgba(0,200,140,0.55)', text: 'rgba(225,255,245,0.95)' },
  'Definition': { bg: 'rgba(255,210,120,0.16)', border: 'rgba(255,210,120,0.55)', text: 'rgba(255,240,210,0.95)' },
  'Skill': { bg: 'rgba(255,140,200,0.16)', border: 'rgba(255,140,200,0.55)', text: 'rgba(255,235,245,0.95)' },
  'Index Projection': { bg: 'rgba(110,220,140,0.18)', border: 'rgba(110,220,140,0.55)', text: 'rgba(235,255,240,0.95)' },
  'Field': { bg: 'rgba(255,180,80,0.16)', border: 'rgba(255,180,80,0.55)', text: 'rgba(255,240,210,0.95)' },
  'Source': { bg: 'rgba(160,200,255,0.16)', border: 'rgba(160,200,255,0.55)', text: 'rgba(235,245,255,0.95)' },
  'Mapping': { bg: 'rgba(255,220,160,0.16)', border: 'rgba(255,220,160,0.55)', text: 'rgba(255,245,225,0.95)' },
  'Routing': { bg: 'rgba(200,160,255,0.16)', border: 'rgba(200,160,255,0.55)', text: 'rgba(240,230,255,0.95)' },
  'Connection': { bg: 'rgba(120,220,255,0.16)', border: 'rgba(120,220,255,0.55)', text: 'rgba(230,250,255,0.95)' }
};

const getTagStyle = (kind: 'resource' | 'action', label: string) => {
  const palette = kind === 'resource' ? resourceTagColors : actionTagColors;
  const color = palette[label] ?? { bg: 'rgba(140,180,255,0.18)', border: 'rgba(140,180,255,0.45)', text: 'rgba(230,240,255,0.9)' };
  return {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 999,
    background: color.bg,
    border: `1px solid ${color.border}`,
    color: color.text,
    opacity: 0.9
  } as React.CSSProperties;
};

export const CardNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as BaseCardData;
  return (
    <div
      style={{
        width: 300,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(20,20,20,0.85)',
        boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
        color: 'var(--text-color)',
        overflow: 'hidden'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <i className={`fas ${d.icon || 'fa-square'}`} style={{ opacity: 0.9, color: 'var(--accent-color)' }}></i>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
          {d.subtitle && (
            <div style={{ fontSize: 11, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {d.resourceTag && (
            <div
              style={getTagStyle('resource', d.resourceTag)}
            >
              {d.resourceTag}
            </div>
          )}
          {d.actionTag && (
            <div
              style={getTagStyle('action', d.actionTag)}
            >
              {d.actionTag}
            </div>
          )}
          {d.badge && (
            <div
              style={getTagStyle('resource', d.badge)}
            >
              {d.badge}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, opacity: 0.85 }}>
        {(d.meta ? [d.meta] : []).concat(d.lines || []).map((l: string, i: number) => (
          <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkillNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as SkillNodeData;
  const height = typeof d.height === 'number' ? d.height : 200;
  return (
    <div
      style={{
        width: 420,
        height,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(18,18,18,0.92)',
        boxShadow: '0 10px 26px rgba(0,0,0,0.55)',
        color: 'var(--text-color)',
        overflow: 'hidden'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
          {d.subtitle && (
            <div style={{ fontSize: 11, opacity: 0.72, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
          )}
          {d.meta && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{d.meta}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          {d.resourceTag && (
            <div
              style={getTagStyle('resource', d.resourceTag)}
            >
              {d.resourceTag}
            </div>
          )}
          {d.actionTag && (
            <div
              style={getTagStyle('action', d.actionTag)}
            >
              {d.actionTag}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 12px' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, marginBottom: 6 }}>Inputs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            {(d.inputs || []).length ? (
              (d.inputs || []).map((l: string, i: number) => (
                <div key={i} title={l} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.86 }}>
                  {l}
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.45 }}>(none)</div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, marginBottom: 6 }}>Outputs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            {(d.outputs || []).length ? (
              (d.outputs || []).map((l: string, i: number) => (
                <div key={i} title={l} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.86 }}>
                  {l}
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.45 }}>(none)</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, opacity: 0.65 }}>
        Click to select • Double-click to edit
      </div>
    </div>
  );
};

export const SelectorNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as SelectorNodeData;
  return (
    <div style={{ width: 300, borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(16,16,16,0.92)', boxShadow: '0 6px 22px rgba(0,0,0,0.45)', color: 'var(--text-color)', overflow: 'hidden' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
          {d.subtitle && (
            <div style={{ fontSize: 11, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
          )}
          {d.meta && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.meta}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          {d.resourceTag && (
            <div
              style={{ ...getTagStyle('resource', d.resourceTag), whiteSpace: 'nowrap' }}
            >
              {d.resourceTag}
            </div>
          )}
          {d.actionTag && (
            <div
              style={{ ...getTagStyle('action', d.actionTag), whiteSpace: 'nowrap' }}
            >
              {d.actionTag}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, opacity: 0.85 }}>
        {(d.lines || []).length ? (
          (d.lines || []).map((l: string, i: number) => (
            <div key={i} title={l} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {l}
            </div>
          ))
        ) : (
          <div style={{ opacity: 0.5 }}>(no mappings)</div>
        )}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, opacity: 0.65 }}>
        Click to select • Double-click to edit
      </div>
    </div>
  );
};

export const FieldNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as FieldNodeData;
  return (
    <div
      style={{
        width: 260,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(14,14,14,0.92)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
        color: 'var(--text-color)',
        overflow: 'hidden'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <i className="fas fa-stream" style={{ opacity: 0.8, color: 'var(--accent-color)' }}></i>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
          {d.subtitle && (
            <div style={{ fontSize: 10, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {d.resourceTag && (
            <div
              style={{ ...getTagStyle('resource', d.resourceTag), fontSize: 9, padding: '2px 5px' }}
            >
              {d.resourceTag}
            </div>
          )}
          {d.actionTag && (
            <div
              style={{ ...getTagStyle('action', d.actionTag), fontSize: 9, padding: '2px 5px' }}
            >
              {d.actionTag}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10, opacity: 0.85 }}>
        {(d.lines || []).length ? (
          (d.lines || []).map((l: string, i: number) => (
            <div key={i} title={l} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {l}
            </div>
          ))
        ) : (
          <div style={{ opacity: 0.5 }}>(no details)</div>
        )}
      </div>
    </div>
  );
};

