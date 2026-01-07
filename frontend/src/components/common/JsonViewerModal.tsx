import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { JsonView } from './JsonView';

interface JsonViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any;
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
            footer={(
                <>
                    <Button variant="secondary" onClick={handleCopy}>
                        <i className="fas fa-copy"></i> Copy
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </>
            )}
        >
            <div style={{ height: '60vh', minHeight: '400px', border: '1px solid #333' }}>
                <JsonView data={data} />
            </div>
        </Modal>
    );
};
