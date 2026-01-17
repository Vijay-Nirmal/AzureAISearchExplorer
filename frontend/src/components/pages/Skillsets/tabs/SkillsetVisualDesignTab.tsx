import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Edge, Node, NodeProps, NodeTypes } from '@xyflow/react';

import { Button } from '../../../common/Button';
import { Card } from '../../../common/Card';
import { FlowCanvas } from '../../../common/flow/FlowCanvas';
import { SchemaDrivenEditorModal } from '../../../common/configDriven/SchemaDrivenEditorModal';
import { applyDefaultsForType, getResolvedTypeDefinitions } from '../../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../../common/configDriven/configDrivenTypes';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';
import { confirmService } from '../../../../services/confirmService';

import skillsSchemaJson from '../../../../data/constants/config/Skillset/Skills/skillsConfig.json';
import selectorTypeJson from '../../../../data/constants/config/Skillset/IndexProjections/types/SearchIndexerIndexProjectionSelector.json';
import mappingTypeJson from '../../../../data/constants/config/Skillset/types/InputFieldMappingEntry.json';

interface SkillsetVisualDesignTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const getSkillName = (skill: Record<string, unknown>, index: number) => {
  const n = trim(skill.name);
  return n ? n : `#${index + 1}`;
};

const getSkillType = (skill: Record<string, unknown>) => trim(skill['@odata.type']);

const getSkillContext = (skill: Record<string, unknown>) => trim(skill.context) || '/document';

const getArrayOfObjects = (v: unknown) => (Array.isArray(v) ? v.filter(isPlainObject) : ([] as Record<string, unknown>[]));

const asPathish = (s: string) => s.replace(/^=\s*/, '').replace(/^'+|'+$/g, '').replace(/^"+|"+$/g, '');

const makeSchemaFromType = (
  title: string,
  typeDef: ConfigDrivenTypeDefinition,
  entityKeys?: { discriminatorKey?: string; nameKey?: string }
): ConfigDrivenSchema => {
  return {
    entity: {
      title,
      description: typeDef.description,
      discriminatorKey: entityKeys?.discriminatorKey ?? '@odata.type',
      nameKey: entityKeys?.nameKey ?? 'name'
    },
    commonFields: [],
    types: [typeDef]
  };
};

const skillsSchema = skillsSchemaJson as unknown as ConfigDrivenSchema;
const selectorType = selectorTypeJson as unknown as ConfigDrivenTypeDefinition;
const mappingType = mappingTypeJson as unknown as ConfigDrivenTypeDefinition;

const selectorSchema: ConfigDrivenSchema = makeSchemaFromType('Index Projection Selector', selectorType);
const mappingSchema: ConfigDrivenSchema = makeSchemaFromType('Projection Mapping', mappingType);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const makePathMatcher = (path: string) => {
  const trimmed = trim(path);
  if (!trimmed) return null;
  // Convert skill output paths to a regex that matches the start of a JSON-path-like string.
  // `*` is treated as a single path segment wildcard.
  const escaped = escapeRegExp(trimmed).replace(/\\\*/g, '[^/]+');
  return new RegExp(`^${escaped}(?:$|/)`);
};

type EditorTarget =
  | { kind: 'skill'; index: number; value: Record<string, unknown> }
  | { kind: 'selector'; index: number; value: Record<string, unknown> };

type BaseCardData = {
  title: string;
  subtitle: string;
  lines?: string[];
  meta?: string;
  icon?: string;
};

type SkillNodeData = BaseCardData & {
  kind: 'skill';
  index: number;
  inputs: string[];
  outputs: string[];
  height?: number;
};

type SelectorNodeData = BaseCardData & {
  kind: 'selector';
  index: number;
};

type VisualNodeData = BaseCardData | SkillNodeData | SelectorNodeData;

const getNodeSize = (node: Node) => {
  switch (node.type) {
    case 'skill': {
      const d = node.data as unknown as SkillNodeData;
      return { width: 420, height: typeof d.height === 'number' ? d.height : 220 };
    }
    case 'selector': {
      const d = node.data as unknown as SelectorNodeData;
      const lines = Array.isArray(d.lines) ? d.lines.length : 0;
      // Header ~70px + each mapping line ~18px + footer ~40px
      return { width: 320, height: Math.max(180, 120 + lines * 18) };
    }
    case 'card':
    default: {
      const d = node.data as unknown as BaseCardData;
      const lines = Array.isArray(d.lines) ? d.lines.length : 0;
      return { width: 300, height: Math.max(140, 110 + lines * 18) };
    }
  }
};

