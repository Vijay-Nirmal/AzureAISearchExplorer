const TOKEN_KEY = 'copilot_auth_token';
const MODE_KEY = 'copilot_auth_mode';

export type StoredAuthMode = 'device_code' | 'browser' | 'token';

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, mode: StoredAuthMode) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(MODE_KEY, mode);
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MODE_KEY);
  },

  getMode(): StoredAuthMode | null {
    return localStorage.getItem(MODE_KEY) as StoredAuthMode | null;
  }
};
