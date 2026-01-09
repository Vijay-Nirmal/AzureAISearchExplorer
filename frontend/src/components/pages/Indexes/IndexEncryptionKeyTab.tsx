import React, { useMemo, useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Label } from '../../common/Label';
import { Modal } from '../../common/Modal';
import { InfoIcon } from '../../common/InfoIcon';
import { SelectWithDescription } from '../../common/SelectWithDescription';

import encryptionKeyDescriptions from '../../../data/constants/encryptionKeyPropertyDescriptions.json';
import authMethods from '../../../data/constants/encryptionKeyAuthMethods.json';

import type {
    AzureActiveDirectoryApplicationCredentials,
    SearchIndex,
    SearchResourceEncryptionKey
} from '../../../types/IndexModels';

interface IndexEncryptionKeyTabProps {
    indexDef: SearchIndex;
    setIndexDef: React.Dispatch<React.SetStateAction<SearchIndex>>;
}

type AuthMethod = 'managedIdentity' | 'aadAppCredentials';

const getAuthMethodFromKey = (key: SearchResourceEncryptionKey | undefined): AuthMethod => {
    return key?.accessCredentials ? 'aadAppCredentials' : 'managedIdentity';
};

const normalizeEncryptionKey = (draft: SearchResourceEncryptionKey, authMethod: AuthMethod): SearchResourceEncryptionKey => {
    const normalized: SearchResourceEncryptionKey = {
        keyVaultUri: (draft.keyVaultUri || '').trim() || undefined,
        keyVaultKeyName: (draft.keyVaultKeyName || '').trim() || undefined,
        keyVaultKeyVersion: (draft.keyVaultKeyVersion || '').trim() || undefined
    };

    if (authMethod === 'aadAppCredentials') {
        const creds: AzureActiveDirectoryApplicationCredentials = {
            applicationId: (draft.accessCredentials?.applicationId || '').trim() || undefined,
            applicationSecret: (draft.accessCredentials?.applicationSecret || '').trim() || undefined
        };
        normalized.accessCredentials = creds;
    }

    return normalized;
};

