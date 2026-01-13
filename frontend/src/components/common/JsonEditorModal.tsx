import React, { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { JsonView } from './JsonView';

interface JsonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    value: unknown;
    onSave: (nextValue: unknown) => void | Promise<void>;
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({ isOpen, onClose, title, value, onSave }) => {
    const initialText = useMemo(() => {
        return typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2);
    }, [value]);

    const [text, setText] = useState<string>(initialText);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Keep the editor in sync when modal is reopened for a different value.
    React.useEffect(() => {
        if (!isOpen) return;
        setText(initialText);
        setError(null);
        setIsSaving(false);
    }, [isOpen, initialText]);

    const handleSave = async () => {
        try {
            const parsed = JSON.parse(text);
            setError(null);
            setIsSaving(true);
            await onSave(parsed);
            onClose();
        } catch (e) {
            setError((e as Error).message || 'Invalid JSON');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            width="900px"
            footer={(
                <>
                    <Button variant="primary" onClick={() => void handleSave()} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                </>
            )}
        >
            <div style={{ height: '60vh', minHeight: '420px', border: '1px solid var(--border-color)' }}>
                <JsonView
                    data={text}
                    readOnly={false}
                    onChange={(v) => setText(v || '')}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        automaticLayout: true
                    }}
                />
            </div>

            {error && (
                <div style={{ marginTop: '10px', color: 'var(--status-error-text)', fontSize: '12px' }}>
                    {error}
                </div>
            )}
        </Modal>
    );
};
