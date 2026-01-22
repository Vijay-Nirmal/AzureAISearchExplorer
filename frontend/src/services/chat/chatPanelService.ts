export const chatPanelService = {
  openWithMessage(message: string) {
    window.dispatchEvent(new CustomEvent('chat:open', { detail: { message } }));
  }
};
