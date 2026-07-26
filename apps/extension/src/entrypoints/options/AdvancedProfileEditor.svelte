<script lang="ts">
  import {
    cloneProfileSpec,
    type AutoDetectProfile,
    type PacProfile,
    type ProfileRouteTarget,
    type ProfileSpec,
    type RuleListFormat,
    type RuleListProfile,
    type RuleSource,
    type RuleSourceHeader,
    type UserProfile,
  } from '@zeroomega-nex/profile-spec';

  export let spec: ProfileSpec;
  export let profileId: string;
  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;

  type AdvancedProfile = RuleListProfile | PacProfile | AutoDetectProfile;

  let profile: AdvancedProfile | undefined;
  let ruleSource: RuleSource | undefined;
  let routeProfiles: readonly UserProfile[] = [];
  $: profile = spec.profiles.find(
    (candidate): candidate is AdvancedProfile =>
      candidate.id === profileId &&
      (candidate.kind === 'rule-list' ||
        candidate.kind === 'pac' ||
        candidate.kind === 'auto-detect'),
  );
  $: ruleSource =
    profile?.kind === 'rule-list'
      ? spec.ruleSources.find((source) => source.id === profile?.sourceId)
      : undefined;
  $: routeProfiles = spec.profiles.filter((candidate) => candidate.id !== profileId);

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  function routeValue(route: ProfileRouteTarget | undefined): string {
    if (route === undefined) return '';
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function parseRoute(value: string): ProfileRouteTarget | undefined {
    if (value === '') return undefined;
    if (value === 'direct' || value === 'system') return { kind: value };
    return value.startsWith('profile:')
      ? { kind: 'profile', profileId: value.slice('profile:'.length) }
      : undefined;
  }

  async function mutateProfile(update: (target: AdvancedProfile, draft: ProfileSpec) => void) {
    const draft = cloneProfileSpec(spec);
    const target = draft.profiles.find(
      (candidate): candidate is AdvancedProfile =>
        candidate.id === profileId &&
        (candidate.kind === 'rule-list' ||
          candidate.kind === 'pac' ||
          candidate.kind === 'auto-detect'),
    );
    if (!target) return;
    update(target, draft);
    await onReplaceDraft(draft);
  }

  async function mutateRuleSource(update: (target: RuleSource) => void) {
    if (!ruleSource) return;
    const sourceId = ruleSource.id;
    const draft = cloneProfileSpec(spec);
    const target = draft.ruleSources.find((source) => source.id === sourceId);
    if (!target) return;
    update(target);
    await onReplaceDraft(draft);
  }

  async function updateRoute(
    field: 'matchRoute' | 'defaultRoute' | 'fallbackRoute',
    value: string,
  ) {
    const route = parseRoute(value);
    await mutateProfile((target) => {
      if (target.kind === 'rule-list' && (field === 'matchRoute' || field === 'defaultRoute')) {
        if (route) target[field] = route;
        return;
      }
      if ((target.kind === 'pac' || target.kind === 'auto-detect') && field === 'fallbackRoute') {
        if (route) target.fallbackRoute = route;
        else delete target.fallbackRoute;
      }
    });
  }

  async function updateRuleSourceName(name: string) {
    await mutateRuleSource((target) => {
      target.name = name.trim();
    });
  }

  async function updateRuleSourceFormat(format: RuleListFormat) {
    await mutateRuleSource((target) => {
      target.format = format;
    });
  }

  async function updateRuleSourceKind(kind: 'inline' | 'url') {
    await mutateRuleSource((target) => {
      target.location =
        kind === 'inline' ? { kind: 'inline', content: '' } : { kind: 'url', url: '' };
    });
  }

  async function updateRuleSourceLocation(value: string) {
    await mutateRuleSource((target) => {
      target.location =
        target.location.kind === 'inline'
          ? { kind: 'inline', content: value }
          : { kind: 'url', url: value.trim() };
    });
  }

  async function updateRuleSourceInterval(value: string) {
    const interval = Number(value);
    if (!Number.isInteger(interval) || interval < 1) return;
    await mutateRuleSource((target) => {
      target.updateIntervalMinutes = interval;
    });
  }

  async function updatePacSourceKind(kind: 'inline' | 'url') {
    await mutateProfile((target) => {
      if (target.kind !== 'pac') return;
      target.source = kind === 'inline' ? { kind: 'inline', script: '' } : { kind: 'url', url: '' };
    });
  }

  async function updatePacSource(value: string) {
    await mutateProfile((target) => {
      if (target.kind !== 'pac') return;
      target.source =
        target.source.kind === 'inline'
          ? { kind: 'inline', script: value }
          : { kind: 'url', url: value.trim() };
    });
  }

  function headersFor(current: AdvancedProfile | undefined): readonly RuleSourceHeader[] {
    if (current?.kind === 'pac') return current.headers ?? [];
    if (current?.kind === 'rule-list') return ruleSource?.headers ?? [];
    return [];
  }

  async function mutateHeaders(update: (headers: RuleSourceHeader[]) => void) {
    if (profile?.kind === 'rule-list') {
      await mutateRuleSource((target) => {
        const headers = structuredClone(target.headers ?? []);
        update(headers);
        if (headers.length === 0) delete target.headers;
        else target.headers = headers;
      });
      return;
    }
    await mutateProfile((target) => {
      if (target.kind !== 'pac') return;
      const headers = structuredClone(target.headers ?? []);
      update(headers);
      if (headers.length === 0) delete target.headers;
      else target.headers = headers;
    });
  }

  async function addHeader() {
    await mutateHeaders((headers) => {
      headers.push({
        name: '',
        value: { kind: 'literal', value: '' },
      });
    });
  }

  async function updateHeaderName(index: number, name: string) {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (header) header.name = name.trim();
    });
  }

  async function updateHeaderKind(index: number, kind: 'literal' | 'secret') {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        kind === 'literal'
          ? { kind: 'literal', value: '' }
          : { kind: 'secret', secretRef: `secret-header-${crypto.randomUUID()}` };
    });
  }

  async function updateHeaderValue(index: number, value: string) {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        header.value.kind === 'literal'
          ? { kind: 'literal', value }
          : { kind: 'secret', secretRef: value.trim() };
    });
  }

  async function removeHeader(index: number) {
    await mutateHeaders((headers) => {
      headers.splice(index, 1);
    });
  }
