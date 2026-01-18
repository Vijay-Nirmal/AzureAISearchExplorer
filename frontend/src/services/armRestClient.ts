import { apiClient } from './apiClient';
import { getAuthHeader, getConnectionProfileHeader, getConnectionProfileHeaderById } from './searchAuthHeaderCache';
import { AZURE_ARM_API_VERSION } from '../data/constants/azureArmApiVersion';
import type { ConnectionProfile } from '../types/ConnectionProfile';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  query?: QueryParams;
  body?: unknown;
  apiVersion?: string;
};

const buildArmProxyEndpoint = (connectionId: string | undefined, path: string, query?: QueryParams, apiVersion?: string): string => {
  const cleanPath = path.replace(/^\/+/, '');
  const params = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      params.set(key, String(value));
    });
  }

  if (!params.has('api-version')) {
    params.set('api-version', apiVersion ?? AZURE_ARM_API_VERSION);
  }

  if (connectionId) {
    params.set('connectionId', connectionId);
  }
  return `/api/arm/${cleanPath}?${params.toString()}`;
};

const requestArmApi = async <T>(
  connectionId: string,
  method: string,
  path: string,
  options?: RequestOptions
): Promise<T> => {
  const endpoint = buildArmProxyEndpoint(connectionId, path, options?.query, options?.apiVersion);
  const authHeader = await getAuthHeader(connectionId);
  const profileHeader = getConnectionProfileHeaderById(connectionId);
  const headers = { [authHeader.name]: authHeader.value, ...profileHeader };

  switch (method.toUpperCase()) {
    case 'GET':
      return apiClient.get<T>(endpoint, headers);
    case 'POST':
      return apiClient.post<T>(endpoint, options?.body ?? null, headers);
    case 'PUT':
      return apiClient.put<T>(endpoint, options?.body ?? null, headers);
    case 'PATCH':
      return apiClient.patch<T>(endpoint, options?.body ?? null, headers);
    case 'DELETE':
      await apiClient.delete(endpoint, headers);
      return {} as T;
    default:
      throw new Error(`Unsupported ARM method: ${method}`);
  }
};

const requestArmApiForProfile = async <T>(
  profile: ConnectionProfile,
  method: string,
  path: string,
  options?: RequestOptions
): Promise<T> => {
  const endpoint = buildArmProxyEndpoint(undefined, path, options?.query, options?.apiVersion);
  const headers = getConnectionProfileHeader(profile);

  switch (method.toUpperCase()) {
    case 'GET':
      return apiClient.get<T>(endpoint, headers);
    case 'POST':
      return apiClient.post<T>(endpoint, options?.body ?? null, headers);
    case 'PUT':
      return apiClient.put<T>(endpoint, options?.body ?? null, headers);
    case 'PATCH':
      return apiClient.patch<T>(endpoint, options?.body ?? null, headers);
    case 'DELETE':
      await apiClient.delete(endpoint, headers);
      return {} as T;
    default:
      throw new Error(`Unsupported ARM method: ${method}`);
  }
};

export const armRestClient = {
  get: async <T>(connectionId: string, path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApi<T>(connectionId, 'GET', path, options);
  },
  post: async <T>(connectionId: string, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApi<T>(connectionId, 'POST', path, { ...options, body });
  },
  put: async <T>(connectionId: string, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApi<T>(connectionId, 'PUT', path, { ...options, body });
  },
  patch: async <T>(connectionId: string, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApi<T>(connectionId, 'PATCH', path, { ...options, body });
  },
  delete: async (connectionId: string, path: string, options?: Omit<RequestOptions, 'body'>): Promise<void> => {
    await requestArmApi<void>(connectionId, 'DELETE', path, options);
  },
  getForProfile: async <T>(profile: ConnectionProfile, path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApiForProfile<T>(profile, 'GET', path, options);
  },
  postForProfile: async <T>(profile: ConnectionProfile, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApiForProfile<T>(profile, 'POST', path, { ...options, body });
  },
  putForProfile: async <T>(profile: ConnectionProfile, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApiForProfile<T>(profile, 'PUT', path, { ...options, body });
  },
  patchForProfile: async <T>(profile: ConnectionProfile, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestArmApiForProfile<T>(profile, 'PATCH', path, { ...options, body });
  },
  deleteForProfile: async (profile: ConnectionProfile, path: string, options?: Omit<RequestOptions, 'body'>): Promise<void> => {
    await requestArmApiForProfile<void>(profile, 'DELETE', path, options);
  }
};
