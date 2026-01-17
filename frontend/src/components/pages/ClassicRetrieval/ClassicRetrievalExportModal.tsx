import React from 'react';

import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';

import styles from './ClassicRetrievalPage.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  canExportFiltered: boolean;
  onExportFiltered: () => Promise<void>;
  onExportAll: () => Promise<void>;
  loading: boolean;
  error?: string | null;
};

export const ClassicRetrievalExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  canExportFiltered,
  onExportFiltered,
  onExportAll,
  loading,
  error
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Documents"
      width="640px"
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error ? (
          <div className={styles.requestJsonError}>
            <i className="fas fa-triangle-exclamation"></i> {error}
          </div>
        ) : null}

        <div className={styles.kvGrid}>
          <div className={styles.kvKey}>Filtered items</div>
          <div className={styles.kvVal}>
            Export the documents from the current results table.
          </div>
          <div className={styles.kvKey}>All items</div>
          <div className={styles.kvVal}>
            Fetch and export all documents in the index (may take time for large indexes).
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={onExportFiltered}
            disabled={!canExportFiltered || loading}
            title="Export the currently filtered items"
          >
            <i className="fas fa-filter"></i> Export Filtered
          </Button>
          <Button
            variant="primary"
            onClick={onExportAll}
            disabled={loading}
            title="Export all items"
          >
            <i className="fas fa-download"></i> Export All
          </Button>
        </div>
      </div>
    </Modal>
  );
};
