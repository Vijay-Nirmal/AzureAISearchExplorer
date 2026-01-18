import { apiClient } from './apiClient';
import { connectionStorage } from './connectionStorage';
import type { ConnectionProfile } from '../types/ConnectionProfile';

type SearchAuthHeaderDto = {
  name: string;
  value: string;
};

type AuthHeaderCacheEntry = {
  header: SearchAuthHeaderDto;
  expiresAt: number;
};

const AUTH_HEADER_TTL_MS = 15 * 60 * 1000; // 15 minutes
const authHeaderCache = new Map<string, AuthHeaderCacheEntry>();
const CONNECTION_PROFILE_HEADER = 'X-Connection-Profile';

const cacheHeader = (cacheKey: string, header: SearchAuthHeaderDto) => {
  authHeaderCache.set(cacheKey, {
    header,
    expiresAt: Date.now() + AUTH_HEADER_TTL_MS
  });
};

const getCachedHeader = (cacheKey: string) => {
  const cached = authHeaderCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.header;
  }
  return null;
};

export const getAuthHeaderForProfile = async (
  profile: ConnectionProfile,
  forceRefresh = false
): Promise<SearchAuthHeaderDto> => {
  const cacheKey = profile.id?.trim();
  if (cacheKey && !forceRefresh) {
    const cached = getCachedHeader(cacheKey);
    if (cached) return cached;
  }

  const header = await apiClient.post<SearchAuthHeaderDto>('/api/service/auth-header', profile);

  if (cacheKey) {
    cacheHeader(cacheKey, header);
  }

  return header;
};

export const getAuthHeader = async (connectionId: string, forceRefresh = false): Promise<SearchAuthHeaderDto> => {
  const cacheKey = connectionId.trim();
  if (!forceRefresh) {
    const cached = getCachedHeader(cacheKey);
    if (cached) return cached;
  }

  const profile = connectionStorage.getById(connectionId);
  if (!profile) throw new Error('Connection not found');

  const header = await apiClient.post<SearchAuthHeaderDto>('/api/service/auth-header', profile);
  cacheHeader(cacheKey, header);
  return header;
};

export const clearAuthHeaderCache = (connectionId?: string) => {
  if (!connectionId) {
    authHeaderCache.clear();
    return;
  }

  authHeaderCache.delete(connectionId.trim());
};

export const getConnectionProfileHeader = (profile: ConnectionProfile) => {
  const json = JSON.stringify(profile);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return { [CONNECTION_PROFILE_HEADER]: base64 };
};

export const getConnectionProfileHeaderById = (connectionId: string) => {
  const profile = connectionStorage.getById(connectionId);
  if (!profile) throw new Error('Connection not found');
  return getConnectionProfileHeader(profile);
};
