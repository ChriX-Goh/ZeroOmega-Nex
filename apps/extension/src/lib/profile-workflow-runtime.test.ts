import type {
  ProfileWorkflowCommand,
  ProfileWorkflowCommandResponse,
  ProfileWorkflowState,
  ProfileWorkflowView,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it, vi } from 'vitest';

import {
  createInitialBrowserProfileSpec,
  notifyProfileWorkflowActivation,
} from './profile-workflow-runtime';

const state = {} as ProfileWorkflowState;
const view = {} as ProfileWorkflowView;

function command(action: 'get' | 'apply'): ProfileWorkflowCommand {
  return action === 'get'
    ? { channel: 'zeroomega-nex/profile-workflow/v1', action }
    : { channel: 'zeroomega-nex/profile-workflow/v1', action, expectedGeneration: 2 };
}

function success(appliedSnapshotId?: string): ProfileWorkflowCommandResponse {
  return {
    ok: true,
    state,
    view,
    ...(appliedSnapshotId === undefined ? {} : { appliedSnapshotId }),
  };
}

describe('profile workflow activation notification', () => {
  it('creates a browser-safe original System startup without a placeholder proxy', () => {
    const initial = createInitialBrowserProfileSpec('device-runtime');

    expect(initial.settings.startup.route).toEqual({ kind: 'system' });
    expect(initial.settings.interface.builtInProfiles).toEqual({
      direct: { color: '#aaaaaa' },
      system: { color: '#000000' },
    });
    expect(initial.proxyEndpoints).toEqual([]);
    expect(initial.profiles[0]).toMatchObject({
      kind: 'fixed',
      proxyByScheme: {},
    });
  });

  it('notifies only after a successful command returns an applied snapshot', () => {
    const listener = vi.fn();
    const apply = command('apply');

    notifyProfileWorkflowActivation(apply, success('snapshot-7'), listener);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({
      command: apply,
      response: {
        ok: true,
        state,
        view,
        appliedSnapshotId: 'snapshot-7',
      },
    });
  });

  it('does not notify for successful commands that did not activate a snapshot', () => {
    const listener = vi.fn();

    notifyProfileWorkflowActivation(command('get'), success(), listener);

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify for failed commands', () => {
    const listener = vi.fn();

    notifyProfileWorkflowActivation(
      command('apply'),
      { ok: false, code: 'apply-failed', message: 'failed', state, view },
      listener,
    );

    expect(listener).not.toHaveBeenCalled();
  });
});