const buildGraph = (skillsetDef: SearchIndexerSkillset) => {
  const skills = Array.isArray(skillsetDef.skills) ? (skillsetDef.skills as unknown[]).filter(isPlainObject) : [];
  const indexProjections = isPlainObject(skillsetDef.indexProjections) ? (skillsetDef.indexProjections as Record<string, unknown>) : null;
  const selectors = indexProjections ? getArrayOfObjects(indexProjections.selectors) : [];

  const nodes: Node<VisualNodeData>[] = [];
  const edges: Edge[] = [];

  const rootId = 'doc-root';
  nodes.push({
    id: rootId,
    type: 'card',
    position: { x: 40, y: 120 },
    data: {
      title: 'Document Root',
      subtitle: '/document',
      lines: ['Global source for raw fields & metadata'],
      icon: 'fa-database'
    }
  });

  // Precompute skill output paths for dependency detection.
  const skillOutputs = skills.map((skill, i) => {
    const context = getSkillContext(skill);
    const outputs = getArrayOfObjects(skill.outputs);
    const outputTargets = outputs
      .map(o => trim(o.targetName) || trim(o.name))
      .filter(Boolean);
    const paths = outputTargets.map(t => `${context.replace(/\/$/, '')}/${t}`);
    const matchers = paths.map(makePathMatcher).filter((m): m is RegExp => !!m);
    return { index: i, context, paths, outputTargets, matchers };
  });

  const isProducedByAnySkill = (source: string, excludeSkillIndex?: number) => {
    if (!source) return false;
    for (const out of skillOutputs) {
      if (typeof excludeSkillIndex === 'number' && out.index === excludeSkillIndex) continue;
      if (out.matchers.some(m => m.test(source))) return true;
    }
    return false;
  };

  const getBestProducingSkillNodeId = (source: string) => {
    if (!source) return null;
    let best: { nodeId: string; score: number } | null = null;

    for (const out of skillOutputs) {
      for (let i = 0; i < out.matchers.length; i++) {
        const matcher = out.matchers[i];
        if (!matcher.test(source)) continue;
        const path = out.paths[i] ?? '';
        const score = path.length;
        const nodeId = `skill-${out.index}`;
        if (!best || score > best.score) best = { nodeId, score };
      }
    }

    return best?.nodeId ?? null;
  };

  const skillNodeIds = new Map<number, string>();
  const skillBaseX = 420;
  let y = 40;

  for (let i = 0; i < skills.length; i++) {
    const s = skills[i];
    const inputs = getArrayOfObjects(s.inputs);
    const outputs = getArrayOfObjects(s.outputs);
    const name = getSkillName(s, i);
    const type = getSkillType(s) || '(type not set)';
    const context = getSkillContext(s);

    const inputLines = inputs
      .map(inp => {
        const n = trim(inp.name) || 'input';
        const src = trim(inp.source);
        return `${n}: ${src || '(unset)'}`;
      })
      .slice(0, 6);

    const outputLines = outputs
      .map(out => {
        const n = trim(out.name) || 'output';
        const tn = trim(out.targetName) || trim(out.name);
        return `${n} → ${tn || '(unset)'}`;
      })
      .slice(0, 6);

    const height = 140 + Math.max(inputLines.length, outputLines.length) * 14;
    const nodeId = `skill-${i}`;
    skillNodeIds.set(i, nodeId);

    nodes.push({
      id: nodeId,
      type: 'skill',
      position: { x: skillBaseX, y },
      data: {
        title: name,
        subtitle: type,
        meta: context,
        inputs: inputLines,
        outputs: outputLines,
        kind: 'skill',
        index: i,
        height
      }
    });

    // Root -> skill if it has any /document input.
    // Root -> skill only when a skill consumes a *raw* /document field that is not produced by another skill.
    // Example: /document/pages/* is produced by SplitSkill (/document/pages), so we do NOT draw root -> embedding.
    const anyRootInput = inputs.some(inp => {
      const src = trim(inp.source);
      if (!src.startsWith('/document')) return false;
      if (src.startsWith("='")) return false;
      if (src.startsWith('="')) return false;
      return !isProducedByAnySkill(src, i);
    });
    if (anyRootInput) {
      edges.push({
        id: `e-root-skill-${i}`,
        source: rootId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: 'rgba(110,190,255,0.35)' }
      });
    }

    y += height + 22;
  }

  // Skill -> Skill dependencies based on output path substring matching.
  for (let b = 0; b < skills.length; b++) {
    const skillB = skills[b];
    const inputsB = getArrayOfObjects(skillB.inputs);
    const sourcesB = inputsB.map(i => trim(i.source)).filter(Boolean);
    for (let a = 0; a < skillOutputs.length; a++) {
      if (a === b) continue;
      const outA = skillOutputs[a];
      const match = sourcesB.some(src => outA.matchers.some(m => m.test(src)));
      if (!match) continue;
      edges.push({
        id: `e-skill-${a}-to-${b}`,
        source: `skill-${a}`,
        target: `skill-${b}`,
        type: 'smoothstep',
        style: { stroke: 'rgba(255,255,255,0.22)' }
      });
    }
  }

  // Index Projections section.
  const indexNodesByName = new Map<string, string>();
  const ensureIndexNode = (targetIndexName: string) => {
    const key = targetIndexName || '(unset index)';
    const existing = indexNodesByName.get(key);
    if (existing) return existing;

    const idx = indexNodesByName.size;
    const nodeId = `index-${idx}`;
    indexNodesByName.set(key, nodeId);
    nodes.push({
      id: nodeId,
      type: 'card',
      position: { x: 1360, y: 120 + idx * 220 },
      data: {
        title: 'Index',
        subtitle: key,
        lines: ['Target search index'],
        icon: 'fa-table'
      }
    });
    return nodeId;
  };

  let selY = 220;
  for (let si = 0; si < selectors.length; si++) {
    const sel = selectors[si];
    const targetIndexName = trim(sel.targetIndexName) || '(unset index)';
    const sourceContext = trim(sel.sourceContext);
    const mappings = getArrayOfObjects(sel.mappings);

    const selectorNodeId = `selector-${si}`;
    nodes.push({
      id: selectorNodeId,
      type: 'selector',
      position: { x: 860, y: selY },
      data: {
        title: 'Index Projection',
        subtitle: targetIndexName,
        meta: sourceContext ? `sourceContext: ${sourceContext}` : undefined,
        lines: mappings.slice(0, 6).map(m => {
          const n = trim(m.name) || 'field';
          const src = trim(m.source);
          return `${n} ← ${src || '(unset)'}`;
        }),
        kind: 'selector',
        index: si
      }
    });

    const indexNodeId = ensureIndexNode(targetIndexName);
    edges.push({
      id: `e-selector-to-index-${si}`,
      source: selectorNodeId,
      target: indexNodeId,
      type: 'smoothstep',
      style: { stroke: 'rgba(180,255,180,0.25)' }
    });

    // Lineage edges for each mapping: origin (root/skill) -> selector.
    // We add one edge per mapping so that repeated paths (e.g., blob_url) show up per selector.
    for (let mi = 0; mi < mappings.length; mi++) {
      const m = mappings[mi];
      const fieldName = trim(m.name) || `mapping #${mi + 1}`;
      const source = asPathish(trim(m.source));

      const origin = (() => {
        if (!source) return null;
        if (source.startsWith('/document')) {
          // Prefer a skill output match if it exists; otherwise, root.
          const skillId = getBestProducingSkillNodeId(source);
          if (skillId) return skillId;
          return rootId;
        }

        return getBestProducingSkillNodeId(source);
      })();

      if (origin) {
        edges.push({
          id: `e-origin-to-selector-${si}-${mi}`,
          source: origin,
          target: selectorNodeId,
          type: 'smoothstep',
          label: fieldName,
          style: { stroke: 'rgba(255,210,120,0.26)' },
          labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
          labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6
        });
      }
    }

    // (Positions will be overridden by auto-layout; keep a simple increment as a fallback.)
    const blockHeight = Math.max(220, 130 + mappings.length * 18);
    selY += blockHeight + 28;
  }

  return { nodes, edges };
};

