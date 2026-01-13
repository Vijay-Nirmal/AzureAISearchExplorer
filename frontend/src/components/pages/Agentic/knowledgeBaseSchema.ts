import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import knowledgeBaseSchemaJson from '../../../data/constants/config/KnowledgeBase/knowledgeBaseConfig.json';

export const KNOWLEDGE_BASE_DISCRIMINATOR = 'KnowledgeBase';

export const knowledgeBaseSchema = knowledgeBaseSchemaJson as unknown as ConfigDrivenSchema;
