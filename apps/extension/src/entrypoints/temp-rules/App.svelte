<script lang="ts">
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
  class="manager-shell"
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
        type="button"
        data-temp-rules-clear
        disabled={changing}
        onclick={() => void clearAll()}
      >
        {uiText('tempRules.clearAll', locale)}
      </button>
    {/if}
  </header>

  {#if errorMessage}<p class="message error" role="alert">{errorMessage}</p>{/if}
  {#if loading}
    <p class="message" role="status">{uiText('tempRules.loading', locale)}</p>
  {:else if !workflow || !temporary || temporary.rules.length === 0}
    <p class="message" role="status">{uiText('tempRules.empty', locale)}</p>
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
                type="button"
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
