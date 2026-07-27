from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    target.write_text(text.replace(old, new))


replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """    listPopupConditionResultRoutes,
    listPopupProfileResultRoutes,
""",
    """    listPopupConditionResultRoutes,
    listPopupProfileResultRoutes,
    listPopupTemporaryRuleResultRoutes,
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """    type ProfileWorkflowRuntimeView,
    type ProfileWorkflowState,
""",
    """    type PopupTemporaryRuleView,
    type ProfileWorkflowRuntimeView,
    type ProfileWorkflowState,
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
""",
    """  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import {
    sendPopupTemporaryRuleCommand,
    type PopupTemporaryRuleCommandResponse,
  } from '../../lib/popup-temporary-rule-client';
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let currentSite: CurrentSiteInfo | undefined;
  let loading = true;
""",
    """  let currentSite: CurrentSiteInfo | undefined;
  let temporaryRuleView: PopupTemporaryRuleView | undefined;
  let loading = true;
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let settingResult = false;
  let openingSettings = false;
""",
    """  let settingResult = false;
  let settingTemporaryRule = false;
  let openingSettings = false;
  let openingTemporaryRules = false;
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let resultItems: readonly ResultRouteItem[] = [];
  $: items = state ? quickSwitchItems(state.applied) : [];
""",
    """  let resultItems: readonly ResultRouteItem[] = [];
  let temporaryResultItems: readonly ResultRouteItem[] = [];
  let currentTemporaryRoute: ProfileRouteTarget | undefined;
  $: items = state ? quickSwitchItems(state.applied) : [];
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  $: resultItems = state && activeSwitch ? popupResultItems(state.applied, activeSwitch.id) : [];
""",
    """  $: resultItems = state && activeSwitch ? popupResultItems(state.applied, activeSwitch.id) : [];
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
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  async function loadCurrentSite(): Promise<void> {
""",
    """  function acceptTemporaryRuleResponse(response: PopupTemporaryRuleCommandResponse): boolean {
    if (response.ok) {
      temporaryRuleView = response.view;
      errorMessage = '';
      return true;
    }
    if (response.view !== undefined) temporaryRuleView = response.view;
    errorMessage = response.message;
    return false;
  }

  async function loadTemporaryRules(): Promise<void> {
    acceptTemporaryRuleResponse(await sendPopupTemporaryRuleCommand({ action: 'get' }));
  }

  async function loadCurrentSite(): Promise<void> {
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """      await Promise.all([loadWorkflow(), loadCurrentSite()]);
""",
    """      await Promise.all([loadWorkflow(), loadCurrentSite(), loadTemporaryRules()]);
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  async function setProfileResult(item: QuickSwitchItem, event: Event): Promise<void> {
""",
    """  async function setTemporaryRule(event: Event): Promise<void> {
    if (!state || !currentSite || settingTemporaryRule) return;
    const key = (event.currentTarget as HTMLSelectElement).value;
    const selected = temporaryResultItems.find((item) => item.key === key);
    if (!selected && currentTemporaryRoute === undefined) return;
    settingTemporaryRule = true;
    errorMessage = '';
    try {
      const accepted = acceptTemporaryRuleResponse(
        selected
          ? await sendPopupTemporaryRuleCommand({
              action: 'toggle',
              expectedAppliedRevisionId: state.applied.revision.id,
              domain: currentSite.domain,
              route: selected.route,
            })
          : await sendPopupTemporaryRuleCommand({
              action: 'remove',
              expectedAppliedRevisionId: state.applied.revision.id,
              domain: currentSite.domain,
            }),
      );
      if (accepted) window.close();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
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
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      openingTemporaryRules = false;
    }
  }

  async function setProfileResult(item: QuickSwitchItem, event: Event): Promise<void> {
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  aria-busy={loading || switching || addingCondition || settingResult}
""",
    """  aria-busy={loading || switching || addingCondition || settingResult || settingTemporaryRule}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """              settingResult ||
              !item.available ||
""",
    """              settingResult ||
              settingTemporaryRule ||
              !item.available ||
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """                disabled={settingResult || switching || addingCondition || !item.available}
""",
    """                disabled={settingResult || switching || addingCondition || settingTemporaryRule || !item.available}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  {#if !loading && currentSite && activeSwitch && resultItems.length > 0}
""",
    """  {#if !loading && currentSite && temporaryResultItems.length > 0}
    <section class="temporary-rule-action" data-popup-temporary-rule aria-label="Temporary rules">
      <label>
        Temporary profile for {currentSite.domain}
        <select
          aria-label={`Temporary profile for ${currentSite.domain}`}
          value={currentTemporaryRoute ? routeKey(currentTemporaryRoute) : ''}
          disabled={settingTemporaryRule || switching || settingResult || addingCondition}
          onchange={(event) => void setTemporaryRule(event)}
        >
          <option value="">No temporary rule</option>
          {#each temporaryResultItems as item}
            <option value={item.key}>{item.name}</option>
          {/each}
        </select>
      </label>
      {#if (temporaryRuleView?.rules.length ?? 0) > 0}
        <button
          type="button"
          data-popup-manage-temporary-rules
          disabled={openingTemporaryRules || settingTemporaryRule}
          onclick={() => void openTemporaryRules()}
        >
          Manage temporary rules ({temporaryRuleView?.rules.length ?? 0})
        </button>
      {/if}
    </section>
  {/if}

  {#if !loading && currentSite && activeSwitch && resultItems.length > 0}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """    <span class="product-name">{switching ? 'Switching…' : productIdentity.name}</span>
""",
    """    <span class="product-name"
      >{switching || settingTemporaryRule ? 'Switching…' : productIdentity.name}</span
    >
""",
)

replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.current-site-action {
""",
    """.temporary-rule-action,
.current-site-action {
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.current-site-action button,
.scope-button,
""",
    """.temporary-rule-action button,
.current-site-action button,
.scope-button,
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.current-site-action button {
  width: 100%;
}
""",
    """.temporary-rule-action {
  display: grid;
  gap: 7px;
}

.temporary-rule-action label {
  display: grid;
  gap: 3px;
  color: var(--popup-muted);
  font-size: 11px;
}

.temporary-rule-action select {
  width: 100%;
  min-height: 30px;
  padding: 4px 6px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-bg);
  color: var(--popup-text);
  font: inherit;
}

.temporary-rule-action button,
.current-site-action button {
  width: 100%;
}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.current-site-action button:hover,
.scope-button:hover,
""",
    """.temporary-rule-action button:hover:not(:disabled),
.current-site-action button:hover,
.scope-button:hover,
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.current-site-action button:focus-visible,
.scope-button:focus-visible,
""",
    """.temporary-rule-action button:focus-visible,
.temporary-rule-action select:focus-visible,
.current-site-action button:focus-visible,
.scope-button:focus-visible,
""",
)

Path('apps/extension/src/entrypoints/temp-rules/index.html').parent.mkdir(parents=True, exist_ok=True)
Path('apps/extension/src/entrypoints/temp-rules/index.html').write_text(r'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>Temporary Rules — ZeroOmega Nex</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
''')
Path('apps/extension/src/entrypoints/temp-rules/main.ts').write_text(r'''import { mount } from 'svelte';

import { localizeDocument } from '../../lib/i18n';
import App from './App.svelte';
import './style.css';

const target = document.getElementById('app');
if (!target) throw new Error('Temporary rules mount target was not found.');
mount(App, { target });
localizeDocument();
''')
Path('apps/extension/src/entrypoints/temp-rules/App.svelte').write_text(r'''<script lang="ts">
  import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
  import type { PopupTemporaryRuleView, ProfileWorkflowState } from '@zeroomega-nex/profile-workflow';
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
    return spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? 'Missing profile';
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
      <button type="button" data-temp-rules-clear disabled={changing} onclick={() => void clearAll()}>
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
                onclick={() => void remove(rule.domain)}
              >Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>
''')
Path('apps/extension/src/entrypoints/temp-rules/style.css').write_text(r''':root {
  font-family: 'Segoe UI', 'Microsoft YaHei UI', Arial, sans-serif;
  color-scheme: light dark;
  --bg: #fff;
  --text: #263238;
  --muted: #607d8b;
  --border: #dfe4e7;
  --surface: #f5f6f7;
  --danger: #b71c1c;
}

:root[data-theme='dark'] {
  --bg: #262b30;
  --text: #e5e9ec;
  --muted: #a8b2b9;
  --border: #3c444a;
  --surface: #202428;
  --danger: #ffb3b8;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #262b30;
    --text: #e5e9ec;
    --muted: #a8b2b9;
    --border: #3c444a;
    --surface: #202428;
    --danger: #ffb3b8;
  }
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); }
button { font: inherit; }
.manager-shell { max-width: 880px; margin: 0 auto; padding: 24px; }
header { display: flex; gap: 18px; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
h1, p { margin-top: 0; }
header p { color: var(--muted); }
button { min-height: 32px; padding: 5px 10px; border: 1px solid var(--border); border-radius: 3px; background: var(--surface); color: var(--text); cursor: pointer; }
button:disabled { cursor: wait; opacity: .65; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px; border: 1px solid var(--border); text-align: left; }
th { background: var(--surface); }
.message { padding: 12px; border: 1px solid var(--border); background: var(--surface); }
.message.error { color: var(--danger); }
''')
