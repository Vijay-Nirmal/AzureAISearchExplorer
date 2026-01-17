import React from 'react';
import type { ToastMessage } from '../../services/toastService';
import styles from './ToastContainer.module.css';

type Props = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
};

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss, onPause, onResume }) => {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.variant || 'error']}`}
          onMouseEnter={() => onPause(toast.id)}
          onMouseLeave={() => onResume(toast.id)}
        >
          <div className={styles.header}>
            <div className={styles.title}>{toast.title}</div>
            <button
              className={styles.close}
              onClick={() => onDismiss(toast.id)}
              title="Dismiss"
              aria-label="Dismiss"
              type="button"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          {toast.message ? <div className={styles.message}>{toast.message}</div> : null}
          {toast.details ? <pre className={styles.details}>{toast.details}</pre> : null}
        </div>
      ))}
    </div>
  );
};
