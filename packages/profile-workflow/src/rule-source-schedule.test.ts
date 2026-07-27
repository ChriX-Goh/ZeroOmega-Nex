import { describe, expect, it } from 'vitest';

import { createDefaultProfileSpec } from './defaults.js';
import { listDueProfileWorkflowRuleSourceUpdates } from './rule-source-update.js';
import { createProfileWorkflowState } from './state.js';

function stateWithRemoteSource() {
  const spec = createDefaultProfileSpec({
    documentId: 'document-due',
    revisionId: 'revision-due',
    createdAt: '2026-07-27T00:00:00.000Z',
    deviceId: 'device-due',
  });
  spec.settings.ruleSourceUpdateIntervalMinutes = 60;
  spec.ruleSources.push({
    id: 'source-due',
    name: 'Due rules',
    format: 'autoproxy',
    location: { kind: 'url', url: 'https://rules.example.invalid/due.txt' },
  });
  return createProfileWorkflowState(spec);
}

describe('Rule Source due scheduling', () => {
  it('schedules a never-attempted remote source immediately', () => {
    const state = stateWithRemoteSource();
    expect(
      listDueProfileWorkflowRuleSourceUpdates(state, '2026-07-27T06:00:00.000Z').map(
        (source) => source.sourceId,
      ),
    ).toEqual(['source-due']);
  });

  it('waits one source interval after a failed attempt before retrying', () => {
    const state = {
      ...stateWithRemoteSource(),
      ruleSourceUpdates: {
        'source-due': {
          sourceId: 'source-due',
          url: 'https://rules.example.invalid/due.txt',
          lastAttemptAt: '2026-07-27T05:30:00.000Z',
          lastError: { occurredAt: '2026-07-27T05:30:00.000Z', message: 'offline' },
        },
      },
    };
    expect(listDueProfileWorkflowRuleSourceUpdates(state, '2026-07-27T06:29:59.000Z')).toEqual([]);
    expect(
      listDueProfileWorkflowRuleSourceUpdates(state, '2026-07-27T06:30:00.000Z').map(
        (source) => source.sourceId,
      ),
    ).toEqual(['source-due']);
  });

  it('waits one source interval after a successful update', () => {
    const state = {
      ...stateWithRemoteSource(),
      ruleSourceUpdates: {
        'source-due': {
          sourceId: 'source-due',
          url: 'https://rules.example.invalid/due.txt',
          lastAttemptAt: '2026-07-27T05:00:00.000Z',
          lastSuccessAt: '2026-07-27T05:00:00.000Z',
          lastBytes: 100,
        },
      },
    };
    expect(listDueProfileWorkflowRuleSourceUpdates(state, '2026-07-27T05:59:59.000Z')).toEqual([]);
    expect(
      listDueProfileWorkflowRuleSourceUpdates(state, '2026-07-27T06:00:00.000Z').map(
        (source) => source.sourceId,
      ),
    ).toEqual(['source-due']);
  });

  it('treats a changed URL as a fresh source due immediately', () => {
    const state = {
      ...stateWithRemoteSource(),
      ruleSourceUpdates: {
        'source-due': {
          sourceId: 'source-due',
          url: 'https://rules.example.invalid/old.txt',
          lastAttemptAt: '2026-07-27T05:59:00.000Z',
          lastSuccessAt: '2026-07-27T05:59:00.000Z',
        },
      },
    };
    expect(
      listDueProfileWorkflowRuleSourceUpdates(state, '2026-07-27T06:00:00.000Z').map(
        (source) => source.sourceId,
      ),
    ).toEqual(['source-due']);
  });
});
