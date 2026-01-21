import React, { useEffect, useRef, useState } from 'react';
import styles from './Header.module.css';
import { useLayout } from '../../context/LayoutContext';
import { Button } from '../common/Button';
import { NotificationPanel } from '../common/NotificationPanel';
import { useToast } from '../../context/ToastContext';

export const Header: React.FC = () => {
  const { toggleTheme, theme, tabs, activeTabId, breadcrumbs, toggleChat } = useLayout();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const { notifications, dismissNotification } = useToast();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bellRef.current && bellRef.current.contains(target)) return;
      setNotificationsOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [notificationsOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumbs}>
        <span>Azure AI Search</span>
        {breadcrumbs.length > 0 ? (
          breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <i className="fa-solid fa-chevron-right"></i>
              <span
                className={index === breadcrumbs.length - 1 ? styles.current : styles.link}
                onClick={item.onClick}
                style={item.onClick ? { cursor: 'pointer' } : undefined}
              >
                {item.label}
              </span>
            </React.Fragment>
          ))
        ) : (
          <>
            <i className="fa-solid fa-chevron-right"></i>
            <span className={styles.current}>{activeTab?.title || 'Home'}</span>
          </>
        )}
      </div>
      
      <div className={styles.actions}>
        <Button
          variant="icon"
          onClick={toggleChat}
          title="Open Copilot Chat"
          icon={<i className="fa-solid fa-comments"></i>}
        />
        <Button 
          variant="icon" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          icon={<i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>}
        />
        <div style={{ position: 'relative' }} ref={bellRef}>
          <Button
            variant="icon"
            icon={<i className="fa-solid fa-bell"></i>}
            onClick={() => setNotificationsOpen((v) => !v)}
            title="Notifications"
          />
          <NotificationPanel
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            onDismiss={dismissNotification}
          />
        </div>
        <Button variant="icon" icon={<i className="fa-solid fa-user-circle"></i>} />
      </div>
    </header>
  );
};
