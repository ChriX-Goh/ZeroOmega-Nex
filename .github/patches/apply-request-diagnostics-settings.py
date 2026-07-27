from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


replace_once(
    'packages/profile-spec/src/types.ts',
    """  showInspectMenu: boolean;
  addConditionsToBottom: boolean;
""",
    """  showInspectMenu: boolean;
  monitorWebRequests?: boolean;
  addConditionsToBottom: boolean;
""",
)
replace_once(
    'packages/profile-spec/schema/profile-spec-v1.schema.json',
    """            \"showInspectMenu\": {
              \"type\": \"boolean\"
            },
            \"addConditionsToBottom\": {
""",
    """            \"showInspectMenu\": {
              \"type\": \"boolean\"
            },
            \"monitorWebRequests\": {
              \"type\": \"boolean\"
            },
            \"addConditionsToBottom\": {
""",
)
replace_once(
    'packages/profile-workflow/src/defaults.ts',
    """        showInspectMenu: true,
        addConditionsToBottom: true,
""",
    """        showInspectMenu: true,
        monitorWebRequests: true,
        addConditionsToBottom: true,
""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """  if (options['-monitorWebRequests'] !== undefined) {
    state.report.add(
      'downgraded',
      'settings.monitor-disabled',
      '/-monitorWebRequests',
      'Permanent request monitoring was not imported; diagnostics remain opt-in and bounded.',
    );
  }

""",
    """  if (options['-monitorWebRequests'] !== undefined) {
    state.report.add(
      'exact',
      'settings.monitor-web-requests-mapped',
      '/-monitorWebRequests',
      'The request-monitoring preference was mapped; browser permission remains an explicit user grant.',
    );
  }

""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """        showInspectMenu: legacyBoolean(options['-showInspectMenu'], true),
        addConditionsToBottom: legacyBoolean(options['-addConditionsToBottom'], false),
""",
    """        showInspectMenu: legacyBoolean(options['-showInspectMenu'], true),
        monitorWebRequests: legacyBoolean(options['-monitorWebRequests'], true),
        addConditionsToBottom: legacyBoolean(options['-addConditionsToBottom'], false),
""",
)

replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """    | 'showInspectMenu'
    | 'addConditionsToBottom'
""",
    """    | 'showInspectMenu'
    | 'monitorWebRequests'
    | 'addConditionsToBottom'
""",
)
