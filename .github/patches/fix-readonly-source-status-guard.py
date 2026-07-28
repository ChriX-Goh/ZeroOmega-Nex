from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
old = """  [
    optionsApp.includes(\"action: 'get-rule-source-update-status'\") &&
      optionsApp.includes(\"action: 'get-pac-source-update-status'\") &&
      !optionsApp.match(/getRuleSourceUpdateStatus[\\s\\S]*?saving = true/u) &&
      !optionsApp.match(/getPacSourceUpdateStatus[\\s\\S]*?saving = true/u),
    'Read-only Rule Source and PAC status queries must not take the global mutation lock or block profile selection.',
  ],
"""
new = """  [
    optionsApp.includes(\"action: 'get-rule-source-update-status'\") &&
      optionsApp.includes(\"action: 'get-pac-source-update-status'\") &&
      optionsApp.includes(
        'async function getRuleSourceUpdateStatus(\\n    sourceId: string,\\n  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {\\n    if (!state) return undefined;',
      ) &&
      optionsApp.includes(
        'async function getPacSourceUpdateStatus(\\n    profileId: string,\\n  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {\\n    if (!state) return undefined;',
      ) &&
      !optionsApp.includes(
        'async function getRuleSourceUpdateStatus(\\n    sourceId: string,\\n  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {\\n    if (!state || saving)',
      ) &&
      !optionsApp.includes(
        'async function getPacSourceUpdateStatus(\\n    profileId: string,\\n  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {\\n    if (!state || saving)',
      ),
    'Read-only Rule Source and PAC status queries must not take the global mutation lock or block profile selection.',
  ],
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one broad read-only status guard, found {text.count(old)}')
path.write_text(text.replace(old, new))
