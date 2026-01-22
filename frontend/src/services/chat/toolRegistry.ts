import { connectionService } from '../connectionService';
import { indexersService } from '../indexersService';
import { resourceTool } from './resourceTool';

type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
};

type ToolCallArgs = Record<string, unknown>;

const parseArgs = (rawArguments: string): ToolCallArgs => {
  if (!rawArguments?.trim()) return {};
  try {
    return JSON.parse(rawArguments) as ToolCallArgs;
  } catch {
    return {};
  }
};

const RESOURCE_TYPES = [
  'indexes',
  'indexers',
  'datasources',
  'skillsets',
  'synonymmaps',
  'aliases',
  'knowledgeSources',
  'knowledgeBases'
];

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'resource_read',
    description: 'Return JSON for an Azure AI Search resource from the selected connection.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Resource type to read',
          enum: RESOURCE_TYPES
        },
        name: {
          type: 'string',
          description: 'Name of the resource to retrieve from the selected connection'
        }
      },
      required: ['type', 'name']
    }
  },
  {
    name: 'resource_list',
    description: 'Return a list of Azure AI Search resources from the selected connection. Optionally filter by resource types.',
    parameters: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          description: 'Optional list of resource types to include. If omitted, return all resource types.',
          items: {
            type: 'string',
            enum: RESOURCE_TYPES
          }
        }
      },
      required: []
    }
  },
  {
    name: 'indexer_status',
    description: 'Return the run status for the given indexer name from the selected connection.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Indexer name to retrieve status for'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'service_details',
    description: 'Return the full service overview details for the selected connection.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

export const TOOL_NAMES = TOOL_DEFINITIONS.map((tool) => tool.name);

export const TOOL_SUMMARY = [
  'Available tools:',
  'resource_read(type, name) -> returns JSON for an Azure AI Search resource from the selected connection.',
  'resource_list(types?) -> returns a list of resources with name, type, and basic metadata. Optional types filter.',
  'indexer_status(name) -> returns the indexer run status for the given indexer.',
  'service_details() -> returns the service overview details for the selected connection.',
  `Resource types: ${RESOURCE_TYPES.join(', ')}.`
].join(' ');

export const formatToolCall = (name: string, rawArguments: string) => {
  const args = parseArgs(rawArguments);

  if (name === 'resource_read') {
    const type = typeof args.type === 'string' ? args.type : '';
    const resourceName = typeof args.name === 'string' ? args.name : '';
    if (type && resourceName) return `Calling tool: resource_read(type="${type}", name="${resourceName}")`;
    return 'Calling tool: resource_read(...)';
  }

  if (name === 'resource_list') {
    const types = Array.isArray(args.types)
      ? args.types.map((value) => String(value).trim()).filter(Boolean)
      : [];
    if (types.length) {
      return `Calling tool: resource_list(types=[${types.map((value) => `"${value}"`).join(', ')}])`;
    }
    return 'Calling tool: resource_list()';
  }

  if (name === 'indexer_status') {
    const indexerName = typeof args.name === 'string' ? args.name.trim() : '';
    if (indexerName) return `Calling tool: indexer_status(name="${indexerName}")`;
    return 'Calling tool: indexer_status(...)';
  }

  if (name === 'service_details') {
    return 'Calling tool: service_details()';
  }

  return `Calling tool: ${name}(...)`;
};

export const runTool = async (name: string, rawArguments: string, connectionId: string | null): Promise<unknown | null> => {
  if (!connectionId) return null;
  const args = parseArgs(rawArguments);

  if (name === 'resource_read') {
    const type = typeof args.type === 'string' ? args.type.trim() : '';
    const resourceName = typeof args.name === 'string' ? args.name.trim() : '';
    if (!type || !resourceName) return null;
    return resourceTool.getResource({ connectionId, type, name: resourceName });
  }

  if (name === 'resource_list') {
    const types = Array.isArray(args.types)
      ? args.types.map((value) => String(value).trim()).filter(Boolean)
      : undefined;
    return resourceTool.listResources({ connectionId, types });
  }

  if (name === 'indexer_status') {
    const indexerName = typeof args.name === 'string' ? args.name.trim() : '';
    if (!indexerName) return null;
    return indexersService.getIndexerStatus(connectionId, indexerName);
  }

  if (name === 'service_details') {
    return connectionService.getOverview(connectionId);
  }

  return null;
};