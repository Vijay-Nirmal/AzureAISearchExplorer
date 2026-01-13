import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { InfoIcon } from '../../common/InfoIcon';
import { JsonViewerModal } from '../../common/JsonViewerModal';
import {
  getFieldTooltipFromSchema,
  getResolvedEntity,
  getResolvedFieldDefinition,
  getResolvedFieldOptions,
  getTypeDescriptionFromSchema,
  resolveConfigRef
} from '../../common/configDriven/configDrivenUtils';
import type { ConfigDrivenSchema } from '../../common/configDriven/configDrivenTypes';

import { knowledgeBasesService } from '../../../services/knowledgeBasesService';
import { knowledgeSourcesService } from '../../../services/knowledgeSourcesService';
import { knowledgeBaseRetrievalService } from '../../../services/knowledgeBaseRetrievalService';
import type { KnowledgeBase } from '../../../types/KnowledgeBaseModels';
import type { KnowledgeSource } from '../../../types/KnowledgeSourceModels';
import type {
  KnowledgeBaseActivityRecord,
  KnowledgeBaseMessageContent,
  KnowledgeBaseRetrievalResponse,
  KnowledgeBaseReference
} from '../../../types/KnowledgeBaseRetrievalModels';

import styles from './AgenticRetrievalPage.module.css';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  rawResponse?: KnowledgeBaseRetrievalResponse;
};

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const asRecord = (v: unknown): Record<string, unknown> | null => {
  if (!v || typeof v !== 'object') return null;
  if (Array.isArray(v)) return null;
  return v as Record<string, unknown>;
};

const getNumberField = (obj: unknown, key: string): number | undefined => {
  const rec = asRecord(obj);
  const v = rec ? rec[key] : undefined;
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};

const getStringField = (obj: unknown, key: string): string | undefined => {
  const rec = asRecord(obj);
  const v = rec ? rec[key] : undefined;
  return typeof v === 'string' ? v : undefined;
};

const getFirstTextFromResponse = (resp: KnowledgeBaseRetrievalResponse | null | undefined): string => {
  const message = resp?.response?.[0];
  const content = message?.content?.[0];

  const c = content as KnowledgeBaseMessageContent | undefined;
  if (!c) return '';
  if (c.type === 'text') return String(c.text ?? '');

  return '';
};

