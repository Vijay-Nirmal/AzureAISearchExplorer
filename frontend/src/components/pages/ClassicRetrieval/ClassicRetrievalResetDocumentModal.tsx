import React from 'react';

import { Button } from '../../common/Button';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import styles from './ClassicRetrievalPage.module.css';

export type ResetIndexerOption = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  docKey: string;
  indexerOptions: ResetIndexerOption[];
  selectedIndexer: string;
  onSelectIndexer: (value: string) => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  error?: string | null;
};

export const ClassicRetrievalResetDocumentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  docKey,
  indexerOptions,
  selectedIndexer,
  onSelectIndexer,
  onSubmit,
  loading,
  error
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Document"
      width="640px"
      footer={
        <>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!selectedIndexer || loading}
            title="Reset document for the selected indexer"
          >
            <i className="fas fa-rotate"></i> Reset
          </Button>
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

        <div className={styles.fieldRow}>
          <div className={styles.labelRow}>
            <Label>Document Key</Label>
          </div>
          <div className={styles.code}>{docKey || '(missing key)'}</div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.labelRow}>
            <Label>Indexer</Label>
          </div>
          <SelectWithDescription
            options={indexerOptions}
            value={selectedIndexer}
            onChange={(e) => onSelectIndexer(e.target.value)}
          />
          {indexerOptions.length === 0 ? (
            <div className={styles.smallHint}>No indexers target this index.</div>
          ) : null}
        </div>

        <div className={styles.smallHint}>
          Resetting a document clears the indexer change tracking state so it will be re-ingested.
        </div>
      </div>
    </Modal>
  );
};
