<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type Condition,
    type ProfileRouteTarget,
    type ProfileSpec,
    type SwitchProfile,
    type SwitchRule,
    type UserProfile,
    type Weekday,
  } from '@zeroomega-nex/profile-spec';
  import {
    addSwitchRuleDraft,
    createDefaultSwitchCondition,
    deleteSwitchRuleDraft,
    duplicateSwitchRuleDraft,
    moveSwitchRuleDraft,
    type ProfileWorkflowIdFactory,
  } from '@zeroomega-nex/profile-workflow';

  export let spec: ProfileSpec;
  export let profileId: string;
  export let disabled = false;
  export let idFactory: ProfileWorkflowIdFactory;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;

  interface ConditionKindOption {
    readonly value: Condition['kind'];
    readonly label: string;
    readonly help: string;
  }

  interface ConditionGroup {
    readonly label: string;
    readonly options: readonly ConditionKindOption[];
  }

  const basicConditionGroups: readonly ConditionGroup[] = [
    {
      label: 'Basic conditions',
      options: [
        {
          value: 'host-wildcard',
          label: 'Host wildcard',
          help: 'Match a hostname pattern such as *.example.com.',
        },
        {
          value: 'url-wildcard',
          label: 'URL wildcard',
          help: 'Match a complete URL wildcard pattern.',
        },
        {
          value: 'url-regex',
          label: 'URL regular expression',
          help: 'Match a complete URL using a regular expression.',
        },
        {
          value: 'false',
          label: 'Never',
          help: 'Keep a disabled placeholder rule without deleting it.',
        },
      ],
    },
  ];

  const advancedConditionGroups: readonly ConditionGroup[] = [
    {
      label: 'Host',
      options: [
        {
          value: 'host-wildcard',
          label: 'Host wildcard',
          help: 'Match a hostname wildcard without path or port details.',
        },
        {
          value: 'host-regex',
          label: 'Host regular expression',
          help: 'Match the hostname using a regular expression.',
        },
        {
          value: 'host-levels',
          label: 'Host levels',
          help: 'Match hostnames whose label count falls inside a range.',
        },
        {
          value: 'ip',
          label: 'IP network',
          help: 'Match an IPv4 or IPv6 network and prefix length.',
        },
        {
          value: 'bypass',
          label: 'Bypass pattern',
          help: 'Match a browser bypass-list pattern.',
        },
      ],
    },
    {
      label: 'URL',
      options: [
        {
          value: 'url-wildcard',
          label: 'URL wildcard',
          help: 'Match a complete URL wildcard pattern.',
        },
        {
          value: 'url-regex',
          label: 'URL regular expression',
          help: 'Match a complete URL using a regular expression.',
        },
        {
          value: 'keyword',
          label: 'URL keyword',
          help: 'Match an HTTP URL containing a keyword.',
        },
      ],
    },
    {
      label: 'Special',
      options: [
        {
          value: 'weekday',
          label: 'Weekday',
          help: 'Match selected local weekdays.',
        },
        {
          value: 'time',
          label: 'Local time',
          help: 'Match a local-time hour range.',
        },
        {
          value: 'true',
          label: 'Always',
          help: 'Always match. Imported profiles may retain this explicit form.',
        },
        {
          value: 'false',
          label: 'Never',
          help: 'Never match; useful as a retained placeholder.',
        },
      ],
    },
  ];

  const basicConditionKinds = new Set(
    basicConditionGroups.flatMap((group) => group.options.map((option) => option.value)),
  );

  const weekdays: readonly { value: Weekday; label: string }[] = [
    { value: 'sun', label: 'Sun' },
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
  ];

  let profile: SwitchProfile | undefined;
  let routeProfiles: readonly UserProfile[] = [];
  let showConditionHelp = false;
  let notesExpanded = false;
  let draggedRuleId: string | undefined;
  let useAdvancedConditions = false;
  let conditionGroups: readonly ConditionGroup[] = basicConditionGroups;
  let showNotes = false;
  let hasUrlConditions = false;
  $: profile = spec.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === profileId && candidate.kind === 'switch',
  );
  $: routeProfiles = spec.profiles.filter((candidate) => candidate.id !== profileId);
  $: useAdvancedConditions =
    spec.settings.interface.showAdvancedConditions ||
    (profile?.rules.some((rule) => !basicConditionKinds.has(rule.condition.kind)) ?? false);
  $: conditionGroups = useAdvancedConditions ? advancedConditionGroups : basicConditionGroups;
  $: showNotes = notesExpanded || (profile?.rules.some((rule) => Boolean(rule.note)) ?? false);
  $: hasUrlConditions =
    profile?.rules.some(
      (rule) => rule.condition.kind === 'url-wildcard' || rule.condition.kind === 'url-regex',
    ) ?? false;

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
  }

  function checkedFrom(event: Event): boolean {
    return (event.currentTarget as HTMLInputElement).checked;
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

  function conditionPattern(condition: Condition): string {
    return 'pattern' in condition ? condition.pattern : '';
  }

  function conditionFlags(condition: Condition): string {
    return condition.kind === 'host-regex' || condition.kind === 'url-regex'
      ? (condition.flags ?? '')
      : '';
  }

  function conditionAddress(condition: Condition): string {
    return condition.kind === 'ip' ? condition.address : '';
  }

  function conditionNumber(
    condition: Condition,
    field: 'prefixLength' | 'min' | 'max' | 'startHour' | 'endHour',
  ): number {
    if (condition.kind === 'ip' && field === 'prefixLength') return condition.prefixLength;
    if (condition.kind === 'host-levels' && (field === 'min' || field === 'max')) {
      return condition[field];
    }
    if (condition.kind === 'time' && (field === 'startHour' || field === 'endHour')) {
      return condition[field];
    }
    return 0;
  }

  function conditionWeekdays(condition: Condition): readonly Weekday[] {
    return condition.kind === 'weekday' ? condition.days : [];
  }

  async function mutateRule(ruleId: string, update: (rule: SwitchRule) => void): Promise<void> {
    const draft = cloneProfileSpecDraft(spec);
    const targetProfile = draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profileId && candidate.kind === 'switch',
    );
    const rule = targetProfile?.rules.find((candidate) => candidate.id === ruleId);
    if (!rule) return;
    update(rule);
    await onReplaceDraft(draft);
  }

  async function updateDefaultRoute(value: string): Promise<void> {
    const route = parseRoute(value);
    if (!route) return;
    const draft = cloneProfileSpecDraft(spec);
    const targetProfile = draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profileId && candidate.kind === 'switch',
    );
    if (!targetProfile) return;
    targetProfile.defaultRoute = route;
    await onReplaceDraft(draft);
  }

  async function addRule(): Promise<void> {
    try {
      const mutation = addSwitchRuleDraft(spec, profileId, idFactory, 'host-wildcard');
      await onReplaceDraft(mutation.draft);
    } catch {
      return;
    }
  }

  async function duplicateRule(ruleId: string): Promise<void> {
    const mutation = duplicateSwitchRuleDraft(spec, profileId, ruleId, idFactory);
    await onReplaceDraft(mutation.draft);
  }

  async function deleteRule(ruleId: string): Promise<void> {
    await onReplaceDraft(deleteSwitchRuleDraft(spec, profileId, ruleId));
  }

  async function moveRule(ruleId: string, offset: -1 | 1): Promise<void> {
    await onReplaceDraft(moveSwitchRuleDraft(spec, profileId, ruleId, offset));
  }

  async function updateRuleRoute(ruleId: string, value: string): Promise<void> {
    const route = parseRoute(value);
    if (!route) return;
    await mutateRule(ruleId, (rule) => {
      rule.route = route;
    });
  }

  async function updateRuleEnabled(ruleId: string, enabled: boolean): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      rule.enabled = enabled;
    });
  }

  async function updateRuleNote(ruleId: string, note: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      const normalized = note.trim();
      if (normalized) rule.note = normalized;
      else delete rule.note;
    });
  }

  async function updateConditionKind(ruleId: string, kind: Condition['kind']): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      rule.condition = createDefaultSwitchCondition(kind);
    });
  }

  async function updateConditionPattern(ruleId: string, pattern: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if ('pattern' in rule.condition) rule.condition.pattern = pattern.trim();
    });
  }

  async function updateConditionFlags(ruleId: string, flags: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind !== 'host-regex' && rule.condition.kind !== 'url-regex') return;
      const normalized = flags.trim();
      if (normalized) rule.condition.flags = normalized;
      else delete rule.condition.flags;
    });
  }

  async function updateIpAddress(ruleId: string, address: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind === 'ip') rule.condition.address = address.trim();
    });
  }

  async function updateConditionNumber(
    ruleId: string,
    field: 'prefixLength' | 'min' | 'max' | 'startHour' | 'endHour',
    value: string,
  ): Promise<void> {
    const numeric = Number(value);
    if (!Number.isInteger(numeric)) return;
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind === 'ip' && field === 'prefixLength') {
        rule.condition.prefixLength = numeric;
      } else if (rule.condition.kind === 'host-levels' && (field === 'min' || field === 'max')) {
        rule.condition[field] = numeric;
      } else if (rule.condition.kind === 'time' && (field === 'startHour' || field === 'endHour')) {
        rule.condition[field] = numeric;
      }
    });
  }

  async function toggleWeekday(ruleId: string, day: Weekday, selected: boolean): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind !== 'weekday') return;
      const days = new Set(rule.condition.days);
      if (selected) days.add(day);
      else days.delete(day);
      rule.condition.days = weekdays.map((entry) => entry.value).filter((entry) => days.has(entry));
    });
  }

  async function moveRuleTo(ruleId: string, targetIndex: number): Promise<void> {
    const draft = cloneProfileSpecDraft(spec);
    const targetProfile = draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profileId && candidate.kind === 'switch',
    );
    if (!targetProfile) return;
    const sourceIndex = targetProfile.rules.findIndex((rule) => rule.id === ruleId);
    if (sourceIndex < 0 || sourceIndex === targetIndex) return;
    const [rule] = targetProfile.rules.splice(sourceIndex, 1);
    if (!rule) return;
    const boundedTarget = Math.max(0, Math.min(targetIndex, targetProfile.rules.length));
    targetProfile.rules.splice(boundedTarget, 0, rule);
    await onReplaceDraft(draft);
  }

  function startRuleDrag(ruleId: string, event: DragEvent): void {
    draggedRuleId = ruleId;
    event.dataTransfer?.setData('text/plain', ruleId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  async function dropRule(targetIndex: number): Promise<void> {
    if (!draggedRuleId) return;
    const ruleId = draggedRuleId;
    draggedRuleId = undefined;
    await moveRuleTo(ruleId, targetIndex);
  }
</script>

{#if profile}
  {#if showConditionHelp}
    <section class="settings-section condition-help-section" data-switch-condition-help>
      <div class="condition-help-header">
        <h2>Condition help</h2>
        <button
          type="button"
          class="close-help"
          aria-label="Close condition help"
          on:click={() => (showConditionHelp = false)}>×</button
        >
      </div>
      <div class="condition-help-groups">
        {#each conditionGroups as group, groupIndex (group.label)}
          <details open={groupIndex === 0}>
            <summary>{group.label}</summary>
            <dl>
              {#each group.options as option (option.value)}
                <dt>{option.label}</dt>
                <dd>{option.help}</dd>
              {/each}
            </dl>
          </details>
        {/each}
      </div>
    </section>
  {/if}

  <section class="settings-section switch-rules-section">
    <div class="switch-rules-heading">
      <div>
        <h2>Switch rules</h2>
        <p class="section-help">
          Rules are evaluated from top to bottom. The first matching rule selects its result
          profile.
        </p>
      </div>
      <button
        type="button"
        class="help-button"
        aria-expanded={showConditionHelp}
        aria-controls="switch-condition-help"
        on:click={() => (showConditionHelp = !showConditionHelp)}
      >
        ? Condition help
      </button>
    </div>

    {#if hasUrlConditions}
      <p class="url-condition-warning" role="alert">
        Full-URL conditions depend on browser request information and may be limited for some
        requests.
      </p>
    {/if}

    <div class="table-scroller">
      <table class="switch-rules-table" data-switch-rules-table>
        <thead>
          <tr>
            <th scope="col">Sort</th>
            <th scope="col">Condition type</th>
            <th scope="col">Condition details</th>
            <th scope="col">Result profile</th>
            <th scope="col">Actions</th>
            {#if showNotes}<th scope="col">Note</th>{/if}
          </tr>
        </thead>
        <tbody>
          {#each profile.rules as rule, index (rule.id)}
            <tr
              class:dragging={draggedRuleId === rule.id}
              data-switch-rule-row={rule.id}
              on:dragover|preventDefault
              on:drop={() => dropRule(index)}
            >
              <td class="sort-cell">
                <button
                  type="button"
                  class="drag-handle"
                  data-switch-drag-handle
                  title="Drag to reorder"
                  aria-label={`Drag rule ${index + 1} to reorder`}
                  aria-grabbed={draggedRuleId === rule.id}
                  draggable={!disabled}
                  disabled={disabled || profile.rules.length < 2}
                  on:dragstart={(event) => startRuleDrag(rule.id, event)}
                  on:dragend={() => (draggedRuleId = undefined)}
                >
                  ↕
                </button>
                <label class="enabled-toggle" title="Rule enabled">
                  <input
                    type="checkbox"
                    checked={rule.enabled !== false}
                    {disabled}
                    aria-label={`Enable rule ${index + 1}`}
                    on:change={(event) => updateRuleEnabled(rule.id, checkedFrom(event))}
                  />
                </label>
                <div class="keyboard-order-actions">
                  <button
                    type="button"
                    aria-label={`Move rule ${index + 1} up`}
                    disabled={disabled || index === 0}
                    on:click={() => moveRule(rule.id, -1)}>↑</button
                  >
                  <button
                    type="button"
                    aria-label={`Move rule ${index + 1} down`}
                    disabled={disabled || index === profile.rules.length - 1}
                    on:click={() => moveRule(rule.id, 1)}>↓</button
                  >
                </div>
              </td>
              <td>
                <select
                  aria-label={`Rule ${index + 1} condition type`}
                  value={rule.condition.kind}
                  {disabled}
                  on:change={(event) =>
                    updateConditionKind(rule.id, valueFrom(event) as Condition['kind'])}
                >
                  {#each conditionGroups as group (group.label)}
                    <optgroup label={group.label}>
                      {#each group.options as option (option.value)}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </optgroup>
                  {/each}
                </select>
              </td>
              <td class="condition-details-cell">
                {#if rule.condition.kind === 'true'}
                  <span>Always matches</span>
                {:else if rule.condition.kind === 'false'}
                  <span>Never matches</span>
                {:else if 'pattern' in rule.condition}
                  <div class="inline-details">
                    <input
                      aria-label={`Rule ${index + 1} pattern`}
                      value={conditionPattern(rule.condition)}
                      {disabled}
                      on:change={(event) => updateConditionPattern(rule.id, valueFrom(event))}
                    />
                    {#if rule.condition.kind === 'host-regex' || rule.condition.kind === 'url-regex'}
                      <input
                        class="flags-input"
                        aria-label={`Rule ${index + 1} regular-expression flags`}
                        value={conditionFlags(rule.condition)}
                        placeholder="flags"
                        {disabled}
                        on:change={(event) => updateConditionFlags(rule.id, valueFrom(event))}
                      />
                    {/if}
                  </div>
                {:else if rule.condition.kind === 'ip'}
                  <div class="inline-details ip-details">
                    <input
                      aria-label={`Rule ${index + 1} IP address`}
                      value={conditionAddress(rule.condition)}
                      placeholder="127.0.0.1"
                      {disabled}
                      on:change={(event) => updateIpAddress(rule.id, valueFrom(event))}
                    />
                    <span>/</span>
                    <input
                      class="small-number"
                      aria-label={`Rule ${index + 1} prefix length`}
                      type="number"
                      min="0"
                      max="128"
                      value={conditionNumber(rule.condition, 'prefixLength')}
                      {disabled}
                      on:change={(event) =>
                        updateConditionNumber(rule.id, 'prefixLength', valueFrom(event))}
                    />
                  </div>
                {:else if rule.condition.kind === 'host-levels'}
                  <div class="inline-details range-details">
                    <input
                      class="small-number"
                      aria-label={`Rule ${index + 1} minimum host levels`}
                      type="number"
                      min="1"
                      max="99"
                      value={conditionNumber(rule.condition, 'min')}
                      {disabled}
                      on:change={(event) => updateConditionNumber(rule.id, 'min', valueFrom(event))}
                    />
                    <span>to</span>
                    <input
                      class="small-number"
                      aria-label={`Rule ${index + 1} maximum host levels`}
                      type="number"
                      min="1"
                      max="99"
                      value={conditionNumber(rule.condition, 'max')}
                      {disabled}
                      on:change={(event) => updateConditionNumber(rule.id, 'max', valueFrom(event))}
                    />
                  </div>
                {:else if rule.condition.kind === 'weekday'}
                  <div class="weekday-options" aria-label={`Rule ${index + 1} weekdays`}>
                    {#each weekdays as day (day.value)}
                      <label class="weekday-option">
                        <input
                          type="checkbox"
                          checked={conditionWeekdays(rule.condition).includes(day.value)}
                          {disabled}
                          on:change={(event) =>
                            toggleWeekday(rule.id, day.value, checkedFrom(event))}
                        />
                        {day.label}
                      </label>
                    {/each}
                  </div>
                {:else if rule.condition.kind === 'time'}
                  <div class="inline-details range-details">
                    <input
                      class="small-number"
                      aria-label={`Rule ${index + 1} start hour`}
                      type="number"
                      min="0"
                      max="23"
                      value={conditionNumber(rule.condition, 'startHour')}
                      {disabled}
                      on:change={(event) =>
                        updateConditionNumber(rule.id, 'startHour', valueFrom(event))}
                    />
                    <span>to</span>
                    <input
                      class="small-number"
                      aria-label={`Rule ${index + 1} end hour`}
                      type="number"
                      min="0"
                      max="23"
                      value={conditionNumber(rule.condition, 'endHour')}
                      {disabled}
                      on:change={(event) =>
                        updateConditionNumber(rule.id, 'endHour', valueFrom(event))}
                    />
                  </div>
                {/if}
              </td>
              <td>
                <select
                  aria-label={`Rule ${index + 1} result profile`}
                  value={routeValue(rule.route)}
                  {disabled}
                  on:change={(event) => updateRuleRoute(rule.id, valueFrom(event))}
                >
                  <option value="direct">Direct</option>
                  <option value="system">System Proxy</option>
                  {#each routeProfiles as target (target.id)}
                    <option value={`profile:${target.id}`}>{target.name}</option>
                  {/each}
                </select>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    type="button"
                    title="Delete rule"
                    aria-label={`Delete rule ${index + 1}`}
                    {disabled}
                    on:click={() => deleteRule(rule.id)}>🗑</button
                  >
                  <button
                    type="button"
                    title="Clone rule"
                    aria-label={`Clone rule ${index + 1}`}
                    {disabled}
                    on:click={() => duplicateRule(rule.id)}>⧉</button
                  >
                  <button
                    type="button"
                    class:active-note={Boolean(rule.note)}
                    title="Add note"
                    aria-label={`Show note for rule ${index + 1}`}
                    {disabled}
                    on:click={() => (notesExpanded = true)}>✎</button
                  >
                </div>
              </td>
              {#if showNotes}
                <td>
                  <input
                    aria-label={`Rule ${index + 1} note`}
                    value={rule.note ?? ''}
                    placeholder="Optional note"
                    {disabled}
                    on:change={(event) => updateRuleNote(rule.id, valueFrom(event))}
                  />
                </td>
              {/if}
            </tr>
          {/each}
          {#if profile.rules.length === 0}
            <tr class="empty-rules-row">
              <td></td>
              <td colspan={showNotes ? 5 : 4}>
                No conditions. Requests use the default profile below.
              </td>
            </tr>
          {/if}
          <tr class="add-condition-row">
            <td></td>
            <td colspan={showNotes ? 5 : 4}>
              <button type="button" {disabled} on:click={addRule}>＋ Add condition</button>
            </td>
          </tr>
          <tr class="default-route-row">
            <td></td>
            <th scope="row" colspan="2">Default profile</th>
            <td>
              <select
                aria-label="Switch Profile default route"
                value={routeValue(profile.defaultRoute)}
                {disabled}
                on:change={(event) => updateDefaultRoute(valueFrom(event))}
              >
                <option value="direct">Direct</option>
                <option value="system">System Proxy</option>
                {#each routeProfiles as target (target.id)}
                  <option value={`profile:${target.id}`}>{target.name}</option>
                {/each}
              </select>
            </td>
            <td></td>
            {#if showNotes}<td></td>{/if}
          </tr>
        </tbody>
      </table>
    </div>
  </section>
{/if}

<style>
  .condition-help-header,
  .switch-rules-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .condition-help-header h2,
  .switch-rules-heading h2 {
    margin-bottom: 0.35rem;
  }

  .close-help,
  .help-button {
    border: 1px solid var(--border-strong);
    background: var(--button-bg);
    border-radius: 3px;
    padding: 0.35rem 0.6rem;
  }

  .condition-help-groups {
    max-width: 960px;
  }

  .condition-help-groups details {
    border-top: 1px solid var(--border);
    padding: 0.55rem 0;
  }

  .condition-help-groups summary {
    font-weight: 600;
  }

  .condition-help-groups dl {
    display: grid;
    grid-template-columns: minmax(11rem, 0.35fr) minmax(16rem, 1fr);
    gap: 0.35rem 1rem;
    margin: 0.5rem 0 0;
  }

  .condition-help-groups dt {
    font-weight: 600;
  }

  .condition-help-groups dd {
    color: var(--muted);
    margin: 0;
  }

  .url-condition-warning {
    border: 1px solid var(--danger);
    color: var(--danger);
    max-width: 980px;
    padding: 0.65rem 0.8rem;
  }

  .table-scroller {
    overflow-x: auto;
  }

  .switch-rules-table {
    border-collapse: collapse;
    width: min(100%, 1180px);
    min-width: 900px;
  }

  .switch-rules-table th,
  .switch-rules-table td {
    border: 1px solid var(--border);
    padding: 0.38rem;
    text-align: left;
    vertical-align: middle;
  }

  .switch-rules-table thead th {
    background: var(--hover);
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .switch-rules-table select,
  .switch-rules-table input {
    max-width: none;
    min-width: 0;
    width: 100%;
  }

  .switch-rules-table tbody tr.dragging {
    opacity: 0.55;
  }

  .sort-cell {
    width: 6.5rem;
    white-space: nowrap;
  }

  .drag-handle,
  .keyboard-order-actions button,
  .row-actions button,
  .add-condition-row button {
    border: 1px solid var(--border-strong);
    background: var(--button-bg);
    border-radius: 3px;
    min-height: 29px;
    padding: 0.25rem 0.45rem;
  }

  .drag-handle:not(:disabled) {
    cursor: grab;
  }

  .enabled-toggle {
    display: inline-flex;
    margin: 0 0.25rem;
  }

  .enabled-toggle input,
  .weekday-option input {
    width: auto;
  }

  .keyboard-order-actions,
  .row-actions,
  .inline-details,
  .weekday-options {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .keyboard-order-actions {
    display: inline-flex;
  }

  .row-actions {
    flex-wrap: nowrap;
  }

  .row-actions button.active-note {
    border-color: var(--accent);
    color: var(--accent-strong);
  }

  .condition-details-cell {
    min-width: 15rem;
  }

  .flags-input {
    max-width: 5rem !important;
  }

  .small-number {
    max-width: 4.5rem !important;
  }

  .ip-details input:first-child {
    min-width: 9rem;
  }

  .weekday-options {
    flex-wrap: wrap;
  }

  .weekday-option {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    margin: 0;
    white-space: nowrap;
  }

  .empty-rules-row td,
  .add-condition-row td {
    color: var(--muted);
  }

  .default-route-row th,
  .default-route-row td {
    background: var(--hover);
  }

  @media (max-width: 760px) {
    .condition-help-header,
    .switch-rules-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .condition-help-groups dl {
      grid-template-columns: 1fr;
    }
  }
</style>
