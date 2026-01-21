import { CopilotProvider } from './providers/copilotProvider';
import type { AuthMode, AuthResult, ChatProvider, ChatSendRequest, ChatSendResponse } from './types';

export const DEFAULT_CHAT_SETTINGS = {
  model: 'gpt-5-mini',
  temperature: 0.2,
  maxTokens: 1024
};

const providers: Record<string, ChatProvider> = {
  copilot: new CopilotProvider()
};

const getProvider = (providerId: string): ChatProvider => {
  const provider = providers[providerId];
  if (!provider) throw new Error(`Unknown chat provider: ${providerId}`);
  return provider;
};

export const chatClient = {
  async sendMessage(request: ChatSendRequest): Promise<ChatSendResponse> {
    const provider = getProvider(request.providerId);
    return provider.sendMessage(request);
  },

  async connect({ providerId, mode }: { providerId: string; mode: AuthMode }): Promise<AuthResult> {
    const provider = getProvider(providerId);
    return provider.connect(mode);
  }
};
