export interface ConnectionProfile {
    id?: string;
    name: string;
    endpoint: string;
    authType: 'AzureAD' | 'ApiKey' | 'ManagedIdentity';
    apiKey?: string;
    tenantId?: string;
    clientId?: string;
    managedIdentityType?: 'System' | 'User';
    group?: string;
    resourceId?: string;
    hasManagementAccess?: boolean;
    subscriptionId?: string;
    resourceGroupName?: string;
}

export interface ServiceStatistics {
    counters: {
        documentCount: { usage: number; quota: number | null };
        indexCount: { usage: number; quota: number | null };
        indexerCount: { usage: number; quota: number | null };
        dataSourceCount: { usage: number; quota: number | null };
        storageSize: { usage: number; quota: number | null };
        synonymMapCount: { usage: number; quota: number | null };
        skillsetCount: { usage: number; quota: number | null };
        vectorIndexSize: { usage: number; quota: number | null };
    };
    limits: {
        maxFieldsPerIndex: number | null;
        maxIndexerRunTime: string | null;
        maxFileExtractionSize: number | null;
        maxFileContentCharactersToExtract: number | null;
    };
}

export interface ServiceOverview {
    stats: ServiceStatistics;
    endpoint: string;
    name: string;
    // Management Plane Details
    location?: string;
    sku?: string;
    replicaCount?: number;
    partitionCount?: number;
    status?: string;
    hostingMode?: string;
    publicNetworkAccess?: string;
    tags?: Record<string, string>;
    isManagementAvailable: boolean;
    resourceId?: string;
    
    // Extended Details
    networkRuleSet?: string;
    disableLocalAuth?: boolean;
    authOptions?: string;
    encryptionWithCmk?: string;
    privateEndpointConnections?: string[];
    sharedPrivateLinkResources?: string[];
    systemDataCreatedAt?: string;
    systemDataCreatedBy?: string;
    systemDataLastModifiedAt?: string;
    systemDataLastModifiedBy?: string;
    provisioningState?: string;
    semanticSearch?: string;
}
