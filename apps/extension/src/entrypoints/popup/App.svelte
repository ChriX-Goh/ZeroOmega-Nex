<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import type {
    ProfileRouteTarget,
    ProfileSpec,
    SwitchProfile,
    UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    listPopupConditionResultRoutes,
    listPopupProfileResultRoutes,
    type PopupSiteCondition,
    type ProfileWorkflowCommandResponse,
    type ProfileWorkflowRuntimeView,
    type ProfileWorkflowState,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import {
    currentSiteDomainForLevel,
    inspectActiveCurrentSite,
    suggestCurrentSiteCondition,
    type CurrentSiteInfo,
    type PopupConditionKind,
  } from '../../lib/current-site';
  import { translate } from '../../lib/i18n';
  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';

  interface QuickSwitchItem {
    readonly key: string;
    readonly route: ProfileRouteTarget;
    readonly name: string;
    readonly color: string;
    readonly kind: UserProfile['kind'] | 'direct' | 'system' | 'external';
    readonly available: boolean;
    readonly reason?: string;
    readonly profileId?: string;
    readonly resultRoute?: ProfileRouteTarget;
    readonly resultItems?: readonly ResultRouteItem[];
  }

  interface ResultRouteItem {
    readonly key: string;
    readonly route: ProfileRouteTarget;
    readonly name: string;
  }

  const conditionKinds: readonly { value: PopupConditionKind; label: string }[] = [
    { value: 'host-wildcard', label: 'Host wildcard' },
    { value: 'host-regex', label: 'Host regular expression' },
    { value: 'url-wildcard', label: 'URL wildcard' },
    { value: 'url-regex', label: 'URL regular expression' },
    { value: 'keyword', label: 'URL keyword' },
  ];

  let state: ProfileWorkflowState | undefined;
  let runtime: ProfileWorkflowRuntimeView | undefined;
  let currentSite: CurrentSiteInfo | undefined;
  let loading = true;
  let switching = false;
  let addingCondition = false;
  let settingResult = false;
  let openingSettings = false;
  let conditionFormOpen = false;
  let conditionKind: PopupConditionKind = 'host-wildcard';
  let conditionPattern = '';
  let conditionRouteKey = '';
  let subdomainLevel = 0;
  let errorMessage = '';

  let items: readonly QuickSwitchItem[] = [];
  let activeSwitch: SwitchProfile | undefined;
  let resultItems: readonly ResultRouteItem[] = [];
  $: items = state ? quickSwitchItems(state.applied) : [];
  $: activeSwitch = activeSwitchProfile(state?.applied, runtime?.activeRoute);
  $: resultItems = state && activeSwitch ? popupResultItems(state.applied, activeSwitch.id) : [];

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
    if (route.kind === 'direct') return translate('Direct');
    if (route.kind === 'system') return translate('System Proxy');
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ??
      translate('Missing profile')
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

  function configuredResultRoute(profile: UserProfile): ProfileRouteTarget | undefined {
    if (profile.kind === 'switch') return profile.defaultRoute;
    if (profile.kind === 'virtual') return profile.targetRoute;
    return undefined;
  }

  function popupProfileResultItems(
    spec: ProfileSpec,
    profileId: string,
  ): readonly ResultRouteItem[] {
    return listPopupProfileResultRoutes(spec, profileId).map((route) => ({
      key: routeKey(route),
      route,
      name: routeName(spec, route),
    }));
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
          name: translate('Direct'),
          color: spec.settings.interface.builtInProfiles?.direct?.color ?? '#bdbdbd',
          kind: 'direct',
          available: true,
        };
      }
      if (route.kind === 'system') {
        return {
          key: routeKey(route),
          route,
          name: translate('System Proxy'),
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
          name: translate('Missing profile'),
          color: '#9e9e9e',
          kind: 'external',
          available: false,
          reason: `Profile ${route.profileId} is missing from the applied configuration.`,
        };
      }
      const resultRoute = configuredResultRoute(profile);
      const profileResultItems = resultRoute
        ? popupProfileResultItems(spec, profile.id)
        : undefined;
      return {
        key: routeKey(route),
        route,
        name: profile.name,
        color: profile.color ?? '#90a4ae',
        kind: profile.kind,
        available: profile.enabled !== false,
        profileId: profile.id,
        ...(resultRoute === undefined ? {} : { resultRoute }),
        ...(profileResultItems === undefined ? {} : { resultItems: profileResultItems }),
        ...(profile.enabled === false ? { reason: `${profile.name} is disabled.` } : {}),
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
    errorMessage = response.message;
    return false;
  }

  async function loadWorkflow(): Promise<void> {
    acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
  }

  async function loadCurrentSite(): Promise<void> {
    const requested = new URLSearchParams(window.location.search).get('activeTabId');
    const explicitTabId = requested && /^\d+$/u.test(requested) ? Number(requested) : undefined;
    currentSite = await inspectActiveCurrentSite(explicitTabId);
  }

  async function loadPopup(): Promise<void> {
    loading = true;
    try {
      await Promise.all([loadWorkflow(), loadCurrentSite()]);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      loading = false;
    }
  }

  async function setProfileResult(item: QuickSwitchItem, event: Event): Promise<void> {
    if (!state || !item.profileId || !item.resultItems || settingResult) return;
    const key = (event.currentTarget as HTMLSelectElement).value;
    const selected = item.resultItems.find((candidate) => candidate.key === key);
    if (!selected || (item.resultRoute && sameRoute(item.resultRoute, selected.route))) return;
    settingResult = true;
    errorMessage = '';
    try {
      const accepted = acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'set-popup-profile-result',
          expectedAppliedRevisionId: state.applied.revision.id,
          profileId: item.profileId,
          route: selected.route,
        }),
      );
      if (accepted) window.close();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      settingResult = false;
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
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
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
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
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
    } catch (error) {
      console.error('Unable to open the ZeroOmega Nex options page.', error);
      errorMessage = 'Unable to open Options.';
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
  aria-label="ZeroOmega Nex profile switcher"
  aria-busy={loading || switching || addingCondition || settingResult}
>
  <section aria-label="Profiles" class="profile-list">
    {#if loading}
      <p class="settings-error" role="status">Loading applied profiles…</p>
    {:else if !state?.applied.settings.quickSwitch.enabled}
      <p class="settings-error" role="status">Quick switching is disabled in Options.</p>
    {:else if items.length === 0}
      <p class="settings-error" role="status">No quick-switch routes are configured.</p>
    {:else}
      {#each items as item, index (item.key)}
        {#if index === 2}<div class="profile-divider" role="separator"></div>{/if}
        <div class:has-result={item.resultRoute !== undefined} class="profile-row">
          <button
            class:active={sameRoute(runtime?.activeRoute, item.route)}
            type="button"
            disabled={switching ||
              addingCondition ||
              settingResult ||
              !item.available ||
              sameRoute(runtime?.activeRoute, item.route)}
            title={item.reason ??
              (sameRoute(runtime?.activeRoute, item.route)
                ? `${item.name} is active`
                : `Activate ${item.name}`)}
            onclick={() => activateRoute(item)}
          >
            <ProfileIcon kind={item.kind} color={item.color} size={21} />
            <span class="profile-name">
              {item.name}
              {#if item.resultRoute && state}
                <span class="profile-result-label"
                  >[{routeName(state.applied, item.resultRoute)}]</span
                >
              {/if}
            </span>
            {#if sameRoute(runtime?.activeRoute, item.route)}
              <svg class="current-mark" viewBox="0 0 16 16" aria-label="Current profile">
                <path d="m3.2 8.3 2.8 2.8 6.8-7" />
              </svg>
            {/if}
          </button>
          {#if item.resultRoute && item.resultItems && item.resultItems.length > 0}
            <label class="profile-result-control">
              <span>Result</span>
              <select
                data-popup-result-profile
                aria-label={`Result profile for ${item.name}`}
                value={routeKey(item.resultRoute)}
                disabled={settingResult || switching || addingCondition || !item.available}
                onchange={(event) => void setProfileResult(item, event)}
              >
                {#each item.resultItems as result}
                  <option value={result.key}>{result.name}</option>
                {/each}
              </select>
            </label>
          {/if}
        </div>
      {/each}
    {/if}
  </section>

  {#if !loading && currentSite && activeSwitch && resultItems.length > 0}
    {#if conditionFormOpen}
      <form
        class="condition-form"
        data-popup-condition-form
        onsubmit={(event) => {
          event.preventDefault();
          void addCurrentSiteCondition();
        }}
      >
        <h2>Add condition to {activeSwitch.name}</h2>
        <p class="condition-domain">Current site: {currentSite.hostname}</p>
        {#if currentSite.subdomain}
          <button class="scope-button" type="button" onclick={cycleSubdomainScope}>
            Scope: {currentSiteDomainForLevel(currentSite, subdomainLevel)}
          </button>
        {/if}
        <label>
          Condition type
          <select
            aria-label="Current site condition type"
            value={conditionKind}
            onchange={changeConditionKind}
          >
            {#each conditionKinds as kind}
              <option value={kind.value}>{kind.label}</option>
            {/each}
          </select>
        </label>
        <label>
          Pattern
          <input aria-label="Current site condition pattern" bind:value={conditionPattern} />
        </label>
        <label>
          Result profile
          <select aria-label="Current site result profile" bind:value={conditionRouteKey}>
            {#each resultItems as item}
              <option value={item.key}>{item.name}</option>
            {/each}
          </select>
        </label>
        <div class="condition-actions">
          <button
            type="button"
            onclick={() => (conditionFormOpen = false)}
            disabled={addingCondition}>Cancel</button
          >
          <button
            type="submit"
            disabled={addingCondition || !conditionPattern || !conditionRouteKey}
          >
            {addingCondition ? 'Adding…' : 'Add condition'}
          </button>
        </div>
      </form>
    {:else}
      <section class="current-site-action" aria-label="Current site actions">
        <button type="button" data-popup-add-current-site onclick={openConditionForm}>
          Add condition for {currentSite.domain}
        </button>
      </section>
    {/if}
  {/if}

  <footer class="popup-footer">
    <button
      class="settings-button"
      type="button"
      onclick={openOptions}
      disabled={openingSettings}
      aria-label="Open ZeroOmega Nex options"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M8.8 2.2h2.4l.5 1.8c.5.2 1 .5 1.4.8l1.8-.5 1.2 2.1-1.3 1.3c.1.5.1 1.1 0 1.6l1.3 1.3-1.2 2.1-1.8-.5c-.4.4-.9.6-1.4.8l-.5 1.8H8.8L8.3 13a5 5 0 0 1-1.4-.8l-1.8.5-1.2-2.1 1.3-1.3a6 6 0 0 1 0-1.6L3.9 6.4l1.2-2.1 1.8.5c.4-.3.9-.6 1.4-.8l.5-1.8Z"
        />
        <circle cx="10" cy="8.5" r="2.2" />
      </svg>
      <span>{openingSettings ? 'Opening…' : 'Options'}</span>
    </button>
    <span class="product-name">{switching ? 'Switching…' : productIdentity.name}</span>
  </footer>

  {#if errorMessage}<p class="settings-error" role="alert">{errorMessage}</p>{/if}
</main>
