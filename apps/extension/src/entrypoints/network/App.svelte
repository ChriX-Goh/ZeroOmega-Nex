<script lang="ts">
  import { onMount } from 'svelte';

  import { translate } from '../../lib/i18n';
  import {
    requestRequestDiagnosticsPermission,
    sendRequestDiagnosticsCommand,
  } from '../../lib/request-diagnostics-client';
  import type { RequestDiagnosticsView } from '../../lib/request-diagnostics-model';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';

  const parsedTabId = Number.parseInt(new URLSearchParams(location.search).get('tabId') ?? '', 10);
  const tabId = Number.isInteger(parsedTabId) && parsedTabId >= 0 ? parsedTabId : undefined;
  let view: RequestDiagnosticsView | undefined;
  let loading = true;
  let clearing = false;
  let changingSession = false;
  let errorMessage = '';

  async function command(action: 'get' | 'clear' | 'start' | 'stop'): Promise<void> {
    const response = await sendRequestDiagnosticsCommand({
      action,
      ...(tabId === undefined ? {} : { tabId }),
    });
    if (!response.ok) throw new Error(response.message);
    view = response.view;
    errorMessage = '';
  }

  async function load(): Promise<void> {
    try {
      await command('get');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      loading = false;
    }
  }

  async function clear(): Promise<void> {
    if (clearing) return;
    clearing = true;
    try {
      await command('clear');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
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
        if (!granted) throw new Error(translate('Request monitoring permission was not granted.'));
      }
      await command('start');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      changingSession = false;
    }
  }

  async function stop(): Promise<void> {
    if (changingSession) return;
    changingSession = true;
    try {
      await command('stop');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      changingSession = false;
    }
  }

  function formatTime(value: number): string {
    return new Date(value).toLocaleTimeString();
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

<main class="network-shell" aria-busy={loading || clearing || changingSession}>
  <header>
    <div>
      <h1>{translate('Request diagnostics')}</h1>
      <p>{translate('Failed and timed-out requests for this browser session.')}</p>
    </div>
    <div class="header-actions">
      {#if view?.active}
        <button
          type="button"
          data-request-diagnostics-stop
          disabled={changingSession}
          onclick={() => void stop()}
        >
          {translate('Stop monitoring')}
        </button>
      {:else}
        <button
          type="button"
          data-request-diagnostics-start
          disabled={changingSession || view?.enabled === false}
          onclick={() => void start()}
        >
          {translate('Start monitoring')}
        </button>
      {/if}
      <button type="button" disabled={loading} onclick={() => void load()}
        >{translate('Refresh')}</button
      >
      <button
        type="button"
        data-request-diagnostics-clear
        disabled={clearing || (view?.records.length ?? 0) === 0}
        onclick={() => void clear()}
      >
        {translate('Clear diagnostics')}
      </button>
    </div>
  </header>

  {#if errorMessage}<p class="message error" role="alert">{errorMessage}</p>{/if}
  {#if view && !view.enabled}
    <p class="message">{translate('Monitoring is disabled in Options.')}</p>
  {:else if view && !view.active}
    <section class="message permission" data-request-diagnostics-stopped>
      <strong>{translate('Monitoring is stopped for this browser session.')}</strong>
      {#if !view.permissionGranted}<span
          >{translate('Permission will be requested when monitoring starts.')}</span
        >{/if}
    </section>
  {:else if loading}
    <p class="message" role="status">{translate('Loading…')}</p>
  {:else if !view || view.records.length === 0}
    <p class="message" role="status">{translate('No request errors recorded.')}</p>
  {:else}
    <p class="bounds" data-request-diagnostics-bounds>
      {view.records.length} records · max {view.perTabLimit} per tab · max {view.globalLimit} total ·
      retained {Math.round(view.retentionMs / 60_000)} minutes
    </p>
    <table data-request-diagnostics-table>
      <thead>
        <tr>
          <th>{translate('Time')}</th>
          <th>{translate('Status')}</th>
          <th>{translate('Type')}</th>
          <th>{translate('URL')}</th>
          <th>{translate('Error')}</th>
        </tr>
      </thead>
      <tbody>
        {#each view.records as record (`${record.tabId}:${record.requestId}`)}
          <tr data-request-diagnostic-status={record.status}>
            <td>{formatTime(record.failedAt)}</td>
            <td>{record.status === 'timeout' ? translate('Timed out') : translate('Failed')}</td>
            <td>{record.resourceType}</td>
            <td><code>{record.url}</code></td>
            <td>{record.error ?? 'ERR_TIMEOUT'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>
