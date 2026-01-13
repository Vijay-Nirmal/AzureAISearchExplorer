import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import knowledgeSourceSchemaJson from '../../../data/constants/config/KnowledgeSource/knowledgeSourceConfig.json';

export const KNOWLEDGE_SOURCE_DISCRIMINATOR = 'searchIndex';

export const knowledgeSourceSchema = knowledgeSourceSchemaJson as unknown as ConfigDrivenSchema;
