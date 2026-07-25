from pathlib import Path

path = Path('apps/extension/src/entrypoints/options/App.svelte')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    '    FixedProfile,\n    ProfileSpec,',
    '    FixedProfile,\n    ProfileRouteTarget,\n    ProfileSpec,',
    'profile type import',
)

helpers = """  function routeValue(route: ProfileRouteTarget | undefined): string {
    if (route === undefined) return '';
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function parseRouteValue(value: string): ProfileRouteTarget | undefined {
    if (value === '') return undefined;
    if (value === 'direct' || value === 'system') return { kind: value };
    return value.startsWith('profile:')
      ? { kind: 'profile', profileId: value.slice('profile:'.length) }
      : undefined;
  }

  function routeLabel(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return 'Direct';
    if (route.kind === 'system') return 'System Proxy';
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ??
      'Missing profile'
    );
  }

  function checkedFrom(event: Event): boolean {
    return (event.currentTarget as HTMLInputElement).checked;
  }

"""
replace_once(
    '  function endpointId(profile: FixedProfile): string | undefined {',
    helpers + '  function endpointId(profile: FixedProfile): string | undefined {',
    'route helpers',
)

settings_functions = """  async function updateStartupRoute(value: string): Promise<void> {
    const route = parseRouteValue(value);
    await mutateDraft((draft) => {
      if (route === undefined) delete draft.settings.startup.route;
      else draft.settings.startup.route = route;
    });
  }

  async function updateStartupRevert(revertProxyChanges: boolean): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.startup.revertProxyChanges = revertProxyChanges;
    });
  }

  async function updateQuickSwitchFlag(
    field: 'enabled' | 'refreshOnChange',
    value: boolean,
  ): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.quickSwitch[field] = value;
    });
  }

  async function addQuickSwitchRoute(value: string, event: Event): Promise<void> {
    const route = parseRouteValue(value);
    (event.currentTarget as HTMLSelectElement).value = '';
    if (!route) return;
    await mutateDraft((draft) => {
      if (
        !draft.settings.quickSwitch.routes.some(
          (candidate) => routeValue(candidate) === routeValue(route),
        )
      ) {
        draft.settings.quickSwitch.routes.push(route);
      }
    });
  }

  async function removeQuickSwitchRoute(index: number): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.quickSwitch.routes.splice(index, 1);
    });
  }

  async function moveQuickSwitchRoute(index: number, offset: -1 | 1): Promise<void> {
    await mutateDraft((draft) => {
      const routes = draft.settings.quickSwitch.routes;
      const target = index + offset;
      if (target < 0 || target >= routes.length) return;
      const [route] = routes.splice(index, 1);
      if (route) routes.splice(target, 0, route);
    });
  }

"""
replace_once(
    '  async function revertDraft(): Promise<void> {',
    settings_functions + '  async function revertDraft(): Promise<void> {',
    'settings functions',
)

settings_ui = """      <section class=\"settings-section\">
        <h2>Startup</h2>
        <p class=\"section-help\">
          Choose the route restored when the extension starts. This changes only after Apply.
        </p>
        <label>
          Startup route
          <select
            aria-label=\"Startup route\"
            value={routeValue(state.draft.settings.startup.route)}
            disabled={saving || view?.busy}
            on:change={(event) => updateStartupRoute(valueFrom(event))}
          >
            <option value=\"\">Keep the current browser setting</option>
            <option value=\"direct\">Direct</option>
            <option value=\"system\">System Proxy</option>
            {#each profiles as profile (profile.id)}
              <option value={`profile:${profile.id}`}>{profile.name}</option>
            {/each}
          </select>
        </label>
        <label>
          <input
            type=\"checkbox\"
            checked={state.draft.settings.startup.revertProxyChanges}
            disabled={saving || view?.busy}
            on:change={(event) => updateStartupRevert(checkedFrom(event))}
          />
          Restore the previous browser proxy state when the extension releases control
        </label>
      </section>

      <section class=\"settings-section\">
        <h2>Quick switch</h2>
        <p class=\"section-help\">
          The popup uses this ordered list from the Applied revision, never unsaved Draft data.
        </p>
        <label>
          <input
            type=\"checkbox\"
            checked={state.draft.settings.quickSwitch.enabled}
            disabled={saving || view?.busy}
            on:change={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))}
          />
          Enable popup quick switching
        </label>
        <label>
          <input
            type=\"checkbox\"
            checked={state.draft.settings.quickSwitch.refreshOnChange}
            disabled={saving || view?.busy}
            on:change={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))}
          />
          Refresh active tabs after a route change
        </label>
        <ol aria-label=\"Quick-switch route order\">
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <button
                type=\"button\"
                disabled={saving || view?.busy || index === 0}
                aria-label={`Move ${routeLabel(state.draft, route)} up`}
                on:click={() => moveQuickSwitchRoute(index, -1)}>Up</button
              >
              <button
                type=\"button\"
                disabled={
                  saving ||
                  view?.busy ||
                  index === state.draft.settings.quickSwitch.routes.length - 1
                }
                aria-label={`Move ${routeLabel(state.draft, route)} down`}
                on:click={() => moveQuickSwitchRoute(index, 1)}>Down</button
              >
              <button
                type=\"button\"
                disabled={saving || view?.busy}
                aria-label={`Remove ${routeLabel(state.draft, route)}`}
                on:click={() => removeQuickSwitchRoute(index)}>Remove</button
              >
            </li>
          {/each}
        </ol>
        <select
          aria-label=\"Add quick-switch route\"
          disabled={saving || view?.busy}
          on:change={(event) => addQuickSwitchRoute(valueFrom(event), event)}
        >
          <option value=\"\">Add route…</option>
          <option value=\"direct\">Direct</option>
          <option value=\"system\">System Proxy</option>
          {#each profiles as profile (profile.id)}
            <option value={`profile:${profile.id}`}>{profile.name}</option>
          {/each}
        </select>
      </section>

"""
replace_once(
    '      <section class="settings-section shell-status">\n        <h2>Working copy</h2>',
    settings_ui + '      <section class="settings-section shell-status">\n        <h2>Working copy</h2>',
    'settings UI',
)

path.write_text(text)