export const IndexEncryptionKeyTab: React.FC<IndexEncryptionKeyTabProps> = ({ indexDef, setIndexDef }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [tempKey, setTempKey] = useState<SearchResourceEncryptionKey | null>(null);
    const [tempAuthMethod, setTempAuthMethod] = useState<AuthMethod>('managedIdentity');
    const [showSecret, setShowSecret] = useState(false);

    const authMethodOptions = useMemo(() => {
        const list = authMethods as Array<{ value: string; description?: string }>;
        return list.map(m => ({ value: m.value, label: m.value, description: m.description }));
    }, []);

    const openEditor = () => {
        const existing = indexDef.encryptionKey;
        const draft: SearchResourceEncryptionKey = existing ? structuredClone(existing) : {};
        setTempKey(draft);
        setTempAuthMethod(getAuthMethodFromKey(existing));
        setShowSecret(false);
        setModalOpen(true);
    };

    const removeKey = () => {
        const ok = window.confirm(
            'Remove encryptionKey from this index definition?\n\nNote: If the index already has an encryption key set, Azure AI Search may ignore attempts to set encryptionKey to null/removed.'
        );
        if (!ok) return;
        setIndexDef(prev => ({ ...prev, encryptionKey: undefined }));
    };

    const saveFromModal = () => {
        if (!tempKey) return;

        const normalized = normalizeEncryptionKey(tempKey, tempAuthMethod);

        // Minimal validation for a usable payload
        if (!normalized.keyVaultUri || !normalized.keyVaultKeyName) return;
        if (tempAuthMethod === 'aadAppCredentials') {
            const creds = normalized.accessCredentials;
            if (!creds?.applicationId || !creds?.applicationSecret) return;
        }

        setIndexDef(prev => ({ ...prev, encryptionKey: normalized }));
        setModalOpen(false);
        setTempKey(null);
    };

    const renderEditorModal = () => {
        if (!modalOpen || !tempKey) return null;

        const authMethod = tempAuthMethod;
        const isAadApp = authMethod === 'aadAppCredentials';

        return (
            <Modal
                title={indexDef.encryptionKey ? 'Edit Encryption Key' : 'Add Encryption Key'}
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setTempKey(null);
                    setShowSecret(false);
                }}
                width="760px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ color: 'var(--text-muted-color)', fontSize: '12px', lineHeight: 1.4 }}>
                        <InfoIcon tooltip={encryptionKeyDescriptions.encryptionKey} />
                        <span style={{ marginLeft: '6px' }}>Customer-managed keys (CMK) require a paid search service.</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Auth Method <InfoIcon tooltip={encryptionKeyDescriptions.authMethod} /></Label>
                            <SelectWithDescription
                                value={authMethod}
                                onChange={e => {
                                    const next = e.target.value as AuthMethod;
                                    setTempAuthMethod(next);
                                    if (next === 'managedIdentity') {
                                        setTempKey({
                                            ...tempKey,
                                            accessCredentials: undefined
                                        });
                                    } else {
                                        setTempKey({
                                            ...tempKey,
                                            accessCredentials: tempKey.accessCredentials || {}
                                        });
                                    }
                                }}
                                options={authMethodOptions}
                            />
                        </div>

                        <div>
                            <Label>Key Vault URI <InfoIcon tooltip={encryptionKeyDescriptions.keyVaultUri} /></Label>
                            <Input
                                value={tempKey.keyVaultUri || ''}
                                onChange={e => setTempKey({ ...tempKey, keyVaultUri: e.target.value })}
                                placeholder="https://my-keyvault-name.vault.azure.net"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Label>Key Name <InfoIcon tooltip={encryptionKeyDescriptions.keyVaultKeyName} /></Label>
                            <Input
                                value={tempKey.keyVaultKeyName || ''}
                                onChange={e => setTempKey({ ...tempKey, keyVaultKeyName: e.target.value })}
                                placeholder="e.g. cmk-search"
                            />
                        </div>
                        <div>
                            <Label>Key Version <InfoIcon tooltip={encryptionKeyDescriptions.keyVaultKeyVersion} /></Label>
                            <Input
                                value={tempKey.keyVaultKeyVersion || ''}
                                onChange={e => setTempKey({ ...tempKey, keyVaultKeyVersion: e.target.value })}
                                placeholder="(optional)"
                            />
                        </div>
                    </div>

                    <fieldset style={{ border: '1px solid #444', padding: '12px', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 8px' }}>
                            Access Credentials <InfoIcon tooltip={encryptionKeyDescriptions.accessCredentials} />
                        </legend>

                        {!isAadApp && (
                            <div style={{ color: '#aaa', fontSize: '12px' }}>
                                Not required for managed identity.
                            </div>
                        )}

                        {isAadApp && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <Label>Application ID <InfoIcon tooltip={encryptionKeyDescriptions.applicationId} /></Label>
                                    <Input
                                        value={tempKey.accessCredentials?.applicationId || ''}
                                        onChange={e => setTempKey({
                                            ...tempKey,
                                            accessCredentials: {
                                                ...(tempKey.accessCredentials || {}),
                                                applicationId: e.target.value
                                            }
                                        })}
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    />
                                </div>
                                <div>
                                    <Label>
                                        Application Secret <InfoIcon tooltip={encryptionKeyDescriptions.applicationSecret} />
                                    </Label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <Input
                                                type={showSecret ? 'text' : 'password'}
                                                value={tempKey.accessCredentials?.applicationSecret || ''}
                                                onChange={e => setTempKey({
                                                    ...tempKey,
                                                    accessCredentials: {
                                                        ...(tempKey.accessCredentials || {}),
                                                        applicationSecret: e.target.value
                                                    }
                                                })}
                                                placeholder="(secret)"
                                            />
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setShowSecret(s => !s)}
                                            title={showSecret ? 'Hide secret' : 'Show secret'}
                                        >
                                            {showSecret ? 'Hide' : 'Show'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </fieldset>

                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                        Required: Key Vault URI, Key Name. If using AAD app credentials: Application ID + Secret.
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="primary" onClick={saveFromModal}>Save</Button>
                    <Button onClick={() => {
                        setModalOpen(false);
                        setTempKey(null);
                        setShowSecret(false);
                    }}>Cancel</Button>
                </div>
            </Modal>
        );
    };

    const key = indexDef.encryptionKey;
    const hasKey = !!key;
    const authMethodDisplay = hasKey ? (key?.accessCredentials ? 'aadAppCredentials' : 'managedIdentity') : '-';

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#333', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={openEditor}><i className={`fas ${hasKey ? 'fa-pen' : 'fa-plus'}`}></i> {hasKey ? 'Edit Encryption Key' : 'Add Encryption Key'}</Button>
                    <Button variant="secondary" onClick={removeKey} disabled={!hasKey}><i className="fas fa-trash"></i> Remove</Button>
                </div>
            </div>

            <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
                <table className="data-grid" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Auth Method <InfoIcon tooltip={encryptionKeyDescriptions.authMethod} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Key Vault URI <InfoIcon tooltip={encryptionKeyDescriptions.keyVaultUri} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Key Name <InfoIcon tooltip={encryptionKeyDescriptions.keyVaultKeyName} /></th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Key Version <InfoIcon tooltip={encryptionKeyDescriptions.keyVaultKeyVersion} /></th>
                            <th style={{ width: '120px', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hasKey && (
                            <tr style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '4px' }}>{authMethodDisplay}</td>
                                <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>{key?.keyVaultUri || '-'}</td>
                                <td style={{ padding: '4px' }}>{key?.keyVaultKeyName || '-'}</td>
                                <td style={{ padding: '4px', color: '#aaa', fontSize: '12px' }}>{key?.keyVaultKeyVersion || '-'}</td>
                                <td style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                    <Button variant="secondary" onClick={openEditor}>Edit</Button>
                                </td>
                            </tr>
                        )}

                        {!hasKey && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                    No encryption key configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {hasKey && key?.accessCredentials && (
                    <div style={{ marginTop: '14px', fontSize: '12px', color: '#aaa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <InfoIcon tooltip={encryptionKeyDescriptions.accessCredentials} />
                            <span>
                                Using applicationId: <span style={{ color: '#ddd' }}>{key.accessCredentials.applicationId || '-'}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {renderEditorModal()}
        </div>
    );
};
