from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


icon_path = 'apps/extension/src/entrypoints/popup/OriginalPopupIcon.svelte'
chromium_path = 'scripts/e2e-chromium.mjs'
evidence_path = 'docs/AUDIT_EVIDENCE_02M_POPUP_ICON_COMPATIBILITY.md'
ownership_path = 'docs/AUDIT_EVIDENCE_02G_CHROMIUM_OWNERSHIP_SYNCHRONIZATION.md'

replace_once(
    icon_path,
    """    {#if kind === 'direct'}
      <path
        class="solid"
        d="M1 2.4h7V.8l4.4 3.4L8 7.6V6H1ZM13 8H6v-1.6L1.6 9.8 6 13.2v-1.6h7Z"
      />""",
    """    {#if kind === 'direct'}
      <path d="M1.2 4.2h8.1M7.1 1.9l2.4 2.3-2.4 2.3M12.8 9.8H4.7M6.9 7.5 4.5 9.8l2.4 2.3" />""",
)

replace_once(
    icon_path,
    """    {:else if kind === 'fixed' || kind === 'globe'}
      <path
        class="solid globe"
        fill-rule="evenodd"
        d="M7 1.1a5.9 5.9 0 1 1 0 11.8A5.9 5.9 0 0 1 7 1.1ZM3.1 3.5c.7-.7 1.6-1.2 2.6-1.4l.2 1.4-.8.7.5 1.2-1.2.8-1.2-.5-.8.5a4.7 4.7 0 0 1 .7-2.7Zm4.4 3.1 1.3-.6 1 .5.2 1.1 1.2.8-.5 1.8-1.5.1-.8 1.5a4.7 4.7 0 0 1-2.1.2l.2-1.4-1-.8.4-1.5Z"
      />""",
    """    {:else if kind === 'fixed' || kind === 'globe'}
      <circle cx="7" cy="7" r="5.2" />
      <path
        d="M1.8 7h10.4M7 1.8c1.6 1.4 2.5 3.2 2.5 5.2S8.6 10.8 7 12.2C5.4 10.8 4.5 9 4.5 7S5.4 3.2 7 1.8Z"
      />""",
)

replace_once(
    chromium_path,
    """  await system.click();
  await assertEventually(async () => system.isDisabled(), 'System route did not become active');
  const externalProxySetting = await worker.evaluate(async () => {""",
    """  await system.click();
  await assertEventually(async () => system.isDisabled(), 'System route did not become active');
  await assertEventually(
    async () =>
      popup.evaluate(async () => {
        const proxyStateKey = 'zeroomega-nex/browser-proxy/v1/state';
        const storage = await chrome.storage.local.get(proxyStateKey);
        return storage[proxyStateKey]?.activeBuiltInMode === 'system';
      }),
    'System activation storage did not converge before external proxy installation',
  );
  const externalProxySetting = await worker.evaluate(async () => {""",
)

evidence = Path(evidence_path).read_text()
marker = 'Ordinary Head `e60981eae0d3b3377175bf68ec2c923a7ff3bf74` produced a mixed visual result.'
if marker not in evidence:
    evidence += """

## Solid-glyph ordinary result

Ordinary Head `e60981eae0d3b3377175bf68ec2c923a7ff3bf74` produced a mixed visual result. Artifact `8844659739` (`sha256:fb1f4b3864b1e60b8c462d72ba457c930f9d9f5ba886ebdfbb9ad647de903536`) preserved all verified icon boxes and row geometry. Pixel-crop comparison against the paired Original showed:

- heavier power and solid wrench materially improved;
- solid retweet improved slightly;
- the solid transfer and land-cutout globe increased the crop error relative to the verified line-frame versions.

The bounded result therefore keeps only the demonstrated improvements and restores transfer/globe to the prior verified paths. This is evidence-driven selection, not a requirement that every icon share one rendering technique.

The same Head's Chromium main E2E failed before external ownership inspection because the persisted mode was still `direct`. The test had waited only for the System button's disabled state before installing an external proxy. The corrected journey now waits explicitly for `activeBuiltInMode === system`; it does not retry or weaken the ownership assertion.
"""
Path(evidence_path).write_text(evidence)

ownership = Path(ownership_path).read_text()
marker = 'A later Chromium run exposed one remaining test-side precondition gap.'
if marker not in ownership:
    ownership += """

## Explicit external-ownership precondition

A later Chromium run exposed one remaining test-side precondition gap. Before installing the external Fixed configuration, the journey waited for the System button to become disabled but did not independently wait for persisted activation state. One run therefore reached the external step while `activeBuiltInMode` still read `direct`.

The journey now requires both UI convergence and persisted `activeBuiltInMode === system` before calling `chrome.proxy.settings.set()`. The existing external ownership assertion remains strict, and a fresh ordinary Head must pass on its first attempt. This strengthens evidence synchronization; it does not change product ownership semantics.
"""
Path(ownership_path).write_text(ownership)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        icon_path,
        chromium_path,
        evidence_path,
        ownership_path,
    ],
    check=True,
)
