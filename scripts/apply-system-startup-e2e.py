from pathlib import Path

path = Path("scripts/e2e-chromium.mjs")
text = path.read_text(encoding="utf-8")
old = """  assert.equal(await initialButtons.nth(0).isDisabled(), true);"""
new = """  assert.equal(await initialButtons.nth(0).isDisabled(), false);
  assert.equal(await initialButtons.nth(1).isDisabled(), true);"""
count = text.count(old)
if count != 1:
    raise SystemExit(f"System startup E2E assertion: expected one match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
