import type { Node, NodeTypes } from '@xyflow/react';

import type { BaseCardData, FieldNodeData, SelectorNodeData, SkillNodeData } from './ClassicVisualNodeTypes';
import { CardNode, FieldNode, SelectorNode, SkillNode } from './ClassicVisualNodes';

export const getNodeSize = (node: Node) => {
  switch (node.type) {
    case 'skill': {
      const d = node.data as unknown as SkillNodeData;
      return { width: 420, height: typeof d.height === 'number' ? d.height : 220 };
    }
    case 'selector': {
      const d = node.data as unknown as SelectorNodeData;
      const lines = Array.isArray(d.lines) ? d.lines.length : 0;
      return { width: 320, height: Math.max(180, 120 + lines * 18) };
    }
    case 'field': {
      const d = node.data as unknown as FieldNodeData;
      const lines = Array.isArray(d.lines) ? d.lines.length : 0;
      return { width: 260, height: Math.max(110, 90 + lines * 16) };
    }
    case 'card':
    default: {
      const d = node.data as unknown as BaseCardData;
      const lines = Array.isArray(d.lines) ? d.lines.length : 0;
      return { width: 300, height: Math.max(140, 110 + lines * 18) };
    }
  }
};

export const classicNodeTypes: NodeTypes = {
  card: CardNode,
  skill: SkillNode,
  selector: SelectorNode,
  field: FieldNode
};
