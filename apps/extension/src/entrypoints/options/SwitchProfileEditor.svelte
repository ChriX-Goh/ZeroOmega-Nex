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
    attachedRuleListProfileIds,
    composeSwitchProfileSource,
    createAttachedRuleListDraft,
    createDefaultSwitchCondition,
    deleteSwitchRuleDraft,
    detachAttachedRuleListDraft,
    duplicateSwitchRuleDraft,
    inspectAttachedRuleList,
    moveSwitchRuleDraft,
    parseSwitchProfileSourceDraft,
    setAttachedRuleListEnabledDraft,
    updateAttachedRuleListMatchRouteDraft,
    updateSwitchDefaultRouteDraft,
    type AttachedRuleListState,
    type ProfileWorkflowIdFactory,
    type ProfileWorkflowRuleSourceUpdateView,
    type SwitchSourceError,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';
  import {
    ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS as advancedConditionGroups,
    ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS as basicConditionGroups,
    ORIGINAL_SWITCH_BASIC_CONDITION_KINDS,
    isOriginalSwitchSelectableConditionKind,
    isSourceOnlySwitchConditionKind,
    sourceOnlySwitchConditionLabelKey,
    type SwitchConditionGroup,
  } from '../../lib/switch-condition-catalog';
  import AttachedRuleListConfig from './AttachedRuleListConfig.svelte';
  import { readSwitchSourceEditorMode, storeSwitchSourceEditorMode } from './switch-editor-state';

  export let spec: ProfileSpec;
  export let profileId: string;
  export let locale: AppLocale = currentAppLocale();
  export let disabled = false;
  export let idFactory: ProfileWorkflowIdFactory;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onGetRuleSourceUpdateStatus: (
    sourceId: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;
  export let onUpdateRuleSource: (
    sourceId: string,
    url: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;
  export let onRegisterBeforeAction: (guard: (() => Promise<boolean>) | undefined) => void;
  export let onSourceDirtyChange: (dirty: boolean) => void;

  const basicConditionKinds = new Set<Condition['kind']>(ORIGINAL_SWITCH_BASIC_CONDITION_KINDS);

  const weekdays: readonly { value: Weekday; labelKey: UiTextKey }[] = [
    { value: 'sun', labelKey: 'switch.weekday.sun' },
    { value: 'mon', labelKey: 'switch.weekday.mon' },
    { value: 'tue', labelKey: 'switch.weekday.tue' },
    { value: 'wed', labelKey: 'switch.weekday.wed' },
    { value: 'thu', labelKey: 'switch.weekday.thu' },
    { value: 'fri', labelKey: 'switch.weekday.fri' },
    { value: 'sat', labelKey: 'switch.weekday.sat' },
  ];

  let profile: SwitchProfile | undefined;
  let attachedState: AttachedRuleListState | undefined;
  let hiddenProfileIds: ReadonlySet<string> = new Set();
  let routeProfiles: readonly UserProfile[] = [];
  let showConditionHelp = false;
  let notesExpanded = false;
  let draggedRuleId: string | undefined;
  let editSource = false;
  let sourceText = '';
  let sourceTouched = false;
  let sourceError: SwitchSourceError | undefined;
  let useAdvancedConditions = false;
  let conditionGroups: readonly SwitchConditionGroup[] = basicConditionGroups;
  let showNotes = false;
  let hasUrlConditions = false;
  $: profile = spec.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === profileId && candidate.kind === 'switch',
  );
  $: attachedState = inspectAttachedRuleList(spec, profileId);
  $: hiddenProfileIds = attachedRuleListProfileIds(spec);
  $: routeProfiles = spec.profiles.filter(
    (candidate) => candidate.id !== profileId && !hiddenProfileIds.has(candidate.id),
  );
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

  function conditionIpNetwork(condition: Condition): string {
    return condition.kind === 'ip' ? `${condition.address}/${condition.prefixLength}` : '';
  }

  function hostWildcardHasWarning(condition: Condition): boolean {
    return condition.kind === 'host-wildcard' && /[:/]/u.test(condition.pattern);
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
    await onReplaceDraft(updateSwitchDefaultRouteDraft(spec, profileId, route));
  }

  async function attachRuleList(): Promise<void> {
    await onReplaceDraft(createAttachedRuleListDraft(spec, profileId, idFactory));
  }

  async function toggleAttachedRuleList(enabled: boolean): Promise<void> {
    await onReplaceDraft(setAttachedRuleListEnabledDraft(spec, profileId, enabled));
  }

  async function updateAttachedMatchRoute(value: string): Promise<void> {
    const route = parseRoute(value);
    if (!route) return;
    await onReplaceDraft(updateAttachedRuleListMatchRouteDraft(spec, profileId, route));
  }

  async function detachRuleList(): Promise<void> {
    if (!globalThis.confirm(uiText('switch.detachConfirm', locale))) {
      return;
    }
    await onReplaceDraft(detachAttachedRuleListDraft(spec, profileId));
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

  async function updateRuleNote(ruleId: string, note: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      const normalized = note.trim();
      if (normalized) rule.note = normalized;
      else delete rule.note;
    });
  }

  async function updateConditionKind(ruleId: string, kind: Condition['kind']): Promise<void> {
    if (!isOriginalSwitchSelectableConditionKind(kind)) return;
    await mutateRule(ruleId, (rule) => {
      rule.condition = createDefaultSwitchCondition(kind);
      delete rule.enabled;
    });
  }

  function hasLegacySourceState(rule: SwitchRule): boolean {
    return (
      rule.enabled === false ||
      ((rule.condition.kind === 'host-regex' || rule.condition.kind === 'url-regex') &&
        Boolean(rule.condition.flags))
    );
  }

  async function normalizeLegacySourceState(ruleId: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      delete rule.enabled;
      if (rule.condition.kind === 'host-regex' || rule.condition.kind === 'url-regex') {
        delete rule.condition.flags;
      }
    });
  }

  async function normalizeTrueCondition(ruleId: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind === 'true') {
        rule.condition = { kind: 'host-wildcard', pattern: '*' };
      }
    });
  }

  async function updateConditionPattern(ruleId: string, pattern: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if ('pattern' in rule.condition) rule.condition.pattern = pattern.trim();
    });
  }

  async function updateIpNetwork(ruleId: string, network: string): Promise<void> {
    const normalized = network.trim();
    const separator = normalized.lastIndexOf('/');
    const address = separator < 0 ? normalized : normalized.slice(0, separator).trim();
    const prefix =
      separator < 0 ? Number.NaN : Number.parseInt(normalized.slice(separator + 1), 10);
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind !== 'ip') return;
      rule.condition.address = address;
      rule.condition.prefixLength = Number.isInteger(prefix) ? prefix : 0;
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

  function sourceErrorText(value: SwitchSourceError): string {
    return uiMessage(
      'switch.sourceError',
      { code: value.code, ...(value.line === undefined ? {} : { line: value.line }) },
      locale,
    );
  }

  async function commitSourceIfNeeded(): Promise<boolean> {
    if (!editSource || !sourceTouched) return true;
    const parsed = parseSwitchProfileSourceDraft(spec, profileId, sourceText, idFactory);
    if (!parsed.ok) {
      sourceError = parsed.error;
      return false;
    }
    if (!(await onReplaceDraft(parsed.draft))) return false;
    sourceTouched = false;
    onSourceDirtyChange(false);
    sourceError = undefined;
    return true;
  }

  function enterSourceMode(): boolean {
    const composed = composeSwitchProfileSource(spec, profileId);
    if (!composed.ok) {
      sourceError = composed.error;
      storeSwitchSourceEditorMode(profileId, false);
      return false;
    }
    sourceText = composed.source;
    sourceTouched = false;
    onSourceDirtyChange(false);
    sourceError = undefined;
    editSource = true;
    storeSwitchSourceEditorMode(profileId, true);
    return true;
  }

  async function toggleSource(): Promise<void> {
    if (!editSource) {
      enterSourceMode();
      return;
    }
    if (!(await commitSourceIfNeeded())) return;
    editSource = false;
    storeSwitchSourceEditorMode(profileId, false);
    sourceError = undefined;
  }

  function markSourceTouched(): void {
    sourceTouched = true;
    onSourceDirtyChange(true);
    sourceError = undefined;
  }

  onMount(() => {
    onRegisterBeforeAction(commitSourceIfNeeded);
    if (readSwitchSourceEditorMode(profileId)) enterSourceMode();
    return () => {
      onRegisterBeforeAction(undefined);
      onSourceDirtyChange(false);
    };
  });

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
    <section
      class="settings-section condition-help-section"
      data-switch-condition-help
      data-typed-locale={locale}
    >
      <div class="condition-help-header">
        <h2>{uiText('switch.conditionHelp', locale)}</h2>
        <button
          type="button"
          class="close-help"
          aria-label={uiText('switch.closeConditionHelp', locale)}
          on:click={() => (showConditionHelp = false)}>×</button
        >
      </div>
      <div class="condition-help-groups">
        {#each conditionGroups as group, groupIndex (group.labelKey)}
          <details open={groupIndex === 0}>
            <summary>{uiText(group.labelKey, locale)}</summary>
            <dl>
              {#each group.options as option (option.value)}
                <dt>{uiText(option.labelKey, locale)}</dt>
                <dd>{uiText(option.helpKey, locale)}</dd>
              {/each}
            </dl>
          </details>
        {/each}
      </div>
    </section>
  {/if}

  <section
    class="settings-section switch-rules-section"
    data-switch-source-mode={editSource ? 'source' : 'table'}
    data-typed-locale={locale}
  >
    <div class="switch-rules-heading">
      <div>
        <h2>{uiText('switch.rules', locale)}</h2>
        <p class="section-help">
          {uiText('switch.rulesHelp', locale)}
        </p>
      </div>
      <div class="switch-heading-actions">
        <button
          type="button"
          class="source-toggle"
          class:active={editSource}
          data-switch-source-toggle
          aria-pressed={editSource}
          {disabled}
          on:click={toggleSource}
        >
          ✎ {uiText('switch.editSource', locale)}
        </button>
        {#if !editSource}
          <button
            type="button"
            class="help-button"
            aria-expanded={showConditionHelp}
            aria-controls="switch-condition-help"
            on:click={() => (showConditionHelp = !showConditionHelp)}
          >
            ? {uiText('switch.conditionHelp', locale)}
          </button>
        {/if}
      </div>
    </div>

    {#if sourceError}
      <p class="source-error" role="alert" data-switch-source-error>
        {sourceErrorText(sourceError)}
      </p>
    {/if}

    {#if hasUrlConditions}
      <p class="url-condition-warning" role="alert">
        {uiText('switch.urlWarning', locale)}
      </p>
    {/if}

    {#if editSource}
      <div class="switch-source-editor" data-switch-source-editor>
        <textarea
          aria-label={uiText('switch.source', locale)}
          rows="20"
          bind:value={sourceText}
          {disabled}
          on:input={markSourceTouched}></textarea>
        <p class="section-help">
          {uiText('switch.sourceHelp', locale)}
          <a
            href="https://github.com/FelisCatus/SwitchyOmega/wiki/SwitchyOmega-conditions-format"
            target="_blank"
            rel="noreferrer">{uiText('switch.formatHelp', locale)}</a
          >
        </p>
      </div>
    {:else}
      <div class="table-scroller">
        <table class="switch-rules-table" data-switch-rules-table>
          <thead>
            <tr>
              <th scope="col">{uiText('switch.sort', locale)}</th>
              <th scope="col">{uiText('switch.conditionType', locale)}</th>
              <th scope="col">{uiText('switch.conditionDetails', locale)}</th>
              <th scope="col">{uiText('switch.resultProfile', locale)}</th>
              <th scope="col">{uiText('switch.actions', locale)}</th>
              {#if showNotes}<th scope="col">{uiText('switch.note', locale)}</th>{/if}
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
                    title={uiText('switch.dragToReorder', locale)}
                    aria-label={uiMessage(
                      'switch.ruleFieldAria',
                      { index: index + 1, field: 'drag' },
                      locale,
                    )}
                    aria-grabbed={draggedRuleId === rule.id}
                    draggable={!disabled}
                    disabled={disabled || profile.rules.length < 2}
                    on:dragstart={(event) => startRuleDrag(rule.id, event)}
                    on:dragend={() => (draggedRuleId = undefined)}
                  >
                    ↕
                  </button>
                  <div class="keyboard-order-actions">
                    <button
                      type="button"
                      aria-label={uiMessage(
                        'switch.ruleFieldAria',
                        { index: index + 1, field: 'moveUp' },
                        locale,
                      )}
                      disabled={disabled || index === 0}
                      on:click={() => moveRule(rule.id, -1)}>↑</button
                    >
                    <button
                      type="button"
                      aria-label={uiMessage(
                        'switch.ruleFieldAria',
                        { index: index + 1, field: 'moveDown' },
                        locale,
                      )}
                      disabled={disabled || index === profile.rules.length - 1}
                      on:click={() => moveRule(rule.id, 1)}>↓</button
                    >
                  </div>
                </td>
                <td>
                  <select
                    data-switch-condition-select
                    data-switch-condition-kind={rule.condition.kind}
                    aria-label={uiMessage(
                      'switch.ruleFieldAria',
                      { index: index + 1, field: 'conditionType' },
                      locale,
                    )}
                    value={rule.condition.kind}
                    {disabled}
                    on:change={(event) =>
                      updateConditionKind(rule.id, valueFrom(event) as Condition['kind'])}
                  >
                    {#if isSourceOnlySwitchConditionKind(rule.condition.kind)}
                      <optgroup
                        label={uiText('switch.group.compatibility', locale)}
                        data-switch-source-only-condition-group
                      >
                        <option
                          value={rule.condition.kind}
                          data-switch-source-only-condition-option={rule.condition.kind}
                        >
                          {uiText(sourceOnlySwitchConditionLabelKey(rule.condition.kind), locale)}
                        </option>
                      </optgroup>
                    {/if}
                    {#each conditionGroups as group (group.labelKey)}
                      <optgroup label={uiText(group.labelKey, locale)}>
                        {#each group.options as option (option.value)}
                          <option
                            value={option.value}
                            data-switch-condition-selectable-option={option.value}
                          >
                            {uiText(option.labelKey, locale)}
                          </option>
                        {/each}
                      </optgroup>
                    {/each}
                  </select>
                </td>
                <td class="condition-details-cell">
                  {#if rule.condition.kind === 'true'}
                    <span data-switch-true-condition>{uiText('switch.alwaysMatches', locale)}</span>
                  {:else if rule.condition.kind === 'false'}
                    {#if rule.condition.annotation}
                      <input
                        data-switch-false-annotation
                        value={rule.condition.annotation}
                        disabled
                        title={rule.condition.annotation}
                      />
                    {:else}
                      <span data-switch-false-condition
                        >{uiText('switch.neverMatches', locale)}</span
                      >
                    {/if}
                  {:else if 'pattern' in rule.condition}
                    <div class="inline-details">
                      <input
                        data-switch-condition-field="pattern"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'pattern' },
                          locale,
                        )}
                        value={conditionPattern(rule.condition)}
                        {disabled}
                        on:change={(event) => updateConditionPattern(rule.id, valueFrom(event))}
                      />
                    </div>
                    {#if hostWildcardHasWarning(rule.condition)}
                      <p
                        class="legacy-source-warning"
                        role="alert"
                        data-switch-host-wildcard-warning
                      >
                        {uiText('switch.condition.hostWildcardWarning', locale)}
                      </p>
                    {/if}
                  {:else if rule.condition.kind === 'ip'}
                    <div class="inline-details ip-details">
                      <input
                        data-switch-condition-field="ipNetwork"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'ipAddress' },
                          locale,
                        )}
                        value={conditionIpNetwork(rule.condition)}
                        placeholder="127.0.0.1/8"
                        {disabled}
                        on:change={(event) => updateIpNetwork(rule.id, valueFrom(event))}
                      />
                    </div>
                  {:else if rule.condition.kind === 'host-levels'}
                    <div class="inline-details range-details">
                      <input
                        class="small-number"
                        data-switch-condition-field="minimumHostLevels"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'minimumHostLevels' },
                          locale,
                        )}
                        type="number"
                        min="1"
                        max="99"
                        value={conditionNumber(rule.condition, 'min')}
                        {disabled}
                        on:change={(event) =>
                          updateConditionNumber(rule.id, 'min', valueFrom(event))}
                      />
                      <span>{uiText('switch.rangeTo', locale)}</span>
                      <input
                        class="small-number"
                        data-switch-condition-field="maximumHostLevels"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'maximumHostLevels' },
                          locale,
                        )}
                        type="number"
                        min="1"
                        max="99"
                        value={conditionNumber(rule.condition, 'max')}
                        {disabled}
                        on:change={(event) =>
                          updateConditionNumber(rule.id, 'max', valueFrom(event))}
                      />
                    </div>
                  {:else if rule.condition.kind === 'weekday'}
                    <div
                      class="weekday-options"
                      data-switch-condition-field="weekdays"
                      aria-label={uiMessage(
                        'switch.ruleFieldAria',
                        { index: index + 1, field: 'weekdays' },
                        locale,
                      )}
                    >
                      {#each weekdays as day (day.value)}
                        <label class="weekday-option">
                          <input
                            type="checkbox"
                            data-switch-weekday={day.value}
                            checked={conditionWeekdays(rule.condition).includes(day.value)}
                            {disabled}
                            on:change={(event) =>
                              toggleWeekday(rule.id, day.value, checkedFrom(event))}
                          />
                          {uiText(day.labelKey, locale)}
                        </label>
                      {/each}
                    </div>
                  {:else if rule.condition.kind === 'time'}
                    <div class="inline-details range-details">
                      <input
                        class="small-number"
                        data-switch-condition-field="startHour"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'startHour' },
                          locale,
                        )}
                        type="number"
                        min="0"
                        max="23"
                        value={conditionNumber(rule.condition, 'startHour')}
                        {disabled}
                        on:change={(event) =>
                          updateConditionNumber(rule.id, 'startHour', valueFrom(event))}
                      />
                      <span>{uiText('switch.rangeTo', locale)}</span>
                      <input
                        class="small-number"
                        data-switch-condition-field="endHour"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'endHour' },
                          locale,
                        )}
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
                  {#if isSourceOnlySwitchConditionKind(rule.condition.kind)}
                    <p
                      class="legacy-source-warning"
                      role="note"
                      data-switch-source-only-condition={rule.condition.kind}
                    >
                      {uiText('switch.condition.sourceOnlyWarning', locale)}
                    </p>
                  {/if}
                  {#if hasLegacySourceState(rule)}
                    <p class="legacy-source-warning">
                      {uiText('switch.legacyWarning', locale)}
                    </p>
                  {/if}
                </td>
                <td>
                  <select
                    aria-label={uiMessage(
                      'switch.ruleFieldAria',
                      { index: index + 1, field: 'resultProfile' },
                      locale,
                    )}
                    value={routeValue(rule.route)}
                    {disabled}
                    on:change={(event) => updateRuleRoute(rule.id, valueFrom(event))}
                  >
                    <option value="direct">{uiText('route.direct', locale)}</option>
                    <option value="system">{uiText('route.system', locale)}</option>
                    {#each routeProfiles as target (target.id)}
                      <option value={`profile:${target.id}`}>{target.name}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <div class="row-actions">
                    <button
                      type="button"
                      title={uiText('switch.deleteRule', locale)}
                      aria-label={uiMessage(
                        'switch.ruleActionAria',
                        { index: index + 1, action: 'delete' },
                        locale,
                      )}
                      {disabled}
                      on:click={() => deleteRule(rule.id)}>🗑</button
                    >
                    <button
                      type="button"
                      title={uiText('switch.cloneRule', locale)}
                      aria-label={uiMessage(
                        'switch.ruleActionAria',
                        { index: index + 1, action: 'clone' },
                        locale,
                      )}
                      {disabled}
                      on:click={() => duplicateRule(rule.id)}>⧉</button
                    >
                    {#if rule.condition.kind === 'true'}
                      <button
                        type="button"
                        data-switch-normalize-true-condition
                        title={uiText('switch.normalizeTrueTitle', locale)}
                        aria-label={uiText('switch.normalizeTrueTitle', locale)}
                        {disabled}
                        on:click={() => normalizeTrueCondition(rule.id)}
                        >{uiText('switch.normalizeRule', locale)}</button
                      >
                    {/if}
                    {#if hasLegacySourceState(rule)}
                      <button
                        type="button"
                        title={uiText('switch.normalizeRuleTitle', locale)}
                        aria-label={uiMessage(
                          'switch.ruleActionAria',
                          { index: index + 1, action: 'normalize' },
                          locale,
                        )}
                        {disabled}
                        on:click={() => normalizeLegacySourceState(rule.id)}
                        >{uiText('switch.normalizeRule', locale)}</button
                      >
                    {/if}
                    <button
                      type="button"
                      class:active-note={Boolean(rule.note)}
                      title={uiText('switch.addNote', locale)}
                      aria-label={uiMessage(
                        'switch.ruleActionAria',
                        { index: index + 1, action: 'showNote' },
                        locale,
                      )}
                      {disabled}
                      on:click={() => (notesExpanded = true)}>✎</button
                    >
                  </div>
                </td>
                {#if showNotes}
                  <td>
                    <input
                      aria-label={uiMessage(
                        'switch.ruleFieldAria',
                        { index: index + 1, field: 'note' },
                        locale,
                      )}
                      value={rule.note ?? ''}
                      placeholder={uiText('switch.optionalNote', locale)}
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
                  {uiText('switch.empty', locale)}
                </td>
              </tr>
            {/if}
            <tr class="add-condition-row">
              <td></td>
              <td colspan={showNotes ? 5 : 4}>
                <button type="button" {disabled} on:click={addRule}
                  >＋ {uiText('switch.addCondition', locale)}</button
                >
              </td>
            </tr>
            {#if attachedState}
              <tr class="attached-rule-list-row" data-attached-rule-list-row>
                <td class="attached-icon" aria-hidden="true">☷</td>
                <td>
                  <label class="attached-enabled">
                    <input
                      type="checkbox"
                      checked={attachedState.enabled}
                      {disabled}
                      on:change={(event) => toggleAttachedRuleList(checkedFrom(event))}
                    />
                    {uiText('switch.attachedUse', locale)}
                  </label>
                </td>
                <td>
                  {attachedState.enabled
                    ? uiText('switch.attachedEnabled', locale)
                    : uiText('switch.attachedDisabled', locale)}
                </td>
                <td>
                  <select
                    aria-label={uiText('switch.attachedMatchRoute', locale)}
                    value={routeValue(attachedState.profile.matchRoute)}
                    disabled={disabled || !attachedState.enabled}
                    on:change={(event) => updateAttachedMatchRoute(valueFrom(event))}
                  >
                    <option value="direct">{uiText('route.direct', locale)}</option>
                    <option value="system">{uiText('route.system', locale)}</option>
                    {#each routeProfiles as target (target.id)}
                      <option value={`profile:${target.id}`}>{target.name}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    class="detach-attached"
                    aria-label={uiText('switch.deleteAttached', locale)}
                    {disabled}
                    on:click={detachRuleList}>🗑</button
                  >
                </td>
                {#if showNotes}<td></td>{/if}
              </tr>
            {/if}
            <tr class="default-route-row">
              <td></td>
              <th scope="row" colspan="2">{uiText('switch.defaultProfile', locale)}</th>
              <td>
                <select
                  aria-label={uiText('switch.defaultRouteAria', locale)}
                  value={routeValue(attachedState?.defaultRoute ?? profile.defaultRoute)}
                  {disabled}
                  on:change={(event) => updateDefaultRoute(valueFrom(event))}
                >
                  <option value="direct">{uiText('route.direct', locale)}</option>
                  <option value="system">{uiText('route.system', locale)}</option>
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
    {/if}
  </section>

  {#if attachedState}
    <AttachedRuleListConfig
      {locale}
      {spec}
      switchProfileId={profileId}
      {disabled}
      {onReplaceDraft}
      {onGetRuleSourceUpdateStatus}
      {onUpdateRuleSource}
    />
  {:else}
    <section class="settings-section attach-rule-list-section" data-attach-rule-list-section>
      <h2>{uiText('switch.attachTitle', locale)}</h2>
      <p class="section-help">
        {uiText('switch.attachHelp', locale)}
      </p>
      <button type="button" {disabled} on:click={attachRuleList}
        >＋ {uiText('switch.attachButton', locale)}</button
      >
    </section>
  {/if}
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
  .help-button,
  .source-toggle {
    border: 1px solid var(--border-strong);
    background: var(--button-bg);
    border-radius: 3px;
    padding: 0.35rem 0.6rem;
  }

  .switch-heading-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .source-toggle.active {
    border-color: var(--accent);
    background: var(--active);
    color: var(--accent-strong);
  }

  .source-error {
    max-width: 980px;
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--danger);
    background: color-mix(in srgb, var(--danger) 10%, transparent);
    color: var(--danger);
  }

  .switch-source-editor textarea {
    width: min(100%, 980px);
    max-width: 980px;
    min-height: 25rem;
  }

  .legacy-source-warning {
    margin: 0.35rem 0 0;
    color: var(--danger);
    font-size: 0.78rem;
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
  .add-condition-row button,
  .detach-attached,
  .attach-rule-list-section button {
    border: 1px solid var(--border-strong);
    background: var(--button-bg);
    border-radius: 3px;
    min-height: 29px;
    padding: 0.25rem 0.45rem;
  }

  .drag-handle:not(:disabled) {
    cursor: grab;
  }

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

  .attached-rule-list-row td {
    background: color-mix(in srgb, var(--active) 45%, var(--content-bg));
  }

  .attached-icon {
    text-align: center !important;
  }

  .attached-enabled {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
  }

  .attached-enabled input {
    width: auto;
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
