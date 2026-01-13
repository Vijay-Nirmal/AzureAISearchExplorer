import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import aliasSchemaJson from '../../../data/constants/config/Alias/aliasConfig.json';

export const ALIAS_DISCRIMINATOR = 'SearchAlias';

export const aliasSchema = aliasSchemaJson as unknown as ConfigDrivenSchema;
