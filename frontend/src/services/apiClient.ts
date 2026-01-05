const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  },
  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  },
  put: async <T>(endpoint: string, body: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  },
  delete: async (endpoint: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
  }
};
