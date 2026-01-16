import React, { useMemo } from 'react';
import type { Edge, Node } from '@xyflow/react';

import { FlowCanvas } from '../../common/flow/FlowCanvas';
import type { SearchIndexer } from '../../../types/IndexerModels';
import type { SearchIndexerDataSourceConnection } from '../../../types/DataSourceModels';
import type { SearchIndexerSkillset } from '../../../types/SkillsetModels';
import type { SearchIndex } from '../../../types/IndexModels';
import type { SearchAlias } from '../../../types/AliasModels';
import type { SynonymMap } from '../../../types/SynonymMapModels';

import { classicNodeTypes, getNodeSize } from './ClassicVisualNodeUtils';
import type { VisualNodeData, SkillNodeData, SelectorNodeData } from './ClassicVisualNodeTypes';

interface ClassicVisualGraphProps {
  indexer?: SearchIndexer | null;
  dataSource?: SearchIndexerDataSourceConnection | null;
  skillset?: SearchIndexerSkillset | null;
  index?: SearchIndex | null;
  aliases: SearchAlias[];
  synonymMaps: SynonymMap[];
  onSelectNode: (nodeId: string | null) => void;
  onEditNode: (node: { id: string; type?: string; data: unknown }) => void;
  focusNodeId?: string | null;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  return !!v && typeof v === 'object' && !Array.isArray(v);
};

const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const getArrayOfObjects = (v: unknown) => (Array.isArray(v) ? v.filter(isPlainObject) : ([] as Record<string, unknown>[]));

const getSkillName = (skill: Record<string, unknown>, index: number) => {
  const n = trim(skill.name);
  return n ? n : `#${index + 1}`;
};

const getSkillType = (skill: Record<string, unknown>) => trim(skill['@odata.type']);

const getSkillContext = (skill: Record<string, unknown>) => trim(skill.context) || '/document';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const makePathMatcher = (path: string) => {
  const trimmed = trim(path);
  if (!trimmed) return null;
  const escaped = escapeRegExp(trimmed).replace(/\\\*/g, '[^/]+');
  return new RegExp(`^${escaped}(?:$|/)`);
};

const asPathish = (s: string) => s.replace(/^=\s*/, '').replace(/^'+|'+$/g, '').replace(/^"+|"+$/g, '');

