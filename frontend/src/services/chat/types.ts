export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  data?: unknown;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface ChatSendRequest {
  providerId: string;
  connectionId: string | null;
  messages: ChatMessage[];
  settings: ChatSettings;
}

export interface ChatSendResponse {
  content: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export type AuthMode = 'device_code' | 'browser' | 'token';

export interface AuthResult {
  statusMessage: string;
  openUrl?: string;
  userCode?: string;
  verificationUri?: string;
  expiresIn?: number;
  deviceCode?: string;
  interval?: number;
}

export interface ChatProvider {
  id: string;
  name: string;
  sendMessage(request: ChatSendRequest): Promise<ChatSendResponse>;
  connect(mode: AuthMode): Promise<AuthResult>;
}
