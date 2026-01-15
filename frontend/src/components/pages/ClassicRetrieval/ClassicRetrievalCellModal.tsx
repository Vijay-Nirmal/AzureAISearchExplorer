import React from 'react';

import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { TextArea } from '../../common/TextArea';

type Props = {
  isOpen: boolean;
  value: string;
  onClose: () => void;
};

export const ClassicRetrievalCellModal: React.FC<Props> = ({ isOpen, value, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cell Content"
      footer={
        <>
          <Button variant="secondary" onClick={() => value && navigator.clipboard.writeText(value)}>
            <i className="fas fa-copy"></i> Copy
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <TextArea
        readOnly
        style={{
          width: '100%',
          height: '100%',
          minHeight: '300px',
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          resize: 'none',
          padding: '10px'
        }}
        value={value}
      />
    </Modal>
  );
};
