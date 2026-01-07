import React from 'react';
import styles from './Header.module.css';
import { useLayout } from '../../context/LayoutContext';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { toggleTheme, theme, tabs, activeTabId, breadcrumbs } = useLayout();
  const activeTab = tabs.find(t => t.id === activeTabId);

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
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          icon={<i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>}
        />
        <Button variant="icon" icon={<i className="fa-solid fa-bell"></i>} />
        <Button variant="icon" icon={<i className="fa-solid fa-user-circle"></i>} />
      </div>
    </header>
  );
};
