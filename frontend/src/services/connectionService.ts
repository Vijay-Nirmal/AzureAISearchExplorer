import { apiClient } from './apiClient';
import type { ConnectionProfile, ServiceOverview } from '../types/ConnectionProfile';

export const connectionService = {
    getAll: async (): Promise<ConnectionProfile[]> => {
        return await apiClient.get<ConnectionProfile[]>('/api/connections');
    },

    getById: async (id: string): Promise<ConnectionProfile> => {
        return await apiClient.get<ConnectionProfile>(`/api/connections/${id}`);
    },

    create: async (profile: ConnectionProfile): Promise<ConnectionProfile> => {
        return await apiClient.post<ConnectionProfile>('/api/connections', profile);
    },

    update: async (id: string, profile: ConnectionProfile): Promise<void> => {
        await apiClient.put(`/api/connections/${id}`, profile);
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/api/connections/${id}`);
    },

    testConnection: async (profile: ConnectionProfile): Promise<{ success: boolean; message: string }> => {
        return await apiClient.post<{ success: boolean; message: string }>('/api/service/test', profile);
    },

    getOverview: async (connectionId: string): Promise<ServiceOverview> => {
        return await apiClient.get<ServiceOverview>(`/api/service/${connectionId}/overview`);
    },

    scaleService: async (connectionId: string, resourceId: string, replicaCount?: number, partitionCount?: number): Promise<void> => {
        await apiClient.put(`/api/service/${connectionId}/scale`, { resourceId, replicaCount, partitionCount });
    }
};
