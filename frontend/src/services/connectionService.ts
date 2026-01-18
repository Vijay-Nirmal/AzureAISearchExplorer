import { apiClient } from './apiClient';
import { searchRestClient } from './searchRestClient';
import { armRestClient } from './armRestClient';
import { connectionStorage } from './connectionStorage';
import { getAuthHeaderForProfile } from './searchAuthHeaderCache';
import { AZURE_SEARCH_API_VERSION } from '../data/constants/azureSearchApiVersion';
import type { ConnectionProfile, ServiceOverview, ServiceStatistics } from '../types/ConnectionProfile';

type ServiceStatsResponse = ServiceStatistics;

type ArmSearchServiceResponse = {
    id?: string;
    name?: string;
    location?: string;
    tags?: Record<string, string>;
    sku?: { name?: string };
    properties?: Record<string, unknown>;
    systemData?: {
        createdAt?: string;
        createdBy?: string;
        lastModifiedAt?: string;
        lastModifiedBy?: string;
    };
};

type ArmSubscriptionListResponse = {
    value?: Array<{ subscriptionId?: string }>;
};

type ArmResourceListResponse = {
    value?: Array<{ id?: string }>;
};

const getString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const getBool = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined);
const getNumber = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined);
const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
const useProxyInDevBrowser = import.meta.env.DEV && !isElectron;

const buildSearchTestUrl = (endpoint: string) => {
    const base = endpoint.replace(/\/+$/, '');
    return `${base}/indexes?api-version=${AZURE_SEARCH_API_VERSION}`;
};

const getServiceName = (endpoint: string): string | null => {
    try {
        const url = new URL(endpoint);
        const host = url.hostname || url.host;
        const name = host.split('.')[0];
        return name?.trim() ? name.trim() : null;
    } catch {
        return null;
    }
};

const getResourceGroupName = (resourceId: string): string | undefined => {
    const match = /\/resourceGroups\/([^/]+)/i.exec(resourceId);
    return match?.[1];
};

const resolveResourceDetails = async (profile: ConnectionProfile): Promise<ConnectionProfile> => {
    const resolved: ConnectionProfile = {
        ...profile,
        resourceId: undefined,
        hasManagementAccess: false,
        subscriptionId: undefined,
        resourceGroupName: undefined
    };

    if (profile.authType === 'ApiKey') {
        return resolved;
    }

    const serviceName = getServiceName(profile.endpoint);
    if (!serviceName) return resolved;

    try {
        const subscriptions = await armRestClient.getForProfile<ArmSubscriptionListResponse>(
            profile,
            'subscriptions',
            { apiVersion: '2020-01-01' }
        );

        for (const sub of subscriptions.value ?? []) {
            const subscriptionId = sub.subscriptionId?.trim();
            if (!subscriptionId) continue;

            const filter = `resourceType eq 'Microsoft.Search/searchServices' and name eq '${serviceName}'`;
            const resources = await armRestClient.getForProfile<ArmResourceListResponse>(
                profile,
                `subscriptions/${subscriptionId}/resources`,
                { query: { '$filter': filter, 'api-version': '2021-04-01' } }
            );

            const resourceId = resources.value?.find((item) => item.id)?.id;
            if (!resourceId) continue;

            return {
                ...resolved,
                resourceId,
                subscriptionId,
                resourceGroupName: getResourceGroupName(resourceId),
                hasManagementAccess: true
            };
        }
    } catch {
        return resolved;
    }

    return resolved;
};

const extractErrorMessage = async (response: Response) => {
    const text = await response.text();
    if (!text.trim()) return `${response.status} ${response.statusText}`.trim();

    try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const error = parsed.error as Record<string, unknown> | undefined;
        if (error?.message && typeof error.message === 'string') return error.message;
        if (parsed.message && typeof parsed.message === 'string') return parsed.message;
        if (parsed.title && typeof parsed.title === 'string') return parsed.title;
        return text;
    } catch {
        return text;
    }
};

const testConnectionDirect = async (profile: ConnectionProfile): Promise<{ success: boolean; message: string }> => {
    if (!profile.endpoint) {
        return { success: false, message: 'Service endpoint is required.' };
    }

    const authHeader = await getAuthHeaderForProfile(profile);
    const url = buildSearchTestUrl(profile.endpoint);
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            [authHeader.name]: authHeader.value
        }
    });

    if (!response.ok) {
        const message = await extractErrorMessage(response);
        return { success: false, message };
    }

    return { success: true, message: 'Successfully connected.' };
};

