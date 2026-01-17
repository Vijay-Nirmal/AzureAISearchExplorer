import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toastService, type ToastMessage } from '../services/toastService';
import { ToastContainer } from '../components/common/ToastContainer.tsx';

type ToastContextValue = {
  toasts: ToastMessage[];
  notifications: ToastMessage[];
  dismiss: (id: string) => void;
  dismissNotification: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const DISMISS_AFTER_MS = 8000;
const MAX_NOTIFICATIONS = 100;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<ToastMessage[]>([]);
  const timersRef = useRef(new Map<string, { timeoutId: number; startedAt: number; remaining: number }>());

  useEffect(() => {
    return toastService.subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      setNotifications((prev) => {
        const next = [toast, ...prev];
        return next.slice(0, MAX_NOTIFICATIONS);
      });

      const timeoutId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        timersRef.current.delete(toast.id);
      }, DISMISS_AFTER_MS);

      timersRef.current.set(toast.id, {
        timeoutId,
        startedAt: Date.now(),
        remaining: DISMISS_AFTER_MS
      });
    });
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const dismissNotification = (id: string) =>
    setNotifications((prev) => prev.filter((t) => t.id !== id));

  const pause = useCallback((id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry) return;
    window.clearTimeout(entry.timeoutId);
    const elapsed = Date.now() - entry.startedAt;
    const remaining = Math.max(0, entry.remaining - elapsed);
    timersRef.current.set(id, { ...entry, remaining });
  }, []);

  const resume = useCallback((id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry) return;
    const timeoutId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, entry.remaining);
    timersRef.current.set(id, { ...entry, timeoutId, startedAt: Date.now() });
  }, []);

  const value = useMemo(
    () => ({ toasts, notifications, dismiss, dismissNotification, pause, resume }),
    [toasts, notifications, dismiss, dismissNotification, pause, resume]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} onPause={pause} onResume={resume} />
    </ToastContext.Provider>
  );
};
