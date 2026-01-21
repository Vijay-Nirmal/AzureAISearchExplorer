export {};

declare global {
  interface Window {
    electronAPI?: {
      openExternal: (url: string) => Promise<void>;
      githubDeviceCode: (payload: { client_id: string; scope: string }) => Promise<any>;
      githubAccessToken: (payload: { client_id: string; device_code: string; grant_type: string }) => Promise<any>;
      copilotToken: (accessToken: string) => Promise<{ token?: string }>;
      copilotChat: (payload: { token: string; body: any }) => Promise<{ content?: string; functionCall?: { name: string; arguments: string } }>;
      copilotModels: (token: string) => Promise<{ data?: Array<{ id: string; name?: string; model_picker_enabled?: boolean }> }>;
    };
  }
}
