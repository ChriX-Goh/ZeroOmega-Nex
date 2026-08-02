from pathlib import Path
import re

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text()
    count = source.count(old)
    assert count == 1, f'{label}: expected 1, got {count}'
    path.write_text(source.replace(old, new, 1))


# Toolbar projection tests intentionally use a custom profile; make that explicit.
resolver = ROOT / 'apps/extension/src/lib/original-toolbar-profile-resolver.test.ts'
source = resolver.read_text()
old = """  spec.settings.interface.showResultProfileOnActionBadgeText = showBadge;
  return createProfileWorkflowState(spec);"""
new = """  const fixed = spec.profiles.find((profile) => profile.id === 'profile-default-proxy');
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
  fixed.name = 'Proxy';
  fixed.color = '#64b5f6';
  const endpoint = spec.proxyEndpoints.find(
    (candidate) => candidate.id === fixed.proxyByScheme.fallback,
  );
  if (!endpoint) throw new Error('missing default Fixed endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 7890;
  spec.settings.interface.showResultProfileOnActionBadgeText = showBadge;
  return createProfileWorkflowState(spec);"""
assert source.count(old) == 1, source.count(old)
resolver.write_text(source.replace(old, new, 1))

# Activation tests require one explicit PAC-compiled fixed route, not installation defaults.
activation = ROOT / 'apps/extension/src/lib/profile-workflow-activation.test.ts'
source = activation.read_text()
old = """function defaultSpec() {
  return createDefaultProfileSpec({
    documentId: 'document-activation-test',
    revisionId: 'revision-activation-test',
    createdAt: '2026-07-25T09:00:00.000Z',
    deviceId: 'device-activation-test',
  });
}"""
new = """function defaultSpec() {
  const spec = createDefaultProfileSpec({
    documentId: 'document-activation-test',
    revisionId: 'revision-activation-test',
    createdAt: '2026-07-25T09:00:00.000Z',
    deviceId: 'device-activation-test',
  });
  const fixed = spec.profiles.find((profile) => profile.id === 'profile-default-proxy');
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing activation Fixed profile');
  fixed.name = 'Proxy';
  fixed.color = '#64b5f6';
  const endpoint = spec.proxyEndpoints.find(
    (candidate) => candidate.id === fixed.proxyByScheme.fallback,
  );
  if (!endpoint) throw new Error('missing activation endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 7890;
  spec.settings.startup.route = { kind: 'profile', profileId: fixed.id };
  return spec;
}"""
assert source.count(old) == 1, source.count(old)
activation.write_text(source.replace(old, new, 1))

# Snapshot rollback tests likewise need an explicit managed profile route.
snapshot = ROOT / 'apps/extension/src/lib/snapshot-rollback-runtime.test.ts'
source = snapshot.read_text()
old = """  spec.profiles[0]!.name = name;
  return spec;"""
new = """  const fixed = spec.profiles.find((profile) => profile.id === 'profile-default-proxy');
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing rollback Fixed profile');
  fixed.name = name;
  fixed.color = '#64b5f6';
  const endpoint = spec.proxyEndpoints.find(
    (candidate) => candidate.id === fixed.proxyByScheme.fallback,
  );
  if (!endpoint) throw new Error('missing rollback endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 7890;
  spec.settings.startup.route = { kind: 'profile', profileId: fixed.id };
  return spec;"""
assert source.count(old) == 1, source.count(old)
snapshot.write_text(source.replace(old, new, 1))

# Inspect presentation test is a custom-color test, not a default-profile test.
inspect = ROOT / 'apps/extension/src/lib/inspect-runtime.test.ts'
source = inspect.read_text()
old = """    expect(
      evaluateInspectResultPresentation("""
new = """    const fixed = spec.profiles.find((profile) => profile.id === 'profile-default-proxy');
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing inspect Fixed profile');
    fixed.name = 'Proxy';
    fixed.color = '#64b5f6';
    expect(
      evaluateInspectResultPresentation("""
# This sequence appears once in the target test after the createDefaultProfileSpec block.
anchor = """      createdAt: '2026-07-27T18:00:00.000Z',
    });
"""
assert source.count(anchor) == 1, source.count(anchor)
source = source.replace(anchor, anchor + new.split('    expect(\n')[0], 1)
inspect.write_text(source)

# Exporting the actual official default must preserve its lowercase name and endpoint.
profile_export = ROOT / 'apps/extension/src/lib/profile-export.test.ts'
source = profile_export.read_text()
source = source.replace("filename: 'OmegaProfile_Proxy.pac'", "filename: 'OmegaProfile_proxy.pac'", 1)
source = source.replace("'PROXY 127.0.0.1:7890'", "'PROXY proxy.example.com:8080'", 1)
profile_export.write_text(source)
