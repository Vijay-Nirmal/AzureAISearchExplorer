import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { JsonView } from './JsonView';

interface JsonViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: unknown;
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({ isOpen, onClose, title, data }) => {
    const handleCopy = () => {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(jsonString);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            width="min(1200px, 95vw)"
            footer={(
                <>
                    <Button variant="secondary" onClick={handleCopy}>
                        <i className="fas fa-copy"></i> Copy
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </>
            )}
        >
            <div
                style={{
                    height: 'min(70vh, 800px)',
                    minHeight: '400px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                <JsonView data={data} />
            </div>
        </Modal>
    );
};
