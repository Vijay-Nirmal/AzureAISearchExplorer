export type ConfirmMessage = {
  id: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (confirmed: boolean) => void;
};

type ConfirmInput = Omit<ConfirmMessage, 'id' | 'resolve'> & { resolve?: (confirmed: boolean) => void };

type Listener = (confirm: ConfirmMessage) => void;

const listeners = new Set<Listener>();
let pending: ConfirmMessage[] = [];

const emit = (confirm: ConfirmMessage) => {
  if (listeners.size === 0) {
    pending.push(confirm);
    return;
  }
  listeners.forEach((listener) => listener(confirm));
};

export const confirmService: {
  subscribe: (listener: Listener) => () => void;
  confirm: (input: Omit<ConfirmInput, 'resolve'>) => Promise<boolean>;
} = {
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    if (pending.length > 0) {
      pending.forEach((confirm) => listener(confirm));
      pending = [];
    }
    return () => {
      listeners.delete(listener);
    };
  },
  confirm: (input: Omit<ConfirmInput, 'resolve'>) => {
    return new Promise((resolve) => {
      const confirm: ConfirmMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: input.title,
        message: input.message,
        confirmLabel: input.confirmLabel,
        cancelLabel: input.cancelLabel,
        resolve
      };
      emit(confirm);
    });
  }
};
