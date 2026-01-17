import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { ConfirmModal } from '../components/common/ConfirmModal';
import { confirmService, type ConfirmMessage } from '../services/confirmService';

type ConfirmContextValue = {
  queue: ConfirmMessage[];
};

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const useConfirm = (): ConfirmContextValue => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<ConfirmMessage[]>([]);

  useEffect(() => {
    return confirmService.subscribe((confirm) => {
      setQueue((prev) => [...prev, confirm]);
    });
  }, []);

  const current = queue[0];

  const resolve = (confirmed: boolean) => {
    if (current) current.resolve(confirmed);
    setQueue((prev) => prev.slice(1));
  };

  const value = useMemo(() => ({ queue }), [queue]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmModal
        isOpen={!!current}
        title={current?.title || 'Confirm'}
        message={current?.message || ''}
        confirmLabel={current?.confirmLabel}
        cancelLabel={current?.cancelLabel}
        onConfirm={() => resolve(true)}
        onCancel={() => resolve(false)}
      />
    </ConfirmContext.Provider>
  );
};
