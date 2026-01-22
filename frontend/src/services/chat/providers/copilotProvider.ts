import type { AuthMode, AuthResult, ChatProvider, ChatSendRequest, ChatSendResponse, ChatMessage } from '../types';
import { authStore } from '../authStore';
import { githubAuth } from '../githubAuth';
import { TOOL_DEFINITIONS, TOOL_SUMMARY } from '../toolRegistry';

const EDITOR_VERSION = 'AzureAISearchExplorer/1.0';
const PLUGIN_VERSION = 'azure-ai-search-explorer/1.0';
const USER_AGENT = 'AzureAISearchExplorer';

const buildGitHubHeaders = (token?: string) => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': USER_AGENT,
  ...(token ? { Authorization: `token ${token}` } : {})
});

const buildCopilotHeaders = (token: string) => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': USER_AGENT,
  Authorization: `Bearer ${token}`,
  'Editor-Version': EDITOR_VERSION,
  'Editor-Plugin-Version': PLUGIN_VERSION
});

const TOOL_FUNCTIONS = TOOL_DEFINITIONS;

const mapMessages = (messages: ChatMessage[]): Array<{ role: string; content: string }> => {
  return messages.flatMap((message) => {
    if (message.role === 'tool') {
      if (message.data) {
        return [{ role: 'system', content: `Tool response:\n${JSON.stringify(message.data, null, 2)}` }];
      }
      return [{ role: 'system', content: message.content }];
    }
    return [{ role: message.role, content: message.content }];
  });
};

const normalizeFunctionName = (name?: string) => {
  if (!name) return '';
  if (name === 'resource_read') return 'resource_read';
  return name;
};

const buildSystemMessages = (systemPrompt?: string) => {
  const toolDescription = TOOL_SUMMARY;

  const systemMessages: Array<{ role: string; content: string }> = [];
  if (systemPrompt?.trim()) {
    systemMessages.push({ role: 'system', content: systemPrompt.trim() });
  }
  systemMessages.push({ role: 'system', content: toolDescription });
  return systemMessages;
};

const readCopilotStream = async (response: Response): Promise<{ content: string; functionCall?: { name: string; arguments: string } }> => {
  if (!response.body) return { content: '' };
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let content = '';
  let functionName = '';
  let functionArgs = '';
  const toolCallArgs: Record<number, string> = {};
  const toolCallNames: Record<number, string> = {};

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.replace(/^data:\s*/, '');
      if (!payload || payload === '[DONE]') continue;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{
            delta?: {
              content?: string;
              function_call?: { name?: string; arguments?: string };
              tool_calls?: Array<{ index?: number; function?: { name?: string; arguments?: string } }>;
            };
          }>;
        };
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) content += delta.content;
        if (delta?.function_call?.name) functionName = delta.function_call.name;
        if (delta?.function_call?.arguments) functionArgs += delta.function_call.arguments;
        if (delta?.tool_calls?.length) {
          for (const call of delta.tool_calls) {
            const index = call.index ?? 0;
            if (call.function?.name) toolCallNames[index] = call.function.name;
            if (call.function?.arguments) {
              toolCallArgs[index] = `${toolCallArgs[index] ?? ''}${call.function.arguments}`;
            }
          }
        }
      } catch {
        // Ignore malformed chunks
      }
    }
  }

  if (!functionName && Object.keys(toolCallNames).length) {
    const firstIndex = Math.min(...Object.keys(toolCallNames).map((key) => Number(key)));
    functionName = toolCallNames[firstIndex] ?? '';
    functionArgs = toolCallArgs[firstIndex] ?? '';
  }

  if (functionName) {
    return { content, functionCall: { name: normalizeFunctionName(functionName), arguments: functionArgs } };
  }

  return { content };
};

const getModelName = (model: string) => model;

export class CopilotProvider implements ChatProvider {
  id = 'copilot';
  name = 'GitHub Copilot';
  private copilotToken: string | null = null;

  async connect(mode: AuthMode): Promise<AuthResult> {
    if (mode === 'token') {
      return { statusMessage: 'Paste a GitHub token to store it locally.' };
    }

    const device = await githubAuth.startDeviceCode();
    return {
      statusMessage: 'Complete GitHub device verification to finish sign-in.',
      openUrl: device.verification_uri,
      userCode: device.user_code,
      verificationUri: device.verification_uri,
      expiresIn: device.expires_in,
      deviceCode: device.device_code,
      interval: device.interval
    };
  }

  async sendMessage(request: ChatSendRequest): Promise<ChatSendResponse> {
    const token = authStore.getToken();

    if (!token) {
      return {
        content: 'Sign in with GitHub to enable live Copilot chat. The UI is ready, but the Copilot API requires an authenticated token.'
      };
    }

    const ensureCopilotToken = async () => {
      if (window.electronAPI?.copilotToken) {
        const payload = await window.electronAPI.copilotToken(token);
        if (!payload?.token) throw new Error('Copilot token missing from response.');
        this.copilotToken = payload.token;
        return;
      }

      const tokenResponse = await fetch('https://api.github.com/copilot/v2/token', {
        method: 'GET',
        headers: buildGitHubHeaders(token)
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to retrieve Copilot token.');
      }

      const tokenPayload = await tokenResponse.json() as { token?: string };
      if (!tokenPayload.token) {
        throw new Error('Copilot token missing from response.');
      }
      this.copilotToken = tokenPayload.token;
    };

    if (!this.copilotToken) {
      await ensureCopilotToken();
    }

    const systemMessages = buildSystemMessages(request.settings.systemPrompt);
    const body = {
      intent: false,
      model: getModelName(request.settings.model),
      temperature: request.settings.temperature,
      top_p: 1,
      n: 1,
      stream: true,
      messages: [...systemMessages, ...mapMessages(request.messages)],
      functions: TOOL_FUNCTIONS,
      function_call: 'auto'
    };

    const runChat = async (): Promise<{ content: string; functionCall?: { name: string; arguments: string } }> => {
      if (window.electronAPI?.copilotChat && this.copilotToken) {
        const result = await window.electronAPI.copilotChat({ token: this.copilotToken, body });
        return {
          content: result?.content ?? '',
          functionCall: result?.functionCall
            ? { name: normalizeFunctionName(result.functionCall.name), arguments: result.functionCall.arguments }
            : undefined
        };
      }

      const response = await fetch('https://api.githubcopilot.com/chat/completions', {
        method: 'POST',
        headers: buildCopilotHeaders(this.copilotToken ?? ''),
        body: JSON.stringify(body)
      });

      if (response.status === 401 || response.status === 403) {
        this.copilotToken = null;
        await ensureCopilotToken();
        return runChat();
      }

      if (!response.ok) {
        throw new Error('Copilot chat request failed.');
      }

      return readCopilotStream(response);
    };

    const result = await runChat();

    return {
      content: result.content ?? '',
      functionCall: result.functionCall
        ? { name: normalizeFunctionName(result.functionCall.name), arguments: result.functionCall.arguments }
        : undefined
    };
  }
}
