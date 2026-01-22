import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ChatPanel.module.css';
import { useLayout } from '../../context/LayoutContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Label } from '../common/Label';
import { SelectWithDescription, type SelectOption } from '../common/SelectWithDescription';
import { TextArea } from '../common/TextArea';
import { JsonView } from '../common/JsonView';
import chatAuthModes from '../../data/constants/chatAuthModes.json';
import { chatClient, DEFAULT_CHAT_SETTINGS } from '../../services/chat/chatClient';
import { formatToolCall, runTool, TOOL_NAMES } from '../../services/chat/toolRegistry';
import { authStore } from '../../services/chat/authStore';
import { githubAuth } from '../../services/chat/githubAuth';
import { connectionService } from '../../services/connectionService';
import type { AuthMode, ChatMessage } from '../../services/chat/types';

const toOptions = (items: Array<{ value: string; description?: string; label?: string }>): SelectOption[] =>
  items.map((item) => ({ value: item.value, description: item.description, label: item.label }));

export const ChatPanel: React.FC = () => {
  const { isChatOpen, toggleChat, activeConnectionId, breadcrumbs, chatDraft, setChatDraft } = useLayout();
  const [authMode, setAuthMode] = useState<AuthMode>((chatAuthModes[0]?.value as AuthMode) ?? 'device_code');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('Not signed in');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState<SelectOption[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isToolRunning, setIsToolRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [pat, setPat] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(authStore.getToken());
  const [authModeStored, setAuthModeStored] = useState(authStore.getMode());
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const authOptions = useMemo(() => toOptions(chatAuthModes), []);
  const modelOptions = useMemo(() => availableModels, [availableModels]);

  useEffect(() => {
    const storedModel = localStorage.getItem('copilot.selectedModel') ?? '';
    if (storedModel) {
      setModel(storedModel);
    }

    const loadModels = async () => {
      const token = authStore.getToken();
      if (!token || !window.electronAPI?.copilotToken || !window.electronAPI?.copilotModels) return;

      const copilotToken = await window.electronAPI.copilotToken(token);
      if (!copilotToken?.token) return;

      const modelResponse = await window.electronAPI.copilotModels(copilotToken.token);
      const models = modelResponse?.data ?? [];
      const options = models
        .filter((item: { model_picker_enabled?: boolean }) => item.model_picker_enabled)
        .map((item: { id: string; name?: string }) => ({
          value: item.id,
          label: item.name ?? item.id
        }));

      setAvailableModels(options);
      const nextModel = storedModel || options[0]?.value || '';
      if (nextModel && nextModel !== model) {
        setModel(nextModel);
        localStorage.setItem('copilot.selectedModel', nextModel);
      }
    };

    loadModels();
  }, [authToken]);

  useEffect(() => {
    if (!chatDraft) return;
    setInput(chatDraft);
    setChatDraft(null);
  }, [chatDraft, setChatDraft]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const toResourceType = (label?: string) => {
    if (!label) return 'Unknown';
    const normalized = label.toLowerCase();
    const map: Record<string, string> = {
      indexes: 'Index',
      indexers: 'Indexer',
      'data sources': 'Data Source',
      datasources: 'Data Source',
      skillsets: 'Skillset',
      'synonym maps': 'Synonym Map',
      synonymmaps: 'Synonym Map',
      aliases: 'Alias',
      'knowledge sources': 'Knowledge Source',
      knowledgesources: 'Knowledge Source',
      'knowledge bases': 'Knowledge Base',
      knowledgebases: 'Knowledge Base',
      'service overview': 'Service'
    };
    return map[normalized] ?? label;
  };

  const buildPageContext = () => {
    const labels = breadcrumbs.map((item) => item.label).filter(Boolean);
    const resourceType = labels.length > 0 ? toResourceType(labels[0]) : 'Service Overview';

    const lines = ['Page Context:', `Resource Type: ${resourceType}`];

    if (labels.length >= 2) {
      lines.push(`Resource Name: ${labels[1]}`);
    }

    if (labels.length >= 3) {
      lines.push(`Action: ${labels[2]}`);
    }

    return lines.join('\n');
  };

  const withPageContext = (baseMessages: ChatMessage[]) => {
    const lastUserIndex = [...baseMessages]
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => message.role === 'user')
      .map(({ index }) => index)
      .pop();

    if (lastUserIndex === undefined) return baseMessages;

    return baseMessages.map((message, index) => {
      if (index !== lastUserIndex) return message;
      if (message.content.includes('Page Context:')) return message;
      return {
        ...message,
        content: `${message.content}\n\n${buildPageContext()}`
      };
    });
  };

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    scrollToBottom();
  };

  const updateMessageContent = (id: string, content: string) => {
    setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, content } : message)));
    scrollToBottom();
  };

  const streamAssistantResponse = async (content: string) => {
    if (!content.trim()) return;
    const messageId = crypto.randomUUID();
    appendMessage({ id: messageId, role: 'assistant', content: '', createdAt: Date.now() });
    setIsStreaming(true);

    const chunkSize = 12;
    for (let i = 0; i < content.length; i += chunkSize) {
      const next = content.slice(0, i + chunkSize);
      updateMessageContent(messageId, next);
      await new Promise((resolve) => setTimeout(resolve, 16));
    }

    setIsStreaming(false);
  };

  const executeToolCall = async (
    functionName: string,
    rawArguments: string,
    connectionId: string | null
  ): Promise<ChatMessage[] | null> => {
    if (!connectionId) return null;
    const callMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: formatToolCall(functionName, rawArguments),
      createdAt: Date.now()
    };

    appendMessage(callMessage);
    setIsToolRunning(true);

    try {
      const data = await runTool(functionName, rawArguments, connectionId);
      if (data === null || data === undefined) return null;

      const toolMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'tool',
        content: `Tool response: ${functionName}`,
        createdAt: Date.now(),
        data
      };

      appendMessage(toolMessage);
      return [callMessage, toolMessage];
    } finally {
      setIsToolRunning(false);
    }
  };

  const handleToolCalls = async (
    initialResponse: { content: string; functionCall?: { name: string; arguments: string } },
    baseMessages: ChatMessage[],
    systemPrompt: string,
    connectionId: string | null,
    effectiveModel: string
  ) => {
    let response = initialResponse;
    let nextMessages = baseMessages;

    while (response.functionCall && TOOL_NAMES.includes(response.functionCall.name)) {
      const toolResult = await executeToolCall(
        response.functionCall.name,
        response.functionCall.arguments,
        connectionId
      );

      if (!toolResult) break;

      nextMessages = [...nextMessages, ...toolResult];

      response = await chatClient.sendMessage({
        providerId: 'copilot',
        connectionId,
        messages: nextMessages,
        settings: {
          ...DEFAULT_CHAT_SETTINGS,
          model: effectiveModel,
          systemPrompt
        }
      });
    }

    return response;
  };

  const sendWithMessages = async (baseMessages: ChatMessage[]) => {
    setIsSending(true);
    try {
      const messagesWithContext = withPageContext(baseMessages);
      const systemPrompt = await buildSystemPrompt(activeConnectionId);
      const effectiveModel = model || availableModels[0]?.value || DEFAULT_CHAT_SETTINGS.model;
      const response = await chatClient.sendMessage({
        providerId: 'copilot',
        connectionId: activeConnectionId,
        messages: messagesWithContext,
        settings: {
          ...DEFAULT_CHAT_SETTINGS,
          model: effectiveModel,
          systemPrompt
        }
      });

      const finalResponse = await handleToolCalls(response, messagesWithContext, systemPrompt, activeConnectionId, effectiveModel);
      setIsSending(false);
      if (finalResponse?.content) {
        await streamAssistantResponse(finalResponse.content);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message.';
      appendMessage({ id: crypto.randomUUID(), role: 'assistant', content: message, createdAt: Date.now() });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: crypto.randomUUID(), role: 'user', content: trimmed, createdAt: Date.now() }
    ];
    setMessages(nextMessages);
    setInput('');
    scrollToBottom();

    await sendWithMessages(nextMessages);
  };

  const handleRetry = async () => {
    if (isSending || isToolRunning || isStreaming) return;
    const lastUserIndex = [...messages].map((message, index) => ({ message, index }))
      .filter(({ message }) => message.role === 'user')
      .map(({ index }) => index)
      .pop();

    if (lastUserIndex === undefined) return;

    const trimmedMessages = messages.slice(0, lastUserIndex + 1);
    setMessages(trimmedMessages);
    scrollToBottom();
    await sendWithMessages(trimmedMessages);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    scrollToBottom();
  };

  const toggleAuthMenu = () => {
    setIsAuthMenuOpen((prev) => !prev);
  };

  const handleAuth = async () => {
    try {
      if (authMode === 'token') {
        if (!pat.trim()) throw new Error('Enter a personal access token.');
        authStore.setToken(pat.trim(), 'token');
        setAuthToken(pat.trim());
        setAuthModeStored('token');
        setStatus('Signed in with personal access token.');
        return;
      }

      const result = await chatClient.connect({ providerId: 'copilot', mode: authMode });
      setStatus(result.statusMessage);
      setUserCode(result.userCode ?? null);
      setVerificationUrl(result.verificationUri ?? result.openUrl ?? null);
      if (result.openUrl && window.electronAPI?.openExternal) {
        await window.electronAPI.openExternal(result.openUrl);
      }

      if (result.deviceCode && result.verificationUri && result.expiresIn) {
        setStatus('Waiting for GitHub verification...');
        const interval = result.interval ?? 5;
        const token = await githubAuth.pollDeviceCode(result.deviceCode, interval, result.expiresIn);
        authStore.setToken(token, authMode === 'browser' ? 'browser' : 'device_code');
        setAuthToken(token);
        setAuthModeStored(authMode === 'browser' ? 'browser' : 'device_code');
        setStatus('Signed in with GitHub.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setStatus(message);
    }
  };

  const handleSignOut = () => {
    authStore.clear();
    setAuthToken(null);
    setAuthModeStored(null);
    setStatus('Not signed in');
  };

  if (!isChatOpen) return null;

  return (
    <div className={styles.panel} role="dialog" aria-label="Copilot Chat">
      <div className={styles.header}>
        <div className={styles.title}>GitHub Copilot Chat</div>
        <div className={styles.headerActions}>
          <div className={styles.authMenuWrap}>
            <Button
              variant="icon"
              icon={<i className="fa-solid fa-user"></i>}
              onClick={toggleAuthMenu}
              title="Authentication"
            />
            <span
              className={styles.statusIcon}
              title={authToken ? `Signed in (${authModeStored ?? 'token'})` : status}
            >
              <i className={`fa-solid ${authToken ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
            </span>
            {isAuthMenuOpen ? (
              <div className={styles.authMenu}>
                <div className={styles.authMenuRow}>
                  <SelectWithDescription
                    options={authOptions}
                    value={authMode}
                    onChange={(e) => setAuthMode(e.target.value as AuthMode)}
                    className={styles.authSelectControl}
                    containerClassName={styles.authSelectContainer}
                    menuClassName={styles.authSelectMenu}
                  />
                  <Button
                    variant="icon"
                    icon={<i className="fa-solid fa-right-to-bracket"></i>}
                    onClick={handleAuth}
                    title="Sign in"
                  />
                  {authToken ? (
                    <Button
                      variant="icon"
                      icon={<i className="fa-solid fa-right-from-bracket"></i>}
                      onClick={handleSignOut}
                      title="Sign out"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          <Button
            variant="icon"
            icon={<i className="fa-solid fa-plus"></i>}
            onClick={handleNewChat}
            title="New chat"
          />
          <Button variant="icon" icon={<i className="fa-solid fa-times"></i>} onClick={toggleChat} title="Close" />
        </div>
      </div>

      <div className={styles.content}>
        {(authMode === 'token' || (userCode && verificationUrl)) ? (
          <div className={styles.authBar}>
            {authMode === 'token' ? (
              <div className={styles.authRow}>
                <Label className={styles.authLabel}>Token</Label>
                <Input
                  placeholder="Paste GitHub personal access token"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  className={styles.tokenInput}
                />
              </div>
            ) : null}
            {userCode && verificationUrl ? (
              <div className={styles.deviceCode}>
                <div>
                  <strong>Device code:</strong> {userCode}
                </div>
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(userCode)}
                  >
                    Copy code
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => window.electronAPI?.openExternal?.(verificationUrl)}
                  >
                    Open verification
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.placeholder}>Ask Copilot to inspect your Azure AI Search resources.</div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
                <div className={styles.messageRole}>{message.role}</div>
                <div className={styles.messageContent}>{message.content}</div>
                {message.data ? (
                  <div className={styles.toolPayload}>
                    <JsonView data={message.data} height={180} />
                  </div>
                ) : null}
              </div>
            ))
          )}
          {isSending && !isToolRunning ? (
            <div className={`${styles.message} ${styles.assistant} ${styles.pending}`}>
              <div className={styles.messageRole}>assistant</div>
              <div className={styles.messageContent}>
                <span className={styles.loadingText}>Thinking</span>
                <span className={styles.loadingDots}>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                </span>
              </div>
            </div>
          ) : null}
          {isToolRunning ? (
            <div className={`${styles.message} ${styles.tool} ${styles.pending}`}>
              <div className={styles.messageRole}>tool</div>
              <div className={styles.messageContent}>
                <span className={styles.loadingText}>Running tool</span>
                <span className={styles.loadingDots}>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                </span>
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.composer}>
          <div className={styles.composerInputWrap}>
            <TextArea
              className={styles.composerInput}
              placeholder={activeConnectionId ? 'Ask about the selected Azure AI Search connection...' : 'Select a connection to enable resource-aware chat.'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
            />
            <div className={styles.composerActions}>
              {modelOptions.length > 0 ? (
                <div className={styles.modelSelectInline}>
                <i className="fa-solid fa-microchip"></i>
                <SelectWithDescription
                  options={modelOptions}
                  value={model}
                    onChange={(e) => {
                      const nextModel = e.target.value;
                      setModel(nextModel);
                      localStorage.setItem('copilot.selectedModel', nextModel);
                    }}
                  className={styles.modelSelectControl}
                  containerClassName={styles.modelSelectContainer}
                  menuClassName={styles.modelSelectMenu}
                  hideDescription
                />
                </div>
              ) : null}
              <Button
                variant="icon"
                icon={<i className="fa-solid fa-rotate-right"></i>}
                onClick={handleRetry}
                disabled={isSending || isToolRunning || isStreaming || messages.length === 0}
                title="Retry"
              />
              <Button
                variant="icon"
                icon={<i className="fa-solid fa-paper-plane"></i>}
                onClick={handleSend}
                disabled={!input.trim() || isSending || isToolRunning || isStreaming}
                title="Send"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const buildSystemPrompt = async (connectionId: string | null) => {
  let connectionContext = 'No connection selected.';
  if (connectionId) {
    try {
      const profile = await connectionService.getById(connectionId);
      connectionContext = `Selected connection: ${profile.name ?? 'Unnamed'} (${profile.endpoint}).`;
    } catch {
      connectionContext = 'Selected connection could not be loaded.';
    }
  }

  return [
    'You are the Azure AI Search Explorer assistant.',
    'Only answer questions about Azure AI Search or this application. If asked about anything else, refuse briefly and redirect to Azure AI Search topics.',
    'Use the internal read-only resource tool to retrieve Azure AI Search resources for the selected connection when needed.',
    'Page Context: Each user message may include a "Page Context" block describing the current screen (resource type, name, action). Use it to interpret relative references like "this" or "here".',
    'Never ask the user for tool parameters; infer them from the conversation or request clarification about the resource itself.',
    connectionContext
  ].join(' ');
};


