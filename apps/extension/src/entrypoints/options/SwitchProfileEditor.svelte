<script lang="ts">
  import {
    cloneProfileSpec,
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

  const conditionKinds: readonly { value: Condition['kind']; label: string }[] = [
    { value: 'host-wildcard', label: 'Host wildcard' },
    { value: 'url-wildcard', label: 'URL wildcard' },
    { value: 'host-regex', label: 'Host regular expression' },
    { value: 'url-regex', label: 'URL regular expression' },
    { value: 'keyword', label: 'URL keyword' },
    { value: 'bypass', label: 'Bypass pattern' },
    { value: 'ip', label: 'IP network' },
    { value: 'host-levels', label: 'Host levels' },
    { value: 'weekday', label: 'Weekday' },
    { value: 'time', label: 'Local time' },
    { value: 'true', label: 'Always' },
    { value: 'false', label: 'Never' },
  ];

  const weekdays: readonly { value: Weekday; label: string }[] = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
  ];

  let profile: SwitchProfile | undefined;
  let routeProfiles: readonly UserProfile[] = [];
  $: profile = spec.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === profileId && candidate.kind === 'switch',
  );
  $: routeProfiles = spec.profiles.filter((candidate) => candidate.id !== profileId);

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
    const draft = cloneProfileSpec(spec);
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
    const draft = cloneProfileSpec(spec);
    const targetProfile = draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profileId && candidate.kind === 'switch',
    );
    if (!targetProfile) return;
    targetProfile.defaultRoute = route;
    await onReplaceDraft(draft);
  }

  async function addRule(kind: Condition['kind'], event: Event): Promise<void> {
    (event.currentTarget as HTMLSelectElement).value = '';
    try {
      const mutation = addSwitchRuleDraft(spec, profileId, idFactory, kind);
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

  async function updateWeekdays(ruleId: string, event: Event): Promise<void> {
    const selected = [...(event.currentTarget as HTMLSelectElement).selectedOptions].map(
      (option) => option.value as Weekday,
    );
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind === 'weekday') rule.condition.days = selected;
    });
  }
</script>

{#if profile}
  <section class="settings-section">
    <h2>Default route</h2>
    <p class="section-help">Used when no enabled rule matches.</p>
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
  </section>

  <section class="settings-section">
    <h2>Rules</h2>
    <p class="section-help">
      Rules are evaluated from top to bottom. The first enabled match selects its route.
    </p>

    <select
      aria-label="Add Switch Profile rule"
      {disabled}
      on:change={(event) => addRule(valueFrom(event) as Condition['kind'], event)}
    >
      <option value="">Add rule…</option>
      {#each conditionKinds as kind (kind.value)}
        <option value={kind.value}>{kind.label}</option>
      {/each}
    </select>

    {#if profile.rules.length === 0}
      <p>No rules. This profile always uses its default route.</p>
    {:else}
      <ol aria-label="Ordered Switch Profile rules">
        {#each profile.rules as rule, index (rule.id)}
          <li>
            <fieldset {disabled}>
              <legend>Rule {index + 1}</legend>
              <label>
                <input
                  type="checkbox"
                  checked={rule.enabled !== false}
                  on:change={(event) => updateRuleEnabled(rule.id, checkedFrom(event))}
                />
                Enabled
              </label>

              <label>
                Condition
                <select
                  value={rule.condition.kind}
                  on:change={(event) =>
                    updateConditionKind(rule.id, valueFrom(event) as Condition['kind'])}
                >
                  {#each conditionKinds as kind (kind.value)}
                    <option value={kind.value}>{kind.label}</option>
                  {/each}
                </select>
              </label>

              {#if 'pattern' in rule.condition}
                <label>
                  Pattern
                  <input
                    value={conditionPattern(rule.condition)}
                    on:change={(event) => updateConditionPattern(rule.id, valueFrom(event))}
                  />
                </label>
              {/if}

              {#if rule.condition.kind === 'host-regex' || rule.condition.kind === 'url-regex'}
                <label>
                  Regular-expression flags
                  <input
                    value={conditionFlags(rule.condition)}
                    placeholder="i"
                    on:change={(event) => updateConditionFlags(rule.id, valueFrom(event))}
                  />
                </label>
              {:else if rule.condition.kind === 'ip'}
                <label>
                  Address
                  <input
                    value={conditionAddress(rule.condition)}
                    on:change={(event) => updateIpAddress(rule.id, valueFrom(event))}
                  />
                </label>
                <label>
                  Prefix length
                  <input
                    type="number"
                    min="0"
                    max="128"
                    value={conditionNumber(rule.condition, 'prefixLength')}
                    on:change={(event) =>
                      updateConditionNumber(rule.id, 'prefixLength', valueFrom(event))}
                  />
                </label>
              {:else if rule.condition.kind === 'host-levels'}
                <label>
                  Minimum levels
                  <input
                    type="number"
                    min="0"
                    value={conditionNumber(rule.condition, 'min')}
                    on:change={(event) => updateConditionNumber(rule.id, 'min', valueFrom(event))}
                  />
                </label>
                <label>
                  Maximum levels
                  <input
                    type="number"
                    min="0"
                    value={conditionNumber(rule.condition, 'max')}
                    on:change={(event) => updateConditionNumber(rule.id, 'max', valueFrom(event))}
                  />
                </label>
              {:else if rule.condition.kind === 'weekday'}
                <label>
                  Weekdays
                  <select multiple on:change={(event) => updateWeekdays(rule.id, event)}>
                    {#each weekdays as day (day.value)}
                      <option
                        value={day.value}
                        selected={conditionWeekdays(rule.condition).includes(day.value)}
                        >{day.label}</option
                      >
                    {/each}
                  </select>
                </label>
              {:else if rule.condition.kind === 'time'}
                <label>
                  Start hour
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={conditionNumber(rule.condition, 'startHour')}
                    on:change={(event) =>
                      updateConditionNumber(rule.id, 'startHour', valueFrom(event))}
                  />
                </label>
                <label>
                  End hour
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={conditionNumber(rule.condition, 'endHour')}
                    on:change={(event) =>
                      updateConditionNumber(rule.id, 'endHour', valueFrom(event))}
                  />
                </label>
              {/if}

              <label>
                Route
                <select
                  value={routeValue(rule.route)}
                  on:change={(event) => updateRuleRoute(rule.id, valueFrom(event))}
                >
                  <option value="direct">Direct</option>
                  <option value="system">System Proxy</option>
                  {#each routeProfiles as target (target.id)}
                    <option value={`profile:${target.id}`}>{target.name}</option>
                  {/each}
                </select>
              </label>

              <label>
                Note
                <input
                  value={rule.note ?? ''}
                  on:change={(event) => updateRuleNote(rule.id, valueFrom(event))}
                />
              </label>

              <div>
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  on:click={() => moveRule(rule.id, -1)}>Move up</button
                >
                <button
                  type="button"
                  disabled={disabled || index === profile.rules.length - 1}
                  on:click={() => moveRule(rule.id, 1)}>Move down</button
                >
                <button type="button" {disabled} on:click={() => duplicateRule(rule.id)}
                  >Duplicate</button
                >
                <button type="button" {disabled} on:click={() => deleteRule(rule.id)}>Delete</button
                >
              </div>
            </fieldset>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
{/if}
