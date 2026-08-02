from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old!r}")
    target.write_text(source.replace(old, new, 1))


replace_once(
    "apps/extension/src/entrypoints/options/App.svelte",
    "        <span>Zero Omega</span>",
    "        <span>ZeroOmega</span>",
)

replace_once(
    "scripts/e2e-chromium.mjs",
    "  const direct = popup.getByRole('button', { name: /直接连接/u });",
    "  const direct = popup.getByRole('button', { name: '直接连接', exact: true });",
)

for path in (
    "scripts/e2e-firefox-attached-rule-list-toolbar.mjs",
    "scripts/e2e-firefox-profile-traces-toolbar.mjs",
):
    replace_once(
        path,
        """  assert.equal(result?.url, url, 'Firefox navigated to an unexpected extension URL');""",
        """  const expectedUrl = relativeUrl === 'options.html' ? `${url}#/about` : url;
  assert.equal(
    result?.url,
    expectedUrl,
    'Firefox navigated to an unexpected extension URL',
  );""",
    )

for path in (
    "scripts/e2e-firefox-external-control-toolbar.mjs",
    "scripts/e2e-firefox-renderer-fallback-toolbar.mjs",
):
    replace_once(
        path,
        """  assert.equal(result?.url, url, 'Firefox navigated to an unexpected URL');""",
        """  const expectedUrl = url.endsWith('/options.html') ? `${url}#/about` : url;
  assert.equal(result?.url, expectedUrl, 'Firefox navigated to an unexpected URL');""",
    )
