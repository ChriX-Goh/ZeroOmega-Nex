from pathlib import Path

path = Path('.github/patches/apply-popup-temporary-rules-coordinator.py')
text = path.read_text()

old = """interface PopupTemporaryRuleMessageEvent {
  addListener(
    listener: (message: unknown) => Promise<PopupTemporaryRuleCommandResponse | undefined>,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}
"""
new = """interface PopupTemporaryRuleMessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) => PopupTemporaryRuleCommandResponse | Promise<PopupTemporaryRuleCommandResponse> | undefined,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary message event match count: {text.count(old)}')
text = text.replace(old, new)

old = """  const listener = async (message: unknown): Promise<PopupTemporaryRuleCommandResponse | undefined> => {
    if (!isPopupTemporaryRuleCommand(message)) return undefined;
    const state = await workflow.read();
    if (!state) return failure('storage-failure', 'profile workflow state is unavailable');
    if (message.action === 'get') {
      try {
        return response(await coordinator.view(state.applied));
      } catch (error) {
        return failure('storage-failure', errorMessage(error));
      }
    }
    if (state.applied.revision.id !== message.expectedAppliedRevisionId) {
      return failure(
        'conflict',
        `expected applied revision ${message.expectedAppliedRevisionId}, current revision is ${state.applied.revision.id}`,
        await coordinator.view(state.applied),
      );
    }
    try {
      if (message.action === 'toggle') {
        return response(await coordinator.toggle(state.applied, message.domain, message.route));
      }
      if (message.action === 'remove') {
        return response(await coordinator.remove(state.applied, message.domain));
      }
      return response(await coordinator.clear(state.applied));
    } catch (error) {
      return failure('activation-failed', errorMessage(error), await coordinator.view(state.applied));
    }
  };
"""
new = """  const handleMessage = async (
    message: Parameters<typeof isPopupTemporaryRuleCommand>[0] &
      import('./popup-temporary-rule-client').PopupTemporaryRuleCommand,
  ): Promise<PopupTemporaryRuleCommandResponse> => {
    const state = await workflow.read();
    if (!state) return failure('storage-failure', 'profile workflow state is unavailable');
    if (message.action === 'get') {
      try {
        return response(await coordinator.view(state.applied));
      } catch (error) {
        return failure('storage-failure', errorMessage(error));
      }
    }
    if (state.applied.revision.id !== message.expectedAppliedRevisionId) {
      return failure(
        'conflict',
        `expected applied revision ${message.expectedAppliedRevisionId}, current revision is ${state.applied.revision.id}`,
        await coordinator.view(state.applied),
      );
    }
    try {
      if (message.action === 'toggle') {
        return response(await coordinator.toggle(state.applied, message.domain, message.route));
      }
      if (message.action === 'remove') {
        return response(await coordinator.remove(state.applied, message.domain));
      }
      return response(await coordinator.clear(state.applied));
    } catch (error) {
      return failure('activation-failed', errorMessage(error), await coordinator.view(state.applied));
    }
  };
  const listener = (
    message: unknown,
  ): Promise<PopupTemporaryRuleCommandResponse> | undefined => {
    if (!isPopupTemporaryRuleCommand(message)) return undefined;
    return handleMessage(message);
  };
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary async listener match count: {text.count(old)}')
text = text.replace(old, new)

# Keep the command type as a normal imported type rather than an inline import expression.
old = """  isPopupTemporaryRuleCommand,
  type PopupTemporaryRuleCommandResponse,
} from './popup-temporary-rule-client';
"""
new = """  isPopupTemporaryRuleCommand,
  type PopupTemporaryRuleCommand,
  type PopupTemporaryRuleCommandResponse,
} from './popup-temporary-rule-client';
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary command import match count: {text.count(old)}')
text = text.replace(old, new)
text = text.replace(
    """    message: Parameters<typeof isPopupTemporaryRuleCommand>[0] &
      import('./popup-temporary-rule-client').PopupTemporaryRuleCommand,
""",
    """    message: PopupTemporaryRuleCommand,
""",
)

path.write_text(text)
