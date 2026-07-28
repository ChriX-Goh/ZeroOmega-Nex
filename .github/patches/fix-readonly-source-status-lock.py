from pathlib import Path

path = Path('apps/extension/src/entrypoints/options/App.svelte')
text = path.read_text()
old_rule = """  async function getRuleSourceUpdateStatus(
    sourceId: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-rule-source-update-status',
        sourceId,
      });
      acceptResponse(response);
      return response.ruleSourceUpdate;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    } finally {
      saving = false;
    }
  }
"""
new_rule = """  async function getRuleSourceUpdateStatus(
    sourceId: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state) return undefined;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-rule-source-update-status',
        sourceId,
      });
      if (!response.ok) {
        errorMessage = uiText('options.error.safeMessage', locale);
        return undefined;
      }
      return response.ruleSourceUpdate;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    }
  }
"""
old_pac = """  async function getPacSourceUpdateStatus(
    profileId: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-pac-source-update-status',
        profileId,
      });
      acceptResponse(response);
      return response.pacSourceUpdate;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    } finally {
      saving = false;
    }
  }
"""
new_pac = """  async function getPacSourceUpdateStatus(
    profileId: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state) return undefined;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-pac-source-update-status',
        profileId,
      });
      if (!response.ok) {
        errorMessage = uiText('options.error.safeMessage', locale);
        return undefined;
      }
      return response.pacSourceUpdate;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    }
  }
"""
for old, new, label in ((old_rule, new_rule, 'Rule Source'), (old_pac, new_pac, 'PAC')):
    if text.count(old) != 1:
        raise SystemExit(f'expected one {label} status block, found {text.count(old)}')
    text = text.replace(old, new)
path.write_text(text)

validator = Path('scripts/validate-ui-compatibility.mjs')
guard = validator.read_text()
anchor = """  [
    workflowClient.includes('PROFILE_WORKFLOW_STATE_STORAGE_KEY') &&
"""
requirement = """  [
    optionsApp.includes("action: 'get-rule-source-update-status'") &&
      optionsApp.includes("action: 'get-pac-source-update-status'") &&
      !optionsApp.match(/getRuleSourceUpdateStatus[\\s\\S]*?saving = true/u) &&
      !optionsApp.match(/getPacSourceUpdateStatus[\\s\\S]*?saving = true/u),
    'Read-only Rule Source and PAC status queries must not take the global mutation lock or block profile selection.',
  ],
"""
if guard.count(anchor) != 1:
    raise SystemExit(f'expected one status subscription guard anchor, found {guard.count(anchor)}')
validator.write_text(guard.replace(anchor, requirement + anchor))
