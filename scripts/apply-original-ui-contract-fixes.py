import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


path = 'scripts/capture-original-nex-ui-evidence.mjs'
replace_once(
    path,
    """  const text = await page.locator('body').innerText();
  const html = await page.locator('body').evaluate((body) => body.outerHTML);
  const viewport = page.viewportSize();
  entries.push({""",
    """  const text = await page.locator('body').innerText();
  const html = await page.locator('body').evaluate((body) => body.outerHTML);
  const htmlPath = resolve(outputDir, `${surface}.html`);
  await writeFile(htmlPath, `${html}\n`);
  const links = await page.locator('a').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      text: anchor.textContent?.trim() ?? '',
      href: anchor.href,
      target: anchor.target,
      rel: anchor.rel,
    })),
  );
  const viewport = page.viewportSize();
  entries.push({""",
)
replace_once(
    path,
    """    textLines: text
      .split(/\\r?\\n/u)
      .map((line) => line.trim())
      .filter(Boolean),
    bodyHtmlSha256: sha256(Buffer.from(html)),""",
    """    textLines: text
      .split(/\\r?\\n/u)
      .map((line) => line.trim())
      .filter(Boolean),
    html: relative(outputRoot, htmlPath).replaceAll('\\\\', '/'),
    bodyHtmlSha256: sha256(Buffer.from(html)),
    links,""",
)
replace_once(
    path,
    """- Surfaces: default Popup and default Options page\\n\\nThis artifact is the product-facing comparison authority for removing Nex-only UI, extra descriptions and altered information hierarchy. Green Nex-only screenshots do not establish parity.\\n`,""",
    """- Surfaces: default Popup and default Options page\\n- Evidence: screenshots, rendered text, saved body DOM and normalized anchor targets\\n\\nThis artifact is the product-facing comparison authority for removing Nex-only UI, extra descriptions and altered information hierarchy. Green Nex-only screenshots do not establish parity.\\n`,""",
)

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', path],
    check=True,
)
