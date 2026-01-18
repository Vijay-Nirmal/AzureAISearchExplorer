import { searchRestClient } from './searchRestClient';
import type { DataSourceListItem, SearchIndexerDataSourceConnection } from '../types/DataSourceModels';

type SearchDataSourcesResponse = {
  value?: SearchIndexerDataSourceConnection[];
};

export const datasourcesService = {
  listDataSources: async (connectionId: string): Promise<DataSourceListItem[]> => {
    const response = await searchRestClient.get<SearchDataSourcesResponse>(connectionId, 'datasources');
    return (response.value ?? []).map((item) => ({
      name: item.name,
      description: item.description,
      type: item.type,
      containerName: item.container?.name,
      eTag: item['@odata.etag']
    }));
  },

  getDataSource: async (connectionId: string, dataSourceName: string): Promise<SearchIndexerDataSourceConnection> => {
    const path = `datasources/${encodeURIComponent(dataSourceName)}`;
    return searchRestClient.get<SearchIndexerDataSourceConnection>(connectionId, path);
  },

  createOrUpdateDataSource: async (
    connectionId: string,
    dataSource: SearchIndexerDataSourceConnection
  ): Promise<SearchIndexerDataSourceConnection> => {
    const name = dataSource.name?.trim();
    if (!name) throw new Error('Data source name is required.');

    const path = `datasources/${encodeURIComponent(name)}`;
    return searchRestClient.put<SearchIndexerDataSourceConnection>(connectionId, path, dataSource);
  },

  deleteDataSource: async (connectionId: string, dataSourceName: string): Promise<void> => {
    const path = `datasources/${encodeURIComponent(dataSourceName)}`;
    await searchRestClient.delete(connectionId, path);
  }
};
