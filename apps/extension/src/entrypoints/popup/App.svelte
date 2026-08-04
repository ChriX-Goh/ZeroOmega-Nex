<script lang="ts">
  import type {
    ProfileRouteTarget,
    ProfileSpec,
    SwitchProfile,
    UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    listPopupConditionResultRoutes,
    listPopupTemporaryRuleResultRoutes,
    type PopupSiteCondition,
    type ProfileWorkflowCommandResponse,
    type PopupTemporaryRuleView,
    type ProfileWorkflowRuntimeView,
    type ProfileWorkflowState,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';

  import OriginalPopupIcon from './OriginalPopupIcon.svelte';
  import {
    currentSiteDomainForLevel,
    inspectActiveCurrentSite,
    inspectCurrentSiteUrl,
    suggestCurrentSiteCondition,
    type CurrentSiteInfo,
    type PopupConditionKind,
  } from '../../lib/current-site';
  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';
  import { sendInspectCommand } from '../../lib/inspect-client';
  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import {
    sendProxyOwnershipCommand,
    type ProxyOwnershipBlockReason,
    type ProxyOwnershipView,
  } from '../../lib/proxy-ownership-client';
  import {
    sendPopupTemporaryRuleCommand,
    type PopupTemporaryRuleCommandResponse,
  } from '../../lib/popup-temporary-rule-client';
  import {
    sendRequestDiagnosticsCommand,
    type RequestDiagnosticsCommandResponse,
  } from '../../lib/request-diagnostics-client';
  import type { RequestDiagnosticsView } from '../../lib/request-diagnostics-model';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';

  export let locale: AppLocale = currentAppLocale();

  interface QuickSwitchItem {
    readonly key: string;
    readonly route: ProfileRouteTarget;
    readonly name: string;
    readonly color: string;
    readonly kind: UserProfile['kind'] | 'direct' | 'system' | 'external';
    readonly available: boolean;
    readonly reason?: string;
  }

  interface ResultRouteItem {
    readonly key: string;
    readonly route: ProfileRouteTarget;
    readonly name: string;
  }

  const conditionKinds: readonly { value: PopupConditionKind; labelKey: UiTextKey }[] = [
    { value: 'host-wildcard', labelKey: 'popup.condition.hostWildcard' },
    { value: 'host-regex', labelKey: 'popup.condition.hostRegex' },
    { value: 'url-wildcard', labelKey: 'popup.condition.urlWildcard' },
    { value: 'url-regex', labelKey: 'popup.condition.urlRegex' },
    { value: 'keyword', labelKey: 'popup.condition.keyword' },
  ];

  let state: ProfileWorkflowState | undefined;
  let runtime: ProfileWorkflowRuntimeView | undefined;
  let currentSite: CurrentSiteInfo | undefined;
  let inspectingContextTarget = false;
  let temporaryRuleView: PopupTemporaryRuleView | undefined;
  let proxyOwnership: ProxyOwnershipView | undefined;
  let requestDiagnostics: RequestDiagnosticsView | undefined;
  let loading = true;
  let switching = false;
  let addingCondition = false;
  let settingTemporaryRule = false;
  let openingSettings = false;
  let openingTemporaryRules = false;
  let openingRequestDiagnostics = false;
  let openingExtensionManager = false;
  let importingExternalProfile = false;
  let externalProfileFormOpen = false;
  let externalProfileName = '';
  let externalProfileNameError = '';
  let conditionFormOpen = false;
  let temporaryMenuOpen = false;
  let conditionKind: PopupConditionKind = 'host-wildcard';
  let conditionPattern = '';
  let conditionRouteKey = '';
  let subdomainLevel = 0;
  let errorMessage = '';

  let items: readonly QuickSwitchItem[] = [];
  let activeSwitch: SwitchProfile | undefined;
  let resultItems: readonly ResultRouteItem[] = [];
  let temporaryResultItems: readonly ResultRouteItem[] = [];
  let currentTemporaryRoute: ProfileRouteTarget | undefined;
  $: items = state ? quickSwitchItems(state.applied) : [];
  $: activeSwitch = activeSwitchProfile(state?.applied, runtime?.activeRoute);
  $: resultItems = state && activeSwitch ? popupResultItems(state.applied, activeSwitch.id) : [];
  $: currentTemporaryRoute =
    currentSite && temporaryRuleView
      ? temporaryRuleView.rules.find((rule) => rule.domain === currentSite?.domain)?.route
      : undefined;
  $: temporaryResultItems =
    state && runtime?.activeRoute
      ? listPopupTemporaryRuleResultRoutes(state.applied, runtime.activeRoute)
          .filter(
            (route) =>
              !sameRoute(route, runtime!.activeRoute!) ||
              (currentTemporaryRoute !== undefined && sameRoute(route, currentTemporaryRoute)),
          )
          .map((route) => ({ key: routeKey(route), route, name: routeName(state!.applied, route) }))
      : [];

  function sameRoute(left: ProfileRouteTarget | undefined, right: ProfileRouteTarget): boolean {
    if (left?.kind !== right.kind) return false;
    return (
      left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId)
    );
  }

  function routeKey(route: ProfileRouteTarget): string {
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function routeName(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return uiText('route.direct', locale);
    if (route.kind === 'system') return uiText('route.system', locale);
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ??
      uiText('route.missing', locale)
    );
  }

  function activeSwitchProfile(
    spec: ProfileSpec | undefined,
    route: ProfileRouteTarget | undefined,
  ): SwitchProfile | undefined {
    if (!spec || route?.kind !== 'profile') return undefined;
    const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
    return profile?.kind === 'switch' && profile.enabled !== false ? profile : undefined;
  }

  function popupResultItems(
    spec: ProfileSpec,
    switchProfileId: string,
  ): readonly ResultRouteItem[] {
    return listPopupConditionResultRoutes(spec, switchProfileId).map((route) => ({
      key: routeKey(route),
      route,
      name: routeName(spec, route),
    }));
  }

  function normalizedRoutes(spec: ProfileSpec): readonly ProfileRouteTarget[] {
    const routes = spec.settings.quickSwitch.routes.map((route) => structuredClone(route));
    const hasDirect = routes.some((route) => route.kind === 'direct');
    const hasSystem = routes.some((route) => route.kind === 'system');
    if (!hasDirect) routes.unshift({ kind: 'direct' });
    if (!hasSystem) {
      const directIndex = routes.findIndex((route) => route.kind === 'direct');
      routes.splice(directIndex + 1, 0, { kind: 'system' });
    }
    return routes;
  }

  function quickSwitchItems(spec: ProfileSpec): readonly QuickSwitchItem[] {
    return normalizedRoutes(spec).map((route) => {
      if (route.kind === 'direct') {
        return {
          key: routeKey(route),
          route,
          name: `[${uiText('route.direct', locale)}]`,
          color: spec.settings.interface.builtInProfiles?.direct?.color ?? '#bdbdbd',
          kind: 'direct',
          available: true,
        };
      }
      if (route.kind === 'system') {
        return {
          key: routeKey(route),
          route,
          name: `[${uiText('route.system', locale)}]`,
          color: spec.settings.interface.builtInProfiles?.system?.color ?? '#616161',
          kind: 'system',
          available: true,
        };
      }
      const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
      if (!profile) {
        return {
          key: routeKey(route),
          route,
          name: uiText('route.missing', locale),
          color: '#9e9e9e',
          kind: 'external',
          available: false,
          reason: uiMessage('popup.profileMissing', { profileId: route.profileId }, locale),
        };
      }
      return {
        key: routeKey(route),
        route,
        name: profile.name,
        color: profile.color ?? '#90a4ae',
        kind: profile.kind,
        available: profile.enabled !== false,
        ...(profile.enabled === false
          ? { reason: uiMessage('popup.profileDisabled', { name: profile.name }, locale) }
          : {}),
      };
    });
  }

  function acceptResponse(response: ProfileWorkflowCommandResponse): boolean {
    if (response.ok) {
      state = response.state;
      if (response.runtime !== undefined) runtime = response.runtime;
      errorMessage = '';
      return true;
    }
    if (response.state !== undefined) state = response.state;
    errorMessage = uiText('popup.error.safe', locale);
    return false;
  }

  async function loadWorkflow(): Promise<void> {
    acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
  }

  function acceptTemporaryRuleResponse(response: PopupTemporaryRuleCommandResponse): boolean {
    if (response.ok) {
      temporaryRuleView = response.view;
      errorMessage = '';
      return true;
    }
    if (response.view !== undefined) temporaryRuleView = response.view;
    errorMessage = uiText('popup.error.safe', locale);
    return false;
  }

  async function loadTemporaryRules(): Promise<void> {
    acceptTemporaryRuleResponse(await sendPopupTemporaryRuleCommand({ action: 'get' }));
  }

  async function loadProxyOwnership(): Promise<void> {
    const response = await sendProxyOwnershipCommand();
    if (response.ok) {
      proxyOwnership = response.view;
      return;
    }
    proxyOwnership = {
      family: 'chromium',
      controlLevel: 'not-controllable',
      blocked: true,
      reason: 'unknown',
    };
    errorMessage = uiText('popup.error.safe', locale);
  }

  function ownershipMessage(reason: ProxyOwnershipBlockReason | undefined): string {
    if (reason === 'app') return uiText('popup.ownership.app', locale);
    if (reason === 'policy') return uiText('popup.ownership.policy', locale);
    if (reason === 'disabled') return uiText('popup.ownership.disabled', locale);
    return uiText('popup.ownership.unknown', locale);
  }

  function validateExternalProfileName(): string {
    const name = externalProfileName.trim();
    if (!name) return uiText('popup.name.required', locale);
    if (name.startsWith('_')) return uiText('popup.name.underscore', locale);
    if (state?.applied.profiles.some((profile) => profile.name === name)) {
      return uiText('popup.name.duplicate', locale);
    }
    return '';
  }

  function openExternalProfileForm(): void {
    externalProfileName = '';
    externalProfileNameError = '';
    externalProfileFormOpen = true;
  }

  function closeExternalProfileForm(): void {
    externalProfileFormOpen = false;
    externalProfileName = '';
    externalProfileNameError = '';
  }

  async function importExternalProfile(): Promise<void> {
    if (!state || importingExternalProfile) return;
    externalProfileNameError = validateExternalProfileName();
    if (externalProfileNameError) return;
    importingExternalProfile = true;
    errorMessage = '';
    try {
      const accepted = acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'import-external-profile',
          expectedAppliedRevisionId: state.applied.revision.id,
          name: externalProfileName.trim(),
        }),
      );
      if (accepted) window.close();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
    } finally {
      importingExternalProfile = false;
    }
  }

  async function openExtensionManager(): Promise<void> {
    if (!proxyOwnership || openingExtensionManager) return;
    openingExtensionManager = true;
    errorMessage = '';
    try {
      const url = proxyOwnership.family === 'firefox' ? 'about:addons' : 'chrome://extensions/';
      await browser.tabs.create({ url });
      window.close();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
      openingExtensionManager = false;
    }
  }

  function closePopup(): void {
    window.close();
  }

  function acceptRequestDiagnosticsResponse(response: RequestDiagnosticsCommandResponse): boolean {
    if (response.ok) {
      requestDiagnostics = response.view;
      return true;
    }
    errorMessage = uiText('popup.error.safe', locale);
    return false;
  }

  async function loadRequestDiagnostics(): Promise<void> {
    if (currentSite?.tabId === undefined) return;
    acceptRequestDiagnosticsResponse(
      await sendRequestDiagnosticsCommand({ action: 'summary', tabId: currentSite.tabId }),
    );
  }

  async function openRequestDiagnostics(): Promise<void> {
    if (currentSite?.tabId === undefined || openingRequestDiagnostics) return;
    openingRequestDiagnostics = true;
    try {
      await browser.tabs.create({
        url: new URL(`/network.html?tabId=${currentSite.tabId}`, location.href).href,
      });
      window.close();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
      openingRequestDiagnostics = false;
    }
  }

  async function loadCurrentSite(): Promise<void> {
    const requested = new URLSearchParams(window.location.search).get('activeTabId');
    const explicitTabId = requested && /^\d+$/u.test(requested) ? Number(requested) : undefined;
    const activeSite = await inspectActiveCurrentSite(explicitTabId);
    currentSite = activeSite;
    inspectingContextTarget = false;
    if (activeSite?.tabId === undefined) return;
    const response = await sendInspectCommand(activeSite.tabId);
    if (!response.ok || !response.view.url) return;
    const inspected = inspectCurrentSiteUrl(response.view.url, activeSite.tabId);
    if (!inspected) return;
    currentSite = inspected;
    inspectingContextTarget = true;
  }

  async function loadPopup(): Promise<void> {
    loading = true;
    try {
      await Promise.all([
        loadWorkflow(),
        loadCurrentSite(),
        loadTemporaryRules(),
        loadProxyOwnership(),
      ]);
      await loadRequestDiagnostics();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
    } finally {
      loading = false;
    }
  }

  async function setTemporaryRule(key: string): Promise<void> {
    if (!state || !currentSite || settingTemporaryRule) return;
    const selected = temporaryResultItems.find((item) => item.key === key);
    if (!selected) return;
    settingTemporaryRule = true;
    temporaryMenuOpen = false;
    errorMessage = '';
    try {
      const accepted = acceptTemporaryRuleResponse(
        await sendPopupTemporaryRuleCommand({
          action: 'toggle',
          expectedAppliedRevisionId: state.applied.revision.id,
          domain: currentSite.domain,
          route: selected.route,
        }),
      );
      if (accepted) window.close();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
    } finally {
      settingTemporaryRule = false;
    }
  }

  async function openTemporaryRules(): Promise<void> {
    if (openingTemporaryRules) return;
    openingTemporaryRules = true;
    try {
      await browser.tabs.create({ url: browser.runtime.getURL('/temp-rules.html') });
      window.close();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
      openingTemporaryRules = false;
    }
  }

  async function activateRoute(item: QuickSwitchItem): Promise<void> {
    if (!state || switching || !item.available || sameRoute(runtime?.activeRoute, item.route))
      return;
    switching = true;
    errorMessage = '';
    try {
      acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'activate-route',
          expectedAppliedRevisionId: state.applied.revision.id,
          route: item.route,
        }),
      );
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
    } finally {
      switching = false;
    }
  }

  function suggestedCondition(): PopupSiteCondition | undefined {
    return currentSite
      ? suggestCurrentSiteCondition(currentSite, conditionKind, subdomainLevel)
      : undefined;
  }

  function refreshConditionPattern(): void {
    conditionPattern = suggestedCondition()?.pattern ?? '';
  }

  function openConditionForm(): void {
    if (!state || !currentSite || !activeSwitch || resultItems.length === 0) return;
    conditionKind = 'host-wildcard';
    subdomainLevel = 0;
    refreshConditionPattern();
    const defaultKey = routeKey(activeSwitch.defaultRoute);
    conditionRouteKey = resultItems.some((item) => item.key === defaultKey)
      ? defaultKey
      : (resultItems[0]?.key ?? '');
    conditionFormOpen = true;
    errorMessage = '';
  }

  function changeConditionKind(event: Event): void {
    conditionKind = (event.currentTarget as HTMLSelectElement).value as PopupConditionKind;
    refreshConditionPattern();
  }

  function cycleSubdomainScope(): void {
    if (!currentSite?.subdomain) return;
    subdomainLevel = (subdomainLevel + 1) % (currentSite.subdomain.split('.').length + 1);
    refreshConditionPattern();
  }

  async function addCurrentSiteCondition(): Promise<void> {
    if (!state || !activeSwitch || !conditionPattern || addingCondition) return;
    const resultItem = resultItems.find((item) => item.key === conditionRouteKey);
    if (!resultItem) return;
    const suggested = suggestedCondition();
    if (!suggested) return;
    const condition = { ...suggested, pattern: conditionPattern } as PopupSiteCondition;
    addingCondition = true;
    errorMessage = '';
    try {
      const accepted = acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'add-current-site-condition',
          expectedAppliedRevisionId: state.applied.revision.id,
          switchProfileId: activeSwitch.id,
          ruleId: `popup-rule-${crypto.randomUUID()}`,
          condition,
          route: resultItem.route,
        }),
      );
      if (accepted) window.close();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
    } finally {
      addingCondition = false;
    }
  }

  async function openOptions(): Promise<void> {
    if (openingSettings) return;
    openingSettings = true;
    errorMessage = '';
    try {
      await browser.runtime.openOptionsPage();
      window.close();
    } catch {
      errorMessage = uiText('popup.error.safe', locale);
      openingSettings = false;
    }
  }

  onMount(() => {
    applyThemeMode(readThemeMode());
    void loadPopup();
  });
