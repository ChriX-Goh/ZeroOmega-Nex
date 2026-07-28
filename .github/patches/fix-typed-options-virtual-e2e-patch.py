from pathlib import Path

path = Path('.github/patches/patch-typed-options-virtual-tests-docs.py')
text = path.read_text()
old = '''insert_before(
    chromium,
    "  await options.getByRole('button', { name: 'Proxy', exact: true }).click();\\n  await profileName.waitFor({ state: 'visible' });",
    insert,
)
'''
new = '''interface_return = """  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Confirmation and editing|Menus and status|Show inspect menu|Show result profile/u,
    'Options Interface typed locale coverage regressed',
  );

  await options.getByRole('button', { name: 'Proxy', exact: true }).click();
  await profileName.waitFor({ state: 'visible' });
"""
interface_return_with_typed_pages = """  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Confirmation and editing|Menus and status|Show inspect menu|Show result profile/u,
    'Options Interface typed locale coverage regressed',
  );

""" + insert + """  await options.getByRole('button', { name: 'Proxy', exact: true }).click();
  await profileName.waitFor({ state: 'visible' });
"""
replace_once(chromium, interface_return, interface_return_with_typed_pages)
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one ambiguous Chromium insertion block, found {count}')
text = text.replace(old, new, 1)
text = text.replace(
    '    """  const modernRuleExport = await readFile(modernRulePath, \'utf8\');',
    '    r"""  const modernRuleExport = await readFile(modernRulePath, \'utf8\');',
)
path.write_text(text)
print('Fixed normal Options Chromium patch to use the unique Interface return context.')
