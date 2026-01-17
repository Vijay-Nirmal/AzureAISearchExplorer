import React from 'react';

import { Button } from './Button';
import { Modal } from './Modal';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export const AlertModal: React.FC<Props> = ({ isOpen, title, message, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="480px"
      footer={
        <>
          <Button variant="primary" onClick={onClose}>
            OK
          </Button>
        </>
      }
    >
      <div style={{ fontSize: 13, color: 'var(--text-color)', whiteSpace: 'pre-wrap' }}>{message}</div>
    </Modal>
  );
};
