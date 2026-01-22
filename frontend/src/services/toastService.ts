export type ToastVariant = 'error' | 'info' | 'success' | 'warning';

export type ToastMessage = {
  id: string;
  title: string;
  message?: string;
  details?: string;
  variant?: ToastVariant;
  copilotPrompt?: string;
  createdAt: number;
};

type ToastInput = Omit<ToastMessage, 'id' | 'createdAt'>;

type Listener = (toast: ToastMessage) => void;

const listeners = new Set<Listener>();
let pending: ToastMessage[] = [];

const emit = (toast: ToastMessage) => {
  if (listeners.size === 0) {
    pending.push(toast);
    return;
  }
  listeners.forEach((listener) => listener(toast));
};

const buildCopilotPrompt = (toast: ToastMessage) => {
  return [
    'A warning or error occurred in the app. Explain the likely cause and next steps.',
    '',
    `Title: ${toast.title}`,
    toast.message ? `Message: ${toast.message}` : '',
    toast.details ? `Details: ${toast.details}` : ''
  ].filter(Boolean).join('\n');
};

export const toastService: { subscribe: (listener: Listener) => () => void; show: (input: ToastInput) => void } = {
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    if (pending.length > 0) {
      pending.forEach((toast) => listener(toast));
      pending = [];
    }
    return () => {
      listeners.delete(listener);
    };
  },
  show: (input: ToastInput) => {
    const toast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      createdAt: Date.now()
    };
    if ((toast.variant === 'error' || toast.variant === 'warning') && !toast.copilotPrompt) {
      toast.copilotPrompt = buildCopilotPrompt(toast);
    }
    emit(toast);
  }
};