const normalizeFieldName = (s: string) => trim(s).replace(/^\/document\//, '').replace(/^\/+/, '');

const normalizeSourcePath = (source: unknown) => asPathish(trim(source));

const sourceUsesField = (source: unknown, fieldName: string) => {
  const src = normalizeSourcePath(source);
  const field = normalizeFieldName(fieldName);
  if (!src || !field) return false;
  const docPath = `/document/${field}`;
  return src === docPath || src.startsWith(`${docPath}/`) || src === field || src.startsWith(`${field}/`);
};

const getSourceLabel = (source: unknown) => {
  const src = normalizeSourcePath(source);
  if (!src) return '';
  const cleaned = src.replace(/\*+/g, '').replace(/\/+$/g, '');
  const parts = cleaned.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};

const getDocumentSourceLabel = (source: unknown) => {
  const src = normalizeSourcePath(source);
  if (!src || !src.startsWith('/document')) return '';
  const cleaned = src.replace(/\/+$/g, '');
  const parts = cleaned.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  if (last === '*') {
    const prev = parts[parts.length - 2] || '';
    return prev ? `${prev}/*` : '*';
  }
  return last;
};

const buildClassicGraph = ({
  indexer,
  dataSource,
  skillset,
  index,
  aliases,
  synonymMaps
}: {
  indexer?: SearchIndexer | null;
  dataSource?: SearchIndexerDataSourceConnection | null;
  skillset?: SearchIndexerSkillset | null;
  index?: SearchIndex | null;
  aliases: SearchAlias[];
  synonymMaps: SynonymMap[];
}) => {
  const nodes: Node<VisualNodeData>[] = [];
  const edges: Edge[] = [];

  const indexerId = 'indexer';
  const datasourceId = 'datasource';
  const skillsetId = 'skillset';
  const indexId = 'index';
  let hasSelectorConnection = false;
  const fieldMappingsNodeId = 'indexer-field-mappings';
  const outputFieldMappingsNodeId = 'indexer-output-field-mappings';

  if (dataSource) {
    nodes.push({
      id: datasourceId,
      type: 'card',
      position: { x: 0, y: 0 },
      data: {
        title: 'Data Source',
        subtitle: dataSource.name,
        icon: 'fa-database',
        resourceTag: 'Data Source',
        actionTag: 'Connection',
        lines: [trim(dataSource.type) || 'type: (unset)', trim(dataSource.container?.name) ? `container: ${dataSource.container?.name}` : 'container: (unset)']
      }
    });
  }

  if (indexer) {
    nodes.push({
      id: indexerId,
      type: 'card',
      position: { x: 0, y: 0 },
      data: {
        title: 'Indexer',
        subtitle: indexer.name,
        icon: 'fa-robot',
        resourceTag: 'Indexer',
        actionTag: 'Pipeline',
        lines: [
          indexer.dataSourceName ? `dataSource: ${indexer.dataSourceName}` : 'dataSource: (unset)',
          indexer.targetIndexName ? `targetIndex: ${indexer.targetIndexName}` : 'targetIndex: (unset)',
          indexer.skillsetName ? `skillset: ${indexer.skillsetName}` : 'skillset: (none)'
        ]
      }
    });

    if (dataSource) {
      edges.push({
        id: 'e-datasource-indexer',
        source: datasourceId,
        target: indexerId,
        type: 'smoothstep',
        style: { stroke: 'rgba(110,190,255,0.35)' }
      });
    }
  }

  const fieldMappings = indexer?.fieldMappings ? getArrayOfObjects(indexer.fieldMappings) : [];
  const outputFieldMappings = indexer?.outputFieldMappings ? getArrayOfObjects(indexer.outputFieldMappings) : [];
  const indexProjections = isPlainObject(skillset?.indexProjections) ? (skillset?.indexProjections as Record<string, unknown>) : null;
  const projectionParams = indexProjections && isPlainObject(indexProjections.parameters) ? (indexProjections.parameters as Record<string, unknown>) : null;
  const projectionMode = projectionParams ? trim(projectionParams.projectionMode) : '';
  const skipParentIndexing = projectionMode === 'skipIndexingParentDocuments';
  const selectors = indexProjections ? getArrayOfObjects(indexProjections.selectors) : [];

  if (indexer && fieldMappings.length > 0) {
    nodes.push({
      id: fieldMappingsNodeId,
      type: 'card',
      position: { x: 0, y: 0 },
      data: {
        title: 'Field Mappings',
        subtitle: indexer.name,
        icon: 'fa-random',
        resourceTag: 'Indexer',
        actionTag: 'Field Mappings',
        lines: fieldMappings.slice(0, 6).map((m) => {
          const src = trim(m.sourceFieldName) || '(source)';
          const tgt = trim(m.targetFieldName) || src;
          return `${src} → ${tgt}`;
        })
      }
    });

    if (dataSource) {
      fieldMappings.forEach((m, mi) => {
        const src = trim(m.sourceFieldName) || '(source)';
        edges.push({
          id: `e-datasource-to-field-mappings-${mi}`,
          source: datasourceId,
          target: fieldMappingsNodeId,
          type: 'smoothstep',
          label: src,
          style: { stroke: 'rgba(110,190,255,0.28)' },
          labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
          labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6
        });
      });
    }

    if (index && !skipParentIndexing) {
      fieldMappings.forEach((m, mi) => {
        const src = trim(m.sourceFieldName) || '(source)';
        const tgt = trim(m.targetFieldName) || src;
        edges.push({
          id: `e-field-mapping-${mi}-to-index`,
          source: fieldMappingsNodeId,
          target: indexId,
          type: 'smoothstep',
          label: tgt,
          style: { stroke: 'rgba(180,255,180,0.25)' },
          labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
          labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6
        });
      });
    }
  }

  if (indexer && outputFieldMappings.length > 0) {
    nodes.push({
      id: outputFieldMappingsNodeId,
      type: 'card',
      position: { x: 0, y: 0 },
      data: {
        title: 'Output Field Mappings',
        subtitle: indexer.name,
        icon: 'fa-random',
        resourceTag: 'Indexer',
        actionTag: 'Output Mappings',
        lines: outputFieldMappings.slice(0, 6).map((m) => {
          const src = trim(m.sourceFieldName) || '(source)';
          const tgt = trim(m.targetFieldName) || src;
          return `${src} → ${tgt}`;
        })
      }
    });

    if (skillset) {
      edges.push({
        id: 'e-skillset-to-output-field-mappings',
        source: skillsetId,
        target: outputFieldMappingsNodeId,
        type: 'smoothstep',
        label: 'outputs',
        style: { stroke: 'rgba(0,120,212,0.35)' }
      });
    }

    if (index) {
      outputFieldMappings.forEach((m, mi) => {
        const src = trim(m.sourceFieldName) || '(source)';
        const tgt = trim(m.targetFieldName) || src;
        edges.push({
          id: `e-output-field-mapping-${mi}-to-index`,
          source: outputFieldMappingsNodeId,
          target: indexId,
          type: 'smoothstep',
          label: tgt,
          style: { stroke: 'rgba(180,255,180,0.25)' },
          labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
          labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6
        });
      });
    }
  }

  if (skillset) {
    nodes.push({
      id: skillsetId,
      type: 'card',
      position: { x: 0, y: 0 },
      data: {
        title: 'Skillset',
        subtitle: skillset.name,
        icon: 'fa-wand-magic-sparkles',
        resourceTag: 'Skillset',
        actionTag: 'Definition',
        lines: [`skills: ${Array.isArray(skillset.skills) ? skillset.skills.length : 0}`]
      }
    });

    if (indexer) {
      edges.push({
        id: 'e-indexer-skillset',
        source: indexerId,
        target: skillsetId,
        type: 'smoothstep',
        style: { stroke: 'rgba(0,120,212,0.45)' }
      });
    }
  }

  if (index) {
    const fieldNames = Array.isArray(index.fields) ? index.fields.map(f => f.name).filter(Boolean) : [];
    const fieldLines = fieldNames.slice(0, 6).map((n) => `field: ${n}`);
    nodes.push({
      id: indexId,
      type: 'card',
      position: { x: 0, y: 0 },
      data: {
        title: 'Index',
        subtitle: index.name,
        icon: 'fa-table',
        resourceTag: 'Index',
        actionTag: 'Definition',
        lines: [`fields: ${fieldNames.length}`].concat(fieldLines)
      }
    });

    if (indexer && !skillset) {
      edges.push({
        id: 'e-indexer-index',
        source: indexerId,
        target: indexId,
        type: 'smoothstep',
        style: { stroke: 'rgba(180,255,180,0.25)' }
      });
    }
  }

  if (skillset) {
    const skills = Array.isArray(skillset.skills) ? (skillset.skills as unknown[]).filter(isPlainObject) : [];

    const fieldMappingTargets = fieldMappings
      .map(m => trim(m.targetFieldName) || trim(m.sourceFieldName))
      .filter(Boolean);

    const shouldLinkFieldMappingsToRoot =
      fieldMappingTargets.length > 0 &&
      (skills.some(skill => {
        const inputs = getArrayOfObjects(skill.inputs);
        return inputs.some(inp => fieldMappingTargets.some(t => sourceUsesField(inp.source, t)));
      }) ||
        selectors.some(sel => {
          const mappings = getArrayOfObjects(sel.mappings);
          return mappings.some(m => fieldMappingTargets.some(t => sourceUsesField(m.source, t)));
        }));

    const rootId = 'doc-root';
    const uniqueTargets = Array.from(new Set(fieldMappingTargets));
    const mappingLines = shouldLinkFieldMappingsToRoot
      ? uniqueTargets.slice(0, 6).map((t) => `field: ${t}`)
      : [];
    const mappingLabel = (() => {
      if (!uniqueTargets.length) return '';
      const preview = uniqueTargets.slice(0, 3).join(', ');
      const remaining = uniqueTargets.length - 3;
      return remaining > 0 ? `${preview} +${remaining}` : preview;
    })();
    if (skills.length > 0 || selectors.length > 0) {
      nodes.push({
        id: rootId,
        type: 'card',
        position: { x: 0, y: 0 },
        data: {
          title: 'Document Root',
          subtitle: '/document',
          lines: ['Global source for raw fields & metadata'].concat(mappingLines),
          resourceTag: 'Skillset',
          actionTag: 'Source',
          icon: 'fa-database'
        }
      });

      edges.push({
        id: 'e-skillset-root',
        source: skillsetId,
        target: rootId,
        type: 'smoothstep',
        style: { stroke: 'rgba(110,190,255,0.25)' }
      });
    }

    if (shouldLinkFieldMappingsToRoot && nodes.find(n => n.id === fieldMappingsNodeId) && nodes.find(n => n.id === rootId)) {
      edges.push({
        id: 'e-field-mappings-root',
        source: fieldMappingsNodeId,
        target: rootId,
        type: 'smoothstep',
        label: mappingLabel || 'field mappings',
        style: { stroke: 'rgba(110,190,255,0.25)' }
      });
    }

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
          resourceTag: 'Skillset',
          actionTag: 'Skill',
          height
        } as SkillNodeData
      });

      inputs.forEach((inp, ii) => {
        const src = trim(inp.source);
        if (!src.startsWith('/document')) return;
        if (src.startsWith("='")) return;
        if (src.startsWith('="')) return;
        if (isProducedByAnySkill(src, i)) return;
        if (!nodes.find(n => n.id === rootId)) return;

        const label = getDocumentSourceLabel(src) || trim(inp.name) || 'input';
        edges.push({
          id: `e-root-skill-${i}-${ii}`,
          source: rootId,
          target: nodeId,
          type: 'smoothstep',
          label,
          style: { stroke: 'rgba(110,190,255,0.35)' },
          labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
          labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6
        });
      });

      y += height + 22;
    }

    for (let b = 0; b < skills.length; b++) {
      const skillB = skills[b];
      const inputsB = getArrayOfObjects(skillB.inputs);
      for (let ii = 0; ii < inputsB.length; ii++) {
        const input = inputsB[ii];
        const src = trim(input.source);
        if (!src) continue;
        for (let a = 0; a < skillOutputs.length; a++) {
          if (a === b) continue;
          const outA = skillOutputs[a];
          const match = outA.matchers.some(m => m.test(src));
          if (!match) continue;
          const label = getDocumentSourceLabel(src) || getSourceLabel(src) || trim(input.name) || 'input';
          edges.push({
            id: `e-skill-${a}-to-${b}-${ii}`,
            source: `skill-${a}`,
            target: `skill-${b}`,
            type: 'smoothstep',
            label,
            style: { stroke: 'rgba(255,255,255,0.22)' },
            labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
            labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 6
          });
        }
      }
    }

    if (index) {
      let selY = 220;
      for (let si = 0; si < selectors.length; si++) {
        const sel = selectors[si];
        const targetIndexName = trim(sel.targetIndexName) || index.name;
        if (index.name && targetIndexName !== index.name) continue;

        const sourceContext = trim(sel.sourceContext);
        const mappings = getArrayOfObjects(sel.mappings);

        const selectorNodeId = `selector-${si}`;
        nodes.push({
          id: selectorNodeId,
          type: 'selector',
          position: { x: 860, y: selY },
          data: {
            title: 'Index Projection',
            subtitle: index.name,
            meta: sourceContext ? `sourceContext: ${sourceContext}` : undefined,
            resourceTag: 'Skillset',
            actionTag: 'Index Projection',
            lines: mappings.slice(0, 6).map(m => {
              const n = trim(m.name) || 'field';
              const src = trim(m.source);
              return `${n} ← ${src || '(unset)'}`;
            }),
            kind: 'selector',
            index: si
          } as SelectorNodeData
        });

        if (!mappings.length) {
          edges.push({
            id: `e-selector-to-index-${si}`,
            source: selectorNodeId,
            target: indexId,
            type: 'smoothstep',
            style: { stroke: 'rgba(180,255,180,0.25)' }
          });
          hasSelectorConnection = true;
        }

        for (let mi = 0; mi < mappings.length; mi++) {
          const m = mappings[mi];
          const fieldName = trim(m.name) || `mapping #${mi + 1}`;
          const source = asPathish(trim(m.source));

          const origin = (() => {
            if (!source) return null;
            if (source.startsWith('/document')) {
              const skillId = getBestProducingSkillNodeId(source);
              if (skillId) return skillId;
              return rootId;
            }

            return getBestProducingSkillNodeId(source);
          })();

          if (origin) {
            const sourceLabel = getSourceLabel(m.source) || fieldName;
            edges.push({
              id: `e-origin-to-selector-${si}-${mi}`,
              source: origin,
              target: selectorNodeId,
              type: 'smoothstep',
              label: sourceLabel,
              style: { stroke: 'rgba(255,210,120,0.26)' },
              labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
              labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
              labelBgPadding: [6, 3],
              labelBgBorderRadius: 6
            });
          }

          edges.push({
            id: `e-selector-to-index-${si}-${mi}`,
            source: selectorNodeId,
            target: indexId,
            type: 'smoothstep',
            label: fieldName,
            style: { stroke: 'rgba(180,255,180,0.25)' },
            labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
            labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 6
          });
          hasSelectorConnection = true;
        }

        const blockHeight = Math.max(220, 130 + mappings.length * 18);
        selY += blockHeight + 28;
      }
    }
  }

  if (index?.fields?.length) {
    const synonymByName = new Map<string, SynonymMap>();
    synonymMaps.forEach((s) => synonymByName.set(s.name, s));

    let synY = 60;
    for (const f of index.fields) {
      const maps = Array.isArray(f.synonymMaps) ? f.synonymMaps : [];
      for (const mapName of maps) {
        const syn = synonymByName.get(mapName);
        if (!syn) continue;
        const synId = `synonym-${syn.name}`;
        if (!nodes.find(n => n.id === synId)) {
          nodes.push({
            id: synId,
            type: 'card',
            position: { x: 1860, y: synY },
            data: {
              title: 'Synonym Map',
              subtitle: syn.name,
              icon: 'fa-language',
              resourceTag: 'Synonym Map',
              actionTag: 'Mapping',
              lines: [syn.format ? `format: ${syn.format}` : 'format: (unset)']
            }
          });
          synY += 180;
        }

        edges.push({
          id: `e-index-syn-${f.name}-${syn.name}`,
          source: indexId,
          target: synId,
          type: 'smoothstep',
          label: f.name,
          style: { stroke: 'rgba(255,210,120,0.25)' },
          labelStyle: { fill: 'rgba(235,235,235,0.75)', fontSize: 10 },
          labelBgStyle: { fill: 'rgba(0,0,0,0.35)' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6
        });
      }
    }
  }

  if (index?.name && aliases.length > 0) {
    let aliasY = 80;
    for (const alias of aliases) {
      const aliasId = `alias-${alias.name}`;
      nodes.push({
        id: aliasId,
        type: 'card',
        position: { x: 1200, y: aliasY },
        data: {
          title: 'Alias',
          subtitle: alias.name,
          icon: 'fa-link',
          resourceTag: 'Alias',
          actionTag: 'Routing',
          lines: [`indexes: ${(alias.indexes || []).join(', ') || '(none)'}`]
        }
      });

      edges.push({
        id: `e-alias-index-${alias.name}`,
        source: aliasId,
        target: indexId,
        type: 'smoothstep',
        style: { stroke: 'rgba(180,180,255,0.25)' }
      });
      aliasY += 180;
    }
  }

  if (index && indexer && !hasSelectorConnection) {
    edges.push({
      id: 'e-indexer-index-fallback',
      source: indexerId,
      target: indexId,
      type: 'smoothstep',
      style: { stroke: 'rgba(180,255,180,0.22)' }
    });
  }

  return { nodes, edges };
};