const mapArmOverview = (resp: ArmSearchServiceResponse): Partial<ServiceOverview> => {
    const props = asRecord(resp.properties) || {};

    const privateEndpoints = Array.isArray(props.privateEndpointConnections)
        ? (props.privateEndpointConnections as Array<Record<string, unknown>>)
              .map((x) => getString(x?.id))
              .filter((x): x is string => !!x)
        : undefined;

    const sharedPrivateLinks = Array.isArray(props.sharedPrivateLinkResources)
        ? (props.sharedPrivateLinkResources as Array<Record<string, unknown>>)
              .map((x) => getString(x?.id))
              .filter((x): x is string => !!x)
        : undefined;

    return {
        location: resp.location,
        sku: resp.sku?.name,
        replicaCount: getNumber(props.replicaCount),
        partitionCount: getNumber(props.partitionCount),
        status: getString(props.status),
        hostingMode: getString(props.hostingMode),
        publicNetworkAccess: getString(props.publicNetworkAccess),
        tags: resp.tags,
        isManagementAvailable: true,
        resourceId: resp.id,
        networkRuleSet: props.networkRuleSet ? JSON.stringify(props.networkRuleSet) : undefined,
        disableLocalAuth: getBool(props.disableLocalAuth ?? props.isLocalAuthDisabled),
        authOptions: props.authOptions ? JSON.stringify(props.authOptions) : undefined,
        encryptionWithCmk: getString(asRecord(props.encryptionWithCmk)?.enforcement ?? props.encryptionWithCmk),
        privateEndpointConnections: privateEndpoints,
        sharedPrivateLinkResources: sharedPrivateLinks,
        systemDataCreatedAt: resp.systemData?.createdAt,
        systemDataCreatedBy: resp.systemData?.createdBy,
        systemDataLastModifiedAt: resp.systemData?.lastModifiedAt,
        systemDataLastModifiedBy: resp.systemData?.lastModifiedBy,
        provisioningState: getString(props.provisioningState),
        semanticSearch: getString(props.semanticSearch)
    };
};

export const connectionService = {
    getAll: async (): Promise<ConnectionProfile[]> => {
        return connectionStorage.loadAll();
    },

    getById: async (id: string): Promise<ConnectionProfile> => {
        const item = connectionStorage.getById(id);
        if (!item) throw new Error('Connection not found');
        return item;
    },

    create: async (profile: ConnectionProfile): Promise<ConnectionProfile> => {
        const resolved = await resolveResourceDetails(profile);
        return connectionStorage.upsert(resolved);
    },

    update: async (id: string, profile: ConnectionProfile): Promise<void> => {
        if (id !== profile.id) throw new Error('Connection ID mismatch');
        const resolved = await resolveResourceDetails(profile);
        connectionStorage.upsert(resolved);
    },

    delete: async (id: string): Promise<void> => {
        connectionStorage.remove(id);
    },

    testConnection: async (profile: ConnectionProfile): Promise<{ success: boolean; message: string }> => {
        if (!useProxyInDevBrowser) {
            return await testConnectionDirect(profile);
        }

        return await apiClient.post<{ success: boolean; message: string }>('/api/service/test', profile);
    },

    getOverview: async (connectionId: string): Promise<ServiceOverview> => {
        const [profile, stats] = await Promise.all([
            connectionService.getById(connectionId),
            searchRestClient.get<ServiceStatsResponse>(connectionId, 'servicestats')
        ]);

        const overview: ServiceOverview = {
            stats,
            endpoint: profile.endpoint,
            name: profile.name,
            isManagementAvailable: false
        };

        const resourceId = profile.resourceId?.trim();
        if (resourceId && profile.hasManagementAccess) {
            try {
                const path = resourceId.replace(/^\/+/, '');
                const arm = await armRestClient.get<ArmSearchServiceResponse>(connectionId, path);
                Object.assign(overview, mapArmOverview(arm));
            } catch {
                // Keep REST stats even if ARM fails.
            }
        }

        return overview;
    },

    scaleService: async (
        connectionId: string,
        resourceId: string,
        replicaCount?: number,
        partitionCount?: number
    ): Promise<void> => {
        const path = resourceId.trim().replace(/^\/+/, '');
        if (!path) throw new Error('Resource ID is required to scale the service.');

        const properties: Record<string, unknown> = {};
        if (typeof replicaCount === 'number') properties.replicaCount = replicaCount;
        if (typeof partitionCount === 'number') properties.partitionCount = partitionCount;

        if (Object.keys(properties).length === 0) return;

        await armRestClient.patch(connectionId, path, { properties });
    },

    updateService: async (
        connectionId: string,
        resourceId: string,
        publicNetworkAccess?: boolean,
        disableLocalAuth?: boolean
    ): Promise<void> => {
        const path = resourceId.trim().replace(/^\/+/, '');
        if (!path) throw new Error('Resource ID is required to update the service.');

        const properties: Record<string, unknown> = {};
        if (typeof publicNetworkAccess === 'boolean') {
            properties.publicNetworkAccess = publicNetworkAccess ? 'Enabled' : 'Disabled';
        }
        if (typeof disableLocalAuth === 'boolean') {
            properties.disableLocalAuth = disableLocalAuth;
        }

        if (Object.keys(properties).length === 0) return;

        await armRestClient.patch(connectionId, path, { properties });
    },

    clearAuthCache: async (): Promise<void> => {
        await apiClient.post('/api/service/clear-auth-cache', {});
    }
};
