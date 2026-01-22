const { ipcMain } = require('electron');

const USER_AGENT = 'GithubCopilot/1.155.0';
const EDITOR_VERSION = 'vscode/1.100.2';
const PLUGIN_VERSION = 'copilot-chat/0.27.1';

const sharedHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': USER_AGENT,
  'Editor-Version': EDITOR_VERSION,
  'Editor-Plugin-Version': PLUGIN_VERSION
});

const parseCopilotStream = async (response) => {
  const text = await response.text();
  // Log raw response for debugging
  // Disabling logs by commenting out to reduce noise
  // try {
  //   console.log('Copilot stream response (raw):', text);
  //   const parsedLines = text
  //     .split('\n')
  //     .map((l) => l.trim())
  //     .filter((l) => l.startsWith('data:'))
  //     .map((l) => l.replace(/^data:\s*/, ''))
  //     .filter((l) => l && l !== '[DONE]')
  //     .map((l) => {
  //       try {
  //         return JSON.stringify(JSON.parse(l), null, 2);
  //       } catch {
  //         return l;
  //       }
  //     });

  // } catch (err) {
  //   console.error('Failed to log Copilot stream response', err);
  // }

  const lines = text.split('\n');
  let content = '';
  let functionName = '';
  let functionArgs = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payloadLine = trimmed.replace(/^data:\s*/, '');
    if (!payloadLine || payloadLine === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payloadLine);
      const delta = parsed?.choices?.[0]?.delta;
      if (delta?.content) content += delta.content;
      if (delta?.function_call?.name) functionName = delta.function_call.name;
      if (delta?.function_call?.arguments) functionArgs += delta.function_call.arguments;
    } catch {
      // ignore
    }
  }

  if (functionName) {
    return { content, functionCall: { name: functionName, arguments: functionArgs } };
  }

  return { content };
};

const registerGithubCopilotIpc = () => {
  ipcMain.handle('github-device-code', async (_event, payload) => {
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: sharedHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to start device code flow.');
    }

    return response.json();
  });

  ipcMain.handle('github-access-token', async (_event, payload) => {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: sharedHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to complete device code flow.');
    }

    return response.json();
  });

  ipcMain.handle('copilot-token', async (_event, accessToken) => {
    const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
      method: 'GET',
      headers: {
        ...sharedHeaders(),
        Authorization: `token ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve Copilot token.');
    }

    return response.json();
  });

  ipcMain.handle('copilot-chat', async (_event, payload) => {
    console.log('Copilot chat payload received', JSON.stringify(payload.body), payload.token, 'https://api.githubcopilot.com/chat/completions');
    const response = await fetch('https://api.githubcopilot.com/chat/completions', {
      method: 'POST',
      headers: {
        ...sharedHeaders(),
        Authorization: `Bearer ${payload.token}`
      },
      body: JSON.stringify(payload.body)
    });

    if (!response.ok) {
      console.error('Copilot chat request failed', await response.text());
      throw new Error('Copilot chat request failed.');
    }

    return parseCopilotStream(response);
  });

  ipcMain.handle('copilot-models', async (_event, token) => {
    const response = await fetch('https://api.githubcopilot.com/models', {
      method: 'GET',
      headers: {
        ...sharedHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Copilot models request failed', await response.text());
      throw new Error('Copilot models request failed.');
    }

    return response.json();
  });
};

module.exports = { registerGithubCopilotIpc };
