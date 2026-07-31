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

  it('notifies only after a successful command returns an applied snapshot', async () => {
    const listener = vi.fn();
    const apply = command('apply');

    await notifyProfileWorkflowActivation(apply, success('snapshot-7'), listener);

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

  it('waits for asynchronous activation follow-up before resolving', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const listener = vi.fn(() => gate);
    const notification = notifyProfileWorkflowActivation(
      command('apply'),
      success('snapshot-8'),
      listener,
    );
    let resolved = false;
    void notification.then(() => {
      resolved = true;
    });

    expect(listener).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(resolved).toBe(false);

    release();
    await notification;
    expect(resolved).toBe(true);
  });

  it('propagates activation follow-up failures', async () => {
    const failure = new Error('toolbar refresh failed');

    await expect(
      notifyProfileWorkflowActivation(command('apply'), success('snapshot-9'), () =>
        Promise.reject(failure),
      ),
    ).rejects.toBe(failure);
  });

  it('does not notify for successful commands that did not activate a snapshot', async () => {
    const listener = vi.fn();

    await notifyProfileWorkflowActivation(command('get'), success(), listener);

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify for failed commands', async () => {
    const listener = vi.fn();

    await notifyProfileWorkflowActivation(
      command('apply'),
      { ok: false, code: 'apply-failed', message: 'failed', state, view },
      listener,
    );

    expect(listener).not.toHaveBeenCalled();
  });
});
