export type ToastVariant = 'error' | 'info' | 'success' | 'warning';

export type ToastMessage = {
  id: string;
  title: string;
  message?: string;
  details?: string;
  variant?: ToastVariant;
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
    emit(toast);
  }
};
