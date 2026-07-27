from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    '''import {
  createBrowserSafePacSnapshot,
  type PacTarget,
''',
    '''import {
  createBrowserSafePacSnapshot,
  createRawPacSnapshot,
  type PacTarget,
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    '''function snapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createBrowserSafePacSnapshot>>, { ok: true }>,
): string {
''',
    '''function rawPacScript(spec: ProfileSpec, route: ProfileRouteTarget): string | undefined {
  if (route.kind !== 'profile') return undefined;
  const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
  if (!profile || profile.kind !== 'pac') return undefined;
  if (profile.source.kind === 'inline') return profile.source.script;
  let protocol: string;
  try {
    protocol = new URL(profile.source.url).protocol;
  } catch {
    throw new Error(`PAC profile ${profile.name} has an invalid source URL`);
  }
  if (protocol === 'file:') {
    throw new Error(
      `PAC profile ${profile.name} uses a local file URL, which is not supported by the inline browser adapter`,
    );
  }
  if (profile.source.script === undefined) {
    throw new Error(`PAC profile ${profile.name} has no downloaded script cache`);
  }
  return profile.source.script;
}

function rawSnapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createRawPacSnapshot>>, { ok: true }>,
): string {
  return result.issues
    .slice(0, 8)
    .map((issue) => `${issue.code}: ${issue.message}`)
    .join('; ');
}

function snapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createBrowserSafePacSnapshot>>, { ok: true }>,
): string {
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    '''        const snapshot = await createBrowserSafePacSnapshot(
          spec,
          route,
          buildProfileWorkflowVerificationVectors(spec),
          {
            createdAt: startedAt,
            ...(temporarySnapshotId === undefined ? {} : { snapshotId: temporarySnapshotId }),
          },
          { target: targetFor(runtime.driver) },
        );
        if (!snapshot.ok) {
          throw new Error(
            `${snapshot.stage === 'compile' ? 'PAC compilation' : 'PAC verification'} failed: ${snapshotFailureMessage(snapshot)}`,
          );
        }

        const activated = await activatePacSnapshot(
          runtime.repository,
          runtime.driver,
          snapshot.snapshot,
''',
    '''        const rawScript = rawPacScript(spec, route);
        const snapshot =
          rawScript === undefined
            ? await createBrowserSafePacSnapshot(
                spec,
                route,
                buildProfileWorkflowVerificationVectors(spec),
                {
                  createdAt: startedAt,
                  ...(temporarySnapshotId === undefined
                    ? {}
                    : { snapshotId: temporarySnapshotId }),
                },
                { target: targetFor(runtime.driver) },
              )
            : await createRawPacSnapshot(
                spec,
                route,
                rawScript,
                { createdAt: startedAt },
                targetFor(runtime.driver),
              );
        if (!snapshot.ok) {
          throw new Error(
            rawScript === undefined
              ? `${'stage' in snapshot && snapshot.stage === 'compile' ? 'PAC compilation' : 'PAC verification'} failed: ${snapshotFailureMessage(snapshot as Exclude<Awaited<ReturnType<typeof createBrowserSafePacSnapshot>>, { ok: true }> )}`
              : `Raw PAC validation failed: ${rawSnapshotFailureMessage(snapshot as Exclude<Awaited<ReturnType<typeof createRawPacSnapshot>>, { ok: true }> )}`,
          );
        }

        const activated = await activatePacSnapshot(
          runtime.repository,
          runtime.driver,
          snapshot.snapshot,
''',
)

# Test helper and activation coverage.
test_path = Path('apps/extension/src/lib/profile-workflow-activation.test.ts')
test = test_path.read_text()
anchor = "function authenticatedSpec(protocol: 'http' | 'socks5' = 'http') {"
helper = r'''function rawPacSpec(source: 'inline' | 'url' | 'file' = 'inline') {
  const spec = cloneProfileSpec(defaultSpec());
  const script = "function FindProxyForURL(url, host) { return 'DIRECT'; }";
  spec.profiles.push({
    id: 'profile-raw-pac',
    name: 'Raw PAC',
    kind: 'pac',
    source:
      source === 'inline'
        ? { kind: 'inline', script }
        : source === 'url'
          ? { kind: 'url', url: 'https://pac.example.invalid/proxy.pac', script }
          : { kind: 'url', url: 'file:///tmp/proxy.pac' },
  });
  return spec;
}

'''
if test.count(anchor) != 1:
    raise SystemExit('raw PAC activation helper anchor missing')
test = test.replace(anchor, helper + anchor, 1)
anchor = "  it('targets Firefox when the runtime driver is Firefox', async () => {"
coverage = r'''  it('installs a top-level raw PAC Profile without composing it into the typed graph', async () => {
    for (const source of ['inline', 'url'] as const) {
      const proxy = new FakeProxyDriver('chromium');
      const created = runtime(proxy);
      const driver = new BrowserProfileWorkflowActivationDriver({
        createRuntime: () => created.runtime,
        now: () => new Date('2026-07-25T09:01:30.000Z'),
      });
      const result = await driver.activate(rawPacSpec(source), {
        kind: 'profile',
        profileId: 'profile-raw-pac',
      });
      expect(result.snapshotId).toMatch(/^raw-pac-/u);
      expect(proxy.installed).toMatchObject({
        compilerVersion: 'raw-pac/1',
        startRoute: { kind: 'profile', profileId: 'profile-raw-pac' },
        verification: { mode: 'structural' },
      });
      expect(proxy.installed?.script).toContain('function FindProxyForURL');
    }
  });

  it('rejects top-level PAC file URLs before changing browser state', async () => {
    const proxy = new FakeProxyDriver('chromium');
    const created = runtime(proxy);
    const driver = new BrowserProfileWorkflowActivationDriver({ createRuntime: () => created.runtime });
    await expect(
      driver.activate(rawPacSpec('file'), {
        kind: 'profile',
        profileId: 'profile-raw-pac',
      }),
    ).rejects.toThrow('local file URL');
    expect(proxy.installCount).toBe(0);
  });

'''
if test.count(anchor) != 1:
    raise SystemExit('raw PAC activation test insertion anchor missing')
test_path.write_text(test.replace(anchor, coverage + anchor, 1))

# Remove cross-package test dependency from pac-compiler.
raw_test = Path('packages/pac-compiler/src/raw-snapshot.test.ts')
text = raw_test.read_text()
text = text.replace("import { createDefaultProfileSpec } from '@zeroomega-nex/profile-workflow';\n", '')
old = '''function fixture() {
  const spec = createDefaultProfileSpec({
    documentId: 'raw-pac-document',
    revisionId: 'raw-pac-revision',
    createdAt: '2026-07-28T00:00:00.000Z',
  });
  spec.profiles.push({
'''
new = '''function fixture() {
  const spec = {
    schemaVersion: 1 as const,
    documentId: 'raw-pac-document',
    revision: {
      id: 'raw-pac-revision',
      createdAt: '2026-07-28T00:00:00.000Z',
    },
    profiles: [],
    proxyEndpoints: [],
    ruleSources: [],
    settings: {
      startup: { revertProxyChanges: true },
      quickSwitch: { enabled: false, refreshOnChange: false, routes: [] },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: true,
      },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
  spec.profiles.push({
'''
if text.count(old) != 1:
    raise SystemExit('raw PAC test fixture anchor missing')
raw_test.write_text(text.replace(old, new, 1))
