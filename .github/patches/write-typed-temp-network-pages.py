from pathlib import Path

ROOT = Path('.')


temp_path = ROOT / 'apps/extension/src/entrypoints/temp-rules/App.svelte'
temp_path.write_text("""<script lang=\"ts\">
  import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
  import type {
    PopupTemporaryRuleView,
    ProfileWorkflowState,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import {
    sendPopupTemporaryRuleCommand,
    type PopupTemporaryRuleCommandResponse,
  } from '../../lib/popup-temporary-rule-client';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';
  import { uiMessage, uiText } from '../../lib/ui-messages';

  export let locale: AppLocale = currentAppLocale();

  let workflow: ProfileWorkflowState | undefined;
  let temporary: PopupTemporaryRuleView | undefined;
  let loading = true;
  let changing = false;
  let errorMessage = '';

  function routeName(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return uiText('route.direct', locale);
    if (route.kind === 'system') return uiText('route.system', locale);
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ??
      uiText('route.missing', locale)
    );
  }

  function setSafeError(): void {
    errorMessage = uiText('tempRules.error.safe', locale);
  }

  function accept(response: PopupTemporaryRuleCommandResponse): boolean {
    if (response.ok) {
      temporary = response.view;
      errorMessage = '';
      return true;
    }
    if (response.view !== undefined) temporary = response.view;
    setSafeError();
    return false;
  }

  async function load(): Promise<void> {
    loading = true;
    try {
      const [workflowResponse, temporaryResponse] = await Promise.all([
        sendProfileWorkflowCommand({ action: 'get' }),
        sendPopupTemporaryRuleCommand({ action: 'get' }),
      ]);
      if (!workflowResponse.ok) {
        setSafeError();
        return;
      }
      workflow = workflowResponse.state;
      accept(temporaryResponse);
    } catch {
      setSafeError();
    } finally {
      loading = false;
    }
  }

  async function remove(domain: string): Promise<void> {
    if (!workflow || changing) return;
    changing = true;
    try {
      accept(
        await sendPopupTemporaryRuleCommand({
          action: 'remove',
          expectedAppliedRevisionId: workflow.applied.revision.id,
          domain,
        }),
      );
    } catch {
      setSafeError();
    } finally {
      changing = false;
    }
  }

  async function clearAll(): Promise<void> {
    if (!workflow || changing) return;
    changing = true;
    try {
      accept(
        await sendPopupTemporaryRuleCommand({
          action: 'clear',
          expectedAppliedRevisionId: workflow.applied.revision.id,
        }),
      );
    } catch {
      setSafeError();
    } finally {
      changing = false;
    }
  }

  onMount(() => {
    applyThemeMode(readThemeMode());
    void load();
  });
</script>

<main
  class=\"manager-shell\"
  data-temp-rules-manager
  data-typed-locale={locale}
  aria-label={uiText('tempRules.pageAria', locale)}
  aria-busy={loading || changing}
>
  <header>
    <div>
      <h1>{uiText('tempRules.title', locale)}</h1>
      <p>{uiText('tempRules.help', locale)}</p>
    </div>
    {#if (temporary?.rules.length ?? 0) > 0}
      <button
        type=\"button\"
        data-temp-rules-clear
        disabled={changing}
        onclick={() => void clearAll()}
      >
        {uiText('tempRules.clearAll', locale)}
      </button>
    {/if}
  </header>

  {#if errorMessage}<p class=\"message error\" role=\"alert\">{errorMessage}</p>{/if}
  {#if loading}
    <p class=\"message\" role=\"status\">{uiText('tempRules.loading', locale)}</p>
  {:else if !workflow || !temporary || temporary.rules.length === 0}
    <p class=\"message\" role=\"status\">{uiText('tempRules.empty', locale)}</p>
  {:else}
    <table data-temp-rules-table aria-label={uiText('tempRules.tableAria', locale)}>
      <thead>
        <tr>
          <th>{uiText('tempRules.domain', locale)}</th>
          <th>{uiText('tempRules.resultProfile', locale)}</th>
          <th>{uiText('tempRules.action', locale)}</th>
        </tr>
      </thead>
      <tbody>
        {#each temporary.rules as rule (rule.domain)}
          <tr data-temp-rule-domain={rule.domain}>
            <td>{rule.domain}</td>
            <td>{routeName(workflow.applied, rule.route)}</td>
            <td>
              <button
                type=\"button\"
                aria-label={uiMessage('tempRules.deleteAria', { domain: rule.domain }, locale)}
                disabled={changing}
                onclick={() => void remove(rule.domain)}>{uiText('common.delete', locale)}</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>
""")

