from pathlib import Path

path = Path('packages/browser-adapters/src/snapshot-history.test.ts')
text = path.read_text()

old_warning = '''          {
            code: 'TARGET_DEPENDENT',
            message: 'Target-dependent behavior',
            path: '$.profiles[0]',
          },'''
new_warning = '''          {
            code: 'TARGET_DEPENDENT',
            message: 'Target-dependent behavior',
            path: '$.profiles[0]',
            capability: 'target-dependent',
            severity: 'warning',
            blocking: false,
          },'''
if text.count(old_warning) != 1:
    raise SystemExit(f'warning fixture anchor count: {text.count(old_warning)}')
text = text.replace(old_warning, new_warning, 1)

start = text.index("  it('rejects unverified snapshots'")
end = text.index("  it('rejects invalid creation timestamps'", start)
replacement = '''  it('rejects snapshots with incomplete compiler identity', async () => {
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(
      snapshot('snapshot-incomplete', '2026-07-25T11:00:00.000Z', {
        scriptSha256: '',
      }),
    );

    await expect(listPacSnapshotHistory(repository)).rejects.toThrow(
      'snapshot snapshot-incomplete has incomplete compiler identity',
    );
  });

'''
text = text[:start] + replacement + text[end:]
path.write_text(text)
