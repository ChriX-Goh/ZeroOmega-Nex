from pathlib import Path


def add_quick_switch_route(path_name: str, profile_push_marker: str, label: str) -> None:
    path = Path(path_name)
    text = path.read_text(encoding='utf-8')
    route = """  switchDraft.settings.quickSwitch.routes.push({
    kind: 'profile',
    profileId: 'profile-toolbar-switch',
  });
"""
    if path_name.endswith('e2e-firefox.mjs'):
        route = """    switchDraft.settings.quickSwitch.routes.push({
      kind: 'profile',
      profileId: 'profile-toolbar-switch',
    });
"""
    count = text.count(profile_push_marker)
    if count != 1:
        raise SystemExit(f'{label}: expected one profile marker, found {count}')
    insertion_point = profile_push_marker + route
    path.write_text(text.replace(profile_push_marker, insertion_point, 1), encoding='utf-8')


add_quick_switch_route(
    'scripts/e2e-chromium-toolbar.mjs',
    """  switchDraft.profiles.push({
    id: 'profile-toolbar-switch',
    name: 'Toolbar Switch',
    color: '#ffb74d',
    kind: 'switch',
    rules: [
      {
        id: 'rule-toolbar-a',
        condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
        route: { kind: 'profile', profileId: proxyProfileId },
      },
    ],
    defaultRoute: { kind: 'profile', profileId: proxyProfileId },
  });
""",
    'Chromium Switch quick route',
)
add_quick_switch_route(
    'scripts/e2e-firefox.mjs',
    """    switchDraft.profiles.push({
      id: 'profile-toolbar-switch',
      name: 'Toolbar Switch',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-toolbar-a',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: 'profile-default-proxy' },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });
""",
    'Firefox Switch quick route',
)
