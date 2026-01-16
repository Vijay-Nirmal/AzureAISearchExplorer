export type BaseCardData = {
  title: string;
  subtitle?: string;
  lines?: string[];
  meta?: string;
  icon?: string;
  badge?: string;
  resourceTag?: string;
  actionTag?: string;
};

export type SkillNodeData = BaseCardData & {
  kind: 'skill';
  index: number;
  inputs: string[];
  outputs: string[];
  height?: number;
};

export type SelectorNodeData = BaseCardData & {
  kind: 'selector';
  index: number;
};

export type FieldNodeData = BaseCardData & {
  kind: 'field';
  fieldName: string;
};

export type VisualNodeData = BaseCardData | SkillNodeData | SelectorNodeData | FieldNodeData;
