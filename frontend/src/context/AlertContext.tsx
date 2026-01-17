import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { AlertModal } from '../components/common/AlertModal';
import { alertService, type AlertMessage } from '../services/alertService';

type AlertContextValue = {
  queue: AlertMessage[];
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const useAlert = (): AlertContextValue => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<AlertMessage[]>([]);

  useEffect(() => {
    return alertService.subscribe((alert) => {
      setQueue((prev) => [...prev, alert]);
    });
  }, []);

  const current = queue[0];

  const dismiss = () => {
    setQueue((prev) => prev.slice(1));
  };

  const value = useMemo(() => ({ queue }), [queue]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal
        isOpen={!!current}
        title={current?.title || 'Notice'}
        message={current?.message || ''}
        onClose={dismiss}
      />
    </AlertContext.Provider>
  );
};
