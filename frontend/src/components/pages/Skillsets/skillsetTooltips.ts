import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../common/configDriven/configDrivenTypes';

import skillsetTypeJson from '../../../data/constants/config/Skillset/types/SearchIndexerSkillset.json';

export const SKILLSET_META_DISCRIMINATOR = 'SearchIndexerSkillset';

const skillsetType = skillsetTypeJson as unknown as ConfigDrivenTypeDefinition;

// Skillsets aren't edited with the config-driven form (yet), but we still reuse the schema
// shape to keep tooltips/descriptions consistent and reusable.
export const skillsetMetaSchema: ConfigDrivenSchema = {
  entity: {
    title: 'Skillset',
    description: skillsetType.description,
    discriminatorKey: '__type',
    nameKey: 'name'
  },
  commonFields: [],
  types: [skillsetType]
};
