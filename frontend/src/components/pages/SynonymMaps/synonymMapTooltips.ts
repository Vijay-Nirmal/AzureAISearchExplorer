import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import synonymMapSchemaJson from '../../../data/constants/config/SynonymMap/synonymMapConfig.json';

export const SYNONYM_MAP_DISCRIMINATOR = 'SynonymMap';

export const synonymMapSchema = synonymMapSchemaJson as unknown as ConfigDrivenSchema;