</script>

<main
  class="popup-shell"
  data-popup-locale={locale}
  data-typed-locale={locale}
  aria-label={uiText('popup.switcherAria', locale)}
  aria-busy={loading ||
    switching ||
    addingCondition ||
    settingTemporaryRule ||
    importingExternalProfile}
>
  <section aria-label={uiText('popup.profilesAria', locale)} class="profile-list">
    {#if loading}
      <p class="settings-error" role="status">{uiText('popup.loading', locale)}</p>
    {:else if proxyOwnership?.blocked}
      <section
        class="proxy-not-controllable"
        data-popup-proxy-not-controllable
        data-reason={proxyOwnership.reason ?? 'unknown'}
        aria-live="assertive"
      >
        <p class="proxy-control-message">{ownershipMessage(proxyOwnership.reason)}</p>
        <p class="proxy-control-details">
          {uiText('popup.ownership.details', locale)}
        </p>
        <div class="proxy-control-actions">
          <button type="button" onclick={closePopup}>{uiText('popup.cancel', locale)}</button>
          <button
            type="button"
            class="primary"
            data-popup-manage-extensions
            disabled={openingExtensionManager}
            onclick={() => void openExtensionManager()}
          >
            {uiText('popup.manageExtensions', locale)}
          </button>
        </div>
      </section>
    {:else if items.length === 0}
      <p class="settings-error" role="status">{uiText('popup.noRoutes', locale)}</p>
    {:else}
      {#each items as item, index (item.key)}
        {#if index === 2}<div class="profile-divider" role="separator"></div>{/if}
        <div class="profile-row">
          <button
            class:active={sameRoute(runtime?.activeRoute, item.route)}
            type="button"
            disabled={switching ||
              addingCondition ||
              settingTemporaryRule ||
              !item.available ||
              sameRoute(runtime?.activeRoute, item.route)}
            title={item.reason ??
              (sameRoute(runtime?.activeRoute, item.route)
                ? uiMessage('popup.profileActive', { name: item.name }, locale)
                : uiMessage('popup.activateProfile', { name: item.name }, locale))}
            onclick={() => activateRoute(item)}
          >
            <OriginalPopupIcon kind={item.kind} color={item.color} />
            <span class="profile-name">{item.name}</span>
            {#if item.kind === 'direct' || item.kind === 'system'}
              <OriginalPopupIcon kind="globe" color={item.color} position="trailing" />
            {/if}
          </button>
        </div>
      {/each}
      {#if proxyOwnership?.externalProfile}
        <div class="profile-divider" role="separator"></div>
        <div class="external-profile-row" data-popup-external-profile>
          {#if externalProfileFormOpen}
            <form
              class="external-profile-form"
              data-popup-external-profile-form
              onsubmit={(event) => {
                event.preventDefault();
                void importExternalProfile();
              }}
            >
              <label>
                {uiText('popup.profileName', locale)}
                <input
                  aria-label={uiText('popup.externalNameAria', locale)}
                  bind:value={externalProfileName}
                  placeholder={uiText('popup.externalProfile', locale)}
                  oninput={() => (externalProfileNameError = '')}
                />
              </label>
              {#if externalProfileNameError}
                <p class="external-profile-error" role="alert">{externalProfileNameError}</p>
              {/if}
              <div class="external-profile-actions">
                <button
                  type="button"
                  disabled={importingExternalProfile}
                  onclick={closeExternalProfileForm}
                >
                  {uiText('popup.cancel', locale)}
                </button>
                <button type="submit" class="primary" disabled={importingExternalProfile}>
                  {uiText(importingExternalProfile ? 'popup.saving' : 'popup.saveName', locale)}
                </button>
              </div>
            </form>
          {:else}
            <button
              type="button"
              class="external-profile-button"
              disabled={switching || importingExternalProfile}
              onclick={openExternalProfileForm}
            >
              <OriginalPopupIcon
                kind={proxyOwnership.externalProfile.kind}
                color={proxyOwnership.externalProfile.kind === 'fixed' ? '#64b5f6' : '#ffb74d'}
              />
              <span>{uiText('popup.externalProfile', locale)}</span>
            </button>
          {/if}
        </div>
      {/if}
    {/if}
  </section>

  {#if !loading && !proxyOwnership?.blocked && inspectingContextTarget && currentSite}
    <section class="inspect-target" data-popup-inspect-target aria-live="polite">
      <strong>{uiText('popup.inspectingContext', locale)}</strong>
      <span>{currentSite.hostname}</span>
    </section>
  {/if}

  {#if !loading && !proxyOwnership?.blocked && currentSite && requestDiagnostics?.active && requestDiagnostics.errorCount + requestDiagnostics.timeoutCount > 0}
    <section class="request-diagnostics-summary" data-popup-request-diagnostics>
      <div>
        <strong>
          {uiMessage(
            'popup.requestErrors',
            { count: requestDiagnostics.errorCount + requestDiagnostics.timeoutCount },
            locale,
          )}
        </strong>
        <span>
          {requestDiagnostics.domains
            .slice(0, 3)
            .map((entry) => `${entry.domain} (${entry.count})`)
            .join(', ')}
        </span>
      </div>
      <button
        type="button"
        data-popup-open-request-diagnostics
        disabled={openingRequestDiagnostics}
        onclick={() => void openRequestDiagnostics()}
      >
        {uiText('popup.inspectRequests', locale)}
      </button>
    </section>
  {/if}

  {#if !loading && !proxyOwnership?.blocked && currentSite && activeSwitch && resultItems.length > 0}
    {#if conditionFormOpen}
      <form
        class="condition-form"
        data-popup-condition-form
        onsubmit={(event) => {
          event.preventDefault();
          void addCurrentSiteCondition();
        }}
      >
        <h2>{uiMessage('popup.addConditionTitle', { name: activeSwitch.name }, locale)}</h2>
        <p class="condition-domain">
          {uiMessage('popup.currentSite', { hostname: currentSite.hostname }, locale)}
        </p>
        {#if currentSite.subdomain}
          <button class="scope-button" type="button" onclick={cycleSubdomainScope}>
            {uiMessage(
              'popup.scope',
              { domain: currentSiteDomainForLevel(currentSite, subdomainLevel) },
              locale,
            )}
          </button>
        {/if}
        <label>
          {uiText('popup.conditionType', locale)}
          <select
            aria-label={uiText('popup.conditionTypeAria', locale)}
            value={conditionKind}
            onchange={changeConditionKind}
          >
            {#each conditionKinds as kind}
              <option value={kind.value}>{uiText(kind.labelKey, locale)}</option>
            {/each}
          </select>
        </label>
        <label>
          {uiText('popup.pattern', locale)}
          <input aria-label={uiText('popup.patternAria', locale)} bind:value={conditionPattern} />
        </label>
        <label>
          {uiText('popup.resultProfile', locale)}
          <select
            aria-label={uiText('popup.resultProfileAria', locale)}
            bind:value={conditionRouteKey}
          >
            {#each resultItems as item}
              <option value={item.key}>{item.name}</option>
            {/each}
          </select>
        </label>
        <div class="condition-actions">
          <button
            type="button"
            onclick={() => (conditionFormOpen = false)}
            disabled={addingCondition}>{uiText('popup.cancel', locale)}</button
          >
          <button
            type="submit"
            disabled={addingCondition || !conditionPattern || !conditionRouteKey}
          >
            {uiText(addingCondition ? 'popup.adding' : 'popup.addCondition', locale)}
          </button>
        </div>
      </form>
    {:else}
      <section
        class="current-site-action"
        aria-label={uiText('popup.currentSiteActionsAria', locale)}
      >
        <button
          class="original-site-action-row"
          type="button"
          data-popup-add-current-site
          onclick={openConditionForm}
        >
          <OriginalPopupIcon kind="plus" color="#337ab7" />
          <span data-popup-add-current-site-label>{uiText('popup.addCondition', locale)}</span>
        </button>
      </section>
    {/if}
  {/if}

  {#if !conditionFormOpen && !loading && !proxyOwnership?.blocked && currentSite && temporaryResultItems.length > 0}
    <section
      class="temporary-rule-action"
      data-popup-temporary-rule
      aria-label={uiText('popup.temporaryRulesAria', locale)}
    >
      <button
        class="original-temporary-rule-toggle"
        type="button"
        data-popup-temporary-rule-toggle
        aria-expanded={temporaryMenuOpen}
        aria-label={uiMessage('popup.temporaryFor', { domain: currentSite.domain }, locale)}
        disabled={settingTemporaryRule || switching || addingCondition}
        onclick={() => (temporaryMenuOpen = !temporaryMenuOpen)}
      >
        <OriginalPopupIcon kind="filter" color="#337ab7" />
        <span class="original-temporary-rule-domain" data-popup-temporary-domain>
          {currentSite.domain}
        </span>
        <span class="om-caret" aria-hidden="true"></span>
      </button>
      {#if temporaryMenuOpen}
        <ul class="original-temporary-rule-menu" data-popup-temporary-rule-menu role="menu">
          {#each temporaryResultItems as item}
            <li>
              <button
                type="button"
                role="menuitem"
                class:active={sameRoute(currentTemporaryRoute, item.route)}
                data-popup-temporary-rule-option={item.key}
                disabled={settingTemporaryRule || switching || addingCondition}
                onclick={() => void setTemporaryRule(item.key)}
              >
                {item.name}
              </button>
            </li>
          {/each}
          {#if (temporaryRuleView?.rules.length ?? 0) > 0}
            <li class="original-temporary-rule-menu-divider" role="separator"></li>
            <li>
              <button
                type="button"
                role="menuitem"
                data-popup-manage-temporary-rules
                disabled={openingTemporaryRules || settingTemporaryRule}
                onclick={() => void openTemporaryRules()}
              >
                {uiMessage(
                  'popup.manageTemporary',
                  { count: temporaryRuleView?.rules.length ?? 0 },
                  locale,
                )}
              </button>
            </li>
          {/if}
        </ul>
      {/if}
    </section>
  {/if}

  <footer class="popup-footer">
    <button
      class="settings-button"
      type="button"
      onclick={openOptions}
      disabled={openingSettings}
      aria-label={uiText('popup.optionsAria', locale)}
    >
      <OriginalPopupIcon kind="wrench" color="#337ab7" position="options" />
      <span>{uiText(openingSettings ? 'popup.opening' : 'popup.options', locale)}</span>
    </button>
  </footer>

  {#if errorMessage}<p class="settings-error" role="alert">{errorMessage}</p>{/if}
</main>
