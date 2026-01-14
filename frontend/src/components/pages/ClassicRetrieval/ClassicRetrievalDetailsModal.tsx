import React, { useMemo, useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { JsonViewerModal } from '../../common/JsonViewerModal';
import styles from './ClassicRetrievalPage.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  doc: Record<string, unknown> | null;
  keyFieldName?: string | null;
};

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const asNumber = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const asString = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const getProp = (v: unknown, key: string): unknown => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  return (v as Record<string, unknown>)[key];
};

const pickDocId = (doc: Record<string, unknown>, keyFieldName?: string | null): string => {
  if (keyFieldName) {
    const v = doc[keyFieldName];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
  }
  const candidates = ['id', 'Id', 'key', 'Key'];
  for (const k of candidates) {
    const v = doc[k];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
  }
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('@')) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
  }
  return '(document)';
};

export const ClassicRetrievalDetailsModal: React.FC<Props> = ({ isOpen, onClose, doc, keyFieldName }) => {
  const [rawOpen, setRawOpen] = useState(false);

  const id = useMemo(() => (doc ? pickDocId(doc, keyFieldName) : ''), [doc, keyFieldName]);

  const score = doc ? asNumber(doc['@search.score']) : null;
  const reranker = doc ? asNumber(doc['@search.rerankerScore']) : null;
  const boosted = doc ? asNumber(doc['@search.rerankerBoostedScore']) : null;

  const highlights = doc ? doc['@search.highlights'] : undefined;
  const captions = doc ? asArray(doc['@search.captions']) : [];
  const debug = doc ? doc['@search.documentDebugInfo'] : undefined;

  const debugVectorsSubscores = useMemo(() => {
    if (!isRecord(debug)) return null;
    const vectors = debug.vectors;
    if (!isRecord(vectors)) return null;
    const subscores = vectors.subscores;
    if (!isRecord(subscores)) return null;
    return subscores;
  }, [debug]);

  const fieldEntries = useMemo(() => {
    if (!doc) return [] as Array<[string, unknown]>;
    return Object.entries(doc)
      .filter(([k]) => !k.startsWith('@'))
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [doc]);

  const renderHighlights = () => {
    if (!highlights) return <div className={styles.smallHint}>No highlights returned.</div>;
    if (!isRecord(highlights)) return <div className={styles.smallHint}>Highlights are not in an object format.</div>;

    const entries = Object.entries(highlights);
    if (entries.length === 0) return <div className={styles.smallHint}>No highlights returned.</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {entries.map(([field, value]) => {
          const frags = asArray(value).map((x) => asString(x)).filter(Boolean);
          return (
            <div key={field} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 6 }}>
                <i className="fas fa-highlighter" style={{ color: 'var(--accent-color)' }}></i>
                <span style={{ fontWeight: 600 }}>{field}</span>
                <span className={styles.badge}>{frags.length}</span>
              </div>
              <div className={styles.code} style={{ whiteSpace: 'pre-wrap' }}>
                {frags.length > 0 ? frags.join('\n') : asString(value)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCaptions = () => {
    if (!captions.length) return <div className={styles.smallHint}>No captions returned.</div>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {captions.slice(0, 10).map((c, idx) => (
          <div key={idx} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 6 }}>
            <div className={styles.smallHint} style={{ marginBottom: 6 }}>
              <i className="fas fa-quote-left" style={{ color: 'var(--status-warn-text)' }}></i> caption #{idx + 1}
            </div>
            <div style={{ color: 'var(--text-color)', whiteSpace: 'pre-wrap' }}>{asString(getProp(c, 'text') ?? c)}</div>
            {asString(getProp(c, 'highlights')).trim() ? (
              <div className={styles.smallHint} style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                {asString(getProp(c, 'highlights'))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderDebug = () => {
    if (!debug) return <div className={styles.smallHint}>No debug info returned (enable Debug in request).</div>;

    if (!debugVectorsSubscores) {
      return (
        <div className={styles.smallHint}>
          Debug info returned, but it doesn’t match the expected vector debug shape. Use “Raw JSON” to inspect.
        </div>
      );
    }

    const documentBoost = asNumber(debugVectorsSubscores.documentBoost);
    const textScore = isRecord(debugVectorsSubscores.text) ? asNumber(debugVectorsSubscores.text.searchScore) : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className={styles.kvGrid}>
          <div className={styles.kvKey}>documentBoost</div>
          <div className={`${styles.kvVal} ${styles.code}`}>{documentBoost == null ? '-' : documentBoost.toFixed(4)}</div>

          <div className={styles.kvKey}>text.searchScore</div>
          <div className={`${styles.kvVal} ${styles.code}`}>{textScore == null ? '-' : textScore.toFixed(4)}</div>
        </div>

        {isRecord(debugVectorsSubscores.vectors) ? (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: 10 }}>
              <i className="fas fa-vector-square" style={{ color: 'var(--accent-color)' }}></i>
              Vector Subscores
            </div>
            <div className={styles.smallHint} style={{ marginBottom: 8 }}>
              Vector field results are returned as a map. Open Raw JSON for full detail.
            </div>
            <pre className={styles.code} style={{ margin: 0, color: 'var(--text-color)' }}>
              {JSON.stringify(debugVectorsSubscores.vectors, null, 2)}
            </pre>
          </Card>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Document • ${id}`}
        width="980px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRawOpen(true)} disabled={!doc}>
              <i className="fas fa-code"></i> Raw JSON
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </>
        }
      >
        {!doc ? (
          <div className={styles.smallHint}>No document selected.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontWeight: 600 }}>Scores</div>
                  <div className={styles.smallHint}>Core ranking metadata for this result.</div>
                </div>
                <span className={styles.pill}>
                  <i className="fas fa-ranking-star"></i> row
                </span>
              </div>
              <div style={{ marginTop: 10 }} className={styles.kvGrid}>
                <div className={styles.kvKey}>@search.score</div>
                <div className={`${styles.kvVal} ${styles.code}`}>{score == null ? '-' : score.toFixed(4)}</div>

                <div className={styles.kvKey}>@search.rerankerScore</div>
                <div className={`${styles.kvVal} ${styles.code}`}>{reranker == null ? '-' : reranker.toFixed(4)}</div>

                <div className={styles.kvKey}>@search.rerankerBoostedScore</div>
                <div className={`${styles.kvVal} ${styles.code}`}>{boosted == null ? '-' : boosted.toFixed(4)}</div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 600 }}>Fields</div>
                <div className={styles.smallHint}>Document payload (excluding metadata keys).</div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {fieldEntries.slice(0, 18).map(([k, v]) => (
                  <div key={k} className={styles.kvGrid}>
                    <div className={styles.kvKey}>{k}</div>
                    <div className={styles.kvVal} title={asString(v)}>
                      <span className={styles.code}>{asString(v)}</span>
                    </div>
                  </div>
                ))}
                {fieldEntries.length > 18 ? <div className={styles.smallHint}>…and {fieldEntries.length - 18} more fields</div> : null}
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 600 }}>Highlights</div>
                <div className={styles.smallHint}>Matching text fragments by field.</div>
              </div>
              <div style={{ marginTop: 10 }}>{renderHighlights()}</div>
            </Card>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 600 }}>Captions</div>
                <div className={styles.smallHint}>Semantic captions, when enabled.</div>
              </div>
              <div style={{ marginTop: 10 }}>{renderCaptions()}</div>
            </Card>

            <div style={{ gridColumn: '1 / -1' }}>
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontWeight: 600 }}>Debug</div>
                  <div className={styles.smallHint}>Helps explain vector/hybrid scoring (when enabled).</div>
                </div>
                <div style={{ marginTop: 10 }}>{renderDebug()}</div>
              </Card>
            </div>
          </div>
        )}
      </Modal>

      <JsonViewerModal isOpen={rawOpen} onClose={() => setRawOpen(false)} title={`Document JSON • ${id}`} data={doc} />
    </>
  );
};
