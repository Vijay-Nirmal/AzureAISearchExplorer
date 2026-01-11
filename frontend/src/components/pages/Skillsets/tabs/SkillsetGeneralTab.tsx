import React from 'react';
import { Card } from '../../../common/Card';
import { Input } from '../../../common/Input';
import { Label } from '../../../common/Label';
import { InfoIcon } from '../../../common/InfoIcon';
import type { SearchIndexerSkillset } from '../../../../types/SkillsetModels';
import { getFieldTooltipFromSchema } from '../../../common/configDriven/configDrivenUtils';
import { skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR } from '../skillsetTooltips';

interface SkillsetGeneralTabProps {
  skillsetDef: SearchIndexerSkillset;
  setSkillsetDef: React.Dispatch<React.SetStateAction<SearchIndexerSkillset>>;
  isEdit: boolean;
}

const SkillsetGeneralTab: React.FC<SkillsetGeneralTabProps> = ({ skillsetDef, setSkillsetDef, isEdit }) => {
  const nameTooltip = getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'name');
  const descTooltip = getFieldTooltipFromSchema(skillsetMetaSchema, SKILLSET_META_DISCRIMINATOR, 'description');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <Card style={{ maxWidth: '900px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label>
                Name {nameTooltip ? <InfoIcon tooltip={nameTooltip} /> : null}
              </Label>
              <Input
                value={skillsetDef.name}
                onChange={(e) => setSkillsetDef({ ...skillsetDef, name: e.target.value })}
                disabled={isEdit}
                placeholder="Skillset name"
              />
              {isEdit && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-color)', opacity: 0.75 }}>
                  Name is immutable after creation.
                </div>
              )}
            </div>

            <div>
              <Label>
                Description {descTooltip ? <InfoIcon tooltip={descTooltip} /> : null}
              </Label>
              <Input
                value={skillsetDef.description || ''}
                onChange={(e) => setSkillsetDef({ ...skillsetDef, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-color)', opacity: 0.75 }}>
            Tip: use the JSON tab if you need to edit properties not supported by the UI yet.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SkillsetGeneralTab;