export const ClassicVisualGraph: React.FC<ClassicVisualGraphProps> = ({
  indexer,
  dataSource,
  skillset,
  index,
  aliases,
  synonymMaps,
  onSelectNode,
  onEditNode,
  focusNodeId
}) => {
  const { nodes, edges } = useMemo(
    () =>
      buildClassicGraph({
        indexer,
        dataSource,
        skillset,
        index,
        aliases,
        synonymMaps
      }),
    [aliases, dataSource, index, indexer, skillset, synonymMaps]
  );

  const nodeChrome = useMemo(
    () => ({
      enabled: true,
      showSelectionRing: true,
      getSelectionRingColor: (n: { id: string; type?: string; data: unknown }) => {
        const d = n.data as unknown as { kind?: unknown };
        if (d?.kind === 'selector') return 'rgba(110,220,140,0.85)';
        if (d?.kind === 'skill') return 'rgba(0,120,212,0.90)';
        if (d?.kind === 'field') return 'rgba(255,210,120,0.85)';
        return 'rgba(110,190,255,0.75)';
      },
      showEditButton: true,
      isNodeEditable: (n: { id: string; type?: string; data: unknown }) => n.id !== 'doc-root',
      onEditNode
    }),
    [onEditNode]
  );

  return (
    <FlowCanvas
      nodes={nodes}
      edges={edges}
      nodeTypes={classicNodeTypes}
      fitViewKey={`${indexer?.name ?? ''}:${skillset?.name ?? ''}:${index?.name ?? ''}`}
      focusNodeId={focusNodeId}
      onNodeClick={(_, node) => onSelectNode(node.id)}
      onNodeDoubleClick={(_, node) => onEditNode(node)}
      onPaneClick={() => onSelectNode(null)}
      onSelectionChange={(sel) => onSelectNode(sel.nodes?.[0]?.id || null)}
      autoLayout={{ enabled: true, direction: 'LR', getNodeSize }}
      smartRouting={{ enabled: true }}
      nodeChrome={nodeChrome}
    />
  );
};
