import { apiClient } from './apiClient';
import type { DataSourceListItem, SearchIndexerDataSourceConnection } from '../types/DataSourceModels';

export const datasourcesService = {
  listDataSources: async (connectionId: string): Promise<DataSourceListItem[]> => {
    return apiClient.get<DataSourceListItem[]>(`/api/datasources?connectionId=${connectionId}`);
  },

  getDataSource: async (connectionId: string, dataSourceName: string): Promise<SearchIndexerDataSourceConnection> => {
    return apiClient.get<SearchIndexerDataSourceConnection>(`/api/datasources/${encodeURIComponent(dataSourceName)}?connectionId=${connectionId}`);
  },

  createOrUpdateDataSource: async (
    connectionId: string,
    dataSource: SearchIndexerDataSourceConnection
  ): Promise<SearchIndexerDataSourceConnection> => {
    return apiClient.post<SearchIndexerDataSourceConnection>(`/api/datasources?connectionId=${connectionId}`, dataSource);
  },

  deleteDataSource: async (connectionId: string, dataSourceName: string): Promise<void> => {
    return apiClient.delete(`/api/datasources/${encodeURIComponent(dataSourceName)}?connectionId=${connectionId}`);
  }
};
