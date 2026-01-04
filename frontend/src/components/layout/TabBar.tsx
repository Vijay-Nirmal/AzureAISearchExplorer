import React from 'react';
import styles from './TabBar.module.css';
import { useLayout } from '../../context/LayoutContext';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useLayout();

  if (tabs.length === 0) return null;

  return (
    <div className={styles.tabBar}>
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          className={`${styles.tabItem} ${tab.id === activeTabId ? styles.active : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon && <i className={tab.icon}></i>}
          <span>{tab.title}</span>
          <span 
            className={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            <i className="fa-solid fa-times"></i>
          </span>
        </div>
      ))}
    </div>
  );
};
