<script lang="ts">
  import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
  import type {
    PopupTemporaryRuleView,
    ProfileWorkflowState,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import {
    sendPopupTemporaryRuleCommand,
    type PopupTemporaryRuleCommandResponse,
  } from '../../lib/popup-temporary-rule-client';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';

  let workflow: ProfileWorkflowState | undefined;
  let temporary: PopupTemporaryRuleView | undefined;
  let loading = true;
  let changing = false;
  let errorMessage = '';

  function routeName(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return 'Direct';
    if (route.kind === 'system') return 'System Proxy';
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? 'Missing profile'
    );
  }

  function accept(response: PopupTemporaryRuleCommandResponse): boolean {
    if (response.ok) {
      temporary = response.view;
      errorMessage = '';
      return true;
    }
    if (response.view !== undefined) temporary = response.view;
    errorMessage = response.message;
    return false;
  }

  async function load(): Promise<void> {
    loading = true;
    try {
      const [workflowResponse, temporaryResponse] = await Promise.all([
        sendProfileWorkflowCommand({ action: 'get' }),
        sendPopupTemporaryRuleCommand({ action: 'get' }),
      ]);
      if (!workflowResponse.ok) throw new Error(workflowResponse.message);
      workflow = workflowResponse.state;
      accept(temporaryResponse);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
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
    } finally {
      changing = false;
    }
  }

  onMount(() => {
    applyThemeMode(readThemeMode());
    void load();
  });
</script>

<main class="manager-shell" aria-busy={loading || changing}>
  <header>
    <div>
      <h1>Temporary Rules</h1>
      <p>These rules last for the current browser session and are not written to Options.</p>
    </div>
    {#if (temporary?.rules.length ?? 0) > 0}
      <button
        type="button"
        data-temp-rules-clear
        disabled={changing}
        onclick={() => void clearAll()}
      >
        Delete all temporary rules
      </button>
    {/if}
  </header>

  {#if errorMessage}<p class="message error" role="alert">{errorMessage}</p>{/if}
  {#if loading}
    <p class="message" role="status">Loading temporary rules…</p>
  {:else if !workflow || !temporary || temporary.rules.length === 0}
    <p class="message" role="status">No temporary rules are active.</p>
  {:else}
    <table data-temp-rules-table>
      <thead><tr><th>Domain</th><th>Result profile</th><th>Action</th></tr></thead>
      <tbody>
        {#each temporary.rules as rule (rule.domain)}
          <tr data-temp-rule-domain={rule.domain}>
            <td>{rule.domain}</td>
            <td>{routeName(workflow.applied, rule.route)}</td>
            <td>
              <button
                type="button"
                aria-label={`Delete temporary rule for ${rule.domain}`}
                disabled={changing}
                onclick={() => void remove(rule.domain)}>Delete</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>
