export type AlertMessage = {
  id: string;
  title: string;
  message: string;
};

type AlertInput = Omit<AlertMessage, 'id'>;

type Listener = (alert: AlertMessage) => void;

const listeners = new Set<Listener>();
let pending: AlertMessage[] = [];

const emit = (alert: AlertMessage) => {
  if (listeners.size === 0) {
    pending.push(alert);
    return;
  }
  listeners.forEach((listener) => listener(alert));
};

export const alertService: { subscribe: (listener: Listener) => () => void; show: (input: AlertInput) => void } = {
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    if (pending.length > 0) {
      pending.forEach((alert) => listener(alert));
      pending = [];
    }
    return () => {
      listeners.delete(listener);
    };
  },
  show: (input: AlertInput) => {
    const alert: AlertMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...input
    };
    emit(alert);
  }
};
