import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const loadConnectionsRef = useRef<(() => Promise<void>) | null>(null);
  const handleConnectionSaved = useCallback(() => {
    void loadConnectionsRef.current?.();
  }, []);

  const loadConnections = useCallback(async () => {
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
            props: { onSave: handleConnectionSaved }
        });
      }
    } catch (error) {
      console.error('Failed to load connections', error);
    }
  }, [activeConnectionId, handleConnectionSaved, openTab, setActiveConnectionId]);

  useEffect(() => {
    loadConnectionsRef.current = loadConnections;
  }, [loadConnections]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadConnections();
    }, 0);

    return () => {
      window.clearTimeout(id);
    };
  }, [loadConnections]);

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
          props: { onSave: handleConnectionSaved }
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
          props: { connectionId: activeConnectionId, onSave: handleConnectionSaved }
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
              props: { onSave: handleConnectionSaved }
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
          <NavItem 
            id="aliases" 
            title="Aliases" 
            icon="fa-solid fa-link" 
            isActive={activeTabId === 'aliases'}
            onClick={() => handleNavClick('aliases', 'Aliases', 'fa-solid fa-link')}
          />
          <NavItem 
            id="synonymmaps" 
            title="Synonym Maps" 
            icon="fa-solid fa-language" 
            isActive={activeTabId === 'synonymmaps'}
            onClick={() => handleNavClick('synonymmaps', 'Synonym Maps', 'fa-solid fa-language')}
          />
          <NavItem 
            id="indexers" 
            title="Indexers" 
            icon="fa-solid fa-robot" 
            isActive={activeTabId === 'indexers'}
            onClick={() => handleNavClick('indexers', 'Indexers', 'fa-solid fa-robot')}
          />
          <NavItem 
            id="datasources" 
            title="Data Sources" 
            icon="fa-solid fa-database" 
            isActive={activeTabId === 'datasources'}
            onClick={() => handleNavClick('datasources', 'Data Sources', 'fa-solid fa-database')}
          />
          <NavItem 
            id="skillsets" 
            title="Skillsets" 
            icon="fa-solid fa-wand-magic-sparkles" 
            isActive={activeTabId === 'skillsets'}
            onClick={() => handleNavClick('skillsets', 'Skillsets', 'fa-solid fa-wand-magic-sparkles')}
          />

          <NavItem
            id="classic-retrieval"
            title="Classic Retrieval"
            icon="fa-solid fa-magnifying-glass"
            isActive={activeTabId === 'classic-retrieval'}
            onClick={() => handleNavClick('classic-retrieval', 'Classic Retrieval', 'fa-solid fa-magnifying-glass')}
          />
          {/* Add other items as needed */}
        </div>
        
        <div className={styles.navGroup}>
          <div className={styles.navGroupTitle}>Agentic</div>
          <NavItem 
            id="agentic-retrieval" 
            title="Agentic Retrieval" 
            icon="fa-solid fa-comments" 
            isActive={activeTabId === 'agentic-retrieval'}
            onClick={() => handleNavClick('agentic-retrieval', 'Agentic Retrieval', 'fa-solid fa-comments')}
          />
          <NavItem 
            id="playground" 
            title="Playground" 
            icon="fa-solid fa-flask" 
            isActive={activeTabId === 'playground'}
            onClick={() => handleNavClick('playground', 'Playground', 'fa-solid fa-flask')}
          />
          <NavItem 
            id="knowledgesources" 
            title="Knowledge Sources" 
            icon="fa-solid fa-database" 
            isActive={activeTabId === 'knowledgesources'}
            onClick={() => handleNavClick('knowledgesources', 'Knowledge Sources', 'fa-solid fa-database')}
          />
          <NavItem 
            id="knowledgebases" 
            title="Knowledge Bases" 
            icon="fa-solid fa-book" 
            isActive={activeTabId === 'knowledgebases'}
            onClick={() => handleNavClick('knowledgebases', 'Knowledge Bases', 'fa-solid fa-book')}
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
