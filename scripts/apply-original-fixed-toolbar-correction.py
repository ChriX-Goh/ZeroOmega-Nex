from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


defaults_path = Path("packages/profile-workflow/src/defaults.ts")
replace_once(defaults_path, "direct: { color: '#bdbdbd' },", "direct: { color: '#aaaaaa' },", "Direct color")
replace_once(defaults_path, "system: { color: '#616161' },", "system: { color: '#000000' },", "System color")

defaults_test = Path("packages/profile-workflow/src/defaults.test.ts")
replace_once(
    defaults_test,
    """    expect(spec.settings.quickSwitch.routes).toEqual([
      { kind: 'direct' },
      { kind: 'system' },
      { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
    ]);""",
    """    expect(spec.settings.quickSwitch.routes).toEqual([
      { kind: 'direct' },
      { kind: 'system' },
      { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
    ]);
    expect(spec.settings.interface.builtInProfiles).toEqual({
      direct: { color: '#aaaaaa' },
      system: { color: '#000000' },
    });""",
    "default color assertion",
)

resolver_test = Path("apps/extension/src/lib/original-toolbar-profile-resolver.test.ts")
text = resolver_test.read_text(encoding="utf-8")
if text.count("#bdbdbd") != 2:
    raise SystemExit(f"resolver Direct colors: expected two matches, found {text.count('#bdbdbd')}")
text = text.replace("#bdbdbd", "#aaaaaa")
text = text.replace("details: '(default)',", "details: 'PROXY 127.0.0.1:7890\\n',", 1)
old_bypass = """  it('keeps a Fixed bypass unresolved until the original result trace is reproduced', async () => {
    await expect(
      resolver(state(true), {
        activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      }).resolve({ tabId: 9, url: 'http://localhost/' }),
    ).resolves.toBeUndefined();
  });"""
new_bypass = """  it('reproduces a Fixed bypass condition-to-Direct result', async () => {
    const result = await resolver(state(true), {
      activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    }).resolve({ tabId: 9, url: 'http://localhost/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#64b5f6',
      },
      titleArguments: {
        currentProfileName: 'Proxy',
        resultProfileName: 'Proxy',
        details: 'localhost => (not using any proxy)\\n',
      },
      badgeText: 'Prox',
    });
  });

  it('reproduces a scheme-specific Fixed PAC result', async () => {
    const workflowState = state();
    const profile = workflowState.applied.profiles[0];
    if (!profile || profile.kind !== 'fixed') throw new Error('missing default Fixed profile');
    profile.proxyByScheme.http = profile.proxyByScheme.fallback;

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: profile.id },
    }).resolve({ tabId: 10, url: 'http://example.test/' });

    expect(result?.titleArguments.details).toBe('http => PROXY 127.0.0.1:7890\\n');
  });"""
if text.count(old_bypass) != 1:
    raise SystemExit(f"resolver bypass test: expected one match, found {text.count(old_bypass)}")
resolver_test.write_text(text.replace(old_bypass, new_bypass, 1), encoding="utf-8")
