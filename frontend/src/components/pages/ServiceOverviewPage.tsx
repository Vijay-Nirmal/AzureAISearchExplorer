import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { JsonViewerModal } from '../common/JsonViewerModal';
import { TruncatedTextCell } from '../common/TruncatedTextCell';
import { connectionService } from '../../services/connectionService';
import { alertService } from '../../services/alertService';
import type { ServiceOverview } from '../../types/ConnectionProfile';
import { useLayout } from '../../context/LayoutContext';
import styles from './ServiceOverviewPage.module.css';

interface ServiceOverviewPageProps {
    connectionId: string;
}

export const ServiceOverviewPage: React.FC<ServiceOverviewPageProps> = ({ connectionId }) => {
    const [overview, setOverview] = useState<ServiceOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerTitle, setViewerTitle] = useState('');
    const [viewerData, setViewerData] = useState<unknown>(null);
    
    // Scaling State
    const [isScaling, setIsScaling] = useState(false);
    const [scaleReplica, setScaleReplica] = useState(1);
    const [scalePartition, setScalePartition] = useState(1);
    const [scalingLoading, setScalingLoading] = useState(false);

    // Settings Update State
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [editPublicAccess, setEditPublicAccess] = useState(false);
    const [editLocalAuth, setEditLocalAuth] = useState(false);
    const [updatingSettings, setUpdatingSettings] = useState(false);
    
    const { openTab } = useLayout();

    const openViewer = (title: string, data: unknown) => {
        setViewerTitle(title);
        setViewerData(data);
        setViewerOpen(true);
    };

    const parseJsonSafe = (raw: string | undefined | null): unknown => {
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    };

    const summarizeJson = (value: unknown): string => {
        if (!value) return 'N/A';
        if (Array.isArray(value)) return `Array (${value.length})`;
        if (typeof value === 'object') return `Object (${Object.keys(value as Record<string, unknown>).length} keys)`;
        return String(value);
    };

    const renderJsonCell = (label: string, raw?: string | null) => {
        if (!raw) return <td>N/A</td>;
        const parsed = parseJsonSafe(raw);
        const summary = summarizeJson(parsed);
        return (
            <TruncatedTextCell
                value={summary}
                maxWidth="420px"
                onExpand={() => openViewer(label, parsed)}
            />
        );
    };

    const renderListCell = (label: string, items?: string[] | null) => {
        if (!items || items.length === 0) return <td>None</td>;
        const joined = items.join(', ');
        if (joined.length <= 80) return <td>{joined}</td>;

        return (
            <TruncatedTextCell
                value={joined}
                maxWidth="420px"
                onExpand={() => openViewer(label, items)}
            />
        );
    };

    useEffect(() => {
        loadOverview();
    }, [connectionId]);

    const loadOverview = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await connectionService.getOverview(connectionId);
            setOverview(data);
            if (data.replicaCount) setScaleReplica(data.replicaCount);
            if (data.partitionCount) setScalePartition(data.partitionCount);
            
            // Initialize settings state
            setEditPublicAccess(data.publicNetworkAccess === 'Enabled');
            setEditLocalAuth(data.disableLocalAuth ?? false);
        } catch (err: any) {
            setError(err.message || 'Failed to load service overview');
        } finally {
            setLoading(false);
        }
    };

    const handleScale = async () => {
        if (!overview?.resourceId) return;
        setScalingLoading(true);
        try {
            await connectionService.scaleService(connectionId, overview.resourceId, scaleReplica, scalePartition);
            setIsScaling(false);
            await loadOverview();
        } catch (err: any) {
            alertService.show({ title: 'Error', message: `Failed to scale service: ${err.message}` });
        } finally {
            setScalingLoading(false);
        }
    };

    const handleUpdateSettings = async () => {
        if (!overview?.resourceId) return;
        setUpdatingSettings(true);
        try {
            await connectionService.updateService(
                connectionId, 
                overview.resourceId, 
                editPublicAccess, 
                editLocalAuth
            );
            setIsEditingSettings(false);
            await loadOverview();
        } catch (err: any) {
            alertService.show({ title: 'Error', message: `Failed to update service settings: ${err.message}` });
        } finally {
            setUpdatingSettings(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading service details...</div>;
    if (error) return <div className={styles.error}>Error: {error}</div>;
    if (!overview) return null;

    const { stats, endpoint, name, isManagementAvailable } = overview;

    return (
        <>
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2>{name || 'Service Overview'}</h2>
                    <span className={styles.endpoint}>{endpoint}</span>
                    {overview.status && (
                        <span className={`${styles.badge} ${overview.status === 'Running' ? styles.success : styles.warning}`}>
                            {overview.status}
                        </span>
                    )}
                </div>
                <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => openTab({
                        id: 'edit-connection-' + connectionId,
                        title: 'Edit Connection',
                        icon: 'fa-solid fa-pencil',
                        component: 'add-connection',
                        props: { connectionId }
                    })}>
                        <i className="fas fa-edit"></i> Edit Connection
                    </button>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Management Plane Details */}
                {isManagementAvailable && (
                    <>
                        <Card>
                            <div className={styles.cardHeader}>
                                <h3>Properties</h3>
                                {!isScaling ? (
                                    <button className={styles.iconBtn} onClick={() => setIsScaling(true)} title="Scale Service">
                                        <i className="fas fa-sliders-h"></i> Scale
                                    </button>
                                ) : (
                                    <div className={styles.scaleActions}>
                                        <button className={styles.iconBtn} onClick={handleScale} disabled={scalingLoading}>
                                            <i className="fas fa-check"></i>
                                        </button>
                                        <button className={styles.iconBtn} onClick={() => setIsScaling(false)} disabled={scalingLoading}>
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <table className={styles.table}>
                                <tbody>
                                    <tr>
                                        <td>Location</td>
                                        <td>{overview.location}</td>
                                    </tr>
                                    <tr>
                                        <td>SKU</td>
                                        <td>{overview.sku}</td>
                                    </tr>
                                    <tr>
                                        <td>Replicas</td>
                                        <td>
                                            {isScaling ? (
                                                <Input 
                                                    type="number" 
                                                    min="1" 
                                                    max="12" 
                                                    value={scaleReplica} 
                                                    onChange={(e) => setScaleReplica(parseInt(e.target.value))}
                                                    className={styles.scaleInput}
                                                />
                                            ) : overview.replicaCount}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Partitions</td>
                                        <td>
                                            {isScaling ? (
                                                <Input 
                                                    type="number" 
                                                    min="1" 
                                                    max="12" 
                                                    value={scalePartition} 
                                                    onChange={(e) => setScalePartition(parseInt(e.target.value))}
                                                    className={styles.scaleInput}
                                                />
                                            ) : overview.partitionCount}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Hosting Mode</td>
                                        <td>{overview.hostingMode}</td>
                                    </tr>
                                    <tr>
                                        <td>Provisioning State</td>
                                        <td>{overview.provisioningState}</td>
                                    </tr>
                                    <tr>
                                        <td>Semantic Search</td>
                                        <td>{overview.semanticSearch || 'Disabled'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Card>

                        <Card>
                            <div className={styles.cardHeader}>
                                <h3>Networking & Security</h3>
                                {!isEditingSettings ? (
                                    <button className={styles.iconBtn} onClick={() => setIsEditingSettings(true)} title="Edit Settings">
                                        <i className="fas fa-cog"></i> Edit
                                    </button>
                                ) : (
                                    <div className={styles.scaleActions}>
                                        <button className={styles.iconBtn} onClick={handleUpdateSettings} disabled={updatingSettings}>
                                            <i className="fas fa-check"></i>
                                        </button>
                                        <button className={styles.iconBtn} onClick={() => setIsEditingSettings(false)} disabled={updatingSettings}>
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <table className={styles.table}>
                                <tbody>
                                    <tr>
                                        <td>Public Network Access</td>
                                        <td>
                                            {isEditingSettings ? (
                                                <label className={styles.toggle}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={editPublicAccess} 
                                                        onChange={(e) => setEditPublicAccess(e.target.checked)} 
                                                    />
                                                    <span className={styles.toggleLabel}>{editPublicAccess ? 'Enabled' : 'Disabled'}</span>
                                                </label>
                                            ) : overview.publicNetworkAccess}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Disable Local Auth</td>
                                        <td>
                                            {isEditingSettings ? (
                                                <label className={styles.toggle}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={editLocalAuth} 
                                                        onChange={(e) => setEditLocalAuth(e.target.checked)} 
                                                    />
                                                    <span className={styles.toggleLabel}>{editLocalAuth ? 'Yes' : 'No'}</span>
                                                </label>
                                            ) : (overview.disableLocalAuth ? 'Yes' : 'No')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Auth Options</td>
                                        {renderJsonCell('Auth Options', overview.authOptions)}
                                    </tr>
                                    <tr>
                                        <td>Encryption (CMK)</td>
                                        <td>{overview.encryptionWithCmk || 'Unspecified'}</td>
                                    </tr>
                                    <tr>
                                        <td>Network Rule Set</td>
                                        {renderJsonCell('Network Rule Set', overview.networkRuleSet)}
                                    </tr>
                                    <tr>
                                        <td>Private Endpoints</td>
                                        {renderListCell('Private Endpoints', overview.privateEndpointConnections)}
                                    </tr>
                                    <tr>
                                        <td>Shared Private Links</td>
                                        {renderListCell('Shared Private Links', overview.sharedPrivateLinkResources)}
                                    </tr>
                                </tbody>
                            </table>
                        </Card>

                        <Card>
                            <h3>System Information</h3>
                            <table className={styles.table}>
                                <tbody>
                                    <tr>
                                        <td>Created At</td>
                                        <td>{overview.systemDataCreatedAt ? new Date(overview.systemDataCreatedAt).toLocaleString() : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td>Created By</td>
                                        <td>{overview.systemDataCreatedBy || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td>Last Modified At</td>
                                        <td>{overview.systemDataLastModifiedAt ? new Date(overview.systemDataLastModifiedAt).toLocaleString() : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td>Last Modified By</td>
                                        <td>{overview.systemDataLastModifiedBy || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Card>
                    </>
                )}

                {!isManagementAvailable && (
                    <Card>
                        <h3>Management Data</h3>
                        <div style={{ color: 'var(--text-color)', opacity: 0.8, fontSize: '12px' }}>
                            Management data is unavailable for this connection. Ensure the connection has a valid Resource ID and ARM access.
                        </div>
                    </Card>
                )}

                <Card>
                    <h3>Usage Statistics</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Resource</th>
                                <th>Usage</th>
                                <th>Quota</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Indexes</td>
                                <td>{stats.counters.indexCount?.usage ?? 'N/A'}</td>
                                <td>{stats.counters.indexCount?.quota ?? 'Unlimited'}</td>
                            </tr>
                            <tr>
                                <td>Documents</td>
                                <td>{stats.counters.documentCount?.usage?.toLocaleString() ?? 'N/A'}</td>
                                <td>{stats.counters.documentCount?.quota ? stats.counters.documentCount.quota.toLocaleString() : 'Unlimited'}</td>
                            </tr>
                            <tr>
                                <td>Storage</td>
                                <td>{stats.counters.storageSize?.usage !== undefined ? (stats.counters.storageSize.usage / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</td>
                                <td>{stats.counters.storageSize?.quota ? (stats.counters.storageSize.quota / 1024 / 1024).toFixed(2) + ' MB' : 'Unlimited'}</td>
                            </tr>
                            <tr>
                                <td>Indexers</td>
                                <td>{stats.counters.indexerCount?.usage ?? 'N/A'}</td>
                                <td>{stats.counters.indexerCount?.quota ?? 'Unlimited'}</td>
                            </tr>
                            <tr>
                                <td>Data Sources</td>
                                <td>{stats.counters.dataSourceCount?.usage ?? 'N/A'}</td>
                                <td>{stats.counters.dataSourceCount?.quota ?? 'Unlimited'}</td>
                            </tr>
                            <tr>
                                <td>Skillsets</td>
                                <td>{stats.counters.skillsetCount?.usage ?? 'N/A'}</td>
                                <td>{stats.counters.skillsetCount?.quota ?? 'Unlimited'}</td>
                            </tr>
                            <tr>
                                <td>Synonym Maps</td>
                                <td>{stats.counters.synonymMapCount?.usage ?? 'N/A'}</td>
                                <td>{stats.counters.synonymMapCount?.quota ?? 'Unlimited'}</td>
                            </tr>
                             <tr>
                                <td>Vector Index Size</td>
                                <td>{stats.counters.vectorIndexSize?.usage !== undefined ? (stats.counters.vectorIndexSize.usage / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</td>
                                <td>{stats.counters.vectorIndexSize?.quota ? (stats.counters.vectorIndexSize.quota / 1024 / 1024).toFixed(2) + ' MB' : 'Unlimited'}</td>
                            </tr>
                        </tbody>
                    </table>
                </Card>

                <Card>
                    <h3>Service Limits</h3>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <td>Max Fields Per Index</td>
                                <td>{stats.limits.maxFieldsPerIndex ?? 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Max Indexer Run Time</td>
                                <td>{stats.limits.maxIndexerRunTime ?? 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Max File Extraction Size</td>
                                <td>{stats.limits.maxFileExtractionSize ? (stats.limits.maxFileExtractionSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </Card>

                {overview.tags && Object.keys(overview.tags).length > 0 && (
                    <Card>
                        <h3>Tags</h3>
                        <div className={styles.tags}>
                            {Object.entries(overview.tags).map(([key, value]) => (
                                <span key={key} className={styles.tag}>
                                    <span className={styles.tagKey}>{key}</span>
                                    <span className={styles.tagValue}>{value}</span>
                                </span>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
        <JsonViewerModal
            isOpen={viewerOpen}
            onClose={() => {
                setViewerOpen(false);
                setViewerTitle('');
                setViewerData(null);
            }}
            title={viewerTitle}
            data={viewerData}
        />
        </>
    );
};
