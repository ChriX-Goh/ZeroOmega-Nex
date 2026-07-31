from pathlib import Path


path = Path("scripts/e2e-firefox.mjs")
text = path.read_text(encoding="utf-8")
old = """  try {
    await driver.wait(
      until.elementLocated(By.xpath(\"//*[contains(normalize-space(.), '目前設定已全部套用。') ]\")),
      20_000,
    );
  } catch (error) {
    await logDiagnostics('Apply');
    throw error;
  }"""
new = """  try {
    await driver.wait(
      async () => {
        const response = await sendFirefoxWorkflowCommand({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        });
        return Boolean(response?.ok && response.view?.dirty === false && response.view?.busy !== true);
      },
      45_000,
      'Firefox Apply did not reach a clean workflow state',
    );
    await driver.wait(
      async () => {
        const statuses = await driver.findElements(By.css('.draft-status'));
        return (
          statuses.length === 1 &&
          (await statuses[0].getText()).trim() === '目前設定已全部套用。'
        );
      },
      20_000,
      'Firefox Options did not render the clean Apply status',
    );
  } catch (error) {
    await logDiagnostics('Apply');
    throw error;
  }"""
count = text.count(old)
if count != 1:
    raise SystemExit(f"Firefox Apply wait marker: expected one match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
