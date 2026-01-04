import React from 'react';
import styles from './Sidebar.module.css';
import { useLayout } from '../../context/LayoutContext';
import { Select } from '../common/Select';

interface NavItemProps {
  id: string;
  title: string;
  icon: string;
  onClick: () => void;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ title, icon, onClick, isActive }) => (
  <div 
    className={`${styles.navItem} ${isActive ? styles.active : ''}`} 
    onClick={onClick}
  >
    <i className={icon}></i>
    <span>{title}</span>
  </div>
);

export const Sidebar: React.FC = () => {
  const { openTab, activeTabId, toggleBottomPanel } = useLayout();

  const handleNavClick = (id: string, title: string, icon: string) => {
    openTab({ id, title, icon, component: id });
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.resourceSwitcher}>
        <Select>
          <option>search-service-dev</option>
          <option>search-service-prod</option>
        </Select>
      </div>
      
      <div className={styles.navScroll}>
        <div className={styles.navGroup}>
          <div className={styles.navGroupTitle}>Classic</div>
          <NavItem 
            id="service" 
            title="Service Overview" 
            icon="fa-solid fa-server" 
            isActive={activeTabId === 'service'}
            onClick={() => handleNavClick('service', 'Service Overview', 'fa-solid fa-server')}
          />
          <NavItem 
            id="indexes" 
            title="Indexes" 
            icon="fa-solid fa-table" 
            isActive={activeTabId === 'indexes'}
            onClick={() => handleNavClick('indexes', 'Indexes', 'fa-solid fa-table')}
          />
          {/* Add other items as needed */}
        </div>
        
        <div className={styles.navGroup}>
          <div className={styles.navGroupTitle}>Agentic</div>
          <NavItem 
            id="playground" 
            title="Playground" 
            icon="fa-solid fa-flask" 
            isActive={activeTabId === 'playground'}
            onClick={() => handleNavClick('playground', 'Playground', 'fa-solid fa-flask')}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <NavItem 
          id="settings" 
          title="Settings" 
          icon="fa-solid fa-cog" 
          isActive={activeTabId === 'settings'}
          onClick={() => handleNavClick('settings', 'Settings', 'fa-solid fa-cog')}
        />
        <div className={styles.navItem} onClick={toggleBottomPanel}>
          <i className="fa-solid fa-terminal"></i>
          <span>Toggle Logs</span>
        </div>
      </div>
    </div>
  );
};
