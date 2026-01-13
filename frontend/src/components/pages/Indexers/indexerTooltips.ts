import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import indexerSchemaJson from '../../../data/constants/config/Indexer/indexerConfig.json';

export const INDEXER_DISCRIMINATOR = 'SearchIndexer';

export const indexerSchema = indexerSchemaJson as unknown as ConfigDrivenSchema;
