import React, { useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Card } from '../Card';
import { ConfigDrivenObjectForm } from './ConfigDrivenObjectForm';
import { JsonEditorModal } from '../JsonEditorModal';
import { alertService } from '../../../services/alertService';
import type { ConfigDrivenSchema } from './configDrivenTypes';

interface SchemaDrivenEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  schema: ConfigDrivenSchema;
  value: Record<string, unknown>;
  onSave: (next: Record<string, unknown>) => void;
  onCancel?: () => void;
  layoutMode?: 'default' | 'split-complex';
  nestedPresentation?: 'inline' | 'accordion';
}

export const SchemaDrivenEditorModal: React.FC<SchemaDrivenEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  schema,
  value,
  onSave,
  onCancel,
  layoutMode = 'split-complex',
  nestedPresentation = 'accordion'
}) => {
  const [draft, setDraft] = useState<Record<string, unknown>>(value);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);

  // Reset draft when opening or switching to a different object.
  const resetKey = useMemo(() => JSON.stringify(value), [value]);
  React.useEffect(() => {
    if (!isOpen) return;
    setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resetKey]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onCancel?.();
        onClose();
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <span style={{ fontWeight: 600 }}>{title}</span>
          <Button
            variant="icon"
            onClick={() => setRawJsonOpen(true)}
            title="Edit JSON"
          >
            <i className="fas fa-code"></i>
          </Button>
        </div>
      }
      width="980px"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              onCancel?.();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <Card style={{ width: '100%' }}>
        <ConfigDrivenObjectForm
          schema={schema}
          value={draft}
          onChange={setDraft}
          layoutMode={layoutMode}
          nestedPresentation={nestedPresentation}
          accordionDefaultExpanded={false}
          accordionSingleOpen={false}
        />
      </Card>
      <JsonEditorModal
        isOpen={rawJsonOpen}
        onClose={() => setRawJsonOpen(false)}
        title={`${title} (JSON)`}
        value={draft}
        onSave={(nextValue) => {
          if (nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)) {
            setDraft(nextValue as Record<string, unknown>);
          } else {
                alertService.show({ title: 'Validation', message: 'Root JSON must be an object.' });
          }
        }}
      />
    </Modal>
  );
};
