import React, { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { skillsetsService } from '../../../services/skillsetsService';
import { alertService } from '../../../services/alertService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { JsonEditorModal } from '../../common/JsonEditorModal';
import { JsonView } from '../../common/JsonView';
import { InfoIcon } from '../../common/InfoIcon';

import SkillsetGeneralTab from './tabs/SkillsetGeneralTab';
import SkillsetCognitiveServicesTab from './tabs/SkillsetCognitiveServicesTab';
import SkillsetSkillsTab from './tabs/SkillsetSkillsTab';
import SkillsetKnowledgeStoreTab from './tabs/SkillsetKnowledgeStoreTab';
import SkillsetIndexProjectionsTab from './tabs/SkillsetIndexProjectionsTab';
import SkillsetEncryptionKeyTab from './tabs/SkillsetEncryptionKeyTab';
import SkillsetVisualDesignTab from './tabs/SkillsetVisualDesignTab';

import type { SearchIndexerSkillset } from '../../../types/SkillsetModels';

import { getFieldTooltipFromSchema, getTypeDescriptionFromSchema } from '../../common/configDriven/configDrivenUtils';
import { skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR } from './skillsetTooltips';

interface SkillsetBuilderProps {
  skillsetName?: string;
  onBack: () => void;
}

type TabId = 'general' | 'cognitiveServices' | 'skills' | 'knowledgeStore' | 'indexProjections' | 'encryptionKey' | 'visualDesign' | 'json';

const SkillsetBuilder: React.FC<SkillsetBuilderProps> = ({ skillsetName, onBack }) => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();
  const isEdit = !!skillsetName;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  const [skillsetDef, setSkillsetDef] = useState<SearchIndexerSkillset>({
    name: skillsetName || 'new-skillset',
    description: undefined,
    skills: []
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Skillsets', onClick: onBack },
      { label: isEdit ? skillsetName : 'Create Skillset' }
    ]);
    return () => setBreadcrumbs([]);
  }, [isEdit, skillsetName, onBack, setBreadcrumbs]);

  useEffect(() => {
    const fetchSkillset = async () => {
      if (!isEdit || !activeConnectionId || !skillsetName) return;
      setLoading(true);
      try {
        const data = await skillsetsService.getSkillset(activeConnectionId, skillsetName);
        if (!data.skills) data.skills = [];
        setSkillsetDef(data);
        if (!isEditingDescription) setDescriptionDraft(data.description || '');
      } catch (error) {
        console.error('Failed to fetch skillset definition', error);
        alertService.show({ title: 'Error', message: 'Failed to load skillset definition.' });
      } finally {
        setLoading(false);
      }
    };
    fetchSkillset();
  }, [isEdit, activeConnectionId, skillsetName, isEditingDescription]);

  const saveSkillset = async () => {
    if (!activeConnectionId) return;
    const name = (skillsetDef.name || '').trim();
    if (!name) {
      alertService.show({ title: 'Validation', message: 'Skillset name is required.' });
      return;
    }

    setLoading(true);
    try {
      await skillsetsService.createOrUpdateSkillset(activeConnectionId, { ...skillsetDef, name });
      onBack();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      alertService.show({ title: 'Error', message: `Failed to save skillset: ${message}` });
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(() => {
    const generalTooltipParts = [
      getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'name'),
      getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'description')
    ]
      .filter(Boolean)
      .join(' ');

    const typeDesc = getTypeDescriptionFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR);

    return [
      { id: 'general' as const, label: 'General', tooltip: generalTooltipParts || typeDesc },
      {
        id: 'cognitiveServices' as const,
        label: 'Cognitive Services',
        tooltip: getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'cognitiveServices')
      },
      { id: 'skills' as const, label: 'Skills', tooltip: getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'skills') },
      {
        id: 'knowledgeStore' as const,
        label: 'Knowledge Store',
        tooltip: getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'knowledgeStore')
      },
      {
        id: 'indexProjections' as const,
        label: 'Index Projections',
        tooltip: getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'indexProjections')
      },
      {
        id: 'encryptionKey' as const,
        label: 'Encryption Key',
        tooltip: getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'encryptionKey')
      },
      { id: 'visualDesign' as const, label: 'Visual Design', tooltip: 'Visualize and edit skills + index projections as a flow' },
      { id: 'json' as const, label: 'JSON', tooltip: 'JSON view to view and edit any property' }
    ];
  }, []);

  const renderHeader = () => {
    const descriptionText = (skillsetDef.description || '').trim();

    return (
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.15, flexShrink: 0 }}>
            {isEdit ? skillsetDef.name : 'Create Skillset'}
          </h2>

          {!isEdit && (
            <div style={{ width: '300px', flexShrink: 0 }}>
              <Input
                value={skillsetDef.name}
                onChange={e => setSkillsetDef({ ...skillsetDef, name: e.target.value })}
                placeholder="Skillset name (e.g. my-skillset)"
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, color: 'var(--text-color)', fontSize: '12px', lineHeight: 1.2 }}>
            {!isEditingDescription && descriptionText.length > 0 && (
              <span
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55vw', opacity: 0.75 }}
                title={descriptionText}
              >
                — {descriptionText}
              </span>
            )}

            {isEditingDescription && (
              <>
                <div style={{ width: '520px', maxWidth: '55vw' }}>
                  <Input
                    value={descriptionDraft}
                    onChange={e => setDescriptionDraft(e.target.value)}
                    placeholder="Skillset description"
                    style={{ width: '100%' }}
                  />
                </div>
                <Button
                  variant="icon"
                  onClick={() => {
                    const next = descriptionDraft.trim();
                    setSkillsetDef(prev => ({ ...prev, description: next ? next : undefined }));
                    setIsEditingDescription(false);
                  }}
                  title="Save description"
                >
                  <i className="fas fa-check"></i>
                </Button>
                <Button
                  variant="icon"
                  onClick={() => {
                    setDescriptionDraft(skillsetDef.description || '');
                    setIsEditingDescription(false);
                  }}
                  title="Cancel"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </>
            )}

            {!isEditingDescription && (
              <Button
                variant="icon"
                onClick={() => {
                  setDescriptionDraft(skillsetDef.description || '');
                  setIsEditingDescription(true);
                }}
                title={descriptionText ? 'Edit description' : 'Add description'}
                style={{ opacity: 0.9, flexShrink: 0 }}
              >
                <i className="fas fa-pen"></i>
              </Button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <Button variant="primary" onClick={saveSkillset} disabled={loading}>
            <i className="fas fa-save"></i> Save
          </Button>
          <Button onClick={onBack}>Cancel</Button>
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    return (
      <div style={{ padding: '0 12px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '1px', minWidth: 'max-content' }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: 'var(--text-color)',
                opacity: activeTab === tab.id ? 1 : 0.75,
                flexShrink: 0,
                lineHeight: 1.1,
                fontSize: '12px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {tab.label}
                {tab.tooltip && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <InfoIcon tooltip={tab.tooltip} />
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      {renderHeader()}

      <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderTabs()}

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'general' && (
            <SkillsetGeneralTab skillsetDef={skillsetDef} setSkillsetDef={setSkillsetDef} isEdit={isEdit} />
          )}

          {activeTab === 'cognitiveServices' && (
            <SkillsetCognitiveServicesTab skillsetDef={skillsetDef} setSkillsetDef={setSkillsetDef} />
          )}

          {activeTab === 'skills' && (
            <SkillsetSkillsTab skillsetDef={skillsetDef} setSkillsetDef={setSkillsetDef} />
          )}

          {activeTab === 'knowledgeStore' && (
            <SkillsetKnowledgeStoreTab skillsetDef={skillsetDef} setSkillsetDef={setSkillsetDef} />
          )}

          {activeTab === 'indexProjections' && (
            <SkillsetIndexProjectionsTab skillsetDef={skillsetDef} setSkillsetDef={setSkillsetDef} />
          )}

          {activeTab === 'encryptionKey' && (
            <SkillsetEncryptionKeyTab skillsetDef={skillsetDef} setSkillsetDef={setSkillsetDef} />
          )}

          {activeTab === 'visualDesign' && (
            <SkillsetVisualDesignTab skillsetDef={skillsetDef} setSkillsetDef={setSkillsetDef} />
          )}

          {activeTab === 'json' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                <Button variant="icon" onClick={() => setIsJsonEditorOpen(true)} title="Edit JSON">
                  <i className="fas fa-code"></i>
                </Button>
                <div style={{ marginLeft: 'auto', color: 'var(--text-color)', opacity: 0.75, fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                  {loading ? 'Saving/Loading…' : 'Edit via modal to avoid invalid JSON state'}
                </div>
              </div>
              <div style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                <JsonView data={skillsetDef} />
              </div>

              <JsonEditorModal
                isOpen={isJsonEditorOpen}
                onClose={() => setIsJsonEditorOpen(false)}
                title="Edit Skillset JSON"
                value={skillsetDef}
                onSave={(nextValue) => {
                  if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
                    alertService.show({ title: 'Validation', message: 'Skillset JSON must be an object.' });
                    return;
                  }

                  const obj = nextValue as Record<string, unknown>;
                  const nextName = String(obj.name ?? '').trim();
                  if (!nextName) {
                    alertService.show({ title: 'Validation', message: 'Skillset JSON must include a non-empty name.' });
                    return;
                  }

                  setSkillsetDef(obj as unknown as SearchIndexerSkillset);
                }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SkillsetBuilder;
