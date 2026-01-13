import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import statusSchemaJson from '../../../data/constants/config/Indexer/Status/searchIndexerStatusConfig.json';

export const INDEXER_STATUS_DISCRIMINATOR = 'SearchIndexerStatus';

export const indexerStatusSchema = statusSchemaJson as unknown as ConfigDrivenSchema;
