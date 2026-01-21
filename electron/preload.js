const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  githubDeviceCode: (payload) => ipcRenderer.invoke('github-device-code', payload),
  githubAccessToken: (payload) => ipcRenderer.invoke('github-access-token', payload),
  copilotToken: (accessToken) => ipcRenderer.invoke('copilot-token', accessToken),
  copilotChat: (payload) => ipcRenderer.invoke('copilot-chat', payload),
  copilotModels: (token) => ipcRenderer.invoke('copilot-models', token)
});
