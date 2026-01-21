import { aliasesService } from '../aliasesService';
import { datasourcesService } from '../datasourcesService';
import { indexersService } from '../indexersService';
import { indexesService } from '../indexesService';
import { knowledgeBasesService } from '../knowledgeBasesService';
import { knowledgeSourcesService } from '../knowledgeSourcesService';
import { skillsetsService } from '../skillsetsService';
import { synonymMapsService } from '../synonymMapsService';

export type ResourceType =
  | 'indexes'
  | 'indexers'
  | 'datasources'
  | 'skillsets'
  | 'synonymmaps'
  | 'aliases'
  | 'knowledgeSources'
  | 'knowledgeBases';

interface ResourceRequest {
  connectionId: string | null;
  type: string;
  name: string;
}

interface ResourceListRequest {
  connectionId: string | null;
  types?: string[];
}

export interface ResourceListItem {
  name: string;
  type: ResourceType;
  description?: string;
  eTag?: string;
  [key: string]: unknown;
}

const ALL_RESOURCE_TYPES: ResourceType[] = [
  'indexes',
  'indexers',
  'datasources',
  'skillsets',
  'synonymmaps',
  'aliases',
  'knowledgeSources',
  'knowledgeBases'
];

const toResourceTypeList = (types?: string[]): ResourceType[] => {
  if (!types?.length) return ALL_RESOURCE_TYPES;
  const normalized = types.map((type) => type.trim()).filter(Boolean);
  const filtered = normalized.filter((type): type is ResourceType => ALL_RESOURCE_TYPES.includes(type as ResourceType));
  if (!filtered.length) {
    throw new Error('No valid resource types provided.');
  }
  return filtered;
};

export const resourceTool = {
  async getResource({ connectionId, type, name }: ResourceRequest): Promise<unknown> {
    if (!connectionId) throw new Error('Select a connection before fetching resources.');
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Resource name is required.');

    switch (type as ResourceType) {
      case 'indexes':
        return indexesService.getIndex(connectionId, trimmedName);
      case 'indexers':
        return indexersService.getIndexer(connectionId, trimmedName);
      case 'datasources':
        return datasourcesService.getDataSource(connectionId, trimmedName);
      case 'skillsets':
        return skillsetsService.getSkillset(connectionId, trimmedName);
      case 'synonymmaps':
        return synonymMapsService.getSynonymMap(connectionId, trimmedName);
      case 'aliases':
        return aliasesService.getAlias(connectionId, trimmedName);
      case 'knowledgeSources':
        return knowledgeSourcesService.getKnowledgeSource(connectionId, trimmedName);
      case 'knowledgeBases':
        return knowledgeBasesService.getKnowledgeBase(connectionId, trimmedName);
      default:
        throw new Error(`Unsupported resource type: ${type}`);
    }
  },

  async listResources({ connectionId, types }: ResourceListRequest): Promise<ResourceListItem[]> {
    if (!connectionId) throw new Error('Select a connection before listing resources.');

    const requestedTypes = toResourceTypeList(types);
    const results: ResourceListItem[] = [];

    for (const type of requestedTypes) {
      switch (type) {
        case 'indexes': {
          const indexes = await indexesService.listIndexes(connectionId);
          results.push(
            ...indexes.map((index) => ({
              name: index.name,
              type,
              description: index.description,
              eTag: index.eTag,
              fieldsCount: index.fields?.length ?? 0,
              scoringProfilesCount: index.scoringProfiles?.length ?? 0,
              suggestersCount: index.suggesters?.length ?? 0,
              analyzersCount: index.analyzers?.length ?? 0,
              stats: index.stats
            }))
          );
          break;
        }
        case 'indexers': {
          const indexers = await indexersService.listIndexers(connectionId);
          results.push(
            ...indexers.map((indexer) => ({
              name: indexer.name,
              type,
              description: indexer.description,
              eTag: indexer.eTag,
              dataSourceName: indexer.dataSourceName,
              targetIndexName: indexer.targetIndexName,
              skillsetName: indexer.skillsetName,
              disabled: indexer.disabled
            }))
          );
          break;
        }
        case 'datasources': {
          const datasources = await datasourcesService.listDataSources(connectionId);
          results.push(
            ...datasources.map((datasource) => ({
              name: datasource.name,
              type,
              description: datasource.description,
              eTag: datasource.eTag,
              dataSourceType: datasource.type,
              containerName: datasource.containerName
            }))
          );
          break;
        }
        case 'skillsets': {
          const skillsets = await skillsetsService.listSkillsets(connectionId);
          results.push(
            ...skillsets.map((skillset) => ({
              name: skillset.name,
              type,
              description: skillset.description,
              eTag: skillset.eTag,
              skillsCount: skillset.skillsCount
            }))
          );
          break;
        }
        case 'synonymmaps': {
          const synonymmaps = await synonymMapsService.listSynonymMaps(connectionId);
          results.push(
            ...synonymmaps.map((synonymmap) => ({
              name: synonymmap.name,
              type,
              format: synonymmap.format,
              eTag: synonymmap['@odata.etag']
            }))
          );
          break;
        }
        case 'aliases': {
          const aliases = await aliasesService.listAliases(connectionId);
          results.push(
            ...aliases.map((alias) => ({
              name: alias.name,
              type,
              indexes: alias.indexes,
              eTag: alias['@odata.etag']
            }))
          );
          break;
        }
        case 'knowledgeSources': {
          const sources = await knowledgeSourcesService.listKnowledgeSources(connectionId);
          results.push(
            ...sources.map((source) => ({
              name: source.name,
              type,
              description: source.description,
              kind: source.kind,
              eTag: source['@odata.etag']
            }))
          );
          break;
        }
        case 'knowledgeBases': {
          const bases = await knowledgeBasesService.listKnowledgeBases(connectionId);
          results.push(
            ...bases.map((base) => ({
              name: base.name,
              type,
              description: base.description,
              outputMode: base.outputMode,
              eTag: base['@odata.etag']
            }))
          );
          break;
        }
        default:
          throw new Error(`Unsupported resource type: ${type}`);
      }
    }

    return results;
  }
};