network_path = ROOT / 'apps/extension/src/entrypoints/network/App.svelte'
network_path.write_text("""<script lang=\"ts\">
  import { onMount } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import {
    requestRequestDiagnosticsPermission,
    sendRequestDiagnosticsCommand,
  } from '../../lib/request-diagnostics-client';
  import type { RequestDiagnosticsView } from '../../lib/request-diagnostics-model';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';
  import { uiMessage, uiText } from '../../lib/ui-messages';

  export let locale: AppLocale = currentAppLocale();

  function requestedTabId(): number | undefined {
    if (typeof location === 'undefined') return undefined;
    const parsed = Number.parseInt(new URLSearchParams(location.search).get('tabId') ?? '', 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
  }

  const tabId = requestedTabId();
  let view: RequestDiagnosticsView | undefined;
  let loading = true;
  let clearing = false;
  let changingSession = false;
  let errorMessage = '';

  function setSafeError(): void {
    errorMessage = uiText('network.error.safe', locale);
  }

  async function command(action: 'get' | 'clear' | 'start' | 'stop'): Promise<boolean> {
    const response = await sendRequestDiagnosticsCommand({
      action,
      ...(tabId === undefined ? {} : { tabId }),
    });
    if (!response.ok) {
      setSafeError();
      return false;
    }
    view = response.view;
    errorMessage = '';
    return true;
  }

  async function load(): Promise<void> {
    try {
      await command('get');
    } catch {
      setSafeError();
    } finally {
      loading = false;
    }
  }

  async function clear(): Promise<void> {
    if (clearing) return;
    clearing = true;
    try {
      await command('clear');
    } catch {
      setSafeError();
    } finally {
      clearing = false;
    }
  }

  async function start(): Promise<void> {
    if (changingSession) return;
    changingSession = true;
    try {
      if (!view?.permissionGranted) {
        const granted = await requestRequestDiagnosticsPermission();
        if (!granted) {
          errorMessage = uiText('network.permissionDenied', locale);
          return;
        }
      }
      await command('start');
    } catch {
      setSafeError();
    } finally {
      changingSession = false;
    }
  }

  async function stop(): Promise<void> {
    if (changingSession) return;
    changingSession = true;
    try {
      await command('stop');
    } catch {
      setSafeError();
    } finally {
      changingSession = false;
    }
  }

  function formatTime(value: number): string {
    return new Date(value).toLocaleTimeString(locale);
  }

  onMount(() => {
    applyThemeMode(readThemeMode());
    let disposed = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    void load().then(() => {
      if (disposed) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'visible' && view?.active) void load();
      }, 1_000);
    });
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
    };
  });
</script>

<main
  class=\"network-shell\"
  data-network-diagnostics
  data-typed-locale={locale}
  aria-label={uiText('network.pageAria', locale)}
  aria-busy={loading || clearing || changingSession}
>
  <header>
    <div>
      <h1>{uiText('network.title', locale)}</h1>
      <p>{uiText('network.help', locale)}</p>
    </div>
    <div class=\"header-actions\">
      {#if view?.active}
        <button
          type=\"button\"
          data-request-diagnostics-stop
          disabled={changingSession}
          onclick={() => void stop()}
        >
          {uiText('network.stop', locale)}
        </button>
      {:else}
        <button
          type=\"button\"
          data-request-diagnostics-start
          disabled={changingSession || view?.enabled === false}
          onclick={() => void start()}
        >
          {uiText('network.start', locale)}
        </button>
      {/if}
      <button type=\"button\" disabled={loading} onclick={() => void load()}
        >{uiText('network.refresh', locale)}</button
      >
      <button
        type=\"button\"
        data-request-diagnostics-clear
        disabled={clearing || (view?.records.length ?? 0) === 0}
        onclick={() => void clear()}
      >
        {uiText('network.clear', locale)}
      </button>
    </div>
  </header>

  {#if errorMessage}<p class=\"message error\" role=\"alert\">{errorMessage}</p>{/if}
  {#if view && !view.enabled}
    <p class=\"message\">{uiText('network.disabled', locale)}</p>
  {:else if view && !view.active}
    <section class=\"message permission\" data-request-diagnostics-stopped>
      <strong>{uiText('network.stopped', locale)}</strong>
      {#if !view.permissionGranted}<span>{uiText('network.permissionPending', locale)}</span>{/if}
    </section>
  {:else if loading}
    <p class=\"message\" role=\"status\">{uiText('network.loading', locale)}</p>
  {:else if !view || view.records.length === 0}
    <p class=\"message\" role=\"status\">{uiText('network.empty', locale)}</p>
  {:else}
    <p class=\"bounds\" data-request-diagnostics-bounds>
      {uiMessage(
        'network.bounds',
        {
          records: view.records.length,
          perTabLimit: view.perTabLimit,
          globalLimit: view.globalLimit,
          minutes: Math.round(view.retentionMs / 60_000),
        },
        locale,
      )}
    </p>
    <table data-request-diagnostics-table aria-label={uiText('network.tableAria', locale)}>
      <thead>
        <tr>
          <th>{uiText('network.time', locale)}</th>
          <th>{uiText('network.status', locale)}</th>
          <th>{uiText('network.type', locale)}</th>
          <th>{uiText('network.url', locale)}</th>
          <th>{uiText('network.error', locale)}</th>
        </tr>
      </thead>
      <tbody>
        {#each view.records as record (`${record.tabId}:${record.requestId}`)}
          <tr data-request-diagnostic-status={record.status}>
            <td>{formatTime(record.failedAt)}</td>
            <td
              >{record.status === 'timeout'
                ? uiText('network.timedOut', locale)
                : uiText('network.failed', locale)}</td
            >
            <td>{record.resourceType}</td>
            <td><code>{record.url}</code></td>
            <td>{record.error ?? 'ERR_TIMEOUT'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>
""")

print('Wrote typed Temporary Rules and Network pages.')
