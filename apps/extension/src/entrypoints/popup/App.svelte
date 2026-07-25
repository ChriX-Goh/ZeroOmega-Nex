<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import type { ProfileRouteTarget, ProfileSpec, UserProfile } from '@zeroomega-nex/profile-spec';
  import type {
    ProfileWorkflowCommandResponse,
    ProfileWorkflowRuntimeView,
    ProfileWorkflowState,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import { translate } from '../../lib/i18n';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';
  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';

  interface QuickSwitchItem {
    readonly key: string;
    readonly route: ProfileRouteTarget;
    readonly name: string;
    readonly color: string;
    readonly kind: UserProfile['kind'] | 'direct' | 'system' | 'external';
    readonly available: boolean;
    readonly reason?: string;
  }

  let state: ProfileWorkflowState | undefined;
  let runtime: ProfileWorkflowRuntimeView | undefined;
  let loading = true;
  let switching = false;
  let openingSettings = false;
  let errorMessage = '';

  let items: readonly QuickSwitchItem[] = [];
  $: items = state ? quickSwitchItems(state.applied) : [];

  function sameRoute(left: ProfileRouteTarget | undefined, right: ProfileRouteTarget): boolean {
    if (left?.kind !== right.kind) return false;
    return (
      left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId)
    );
  }

  function routeKey(route: ProfileRouteTarget): string {
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
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
      return {
        key: routeKey(route),
        route,
        name: profile.name,
        color: profile.color ?? '#90a4ae',
        kind: profile.kind,
        available: profile.enabled !== false,
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
    loading = true;
    try {
      acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      loading = false;
    }
  }

  async function activateRoute(item: QuickSwitchItem): Promise<void> {
    if (!state || switching || !item.available || sameRoute(runtime?.activeRoute, item.route)) return;
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
    void loadWorkflow();
  });
</script>

<main class="popup-shell" aria-label="ZeroOmega Nex profile switcher" aria-busy={loading || switching}>
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
        <button
          class:active={sameRoute(runtime?.activeRoute, item.route)}
          type="button"
          disabled={switching || !item.available || sameRoute(runtime?.activeRoute, item.route)}
          title={item.reason ??
            (sameRoute(runtime?.activeRoute, item.route)
              ? `${item.name} is active`
              : `Activate ${item.name}`)}
          onclick={() => activateRoute(item)}
        >
          <ProfileIcon kind={item.kind} color={item.color} size={21} />
          <span class="profile-name">{item.name}</span>
          {#if sameRoute(runtime?.activeRoute, item.route)}
            <svg class="current-mark" viewBox="0 0 16 16" aria-label="Current profile">
              <path d="m3.2 8.3 2.8 2.8 6.8-7" />
            </svg>
          {/if}
        </button>
      {/each}
    {/if}
  </section>

  <footer class="popup-footer">
    <button
      class="settings-button"
      type="button"
      onclick={openOptions}
      disabled={openingSettings}
      aria-label="Open ZeroOmega Nex options"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M8.8 2.2h2.4l.5 1.8c.5.2 1 .5 1.4.8l1.8-.5 1.2 2.1-1.3 1.3c.1.5.1 1.1 0 1.6l1.3 1.3-1.2 2.1-1.8-.5c-.4.4-.9.6-1.4.8l-.5 1.8H8.8L8.3 13a5 5 0 0 1-1.4-.8l-1.8.5-1.2-2.1 1.3-1.3a6 6 0 0 1 0-1.6L3.9 6.4l1.2-2.1 1.8.5c.4-.3.9-.6 1.4-.8l.5-1.8Z" />
        <circle cx="10" cy="8.5" r="2.2" />
      </svg>
      <span>{openingSettings ? 'Opening…' : 'Options'}</span>
    </button>
    <span class="product-name">{switching ? 'Switching…' : productIdentity.name}</span>
  </footer>

  {#if errorMessage}<p class="settings-error" role="alert">{errorMessage}</p>{/if}
</main>