const formatMs = (ms: number | null | undefined): string => {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const pickActivity = (activity: KnowledgeBaseActivityRecord[] | undefined, activityType: string) => {
  return (activity || []).find((a) => String(a.type || '') === activityType);
};

const getTokenMeta = (resp: KnowledgeBaseRetrievalResponse | undefined) => {
  const activity = resp?.activity || [];

  const answer = pickActivity(activity, 'modelAnswerSynthesis');
  const plan = pickActivity(activity, 'modelQueryPlanning');
  const reasoning = pickActivity(activity, 'agenticReasoning');

  return {
    planInputTokens: getNumberField(plan, 'inputTokens'),
    planOutputTokens: getNumberField(plan, 'outputTokens'),
    answerInputTokens: getNumberField(answer, 'inputTokens'),
    answerOutputTokens: getNumberField(answer, 'outputTokens'),
    reasoningTokens: getNumberField(reasoning, 'reasoningTokens'),
    elapsedMs: getNumberField(answer, 'elapsedMs') ?? getNumberField(plan, 'elapsedMs')
  };
};

const AgenticRetrievalPage: React.FC = () => {
  const { activeConnectionId, setBreadcrumbs } = useLayout();

  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState<string>('');
  const [loadingKb, setLoadingKb] = useState(false);

  const [reasoningKind, setReasoningKind] = useState<'minimal' | 'low' | 'medium'>('low');
  const [outputMode, setOutputMode] = useState<string>('');
  const [includeActivity, setIncludeActivity] = useState(true);
  const [includeReferences, setIncludeReferences] = useState(true);
  const [includeReferenceSourceData, setIncludeReferenceSourceData] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState<unknown>(null);

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityPayload, setActivityPayload] = useState<KnowledgeBaseActivityRecord[] | null>(null);

  const [refsOpen, setRefsOpen] = useState(false);
  const [refsPayload, setRefsPayload] = useState<KnowledgeBaseReference[] | null>(null);

  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [selectedKbDetails, setSelectedKbDetails] = useState<Record<string, unknown> | null>(null);

  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Agentic Retrieval' }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Config-driven helptext (response-side)
  const retrievalResponseSchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('KnowledgeBaseRetrievalResponse/retrievalResponseConfig.json');
  }, []);

  const responseTips = useMemo(() => {
    if (!retrievalResponseSchema) return {} as Record<string, string | undefined>;
    const disc = 'KnowledgeBaseRetrievalResponse';
    return {
      activity: getFieldTooltipFromSchema(retrievalResponseSchema, disc, 'activity'),
      references: getFieldTooltipFromSchema(retrievalResponseSchema, disc, 'references'),
      response: getFieldTooltipFromSchema(retrievalResponseSchema, disc, 'response')
    };
  }, [retrievalResponseSchema]);

  const activitySchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('KnowledgeBaseRetrievalResponse/Activity/activityRecordConfig.json');
  }, []);

  const getActivityTip = useCallback(
    (activityType: string, fieldKey: string) => {
      if (!activitySchema) return undefined;
      return getFieldTooltipFromSchema(activitySchema, activityType, fieldKey);
    },
    [activitySchema]
  );

  const knowledgeBaseSchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('KnowledgeBase/knowledgeBaseConfig.json');
  }, []);

  const outputModeOptions = useMemo(() => {
    if (!knowledgeBaseSchema) return [];
    const def = getResolvedFieldDefinition(knowledgeBaseSchema, 'KnowledgeBase', 'outputMode');
    if (!def) return [];
    return getResolvedFieldOptions(def);
  }, [knowledgeBaseSchema]);

  const outputModeSelectOptions = useMemo(() => {
    return outputModeOptions.map((o) => ({
      value: String(o.value),
      description: typeof o.description === 'string' ? o.description : undefined
    }));
  }, [outputModeOptions]);

  const retrievalEffortSchema = useMemo(() => {
    return resolveConfigRef<ConfigDrivenSchema>('KnowledgeBase/RetrievalReasoningEffort/retrievalReasoningEffortConfig.json');
  }, []);

  const retrievalEffortOptions = useMemo(() => {
    const values: Array<'minimal' | 'low' | 'medium'> = ['minimal', 'low', 'medium'];
    return values.map((v) => ({
      value: v,
      description: retrievalEffortSchema ? getTypeDescriptionFromSchema(retrievalEffortSchema, v) : undefined
    }));
  }, [retrievalEffortSchema]);

  const loadKnowledgeBases = useCallback(async () => {
    if (!activeConnectionId) return;
    setLoadingKb(true);
    try {
      const [list, sources] = await Promise.all([
        knowledgeBasesService.listKnowledgeBases(activeConnectionId),
        knowledgeSourcesService.listKnowledgeSources(activeConnectionId)
      ]);
      setKnowledgeBases(list || []);
      setKnowledgeSources(sources || []);

      if (!selectedKb && (list || []).length > 0) setSelectedKb(String((list || [])[0]?.name ?? ''));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKb(false);
    }
  }, [activeConnectionId, selectedKb]);

  useEffect(() => {
    void loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  useEffect(() => {
    const loadKbDetails = async () => {
      if (!activeConnectionId) return;
      const name = (selectedKb || '').trim();
      if (!name) {
        setSelectedKbDetails(null);
        return;
      }

      try {
        const kb = await knowledgeBasesService.getKnowledgeBase(activeConnectionId, name);
        setSelectedKbDetails(asRecord(kb) || null);
      } catch (e) {
        console.error(e);
        setSelectedKbDetails(null);
      }
    };

    void loadKbDetails();
  }, [activeConnectionId, selectedKb]);

  useEffect(() => {
    // Keep scrolled to bottom when new messages come in.
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const buildRetrieveRequest = useCallback(
    (nextMessages: ChatMessage[]) => {
      const kbSources = Array.isArray(selectedKbDetails?.knowledgeSources)
        ? (selectedKbDetails?.knowledgeSources as unknown[])
        : [];

      const kbSourceNames = kbSources
        .map((s) => getStringField(s, 'name'))
        .filter((v): v is string => !!v);

      const kindByName = new Map<string, string>();
      for (const ks of knowledgeSources) {
        const n = typeof ks.name === 'string' ? ks.name : '';
        const k = typeof (ks as unknown as Record<string, unknown>).kind === 'string' ? String((ks as unknown as Record<string, unknown>).kind) : '';
        if (n) kindByName.set(n, k);
      }

      const knowledgeSourceParams = includeReferences
        ? kbSourceNames
            .map((knowledgeSourceName) => {
              const kind = kindByName.get(knowledgeSourceName);
              if (!kind) return null;
              return {
                knowledgeSourceName,
                kind,
                includeReferences: true,
                includeReferenceSourceData
              };
            })
            .filter(
              (v): v is { knowledgeSourceName: string; kind: string; includeReferences: boolean; includeReferenceSourceData: boolean } =>
                v !== null
            )
        : undefined;

      if (reasoningKind === 'minimal') {
        const lastUser = [...nextMessages].reverse().find((m) => m.role === 'user');
        return {
          intents: [{ type: 'semantic', search: lastUser?.text || '' }],
          includeActivity,
          ...(knowledgeSourceParams ? { knowledgeSourceParams } : {})
        };
      }

      const msgPayload = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role,
          content: [{ type: 'text', text: m.text }]
        }));

      const req: Record<string, unknown> = {
        messages: msgPayload,
        retrievalReasoningEffort: { kind: reasoningKind },
        includeActivity,
        ...(knowledgeSourceParams ? { knowledgeSourceParams } : {}),
        ...(outputMode ? { outputMode } : {})
      };

      return req;
    },
    [includeActivity, includeReferenceSourceData, includeReferences, knowledgeSources, outputMode, reasoningKind, selectedKbDetails]
  );

  const sendMessage = useCallback(async () => {
    if (!activeConnectionId) {
      alert('Please select a connection first.');
      return;
    }

    const kb = (selectedKb || '').trim();
    if (!kb) {
      alert('Please select a knowledge base.');
      return;
    }

    const text = draft.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: newId(), role: 'user', text, createdAt: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft('');

    setSending(true);
    try {
      const requestBody = buildRetrieveRequest(nextMessages);
      const resp = await knowledgeBaseRetrievalService.retrieve(activeConnectionId, kb, requestBody);

      const assistantText = getFirstTextFromResponse(resp) || '(no response text)';
      const assistantMsg: ChatMessage = {
        id: newId(),
        role: 'assistant',
        text: assistantText,
        createdAt: Date.now(),
        rawResponse: resp
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', text: `Request failed: ${msg}`, createdAt: Date.now() }
      ]);
    } finally {
      setSending(false);
    }
  }, [activeConnectionId, buildRetrieveRequest, draft, messages, selectedKb]);

  const canSend = !sending && draft.trim().length > 0;
  const hasChat = messages.length > 0 || draft.trim().length > 0;

  const startFreshChat = useCallback(() => {
    if (sending) return;

    if (hasChat) {
      const ok = confirm('Start a fresh chat? This will clear the current conversation.');
      if (!ok) return;
    }

    setMessages([]);
    setDraft('');

    setJsonOpen(false);
    setJsonPayload(null);

    setActivityOpen(false);
    setActivityPayload(null);

    setRefsOpen(false);
    setRefsPayload(null);
  }, [hasChat, sending]);

  const renderBubble = (m: ChatMessage) => {
    const isUser = m.role === 'user';
    const rowClass = isUser ? styles.rowUser : styles.rowAssistant;
    const bubbleClass = `${styles.bubble} ${isUser ? styles.bubbleUser : ''}`;

    const meta = m.role === 'assistant' ? getTokenMeta(m.rawResponse) : null;

    return (
      <div key={m.id} className={`${styles.row} ${rowClass}`}>
        <div className={bubbleClass}>
          <div className={styles.roleRow}>
            <span className={styles.roleTag}>{m.role}</span>
            {!isUser && m.rawResponse ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActivityPayload(m.rawResponse?.activity ?? null);
                    setActivityOpen(true);
                  }}
                  title={responseTips.activity || 'View activity'}
                >
                  <i className="fas fa-list-check"></i> Activity
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRefsPayload(m.rawResponse?.references ?? null);
                    setRefsOpen(true);
                  }}
                  title={responseTips.references || 'View references'}
                >
                  <i className="fas fa-book-open"></i> References
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setJsonPayload(m.rawResponse);
                    setJsonOpen(true);
                  }}
                  title="View raw JSON"
                >
                  <i className="fas fa-code"></i> JSON
                </Button>
              </div>
            ) : null}
          </div>

          <div className={styles.messageText}>{m.text}</div>

          {!isUser && m.rawResponse && meta ? (
            <div className={styles.metaRow}>
              {typeof meta.elapsedMs === 'number' ? (
                <span className={styles.metaItem} title={getActivityTip('KnowledgeBaseModelAnswerSynthesisActivityRecord', 'elapsedMs') || 'Elapsed time'}>
                  <i className={`fas fa-stopwatch ${styles.metaOk}`}></i>
                  {formatMs(meta.elapsedMs)}
                </span>
              ) : null}

              {typeof meta.answerInputTokens === 'number' ? (
                <span className={styles.metaItem} title={getActivityTip('KnowledgeBaseModelAnswerSynthesisActivityRecord', 'inputTokens') || 'Answer synthesis input tokens'}>
                  <i className={`fas fa-cube ${styles.metaWarn}`}></i>
                  in {meta.answerInputTokens}
                </span>
              ) : null}

              {typeof meta.answerOutputTokens === 'number' ? (
                <span className={styles.metaItem} title={getActivityTip('KnowledgeBaseModelAnswerSynthesisActivityRecord', 'outputTokens') || 'Answer synthesis output tokens'}>
                  <i className={`fas fa-cubes ${styles.metaWarn}`}></i>
                  out {meta.answerOutputTokens}
                </span>
              ) : null}

              {typeof meta.reasoningTokens === 'number' ? (
                <span className={styles.metaItem} title={getActivityTip('KnowledgeBaseAgenticReasoningActivityRecord', 'reasoningTokens') || 'Agentic reasoning tokens'}>
                  <i className={`fas fa-brain ${styles.metaWarn}`}></i>
                  reasoning {meta.reasoningTokens}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const kbTip = useMemo(() => {
    if (!knowledgeBaseSchema) return undefined;
    return getResolvedEntity(knowledgeBaseSchema).description || getTypeDescriptionFromSchema(knowledgeBaseSchema, 'KnowledgeBase');
  }, [knowledgeBaseSchema]);

  const outputModeTip = useMemo(() => {
    const match = outputModeSelectOptions.find((o) => o.value === outputMode);
    return match?.description;
  }, [outputMode, outputModeSelectOptions]);

  const includeActivityTip = responseTips.activity;
  const includeRefsTip = responseTips.references;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Agentic Retrieval</h2>
          {kbTip ? <InfoIcon tooltip={kbTip} /> : null}
        </div>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <Button variant="secondary" onClick={startFreshChat} disabled={sending || !hasChat} title="Start a fresh chat">
              <i className="fas fa-rotate-left"></i> New chat
            </Button>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Knowledge Base</span>
            <Select value={selectedKb} onChange={(e) => setSelectedKb(e.target.value)} disabled={loadingKb || !activeConnectionId}>
              {(knowledgeBases || []).length === 0 ? <option value="">(none)</option> : null}
              {(knowledgeBases || []).map((kb) => (
                <option key={kb.name} value={kb.name}>
                  {kb.name}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Reasoning</span>
            <Select value={reasoningKind} onChange={(e) => setReasoningKind(e.target.value as 'minimal' | 'low' | 'medium')}>
              {retrievalEffortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                </option>
              ))}
            </Select>
            {retrievalEffortSchema ? (
              <InfoIcon tooltip={retrievalEffortOptions.find((o) => o.value === reasoningKind)?.description || ''} />
            ) : null}
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Output</span>
            <Select value={outputMode} onChange={(e) => setOutputMode(e.target.value)}>
              <option value="">(default)</option>
              {outputModeSelectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                </option>
              ))}
            </Select>
            {outputModeTip ? <InfoIcon tooltip={outputModeTip} /> : null}
          </div>

          <div className={styles.controlGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.9 }}>
              <input type="checkbox" checked={includeActivity} onChange={(e) => setIncludeActivity(e.target.checked)} />
              Include activity
            </label>
            {includeActivityTip ? <InfoIcon tooltip={includeActivityTip} /> : null}
          </div>

          <div className={styles.controlGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.9 }}>
              <input type="checkbox" checked={includeReferences} onChange={(e) => setIncludeReferences(e.target.checked)} />
              Include references
            </label>
            {includeRefsTip ? <InfoIcon tooltip={includeRefsTip} /> : null}
          </div>

          {includeReferences ? (
            <div className={styles.controlGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.9 }}>
                <input
                  type="checkbox"
                  checked={includeReferenceSourceData}
                  onChange={(e) => setIncludeReferenceSourceData(e.target.checked)}
                />
                Include sourceData
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <Card className={styles.chatCard}>
        <div className={styles.transcript} ref={transcriptRef}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              Ask a question to your selected Knowledge Base. Use the buttons on an assistant response to inspect Activity, References, or Raw JSON.
            </div>
          ) : null}

          {messages.map(renderBubble)}
        </div>

        <div className={styles.composer}>
          <div className={styles.composerInput}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask something…"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void sendMessage();
                }
              }}
            />
            <div className={styles.helperText}>
              Enter to send. Shift+Enter for newline. {reasoningKind === 'minimal' ? 'Minimal mode uses intents (no chat history).' : ''}
            </div>
          </div>

          <Button className={styles.sendButton} variant="primary" onClick={() => void sendMessage()} disabled={!canSend}>
            <i className="fas fa-paper-plane"></i> Send
          </Button>
        </div>
      </Card>

      <JsonViewerModal isOpen={jsonOpen} onClose={() => setJsonOpen(false)} title="Raw Retrieval Response" data={jsonPayload} />
      <JsonViewerModal isOpen={activityOpen} onClose={() => setActivityOpen(false)} title="Activity" data={activityPayload} />
      <JsonViewerModal isOpen={refsOpen} onClose={() => setRefsOpen(false)} title="References" data={refsPayload} />
    </div>
  );
};

export default AgenticRetrievalPage;
