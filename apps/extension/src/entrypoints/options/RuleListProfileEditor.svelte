<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type ProfileRouteTarget,
    type ProfileSpec,
    type RuleListFormat,
    type RuleListProfile,
    type RuleSource,
    type RuleSourceHeader,
    type UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    attachedRuleListProfileIds,
    type ProfileWorkflowRuleSourceUpdateView,
  } from '@zeroomega-nex/profile-workflow';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiMessage, uiText } from '../../lib/ui-messages';

  export let spec: ProfileSpec;
  export let profileId: string;
  export let locale: AppLocale = currentAppLocale();
  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onGetRuleSourceUpdateStatus: (
    sourceId: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;
  export let onUpdateRuleSource: (
    sourceId: string,
    url: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;

  let profile: RuleListProfile | undefined;
  let source: RuleSource | undefined;
  let routeProfiles: readonly UserProfile[] = [];
  let updateView: ProfileWorkflowRuleSourceUpdateView | undefined;
  let updateLoading = false;
  let loadedUpdateKey = '';

  $: profile = spec.profiles.find(
    (candidate): candidate is RuleListProfile =>
      candidate.id === profileId && candidate.kind === 'rule-list',
  );
  $: source = profile
    ? spec.ruleSources.find((candidate) => candidate.id === profile?.sourceId)
    : undefined;
  $: {
    const hiddenProfileIds = attachedRuleListProfileIds(spec);
    routeProfiles = spec.profiles.filter(
      (candidate) => candidate.id !== profileId && !hiddenProfileIds.has(candidate.id),
    );
  }
  $: {
    const key = source?.location.kind === 'url' ? `${source.id}:${source.location.url}` : '';
    if (key !== loadedUpdateKey) {
      loadedUpdateKey = key;
      updateView = undefined;
      if (source?.location.kind === 'url' && source.location.url) {
        void loadUpdateStatus(source.id);
      }
    }
  }

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  function routeValue(route: ProfileRouteTarget): string {
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function parseRoute(value: string): ProfileRouteTarget | undefined {
    if (value === 'direct' || value === 'system') return { kind: value };
    return value.startsWith('profile:')
      ? { kind: 'profile', profileId: value.slice('profile:'.length) }
      : undefined;
  }

  async function mutateProfile(update: (target: RuleListProfile) => void): Promise<void> {
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is RuleListProfile =>
        candidate.id === profileId && candidate.kind === 'rule-list',
    );
    if (!target) return;
    update(target);
    await onReplaceDraft(draft);
  }

  async function mutateSource(update: (target: RuleSource) => void): Promise<void> {
    if (!source) return;
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.ruleSources.find((candidate) => candidate.id === source?.id);
    if (!target) return;
    update(target);
    await onReplaceDraft(draft);
  }

  async function updateRoute(field: 'matchRoute' | 'defaultRoute', value: string): Promise<void> {
    const route = parseRoute(value);
    if (!route) return;
    await mutateProfile((target) => {
      target[field] = route;
    });
  }

  async function updateFormat(format: RuleListFormat): Promise<void> {
    await mutateSource((target) => {
      target.format = format;
    });
  }

  async function updateUrl(value: string): Promise<void> {
    const url = value.trim();
    await mutateSource((target) => {
      const content = target.location.content ?? '';
      target.location = url
        ? { kind: 'url', url, ...(content ? { content } : {}) }
        : { kind: 'inline', content };
    });
  }

  async function clearUrl(): Promise<void> {
    await updateUrl('');
  }

  async function updateRuleListText(content: string): Promise<void> {
    await mutateSource((target) => {
      if (target.location.kind !== 'inline') return;
      target.location.content = content;
    });
  }

  async function loadUpdateStatus(sourceId: string): Promise<void> {
    updateView = await onGetRuleSourceUpdateStatus(sourceId);
  }

  async function downloadNow(): Promise<void> {
    if (!source || source.location.kind !== 'url' || !source.location.url || updateLoading) return;
    updateLoading = true;
    try {
      const updated = await onUpdateRuleSource(source.id, source.location.url);
      if (updated) updateView = updated;
    } finally {
      updateLoading = false;
    }
  }

  function formatTimestamp(value: string | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString(locale);
  }

  function updateSummary(view: ProfileWorkflowRuleSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return uiText('ruleList.neverDownloaded', locale);
    if (view.lastError) {
      return uiMessage(
        'ruleList.updateFailed',
        { timestamp: formatTimestamp(view.lastError.occurredAt) },
        locale,
      );
    }
    return uiMessage(
      'ruleList.lastUpdated',
      {
        timestamp: formatTimestamp(view.lastSuccessAt),
        ...(view.lastBytes === undefined ? {} : { bytes: view.lastBytes }),
        stale: view.stale,
      },
      locale,
    );
  }

  async function mutateHeaders(update: (headers: RuleSourceHeader[]) => void): Promise<void> {
    await mutateSource((target) => {
      const headers = structuredClone(target.headers ?? []);
      update(headers);
      if (headers.length === 0) delete target.headers;
      else target.headers = headers;
    });
  }

  async function addHeader(): Promise<void> {
    await mutateHeaders((headers) => {
      headers.push({ name: '', value: { kind: 'literal', value: '' } });
    });
  }

  async function updateHeaderName(index: number, name: string): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (header) header.name = name.trim();
    });
  }

  async function updateHeaderKind(index: number, kind: 'literal' | 'secret'): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        kind === 'literal'
          ? { kind: 'literal', value: '' }
          : { kind: 'secret', secretRef: `secret-header-${crypto.randomUUID()}` };
    });
  }

  async function updateHeaderValue(index: number, value: string): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        header.value.kind === 'literal'
          ? { kind: 'literal', value }
          : { kind: 'secret', secretRef: value.trim() };
    });
  }

  async function removeHeader(index: number): Promise<void> {
    await mutateHeaders((headers) => headers.splice(index, 1));
  }
