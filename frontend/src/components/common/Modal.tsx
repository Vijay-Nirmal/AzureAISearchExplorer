import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#252526', border: '1px solid #454545',
                borderRadius: '4px', width: '600px', maxWidth: '90vw', maxHeight: '80vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{title}</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                    {children}
                </div>
                {footer && (
                    <div style={{ padding: '12px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
