const CLIENT_ID = 'Iv1.b507a08c87ecfe98';
const SCOPE = 'read:user';
const USER_AGENT = 'GithubCopilot/1.155.0';
const EDITOR_VERSION = 'Neovim/0.6.1';
const PLUGIN_VERSION = 'copilot.vim/1.16.0';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface AccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

const ensureClientId = (): string => {
  if (!CLIENT_ID) {
    throw new Error('Missing GitHub OAuth client id.');
  }
  return CLIENT_ID;
};

export const githubAuth = {
  async startDeviceCode(): Promise<DeviceCodeResponse> {
    const clientId = ensureClientId();
    const payload = { client_id: clientId, scope: SCOPE };
    if (window.electronAPI?.githubDeviceCode) {
      return window.electronAPI.githubDeviceCode(payload) as Promise<DeviceCodeResponse>;
    }

    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
        'Editor-Version': EDITOR_VERSION,
        'Editor-Plugin-Version': PLUGIN_VERSION
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to start device code flow.');
    }

    return response.json() as Promise<DeviceCodeResponse>;
  },

  async pollDeviceCode(deviceCode: string, interval: number, expiresIn: number): Promise<string> {
    const clientId = ensureClientId();
    const start = Date.now();
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let pollInterval = interval;
    while (Date.now() - start < expiresIn * 1000) {
      await sleep(pollInterval * 1000);
      const tokenPayload = {
        client_id: clientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      };

      const payload = window.electronAPI?.githubAccessToken
        ? await window.electronAPI.githubAccessToken(tokenPayload)
        : await (async () => {
            const response = await fetch('https://github.com/login/oauth/access_token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': USER_AGENT,
                'Editor-Version': EDITOR_VERSION,
                'Editor-Plugin-Version': PLUGIN_VERSION
              },
              body: JSON.stringify(tokenPayload)
            });

            if (!response.ok) {
              throw new Error('Failed to complete device code flow.');
            }

            return response.json() as Promise<AccessTokenResponse>;
          })();

      if (payload.access_token) return payload.access_token;

      if (payload.error === 'slow_down') {
        pollInterval += 5;
        continue;
      }

      if (payload.error && payload.error !== 'authorization_pending') {
        throw new Error(payload.error_description ?? payload.error);
      }
    }

    throw new Error('Device code expired. Please try again.');
  }
};
