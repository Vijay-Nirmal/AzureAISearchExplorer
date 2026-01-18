import { apiClient } from './apiClient';
import { toastService } from './toastService';
import { connectionStorage } from './connectionStorage';
import { getAuthHeader, clearAuthHeaderCache } from './searchAuthHeaderCache';
import { AZURE_SEARCH_API_VERSION } from '../data/constants/azureSearchApiVersion';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  query?: QueryParams;
  body?: unknown;
  apiVersion?: string;
};

const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
const useProxyInDevBrowser = import.meta.env.DEV && !isElectron;
const CONNECTION_PROFILE_HEADER = 'X-Connection-Profile';

const buildSearchUrl = (endpoint: string, path: string, query?: QueryParams, apiVersion?: string): string => {
  const base = endpoint.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  const params = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      params.set(key, String(value));
    });
  }

  if (!params.has('api-version')) {
    params.set('api-version', apiVersion ?? AZURE_SEARCH_API_VERSION);
  }

  return `${base}/${cleanPath}?${params.toString()}`;
};

const buildProxyEndpoint = (connectionId: string, path: string, query?: QueryParams, apiVersion?: string): string => {
  const cleanPath = path.replace(/^\/+/, '');
  const params = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      params.set(key, String(value));
    });
  }

  if (!params.has('api-version')) {
    params.set('api-version', apiVersion ?? AZURE_SEARCH_API_VERSION);
  }

  params.set('connectionId', connectionId);
  return `/api/search/${cleanPath}?${params.toString()}`;
};

const tryParseJsonSafe = (text: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const extractErrorMessage = (raw: string): string | undefined => {
  const parsed = tryParseJsonSafe(raw);
  if (!parsed) return raw.trim() || undefined;

  const error = parsed.error as Record<string, unknown> | undefined;
  if (error?.message && typeof error.message === 'string') return error.message;

  if (parsed.message && typeof parsed.message === 'string') return parsed.message;
  if (parsed.title && typeof parsed.title === 'string') return parsed.title;
  return raw.trim() || undefined;
};

const showSearchApiErrorToast = async (response: Response, url: string, method: string) => {
  const raw = await response.text();
  const details = extractErrorMessage(raw);
  const title = `HTTP ${response.status} ${response.statusText}`.trim();

  toastService.show({
    title,
    message: `${method.toUpperCase()} ${url}`,
    details,
    variant: 'error'
  });

  const message = details ? `${title} - ${details}` : title;
  throw new Error(`Search API call failed: ${message}`);
};

const getEndpoint = async (connectionId: string) => {
  const profile = connectionStorage.getById(connectionId);
  if (!profile) throw new Error('Connection not found');
  return profile.endpoint;
};

const encodeProfileHeader = (connectionId: string) => {
  const profile = connectionStorage.getById(connectionId);
  if (!profile) throw new Error('Connection not found');
  const json = JSON.stringify(profile);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return { [CONNECTION_PROFILE_HEADER]: base64 };
};

const requestSearchApi = async <T>(
  connectionId: string,
  method: string,
  path: string,
  options?: RequestOptions
): Promise<T> => {
  if (useProxyInDevBrowser) {
    const endpoint = buildProxyEndpoint(connectionId, path, options?.query, options?.apiVersion);
    const headers = encodeProfileHeader(connectionId);
    switch (method.toUpperCase()) {
      case 'GET':
        return apiClient.get<T>(endpoint, headers);
      case 'POST':
        return apiClient.post<T>(endpoint, options?.body ?? null, headers);
      case 'PUT':
        return apiClient.put<T>(endpoint, options?.body ?? null, headers);
      case 'DELETE':
        await apiClient.delete(endpoint, headers);
        return {} as T;
      default:
        throw new Error(`Unsupported proxy method: ${method}`);
    }
  }

  const endpoint = await getEndpoint(connectionId);
  const url = buildSearchUrl(endpoint, path, options?.query, options?.apiVersion);

  let authHeader = await getAuthHeader(connectionId);
  let response = await fetch(url, {
    method,
    headers: {
      [authHeader.name]: authHeader.value,
      ...(options?.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 401 || response.status === 403) {
    authHeader = await getAuthHeader(connectionId, true);
    response = await fetch(url, {
      method,
      headers: {
        [authHeader.name]: authHeader.value,
        ...(options?.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: options?.body ? JSON.stringify(options.body) : undefined
    });
  }

  if (!response.ok) {
    await showSearchApiErrorToast(response, url, method);
  }

  if (response.status === 204) return {} as T;

  const text = await response.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text) as T;
};

export const searchRestClient = {
  get: async <T>(connectionId: string, path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestSearchApi<T>(connectionId, 'GET', path, options);
  },
  post: async <T>(connectionId: string, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestSearchApi<T>(connectionId, 'POST', path, { ...options, body });
  },
  put: async <T>(connectionId: string, path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> => {
    return requestSearchApi<T>(connectionId, 'PUT', path, { ...options, body });
  },
  delete: async (connectionId: string, path: string, options?: Omit<RequestOptions, 'body'>): Promise<void> => {
    await requestSearchApi<void>(connectionId, 'DELETE', path, options);
  },
  clearAuthHeaderCache
};
