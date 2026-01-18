import type { ConnectionProfile } from '../types/ConnectionProfile';

const STORAGE_KEY = 'azureSearchExplorer.connections';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadAll = (): ConnectionProfile[] => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ConnectionProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveAll = (items: ConnectionProfile[]) => {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getById = (id: string): ConnectionProfile | undefined => {
  const list = loadAll();
  return list.find((item) => item.id === id);
};

const upsert = (profile: ConnectionProfile): ConnectionProfile => {
  const list = loadAll();
  const id = profile.id?.trim() || generateId();
  const next: ConnectionProfile = { ...profile, id };
  const index = list.findIndex((item) => item.id === id);
  if (index >= 0) list[index] = next;
  else list.push(next);
  saveAll(list);
  return next;
};

const remove = (id: string) => {
  const list = loadAll().filter((item) => item.id !== id);
  saveAll(list);
};

export const connectionStorage = {
  loadAll,
  saveAll,
  generateId,
  getById,
  upsert,
  remove
};
