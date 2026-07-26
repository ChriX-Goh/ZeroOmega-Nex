<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type ProfileSpec,
    type RuleListFormat,
    type RuleSource,
    type RuleSourceHeader,
  } from '@zeroomega-nex/profile-spec';
  import { inspectAttachedRuleList } from '@zeroomega-nex/profile-workflow';

  export let spec: ProfileSpec;
  export let switchProfileId: string;
  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;

  let state = inspectAttachedRuleList(spec, switchProfileId);
  $: state = inspectAttachedRuleList(spec, switchProfileId);

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  async function mutateSource(update: (source: RuleSource) => void): Promise<void> {
    const current = inspectAttachedRuleList(spec, switchProfileId);
    if (!current) return;
    const draft = cloneProfileSpecDraft(spec);
    const source = draft.ruleSources.find((candidate) => candidate.id === current.source.id);
    if (!source) return;
    update(source);
    await onReplaceDraft(draft);
  }

  async function updateFormat(format: RuleListFormat): Promise<void> {
    await mutateSource((source) => {
      source.format = format;
    });
  }

  async function updateLocationKind(kind: 'inline' | 'url'): Promise<void> {
    await mutateSource((source) => {
      const content = source.location.content ?? '';
      source.location =
        kind === 'inline'
          ? { kind: 'inline', content }
          : {
              kind: 'url',
              url: source.location.kind === 'url' ? source.location.url : '',
              ...(content ? { content } : {}),
            };
    });
  }

  async function updateUrl(url: string): Promise<void> {
    await mutateSource((source) => {
      if (source.location.kind !== 'url') return;
      source.location.url = url.trim();
    });
  }

  async function updateInlineContent(content: string): Promise<void> {
    await mutateSource((source) => {
      if (source.location.kind !== 'inline') return;
      source.location.content = content;
    });
  }

  async function updateInterval(value: string): Promise<void> {
    const interval = Number(value);
    if (!Number.isInteger(interval) || interval < 1) return;
    await mutateSource((source) => {
      source.updateIntervalMinutes = interval;
    });
  }

  function headers(): readonly RuleSourceHeader[] {
    return state?.source.headers ?? [];
  }

  async function mutateHeaders(update: (headers: RuleSourceHeader[]) => void): Promise<void> {
    await mutateSource((source) => {
      const next = structuredClone(source.headers ?? []);
      update(next);
      if (next.length === 0) delete source.headers;
      else source.headers = next;
    });
  }

  async function addHeader(): Promise<void> {
    await mutateHeaders((items) => {
      items.push({ name: '', value: { kind: 'literal', value: '' } });
    });
  }

  async function updateHeaderName(index: number, name: string): Promise<void> {
    await mutateHeaders((items) => {
      const header = items[index];
      if (header) header.name = name.trim();
    });
  }

  async function updateHeaderKind(index: number, kind: 'literal' | 'secret'): Promise<void> {
    await mutateHeaders((items) => {
      const header = items[index];
      if (!header) return;
      header.value =
        kind === 'literal'
          ? { kind: 'literal', value: '' }
          : { kind: 'secret', secretRef: `secret-header-${crypto.randomUUID()}` };
    });
  }

  async function updateHeaderValue(index: number, value: string): Promise<void> {
    await mutateHeaders((items) => {
      const header = items[index];
      if (!header) return;
      header.value =
        header.value.kind === 'literal'
          ? { kind: 'literal', value }
          : { kind: 'secret', secretRef: value.trim() };
    });
  }

  async function removeHeader(index: number): Promise<void> {
    await mutateHeaders((items) => items.splice(index, 1));
  }
</script>

