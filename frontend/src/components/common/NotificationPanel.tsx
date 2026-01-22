import React from 'react';
import type { ToastMessage } from '../../services/toastService';
import { chatPanelService } from '../../services/chat/chatPanelService';
import { Button } from './Button';
import styles from './NotificationPanel.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  notifications: ToastMessage[];
  onDismiss: (id: string) => void;
};

const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NotificationPanel: React.FC<Props> = ({ isOpen, onClose, notifications, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.panel} role="dialog" aria-label="Notifications" onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <div className={styles.title}>Notifications</div>
        <button className={styles.close} onClick={onClose} title="Close" aria-label="Close" type="button">
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className={styles.body}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>No notifications yet.</div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemMeta}>
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  {item.copilotPrompt && (item.variant === 'error' || item.variant === 'warning') ? (
                    <Button
                      variant="icon"
                      title="Explain with Copilot"
                      onClick={() => chatPanelService.openWithMessage(item.copilotPrompt!)}
                      className={styles.itemCopilot}
                    >
                      <i className="fa-brands fa-github"></i>
                    </Button>
                  ) : null}
                  <button
                    className={styles.itemClose}
                    onClick={() => onDismiss(item.id)}
                    title="Remove"
                    aria-label="Remove"
                    type="button"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              {item.message ? <div className={styles.itemMessage}>{item.message}</div> : null}
              {item.details ? <pre className={styles.itemDetails}>{item.details}</pre> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
