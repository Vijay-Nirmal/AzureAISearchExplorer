import React, { useMemo } from 'react';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import { Card } from '../../common/Card';
import { InfoIcon } from '../../common/InfoIcon';

import { stringifyShort } from './classicRetrievalUtils';
import styles from './ClassicRetrievalPage.module.css';

type ResponseTips = {
  count?: string;
  coverage?: string;
  answers?: string;
};

type Props = {
  rawResponse: Record<string, unknown> | null;
  results: Record<string, unknown>[];
  answers: unknown[];
  count: unknown;
  coverage: unknown;
  responseTips: ResponseTips;
};

export const ClassicRetrievalInsights: React.FC<Props> = ({ rawResponse, results, answers, count, coverage, responseTips }) => {
  const data = useMemo(() => {
    return results
      .map((d, i) => {
        const score = typeof d['@search.score'] === 'number' ? (d['@search.score'] as number) : null;
        const reranker = typeof d['@search.rerankerScore'] === 'number' ? (d['@search.rerankerScore'] as number) : null;
        return { i: i + 1, score, reranker };
      })
      .filter((d) => typeof d.score === 'number');
  }, [results]);

  if (!rawResponse) return <div className={styles.empty}>Run a query to see insights.</div>;

  return (
    <div className={styles.insightsWrap}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>Result Overview</div>
            <div className={styles.smallHint}>Score distribution for the current page of results.</div>
          </div>
          <div className={styles.smallHint}>
            {typeof count === 'number' ? (
              <span className={styles.pill} title={responseTips.count}>
                <i className="fas fa-hashtag"></i> count: {count}
              </span>
            ) : null}{' '}
            {typeof coverage === 'number' ? (
              <span className={styles.pill} title={responseTips.coverage}>
                <i className="fas fa-chart-pie"></i> coverage: {(coverage as number).toFixed(2)}%
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ height: 220, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="i" tick={{ fill: 'var(--text-color)', opacity: 0.7 }} />
              <YAxis tick={{ fill: 'var(--text-color)', opacity: 0.7 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--sidebar-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)'
                }}
              />
              <Bar dataKey="score" name="@search.score" fill="var(--accent-color)" />
              <Bar dataKey="reranker" name="@search.rerankerScore" fill="var(--status-warn-text)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <span>Answers</span>
            <InfoIcon tooltip={responseTips.answers || 'Semantic answers returned by the service when enabled.'} />
          </div>
          {answers.length === 0 ? (
            <div className={styles.smallHint}>No answers returned (enable Answers or use semantic query type).</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {answers.slice(0, 6).map((a, idx) => (
                <div key={idx} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                  <div className={styles.smallHint} style={{ marginBottom: 6 }}>
                    <i className="fas fa-wand-magic-sparkles"></i> answer #{idx + 1}
                  </div>
                  <div className={styles.wrapAnywhere} style={{ color: 'var(--text-color)', whiteSpace: 'pre-wrap' }}>
                    {stringifyShort(a)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
