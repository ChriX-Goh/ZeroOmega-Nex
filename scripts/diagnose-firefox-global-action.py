from pathlib import Path


path = Path("scripts/e2e-firefox.mjs")
text = path.read_text(encoding="utf-8")
old = """  await waitForFirefoxGlobalActionState(
    systemAction,
    'Firefox global System Action baseline failed before new-tab creation',
  );"""
new = """  const globalWorkflow = await sendFirefoxWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'get',
  });
  console.error(`[Firefox global workflow] ${JSON.stringify(globalWorkflow)}`);
  assert.equal(globalWorkflow?.ok, true, 'Firefox global workflow state is unavailable');
  assert.deepEqual(globalWorkflow.runtime?.activeRoute, { kind: 'system' });

  const directGlobalProbe = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.action.setTitle({ title: 'ZeroOmega global probe' }).then(
      async () => done({ title: await browser.action.getTitle({}) }),
      (error) => done({ error: String(error) }),
    );
  `);
  console.error(`[Firefox direct global Action probe] ${JSON.stringify(directGlobalProbe)}`);
  assert.deepEqual(directGlobalProbe, { title: 'ZeroOmega global probe' });

  const systemReactivation = await sendFirefoxWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'activate-route',
    expectedAppliedRevisionId: globalWorkflow.state.applied.revision.id,
    route: { kind: 'system' },
  });
  console.error(`[Firefox explicit System reactivation] ${JSON.stringify(systemReactivation)}`);
  assert.equal(
    systemReactivation?.ok,
    true,
    `Firefox explicit System reactivation failed: ${JSON.stringify(systemReactivation)}`,
  );

  await waitForFirefoxGlobalActionState(
    systemAction,
    'Firefox global System Action baseline failed after explicit reactivation',
  );"""
count = text.count(old)
if count != 1:
    raise SystemExit(f"Firefox global diagnostic marker: expected one match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