const CardNode: React.FC<NodeProps> = ({ data }) => {
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
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
          <div style={{ fontSize: 11, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
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

const SkillNode: React.FC<NodeProps> = ({ data }) => {
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
          <div style={{ fontSize: 11, opacity: 0.72, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
          {d.meta && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{d.meta}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(0,120,212,0.22)',
              border: '1px solid rgba(0,120,212,0.55)',
              color: 'rgba(235,245,255,0.95)',
              opacity: 0.9
            }}
          >
            Skill
          </div>
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

const SelectorNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as SelectorNodeData;
  return (
    <div style={{ width: 300, borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(16,16,16,0.92)', boxShadow: '0 6px 22px rgba(0,0,0,0.45)', color: 'var(--text-color)', overflow: 'hidden' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 10, height: 10, border: 'none', background: 'transparent' }} />
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
          <div style={{ fontSize: 11, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
          {d.meta && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.meta}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(110,220,140,0.18)',
              border: '1px solid rgba(110,220,140,0.55)',
              color: 'rgba(235,255,240,0.95)',
              opacity: 0.95,
              whiteSpace: 'nowrap'
            }}
          >
            Index Projection
          </div>
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

const nodeTypes: NodeTypes = {
  card: CardNode,
  skill: SkillNode,
  selector: SelectorNode
};

const SkillsetVisualDesignTab: React.FC<SkillsetVisualDesignTabProps> = ({ skillsetDef, setSkillsetDef }) => {
  const { nodes, edges } = useMemo(() => buildGraph(skillsetDef), [skillsetDef]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const openSkillEditor = useCallback((index: number) => {
    const raw = Array.isArray(skillsetDef.skills) ? (skillsetDef.skills as unknown[])[index] : null;
    if (!isPlainObject(raw)) return;
    setEditorTarget({ kind: 'skill', index, value: raw });
    setEditorOpen(true);
  }, [skillsetDef.skills]);

  const openSelectorEditor = useCallback((index: number) => {
    const indexProjections = isPlainObject(skillsetDef.indexProjections) ? (skillsetDef.indexProjections as Record<string, unknown>) : null;
    const selectors = indexProjections ? getArrayOfObjects(indexProjections.selectors) : [];
    const sel = selectors[index];
    if (!sel) return;
    setEditorTarget({ kind: 'selector', index, value: sel });
    setEditorOpen(true);
  }, [skillsetDef.indexProjections]);

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    // Click selects only. Editing is via double-click or the toolbar button.
    setSelectedNodeId(node.id);
  };

  const onNodeDoubleClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    const d = node.data as unknown;
    if (!d || typeof d !== 'object') return;

    const rec = d as { kind?: unknown; index?: unknown };
    if (rec.kind === 'skill' && typeof rec.index === 'number') openSkillEditor(rec.index);
    if (rec.kind === 'selector' && typeof rec.index === 'number') openSelectorEditor(rec.index);
  };

  const canEditSelected = !!selectedNodeId && (selectedNodeId.startsWith('skill-') || selectedNodeId.startsWith('selector-'));

  const editSelected = useCallback(() => {
    const id = selectedNodeId;
    if (!id) return;

    if (id.startsWith('skill-')) {
      const idx = Number(id.slice('skill-'.length));
      if (!Number.isFinite(idx)) return;
      openSkillEditor(idx);
      return;
    }

    if (id.startsWith('selector-')) {
      const idx = Number(id.slice('selector-'.length));
      if (!Number.isFinite(idx)) return;
      openSelectorEditor(idx);
      return;
    }
  }, [openSelectorEditor, openSkillEditor, selectedNodeId]);

  const onEditNodeRequested = useCallback(
    (n: { id: string; type?: string; data: unknown }) => {
      // Edits are driven off the domain node's data payload.
      const d = n.data as unknown;
      if (!d || typeof d !== 'object') return;

      const rec = d as { kind?: unknown; index?: unknown };
      if (rec.kind === 'skill' && typeof rec.index === 'number') openSkillEditor(rec.index);
      if (rec.kind === 'selector' && typeof rec.index === 'number') openSelectorEditor(rec.index);
    },
    [openSelectorEditor, openSkillEditor]
  );

  const clearSelection = useCallback(() => setSelectedNodeId(null), []);

  const deleteSelected = useCallback(async () => {
    const id = selectedNodeId;
    if (!id) return;

    // Prevent deleting structural nodes.
    if (id === 'doc-root' || id.startsWith('index-')) return;

    if (id.startsWith('skill-')) {
      const idx = Number(id.slice('skill-'.length));
      if (!Number.isFinite(idx)) return;
      const confirmed = await confirmService.confirm({
        title: 'Delete Skill',
        message: 'Delete this skill?'
      });
      if (!confirmed) return;
      setSkillsetDef(prev => {
        const skills = Array.isArray(prev.skills) ? (prev.skills as unknown[]).filter(isPlainObject) : [];
        if (idx < 0 || idx >= skills.length) return prev;
        const nextSkills = skills.filter((_, i) => i !== idx);
        return { ...prev, skills: nextSkills };
      });
      setSelectedNodeId(null);
      return;
    }

    if (id.startsWith('selector-')) {
      const idx = Number(id.slice('selector-'.length));
      if (!Number.isFinite(idx)) return;
      const confirmed = await confirmService.confirm({
        title: 'Delete Selector',
        message: 'Delete this projection selector?'
      });
      if (!confirmed) return;
      setSkillsetDef(prev => {
        const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : null;
        if (!current) return prev;
        const selectors = getArrayOfObjects(current.selectors);
        if (idx < 0 || idx >= selectors.length) return prev;
        const nextSelectors = selectors.filter((_, i) => i !== idx);
        if (nextSelectors.length === 0) delete current.selectors;
        else current.selectors = nextSelectors;
        return { ...prev, indexProjections: current };
      });
      setSelectedNodeId(null);
      return;
    }
  }, [selectedNodeId, setSkillsetDef]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedNodeId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        void deleteSelected();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        editSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelected, editSelected, selectedNodeId]);

  const addSkill = () => {
    const type = getResolvedTypeDefinitions(skillsSchema)[0]?.discriminatorValue;
    const nextSkill = type ? applyDefaultsForType(skillsSchema, type, {}) : { '@odata.type': '' };
    setSkillsetDef(prev => {
      const skills = Array.isArray(prev.skills) ? (prev.skills as unknown[]).filter(isPlainObject) : [];
      return { ...prev, skills: [...skills, nextSkill] };
    });

    const nextIndex = (Array.isArray(skillsetDef.skills) ? skillsetDef.skills.filter(isPlainObject).length : 0);
    window.setTimeout(() => openSkillEditor(nextIndex), 0);
  };

  const addSelector = () => {
    const nextSelector = applyDefaultsForType(selectorSchema, selectorType.discriminatorValue, {
      targetIndexName: '',
      parentKeyFieldName: '',
      sourceContext: '/document',
      mappings: []
    });

    setSkillsetDef(prev => {
      const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : {};
      const selectors = getArrayOfObjects(current.selectors);
      current.selectors = [...selectors, nextSelector];
      return { ...prev, indexProjections: current };
    });

    const nextIndex = (() => {
      const current = isPlainObject(skillsetDef.indexProjections) ? (skillsetDef.indexProjections as Record<string, unknown>) : null;
      const selectors = current ? getArrayOfObjects(current.selectors) : [];
      return selectors.length;
    })();
    window.setTimeout(() => openSelectorEditor(nextIndex), 0);
  };

  const addMappingToFirstSelector = () => {
    const nextMapping = applyDefaultsForType(mappingSchema, mappingType.discriminatorValue, { name: '', source: '', inputs: [] });

    setSkillsetDef(prev => {
      const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : null;
      if (!current) return prev;
      const selectors = getArrayOfObjects(current.selectors);
      if (!selectors.length) return prev;
      const first = { ...selectors[0] };
      const mappings = getArrayOfObjects(first.mappings);
      first.mappings = [...mappings, nextMapping];
      const nextSelectors = [...selectors];
      nextSelectors[0] = first;
      current.selectors = nextSelectors;
      return { ...prev, indexProjections: current };
    });

    // Bring the user into the selector editor (mappings are edited within the selector).
    window.setTimeout(() => openSelectorEditor(0), 0);
  };

  const editor = (() => {
    if (!editorTarget) return null;

    if (editorTarget.kind === 'skill') {
      const idx = editorTarget.index;
      const title = `Edit Skill: ${getSkillName(editorTarget.value, idx)}`;
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={title}
          schema={skillsSchema}
          value={editorTarget.value}
          onSave={(next) => {
            setSkillsetDef(prev => {
              const skills = Array.isArray(prev.skills) ? (prev.skills as unknown[]).filter(isPlainObject) : [];
              const nextSkills = [...skills];
              nextSkills[idx] = next;
              return { ...prev, skills: nextSkills };
            });
          }}
          nestedPresentation="accordion"
        />
      );
    }

    if (editorTarget.kind === 'selector') {
      const title = 'Edit Selector';
      return (
        <SchemaDrivenEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={title}
          schema={selectorSchema}
          value={editorTarget.value}
          onSave={(next) => {
            setSkillsetDef(prev => {
              const current = isPlainObject(prev.indexProjections) ? ({ ...(prev.indexProjections as Record<string, unknown>) } as Record<string, unknown>) : {};
              const selectors = getArrayOfObjects(current.selectors);
              const nextSelectors = [...selectors];
              nextSelectors[editorTarget.index] = next;
              current.selectors = nextSelectors;
              return { ...prev, indexProjections: current };
            });
          }}
          nestedPresentation="accordion"
        />
      );
    }

    return null;
  })();

  const nodeChrome = useMemo(
    () => ({
      enabled: true,
      showSelectionRing: true,
      getSelectionRingColor: (n: { id: string; type?: string; data: unknown }) => {
        const d = n.data as unknown as { kind?: unknown };
        if (d?.kind === 'selector') return 'rgba(110,220,140,0.85)';
        if (d?.kind === 'skill') return 'rgba(0,120,212,0.90)';
        return 'rgba(110,190,255,0.75)';
      },
      showEditButton: true,
      isNodeEditable: (n: { id: string; type?: string; data: unknown }) => {
        if (n.id === 'doc-root' || n.id.startsWith('index-')) return false;
        const d = n.data as unknown as { kind?: unknown };
        return d?.kind === 'skill' || d?.kind === 'selector';
      },
      onEditNode: onEditNodeRequested
    }),
    [onEditNodeRequested]
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          padding: '8px',
          backgroundColor: 'var(--active-color)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={addSkill}>
            <i className="fas fa-plus"></i> Add Skill
          </Button>
          <Button onClick={addSelector}>
            <i className="fas fa-plus"></i> Add Projection Selector
          </Button>
          <Button variant="secondary" onClick={addMappingToFirstSelector}>
            <i className="fas fa-diagram-project"></i> Add Mapping (first selector)
          </Button>
          <Button variant="secondary" onClick={editSelected} disabled={!canEditSelected}>
            <i className="fas fa-pen"></i> Edit Selected
          </Button>
          <Button variant="secondary" onClick={deleteSelected} disabled={!selectedNodeId || selectedNodeId === 'doc-root' || selectedNodeId.startsWith('index-')}>
            <i className="fas fa-trash"></i> Delete Selected
          </Button>
        </div>
        <div style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '12px' }}>
          Click to select • Double-click or Enter to edit • Selected: {selectedNodeId ?? 'none'}
        </div>
      </div>

      <div style={{ padding: '12px', overflow: 'hidden', flex: 1, minHeight: 0 }}>
        <Card style={{ padding: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitViewKey={`${skillsetDef.name}:${skillsetDef['@odata.etag'] ?? ''}`}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onPaneClick={clearSelection}
            onSelectionChange={(sel) => setSelectedNodeId(sel.nodes?.[0]?.id || null)}
            autoLayout={{ enabled: true, direction: 'LR', getNodeSize }}
            smartRouting={{ enabled: true }}
            nodeChrome={nodeChrome}
          />
        </Card>
      </div>

      {editor}
    </div>
  );
};

export default SkillsetVisualDesignTab;
