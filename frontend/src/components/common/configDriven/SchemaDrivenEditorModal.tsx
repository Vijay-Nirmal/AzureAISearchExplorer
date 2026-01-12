import React, { useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Card } from '../Card';
import { ConfigDrivenObjectForm } from './ConfigDrivenObjectForm';
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
      title={title}
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
    </Modal>
  );
};
