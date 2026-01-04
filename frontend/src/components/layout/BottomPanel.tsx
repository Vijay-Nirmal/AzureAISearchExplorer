import React from 'react';
import styles from './BottomPanel.module.css';
import { useLayout } from '../../context/LayoutContext';
import { Button } from '../common/Button';

export const BottomPanel: React.FC = () => {
  const { isBottomPanelOpen, toggleBottomPanel } = useLayout();

  if (!isBottomPanelOpen) return null;

  return (
    <div className={styles.bottomPanel}>
      <div className={styles.header}>
        <span>Output / Logs</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button variant="icon" icon={<i className="fa-solid fa-trash"></i>} title="Clear" />
          <Button variant="icon" icon={<i className="fa-solid fa-times"></i>} onClick={toggleBottomPanel} title="Close" />
        </div>
      </div>
      <div className={styles.content}>
        <div className={`${styles.logEntry} ${styles.info}`}>[INFO] Application started...</div>
        <div className={`${styles.logEntry} ${styles.warn}`}>[WARN] Connection slow...</div>
      </div>
    </div>
  );
};