</script>

{#if profile && source}
  <div data-rule-list-profile-editor data-typed-locale={locale}>
    <section class="settings-section" data-rule-list-config>
      <h2>{uiText('ruleList.config', locale)}</h2>
      <div class="inline-fields">
        <label>
          {uiText('ruleList.matchProfile', locale)}
          <select
            aria-label={uiText('ruleList.matchProfileAria', locale)}
            value={routeValue(profile.matchRoute)}
            {disabled}
            onchange={(event) => updateRoute('matchRoute', valueFrom(event))}
          >
            <option value="direct">{uiText('route.direct', locale)}</option>
            <option value="system">{uiText('route.system', locale)}</option>
            {#each routeProfiles as target (target.id)}
              <option value={`profile:${target.id}`}>{target.name}</option>
            {/each}
          </select>
        </label>
        <label>
          {uiText('ruleList.defaultProfile', locale)}
          <select
            aria-label={uiText('ruleList.defaultProfileAria', locale)}
            value={routeValue(profile.defaultRoute)}
            {disabled}
            onchange={(event) => updateRoute('defaultRoute', valueFrom(event))}
          >
            <option value="direct">{uiText('route.direct', locale)}</option>
            <option value="system">{uiText('route.system', locale)}</option>
            {#each routeProfiles as target (target.id)}
              <option value={`profile:${target.id}`}>{target.name}</option>
            {/each}
          </select>
        </label>
      </div>
      <fieldset {disabled}>
        <legend>{uiText('ruleList.format', locale)}</legend>
        <label class="radio-row">
          <input
            type="radio"
            name={`rule-list-format-${profile.id}`}
            value="autoproxy"
            checked={source.format === 'autoproxy'}
            onchange={() => updateFormat('autoproxy')}
          />
          AutoProxy
        </label>
        <label class="radio-row">
          <input
            type="radio"
            name={`rule-list-format-${profile.id}`}
            value="switchy"
            checked={source.format === 'switchy'}
            onchange={() => updateFormat('switchy')}
          />
          Switchy
        </label>
      </fieldset>
    </section>

    <section class="settings-section" data-rule-list-url-section>
      <h2>{uiText('ruleList.url', locale)}</h2>
      <div class="url-row">
        <input
          type="url"
          aria-label={uiText('ruleList.url', locale)}
          value={source.location.kind === 'url' ? source.location.url : ''}
          placeholder="https://example.com/rules.txt"
          {disabled}
          onchange={(event) => updateUrl(valueFrom(event))}
        />
        <button
          type="button"
          aria-label={uiText('ruleList.clearUrl', locale)}
          disabled={disabled || source.location.kind !== 'url'}
          onclick={clearUrl}>{uiText('ruleList.clear', locale)}</button
        >
      </div>
      <p class="section-help">
        {uiText('ruleList.urlHelp', locale)}
      </p>
      {#if source.location.kind === 'url'}
        <details open={(source.headers?.length ?? 0) > 0} data-rule-list-request-headers>
          <summary>{uiText('ruleList.requestHeaders', locale)}</summary>
          <p class="section-help">
            {uiText('ruleList.headersHelp', locale)}
          </p>
          {#each source.headers ?? [] as header, index (`${header.name}:${index}`)}
            <div class="header-row">
              <input
                aria-label={uiMessage(
                  'ruleList.headerAria',
                  { scope: 'independent', index: index + 1, field: 'name' },
                  locale,
                )}
                value={header.name}
                {disabled}
                onchange={(event) => updateHeaderName(index, valueFrom(event))}
              />
              <select
                aria-label={uiMessage(
                  'ruleList.headerAria',
                  { scope: 'independent', index: index + 1, field: 'type' },
                  locale,
                )}
                value={header.value.kind}
                {disabled}
                onchange={(event) =>
                  updateHeaderKind(index, valueFrom(event) as 'literal' | 'secret')}
              >
                <option value="literal">{uiText('ruleList.literal', locale)}</option>
                <option value="secret">{uiText('ruleList.secretReference', locale)}</option>
              </select>
              <input
                aria-label={uiMessage(
                  'ruleList.headerAria',
                  { scope: 'independent', index: index + 1, field: 'value' },
                  locale,
                )}
                value={header.value.kind === 'literal'
                  ? header.value.value
                  : header.value.secretRef}
                {disabled}
                onchange={(event) => updateHeaderValue(index, valueFrom(event))}
              />
              <button type="button" {disabled} onclick={() => removeHeader(index)}
                >{uiText('ruleList.removeHeader', locale)}</button
              >
            </div>
          {/each}
          <button type="button" {disabled} onclick={addHeader}
            >{uiText('ruleList.addHeader', locale)}</button
          >
        </details>
      {/if}
    </section>

    <section class="settings-section" data-rule-list-text-section>
      <h2>{uiText('ruleList.text', locale)}</h2>
      <div class="download-row">
        <button
          type="button"
          data-independent-rule-source-update-now
          disabled={disabled ||
            updateLoading ||
            source.location.kind !== 'url' ||
            !source.location.url}
          onclick={downloadNow}
        >
          {updateLoading
            ? uiText('ruleList.downloading', locale)
            : uiText('ruleList.downloadNow', locale)}
        </button>
        {#if source.location.kind === 'url'}
          <p
            class:stale={updateView?.stale}
            role="status"
            data-independent-rule-source-update-status
          >
            {updateSummary(updateView)}
          </p>
        {/if}
      </div>
      {#if updateView?.lastError}
        <p class="source-update-error" role="alert">{uiText('ruleList.updateError', locale)}</p>
      {/if}
      <textarea
        class="monospace"
        aria-label={uiText('ruleList.textAria', locale)}
        rows="20"
        readonly={source.location.kind === 'url'}
        value={source.location.content ?? ''}
        {disabled}
        onchange={(event) => updateRuleListText(valueFrom(event))}></textarea>
    </section>
  </div>
{/if}

<style>
  .inline-fields,
  .url-row,
  .download-row {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .inline-fields label {
    min-width: 15rem;
  }

  fieldset {
    margin: 1rem 0 0;
    border: 0;
    padding: 0;
  }

  legend {
    margin-bottom: 0.4rem;
    font-weight: 600;
  }

  .radio-row {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-right: 1rem;
  }

  .radio-row input {
    width: auto;
  }

  .url-row input {
    min-width: min(100%, 36rem);
    flex: 1;
  }

  .download-row {
    margin-bottom: 0.6rem;
  }

  .download-row p {
    margin: 0;
  }

  .stale,
  .source-update-error {
    color: var(--danger-text, #b3261e);
  }

  .header-row {
    display: grid;
    grid-template-columns: minmax(10rem, 0.8fr) minmax(9rem, 0.45fr) minmax(13rem, 1fr) auto;
    gap: 0.45rem;
    margin-bottom: 0.45rem;
  }

  textarea.monospace {
    width: min(100%, 900px);
    min-height: 22rem;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }
</style>