</script>

{#if profile?.kind === 'rule-list' && ruleSource}
  <section class="settings-section">
    <h2>Rule source</h2>
    <p class="section-help">
      The source definition is saved in Draft. Network updates remain separate from activation.
    </p>
    <label>
      Source name
      <input
        value={ruleSource.name}
        {disabled}
        on:change={(event) => updateRuleSourceName(valueFrom(event))}
      />
    </label>
    <label>
      Format
      <select
        value={ruleSource.format}
        {disabled}
        on:change={(event) => updateRuleSourceFormat(valueFrom(event) as RuleListFormat)}
      >
        <option value="autoproxy">AutoProxy</option>
        <option value="switchy">Switchy</option>
      </select>
    </label>
    <label>
      Location
      <select
        value={ruleSource.location.kind}
        {disabled}
        on:change={(event) => updateRuleSourceKind(valueFrom(event) as 'inline' | 'url')}
      >
        <option value="inline">Inline</option>
        <option value="url">URL</option>
      </select>
    </label>
    {#if ruleSource.location.kind === 'inline'}
      <textarea
        aria-label="Inline rule source"
        rows="10"
        value={ruleSource.location.content}
        {disabled}
        on:change={(event) => updateRuleSourceLocation(valueFrom(event))}></textarea>
    {:else}
      <input
        aria-label="Rule source URL"
        value={ruleSource.location.url}
        {disabled}
        on:change={(event) => updateRuleSourceLocation(valueFrom(event))}
      />
    {/if}
    <label>
      Update interval (minutes)
      <input
        type="number"
        min="1"
        value={ruleSource.updateIntervalMinutes ?? spec.settings.ruleSourceUpdateIntervalMinutes}
        {disabled}
        on:change={(event) => updateRuleSourceInterval(valueFrom(event))}
      />
    </label>
  </section>

  <section class="settings-section">
    <h2>Routing</h2>
    <label>
      Matching rules use
      <select
        value={routeValue(profile.matchRoute)}
        {disabled}
        on:change={(event) => updateRoute('matchRoute', valueFrom(event))}
      >
        <option value="direct">Direct</option>
        <option value="system">System Proxy</option>
        {#each routeProfiles as target (target.id)}
          <option value={`profile:${target.id}`}>{target.name}</option>
        {/each}
      </select>
    </label>
    <label>
      Default route
      <select
        value={routeValue(profile.defaultRoute)}
        {disabled}
        on:change={(event) => updateRoute('defaultRoute', valueFrom(event))}
      >
        <option value="direct">Direct</option>
        <option value="system">System Proxy</option>
        {#each routeProfiles as target (target.id)}
          <option value={`profile:${target.id}`}>{target.name}</option>
        {/each}
      </select>
    </label>
  </section>
{:else if profile?.kind === 'pac'}
  <section class="settings-section">
    <h2>PAC source</h2>
    <p class="section-help">
      Arbitrary PAC code is preserved, but it is outside the deterministic compiler path and remains
      target-dependent.
    </p>
    <label>
      Source
      <select
        value={profile.source.kind}
        {disabled}
        on:change={(event) => updatePacSourceKind(valueFrom(event) as 'inline' | 'url')}
      >
        <option value="inline">Inline</option>
        <option value="url">URL</option>
      </select>
    </label>
    {#if profile.source.kind === 'inline'}
      <textarea
        aria-label="Inline PAC script"
        rows="12"
        value={profile.source.script}
        {disabled}
        on:change={(event) => updatePacSource(valueFrom(event))}></textarea>
    {:else}
      <input
        aria-label="PAC URL"
        value={profile.source.url}
        {disabled}
        on:change={(event) => updatePacSource(valueFrom(event))}
      />
    {/if}
    <label>
      Fallback route
      <select
        value={routeValue(profile.fallbackRoute)}
        {disabled}
        on:change={(event) => updateRoute('fallbackRoute', valueFrom(event))}
      >
        <option value="">No fallback</option>
        <option value="direct">Direct</option>
        <option value="system">System Proxy</option>
        {#each routeProfiles as target (target.id)}
          <option value={`profile:${target.id}`}>{target.name}</option>
        {/each}
      </select>
    </label>
  </section>
{:else if profile?.kind === 'auto-detect'}
  <section class="settings-section">
    <h2>Auto Detect</h2>
    <p class="section-help">
      Browser auto-detection support is target-dependent. Configure an explicit fallback for
      deterministic failure handling.
    </p>
    <label>
      Fallback route
      <select
        value={routeValue(profile.fallbackRoute)}
        {disabled}
        on:change={(event) => updateRoute('fallbackRoute', valueFrom(event))}
      >
        <option value="">No fallback</option>
        <option value="direct">Direct</option>
        <option value="system">System Proxy</option>
        {#each routeProfiles as target (target.id)}
          <option value={`profile:${target.id}`}>{target.name}</option>
        {/each}
      </select>
    </label>
  </section>
{/if}

{#if profile?.kind === 'rule-list' || profile?.kind === 'pac'}
  <section class="settings-section">
    <h2>Request headers</h2>
    <p class="section-help">
      Sensitive values must use secret references. Secret values are never stored in ProfileSpec.
    </p>
    {#each headersFor(profile) as header, index (`${header.name}:${index}`)}
      <div>
        <input
          aria-label={`Header ${index + 1} name`}
          value={header.name}
          {disabled}
          on:change={(event) => updateHeaderName(index, valueFrom(event))}
        />
        <select
          aria-label={`Header ${index + 1} value type`}
          value={header.value.kind}
          {disabled}
          on:change={(event) => updateHeaderKind(index, valueFrom(event) as 'literal' | 'secret')}
        >
          <option value="literal">Literal</option>
          <option value="secret">Secret reference</option>
        </select>
        <input
          aria-label={`Header ${index + 1} ${header.value.kind === 'literal' ? 'value' : 'secret reference'}`}
          value={header.value.kind === 'literal' ? header.value.value : header.value.secretRef}
          {disabled}
          on:change={(event) => updateHeaderValue(index, valueFrom(event))}
        />
        <button type="button" {disabled} on:click={() => removeHeader(index)}>Remove</button>
      </div>
    {/each}
    <button type="button" {disabled} on:click={addHeader}>Add header</button>
  </section>
{/if}
