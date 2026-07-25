import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type {
  Condition,
  ProfileRouteTarget,
  ProfileSpec,
  RuleListProfile,
  RuleSource,
} from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { evaluateProfileGraph } from './graph.js';
import { evaluateRuleListProfile, parseRuleList } from './rule-list.js';
import type { ReferenceRequest, RuleListPriorityGroup } from './types.js';

interface RuleListVector {
  readonly id: string;
  readonly fixtureProfileName: string;
  readonly sourceLine: string;
  readonly request: ReferenceRequest;
  readonly expected: {
    readonly parsedConditionType: string;
    readonly parsedPattern: string;
    readonly selectedProfileName: string;
    readonly priorityGroup: RuleListPriorityGroup;
    readonly note?: string;
  };
  readonly support: 'exact' | 'target-dependent';
}

interface RuleListVectorFile {
  readonly vectors: readonly RuleListVector[];
}

const ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-07-25T04:30:00.000Z',
  documentId: 'document-rule-list-vector',
  revisionId: 'revision-rule-list-vector',
} as const;

function legacyConditionType(condition: Condition): string {
  switch (condition.kind) {
    case 'true':
      return 'TrueCondition';
    case 'false':
      return 'FalseCondition';
    case 'url-regex':
      return 'UrlRegexCondition';
    case 'url-wildcard':
      return 'UrlWildcardCondition';
    case 'host-regex':
      return 'HostRegexCondition';
    case 'host-wildcard':
      return 'HostWildcardCondition';
    case 'bypass':
      return 'BypassCondition';
    case 'keyword':
      return 'KeywordCondition';
    case 'ip':
      return 'IpCondition';
    case 'host-levels':
      return 'HostLevelsCondition';
    case 'weekday':
      return 'WeekdayCondition';
    case 'time':
      return 'TimeCondition';
  }
}

function conditionPattern(condition: Condition): string {
  switch (condition.kind) {
    case 'url-regex':
    case 'url-wildcard':
    case 'host-regex':
    case 'host-wildcard':
    case 'bypass':
    case 'keyword':
      return condition.pattern;
    case 'ip':
      return condition.address;
    case 'true':
    case 'false':
    case 'host-levels':
    case 'weekday':
    case 'time':
      return '';
  }
}

function routeName(spec: ProfileSpec, route: ProfileRouteTarget): string {
  if (route.kind !== 'profile') return route.kind;
  const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
  if (!profile) throw new Error(`missing profile ${route.profileId}`);
  return profile.name;
}

function findProfileAndSource(
  spec: ProfileSpec,
  profileName: string,
): { profile: RuleListProfile; source: RuleSource } {
  const profile = spec.profiles.find((candidate) => candidate.name === profileName);
  if (!profile || profile.kind !== 'rule-list') {
    throw new Error(`missing rule-list profile ${profileName}`);
  }
  const source = spec.ruleSources.find((candidate) => candidate.id === profile.sourceId);
  if (!source) throw new Error(`missing source ${profile.sourceId}`);
  return { profile, source };
}

async function fixtureSpec(): Promise<ProfileSpec> {
  const source = await readFile(new URL('rule-list-formats.json', ROOT), 'utf8');
  const imported = importZeroOmegaBackup(source, context);
  if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));
  return imported.candidate;
}

async function vectors(): Promise<RuleListVectorFile> {
  return JSON.parse(
    await readFile(new URL('vectors/rule-list-decisions.json', ROOT), 'utf8'),
  ) as RuleListVectorFile;
}

describe('rule-list oracle vectors', () => {
  it('parses every committed source line with the pinned condition and priority semantics', async () => {
    const spec = await fixtureSpec();
    const oracle = await vectors();

    for (const vector of oracle.vectors) {
      const { profile, source } = findProfileAndSource(spec, vector.fixtureProfileName);
      const parsed = parseRuleList(spec, profile, source);
      expect(parsed.ok, vector.id).toBe(true);
      if (!parsed.ok) throw new Error(parsed.issues.join('; '));
      const rule = parsed.rules.find((candidate) => candidate.sourceLine === vector.sourceLine);
      expect(rule, vector.id).toBeDefined();
      if (!rule) throw new Error(`missing parsed rule for ${vector.id}`);
      expect(legacyConditionType(rule.condition), vector.id).toBe(
        vector.expected.parsedConditionType,
      );
      expect(conditionPattern(rule.condition), vector.id).toBe(vector.expected.parsedPattern);
      expect(rule.priorityGroup, vector.id).toBe(vector.expected.priorityGroup);
      if (vector.expected.note !== undefined) {
        expect(rule.note, vector.id).toBe(vector.expected.note);
      }
    }
  });

  it('selects the expected profile for every committed rule-list decision', async () => {
    const spec = await fixtureSpec();
    const oracle = await vectors();

    for (const vector of oracle.vectors) {
      const { profile, source } = findProfileAndSource(spec, vector.fixtureProfileName);
      const decision = evaluateRuleListProfile(spec, profile, source, vector.request);
      expect(decision.status, vector.id).toBe('selected');
      if (decision.status !== 'selected') throw new Error(decision.reason);
      expect(routeName(spec, decision.route), vector.id).toBe(vector.expected.selectedProfileName);
      expect(decision.support, vector.id).toBe(vector.support);
    }
  });

  it('resolves every rule-list vector through the complete profile graph', async () => {
    const spec = await fixtureSpec();
    const oracle = await vectors();

    for (const vector of oracle.vectors) {
      const { profile } = findProfileAndSource(spec, vector.fixtureProfileName);
      const decision = evaluateProfileGraph(
        spec,
        { kind: 'profile', profileId: profile.id },
        vector.request,
      );
      expect(decision.status, vector.id).toBe('resolved');
      if (decision.status !== 'resolved') throw new Error(decision.reason);
      expect(decision.support, vector.id).toBe(vector.support);
      if (vector.expected.selectedProfileName === 'direct') {
        expect(decision.route, vector.id).toEqual({ kind: 'direct' });
      } else {
        expect(decision.route.kind, vector.id).toBe('proxy');
        if (decision.route.kind !== 'proxy') throw new Error(`expected proxy for ${vector.id}`);
        expect(decision.route.endpoint.host, vector.id).toBe('proxy.example.invalid');
        expect(decision.route.endpoint.port, vector.id).toBe(8080);
      }
    }
  });

  it('keeps AutoProxy exclusive rules ahead of normal rules and Switchy modern rules ordered', async () => {
    const spec = await fixtureSpec();
    const autoProxy = findProfileAndSource(spec, 'autoproxy-plain');
    const parsedAutoProxy = parseRuleList(spec, autoProxy.profile, autoProxy.source);
    if (!parsedAutoProxy.ok) throw new Error(parsedAutoProxy.issues.join('; '));
    expect(parsedAutoProxy.rules[0]?.priorityGroup).toBe('exclusive');
    expect(parsedAutoProxy.rules.slice(1).every((rule) => rule.priorityGroup === 'normal')).toBe(
      true,
    );

    const switchy = findProfileAndSource(spec, 'switchy-modern');
    const parsedSwitchy = parseRuleList(spec, switchy.profile, switchy.source);
    if (!parsedSwitchy.ok) throw new Error(parsedSwitchy.issues.join('; '));
    expect(parsedSwitchy.rules.every((rule) => rule.priorityGroup === 'ordered')).toBe(true);
    expect(parsedSwitchy.rules.map((rule) => rule.sourceLine)).toEqual([
      '*.example.invalid +fixed',
      '!*.excluded.example.invalid +direct',
      '* +direct',
    ]);
  });
});
