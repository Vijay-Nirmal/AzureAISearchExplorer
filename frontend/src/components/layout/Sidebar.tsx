import React, { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';
import { useLayout } from '../../context/LayoutContext';
import { Select } from '../common/Select';
import { connectionService } from '../../services/connectionService';
import type { ConnectionProfile } from '../../types/ConnectionProfile';

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
  const { openTab, activeTabId, toggleBottomPanel, activeConnectionId, setActiveConnectionId } = useLayout();
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await connectionService.getAll();
      setConnections(data);
      if (data.length > 0 && !activeConnectionId) {
        setActiveConnectionId(data[0].id!);
      } else if (data.length === 0) {
        openTab({ 
            id: 'add-connection', 
            title: 'Add Connection', 
            icon: 'fa-solid fa-plug', 
            component: 'add-connection',
            props: { onSave: loadConnections }
        });
      }
    } catch (error) {
      console.error('Failed to load connections', error);
    }
  };

  const handleNavClick = (id: string, title: string, icon: string) => {
    openTab({ id, title, icon, component: id });
  };

  const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'add-new') {
      openTab({ 
          id: 'add-connection', 
          title: 'Add Connection', 
          icon: 'fa-solid fa-plug', 
          component: 'add-connection',
          props: { onSave: loadConnections }
      });
    } else {
      setActiveConnectionId(value);
    }
  };

  const handleEditConnection = () => {
      if (activeConnectionId) {
          openTab({ 
              id: 'edit-connection-' + activeConnectionId, 
              title: 'Edit Connection', 
              icon: 'fa-solid fa-pencil', 
              component: 'add-connection',
              props: { connectionId: activeConnectionId, onSave: loadConnections }
          });
      }
  };
  
  const handleDeleteConnection = async () => {
      if (activeConnectionId && confirm('Are you sure you want to delete this connection?')) {
          await connectionService.delete(activeConnectionId);
          const remaining = connections.filter(c => c.id !== activeConnectionId);
          setConnections(remaining);
          if (remaining.length > 0) {
              setActiveConnectionId(remaining[0].id!);
          } else {
              setActiveConnectionId(null);
          }
      }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.resourceSwitcher}>
        {connections.length === 0 ? (
             <button 
                onClick={() => openTab({ 
                    id: 'add-connection', 
                    title: 'Add Connection', 
                    icon: 'fa-solid fa-plug', 
                    component: 'add-connection',
                    props: { onSave: loadConnections }
                })}
                className={styles.addConnectionBtn}
             >
                <i className="fa-solid fa-plus"></i>
                <span>Add Connection</span>
             </button>
        ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                <Select 
                    value={activeConnectionId || ''} 
                    onChange={handleResourceChange}
                    style={{ flex: 1 }}
                >
                {connections.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.endpoint}</option>
                ))}
                <option value="add-new">+ Add New Service</option>
                </Select>
                <button className={styles.iconBtn} onClick={handleEditConnection} title="Edit Connection">
                    <i className="fas fa-pencil-alt"></i>
                </button>
                <button className={styles.iconBtn} onClick={handleDeleteConnection} title="Delete Connection">
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        )}
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
