from pathlib import Path

path = Path('apps/extension/src/lib/profile-workflow-runtime.ts')
text = path.read_text()

old = """interface ProfileWorkflowMessageEvent {
  addListener(
    listener: (message: unknown) => Promise<ProfileWorkflowCommandResponse | undefined>,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}
"""
new = """interface ProfileWorkflowMessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) => ProfileWorkflowCommandResponse | Promise<ProfileWorkflowCommandResponse> | undefined,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}
"""
if text.count(old) != 1:
    raise SystemExit(f'profile workflow message event match count: {text.count(old)}')
text = text.replace(old, new)

old = """  const listener = async (
    message: unknown,
  ): Promise<ProfileWorkflowCommandResponse | undefined> => {
    if (!isProfileWorkflowCommand(message)) return undefined;
    return executeProfileWorkflowCommand(
      repository,
      initializer,
      message,
      applyService,
      importService,
      historyService,
      rollbackService,
      ruleSourceUpdateService,
    );
  };
"""
new = """  const listener = (
    message: unknown,
  ): Promise<ProfileWorkflowCommandResponse> | undefined => {
    if (!isProfileWorkflowCommand(message)) return undefined;
    return executeProfileWorkflowCommand(
      repository,
      initializer,
      message,
      applyService,
      importService,
      historyService,
      rollbackService,
      ruleSourceUpdateService,
    );
  };
"""
if text.count(old) != 1:
    raise SystemExit(f'profile workflow async listener match count: {text.count(old)}')
path.write_text(text.replace(old, new))

# Permanent source guard: every runtime channel must reject unrelated messages synchronously.
guard = Path('scripts/validate-ui-compatibility.mjs')
guard_text = guard.read_text()
old = """  [
    popupApp.includes('class=\"popup-footer\"'),
    'Popup must retain the familiar bottom options action area.',
  ],
"""
new = """  [
    popupApp.includes('class=\"popup-footer\"'),
    'Popup must retain the familiar bottom options action area.',
  ],
  [
    runtime.includes('): Promise<ProfileWorkflowCommandResponse> | undefined =>') &&
      runtime.includes('if (!isProfileWorkflowCommand(message)) return undefined;') &&
      !runtime.includes('const listener = async'),
    'Profile Workflow messaging must synchronously reject unrelated channels so parallel extension listeners cannot consume each other’s responses.',
  ],
"""
if guard_text.count(old) != 1:
    raise SystemExit(f'profile message guard insertion count: {guard_text.count(old)}')
guard.write_text(guard_text.replace(old, new))
