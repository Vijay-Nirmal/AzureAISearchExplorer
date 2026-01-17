import { toastService } from './toastService';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  const detail = parsed.detail;
  if (typeof detail === 'string') {
    const nested = tryParseJsonSafe(detail);
    const nestedError = nested?.error as Record<string, unknown> | undefined;
    if (nestedError?.message && typeof nestedError.message === 'string') return nestedError.message;
    return detail;
  }

  if (parsed.message && typeof parsed.message === 'string') return parsed.message;
  if (parsed.title && typeof parsed.title === 'string') return parsed.title;
  return raw.trim() || undefined;
};

const extractErrorCode = (raw: string): string | undefined => {
  const parsed = tryParseJsonSafe(raw);
  if (!parsed) return undefined;
  const error = parsed.error as Record<string, unknown> | undefined;
  if (error?.code && typeof error.code === 'string' && error.code.trim()) return error.code;
  const detail = parsed.detail;
  if (typeof detail === 'string') {
    const nested = tryParseJsonSafe(detail);
    const nestedError = nested?.error as Record<string, unknown> | undefined;
    if (nestedError?.code && typeof nestedError.code === 'string' && nestedError.code.trim()) return nestedError.code;
  }
  return undefined;
};

const buildErrorDetails = (raw: string): string | undefined => {
  if (!raw.trim()) return undefined;
  const message = extractErrorMessage(raw);
  const code = extractErrorCode(raw);
  if (!message) return undefined;
  return code ? `${message}\nCode: ${code}` : message;
};

const showHttpErrorToast = async (response: Response, endpoint: string, method: string) => {
  const raw = await response.text();
  const url = `${BASE_URL}${endpoint}`;
  const details = buildErrorDetails(raw);
  const title = `HTTP ${response.status} ${response.statusText}`.trim();

  toastService.show({
    title,
    message: `${method.toUpperCase()} ${url}`,
    details,
    variant: 'error'
  });

  const message = details ? `${title} - ${details}` : title;
  throw new Error(`API call failed: ${message}`);
};

const showNetworkErrorToast = (endpoint: string, method: string, error: unknown) => {
  const url = `${BASE_URL}${endpoint}`;
  const message = error instanceof Error ? error.message : String(error);
  toastService.show({
    title: 'Network error',
    message: `${method.toUpperCase()} ${url}`,
    details: message,
    variant: 'error'
  });
};

const request = async (method: string, endpoint: string, body?: unknown): Promise<Response> => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      await showHttpErrorToast(response, endpoint, method);
    }
    return response;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('API call failed:')) {
      throw e;
    }
    showNetworkErrorToast(endpoint, method, e);
    throw e;
  }
};

const tryParseJson = async <T>(response: Response): Promise<T> => {
  // Handle explicit no-content
  if (response.status === 204) return {} as T;

  // Some endpoints return 202/200 with no body.
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return {} as T;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text();
    return (text ? (text as unknown as T) : ({} as T));
  }

  const text = await response.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text) as T;
};

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await request('GET', endpoint);
    return tryParseJson<T>(response);
  },
  post: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await request('POST', endpoint, body);
    return tryParseJson<T>(response);
  },
  put: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await request('PUT', endpoint, body);
    return tryParseJson<T>(response);
  },
  delete: async (endpoint: string): Promise<void> => {
    await request('DELETE', endpoint);
  }
};
