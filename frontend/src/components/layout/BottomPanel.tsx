import React, { useEffect, useState, useRef } from 'react';
import { Resizable } from 're-resizable';
import styles from './BottomPanel.module.css';
import { useLayout } from '../../context/LayoutContext';
import { Button } from '../common/Button';
import { logService, type LogEntry } from '../../services/logService';

export const BottomPanel: React.FC = () => {
  const { isBottomPanelOpen, toggleBottomPanel } = useLayout();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [logLevel, setLogLevel] = useState('Information');
  const endRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const data = await logService.getLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  useEffect(() => {
    if (isBottomPanelOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isBottomPanelOpen]);

  useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleClear = async () => {
    try {
      await logService.clearLogs();
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs', error);
    }
  };

  const handleLogLevelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLevel = e.target.value;
      setLogLevel(newLevel);
      try {
          await logService.setLogLevel(newLevel);
      } catch (error) {
          console.error('Failed to set log level', error);
      }
  };

  if (!isBottomPanelOpen) return null;

  const getLogClass = (level: string) => {
      switch (level.toLowerCase()) {
          case 'information': return styles.info;
          case 'warning': return styles.warn;
          case 'error': return styles.error;
          case 'critical': return styles.error;
          default: return styles.info;
      }
  }

  const filteredLogs = logs.filter(log => 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Resizable
      defaultSize={{
        width: '100%',
        height: 180,
      }}
      minHeight={28}
      maxHeight="80vh"
      enable={{ top: true }}
      className={styles.bottomPanel}
      handleClasses={{ top: styles.resizeHandle }}
    >
      <div className={styles.header}>
        <div className={styles.controls}>
            <span>Output / Logs</span>
            <select 
                className={styles.logLevelSelect} 
                value={logLevel} 
                onChange={handleLogLevelChange}
                title="Minimum Log Level"
            >
                <option value="Trace">Trace</option>
                <option value="Debug">Debug</option>
                <option value="Information">Information</option>
                <option value="Warning">Warning</option>
                <option value="Error">Error</option>
                <option value="Critical">Critical</option>
            </select>
            <input 
                type="text" 
                className={styles.searchInput} 
                placeholder="Filter logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button variant="icon" icon={<i className="fa-solid fa-trash"></i>} title="Clear" onClick={handleClear} />
          <Button variant="icon" icon={<i className="fa-solid fa-times"></i>} onClick={toggleBottomPanel} title="Close" />
        </div>
      </div>
      <div className={styles.content}>
        {filteredLogs.length === 0 && <div className={styles.logEntry}>No logs available.</div>}
        {filteredLogs.map((log, index) => (
            <div key={index} className={`${styles.logEntry} ${getLogClass(log.level)}`}>
                <span style={{ opacity: 0.7, marginRight: '8px' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>[{log.level.toUpperCase()}]</span>
                <span>{log.message}</span>
                {log.exception && <div style={{ color: 'var(--status-error-text)', marginLeft: '20px' }}>{log.exception}</div>}
            </div>
        ))}
        <div ref={endRef} />
      </div>
    </Resizable>
  );
};
