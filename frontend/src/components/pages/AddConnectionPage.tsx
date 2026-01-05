import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Label } from '../common/Label';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import type { ConnectionProfile } from '../../types/ConnectionProfile';
import { connectionService } from '../../services/connectionService';
import { useLayout } from '../../context/LayoutContext';
import styles from './AddConnectionPage.module.css';

interface AddConnectionPageProps {
    connectionId?: string; // If provided, we are in Edit mode
    onSave?: () => void;
}

export const AddConnectionPage: React.FC<AddConnectionPageProps> = ({ connectionId, onSave }) => {
    const { closeTab } = useLayout();
    const [profile, setProfile] = useState<ConnectionProfile>({
        name: '',
        endpoint: '',
        authType: 'AzureAD',
        apiKey: '',
        tenantId: '',
        clientId: '',
        managedIdentityType: 'System',
        group: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (connectionId) {
            loadProfile(connectionId);
        }
    }, [connectionId]);

    const loadProfile = async (id: string) => {
        try {
            const data = await connectionService.getById(id);
            setProfile(data);
        } catch (error: any) {
            setError('Failed to load profile: ' + (error.message || 'Unknown error'));
        }
    };

    const handleChange = (field: keyof ConnectionProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleTest = async () => {
        setIsLoading(true);
        setTestResult(null);
        setError(null);
        try {
            const result = await connectionService.testConnection(profile);
            setTestResult(result);
        } catch (error: any) {
            setTestResult({ success: false, message: error.message || 'Connection failed' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (profile.id) {
                await connectionService.update(profile.id, profile);
            } else {
                await connectionService.create(profile);
            }
            
            if (onSave) onSave();
            closeTab('add-connection');
            
        } catch (error: any) {
            setError('Failed to save: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Card>
                <h2>{profile.id ? 'Edit Connection' : 'Add Connection'}</h2>
                
                {error && (
                    <div className={`${styles.testResult} ${styles.error}`} style={{ marginBottom: '16px', marginTop: '0' }}>
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{error}</span>
                    </div>
                )}

                <div className={styles.formGroup}>
                    <Label>Authentication Method</Label>
                    <div className={styles.tabs}>
                        <div 
                            className={`${styles.tab} ${profile.authType === 'AzureAD' ? styles.active : ''}`}
                            onClick={() => handleChange('authType', 'AzureAD')}
                        >
                            Azure AD (RBAC)
                        </div>
                        <div 
                            className={`${styles.tab} ${profile.authType === 'ApiKey' ? styles.active : ''}`}
                            onClick={() => handleChange('authType', 'ApiKey')}
                        >
                            API Key
                        </div>
                        <div 
                            className={`${styles.tab} ${profile.authType === 'ManagedIdentity' ? styles.active : ''}`}
                            onClick={() => handleChange('authType', 'ManagedIdentity')}
                        >
                            Managed Identity
                        </div>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <Label>Service Endpoint URL</Label>
                    <Input 
                        value={profile.endpoint} 
                        onChange={(e) => handleChange('endpoint', e.target.value)}
                        placeholder="https://<service-name>.search.windows.net"
                    />
                </div>

                <div className={styles.formGroup}>
                    <Label>Connection Alias (Optional)</Label>
                    <Input 
                        value={profile.name} 
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="e.g. Production Search"
                    />
                </div>

                {profile.authType === 'AzureAD' && (
                    <div className={styles.authSection}>
                        <div className={styles.formGroup}>
                            <Label>Tenant ID (Optional)</Label>
                            <Input 
                                value={profile.tenantId || ''} 
                                onChange={(e) => handleChange('tenantId', e.target.value)}
                                placeholder="Auto-detect"
                            />
                        </div>
                        <p className={styles.infoText}>
                            <i className="fas fa-info-circle"></i> You will be prompted to sign in via your browser.
                        </p>
                    </div>
                )}

                {profile.authType === 'ApiKey' && (
                    <div className={styles.authSection}>
                        <div className={styles.formGroup}>
                            <Label>Admin Key</Label>
                            <Input 
                                type="password"
                                value={profile.apiKey || ''} 
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                placeholder="****************"
                            />
                        </div>
                        <p className={styles.warningText}>
                            <i className="fas fa-exclamation-triangle"></i> Admin keys provide full access. RBAC is recommended.
                        </p>
                    </div>
                )}

                {profile.authType === 'ManagedIdentity' && (
                    <div className={styles.authSection}>
                        <div className={styles.formGroup}>
                            <Label>Identity Type</Label>
                            <Select 
                                value={profile.managedIdentityType || 'System'}
                                onChange={(e) => handleChange('managedIdentityType', e.target.value as any)}
                            >
                                <option value="System">System Assigned</option>
                                <option value="User">User Assigned</option>
                            </Select>
                        </div>
                        {profile.managedIdentityType === 'User' && (
                            <div className={styles.formGroup}>
                                <Label>Client ID (User Assigned Only)</Label>
                                <Input 
                                    value={profile.clientId || ''} 
                                    onChange={(e) => handleChange('clientId', e.target.value)}
                                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.actions}>
                    <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Connection'}
                    </Button>
                    <Button variant="secondary" onClick={handleTest} disabled={isLoading}>
                        {isLoading ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="secondary" onClick={() => closeTab('add-connection')}>
                        Cancel
                    </Button>
                </div>

                {testResult && (
                    <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                        <i className={`fas ${testResult.success ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        <span>{testResult.message}</span>
                    </div>
                )}
            </Card>
        </div>
    );
};
