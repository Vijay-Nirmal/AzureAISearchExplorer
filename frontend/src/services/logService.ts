import { apiClient } from './apiClient';

export interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  exception?: string;
}

export const logService = {
  getLogs: async (): Promise<LogEntry[]> => {
    return apiClient.get<LogEntry[]>('/api/logs');
  },
  setLogLevel: async (level: string): Promise<void> => {
    return apiClient.post('/api/logs/configuration', { level });
  },
  clearLogs: async (): Promise<void> => {
    return apiClient.delete('/api/logs');
  }
};