{#if state}
  <section class="settings-section attached-rule-list-config" data-attached-rule-list-config>
    <h2>Attached Rule List configuration</h2>
    <p class="section-help">
      The attached profile remains hidden from normal navigation and participates only through this
      Switch Profile.
    </p>

    <fieldset {disabled}>
      <legend>Format</legend>
      <label class="radio-row">
        <input
          type="radio"
          name={`attached-format-${switchProfileId}`}
          value="switchy"
          checked={state.source.format === 'switchy'}
          on:change={() => updateFormat('switchy')}
        />
        Switchy
      </label>
      <label class="radio-row">
        <input
          type="radio"
          name={`attached-format-${switchProfileId}`}
          value="autoproxy"
          checked={state.source.format === 'autoproxy'}
          on:change={() => updateFormat('autoproxy')}
        />
        AutoProxy
      </label>
    </fieldset>

    <label>
      Source type
      <select
        aria-label="Attached Rule List source type"
        value={state.source.location.kind}
        {disabled}
        on:change={(event) => updateLocationKind(valueFrom(event) as 'inline' | 'url')}
      >
        <option value="inline">Inline text</option>
        <option value="url">URL</option>
      </select>
    </label>

    {#if state.source.location.kind === 'url'}
      <label>
        Rule List URL
        <input
          type="url"
          aria-label="Attached Rule List URL"
          value={state.source.location.url}
          placeholder="https://example.com/rules.txt"
          {disabled}
          on:change={(event) => updateUrl(valueFrom(event))}
        />
      </label>
      <p class="section-help">
        URL content is read-only after download. Network download and update status are handled by a
        separate background service slice.
      </p>
      <textarea
        aria-label="Attached Rule List downloaded text"
        rows="16"
        readonly
        value={state.source.location.content ?? ''}></textarea>
    {:else}
      <label>
        Rule List text
        <textarea
          aria-label="Attached Rule List text"
          rows="16"
          value={state.source.location.content}
          {disabled}
          on:change={(event) => updateInlineContent(valueFrom(event))}></textarea>
      </label>
    {/if}

    <label>
      Update interval (minutes)
      <input
        type="number"
        min="1"
        value={state.source.updateIntervalMinutes ?? spec.settings.ruleSourceUpdateIntervalMinutes}
        {disabled}
        on:change={(event) => updateInterval(valueFrom(event))}
      />
    </label>
  </section>

  <section class="settings-section" data-attached-rule-list-headers>
    <details open={headers().length > 0}>
      <summary>Request headers</summary>
      <p class="section-help">
        Sensitive values must use secret references; raw secret values never enter ProfileSpec.
      </p>
      {#each headers() as header, index (`${header.name}:${index}`)}
        <div class="header-row">
          <input
            aria-label={`Attached header ${index + 1} name`}
            value={header.name}
            {disabled}
            on:change={(event) => updateHeaderName(index, valueFrom(event))}
          />
          <select
            aria-label={`Attached header ${index + 1} value type`}
            value={header.value.kind}
            {disabled}
            on:change={(event) => updateHeaderKind(index, valueFrom(event) as 'literal' | 'secret')}
          >
            <option value="literal">Literal</option>
            <option value="secret">Secret reference</option>
          </select>
          <input
            aria-label={`Attached header ${index + 1} value`}
            value={header.value.kind === 'literal' ? header.value.value : header.value.secretRef}
            {disabled}
            on:change={(event) => updateHeaderValue(index, valueFrom(event))}
          />
          <button type="button" {disabled} on:click={() => removeHeader(index)}>Remove</button>
        </div>
      {/each}
      <button type="button" {disabled} on:click={addHeader}>Add header</button>
    </details>
  </section>
{/if}

<style>
  fieldset {
    max-width: 900px;
    margin: 0 0 14px;
    border: 0;
    padding: 0;
  }

  legend {
    margin-bottom: 6px;
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

  .header-row {
    display: grid;
    grid-template-columns: minmax(10rem, 0.8fr) minmax(9rem, 0.45fr) minmax(13rem, 1fr) auto;
    gap: 0.45rem;
    align-items: center;
    max-width: 980px;
    margin-bottom: 0.45rem;
  }

  .header-row button,
  details > button {
    min-height: 32px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    padding: 5px 10px;
  }

  @media (max-width: 760px) {
    .header-row {
      grid-template-columns: 1fr;
    }
  }
</style>
