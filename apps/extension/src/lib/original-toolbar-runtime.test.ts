import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import type {
  OriginalToolbarActionApi,
  OriginalToolbarActionIconPaths,
  OriginalToolbarActionImageDataSet,
} from './original-toolbar-action-adapter';
import type {
  OriginalToolbarCanvas,
  OriginalToolbarCanvasContext,
} from './original-toolbar-icon-renderer';
import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import type {
  OriginalToolbarProfileStateRepository,
  OriginalToolbarRuntimeInspector,
} from './original-toolbar-profile-resolver';
import {
  registerOriginalToolbarRuntime,
  type OriginalToolbarTabRemovedListener,
} from './original-toolbar-runtime';
import type {
  OriginalToolbarActivatedListener,
  OriginalToolbarEvent,
  OriginalToolbarTabsApi,
  OriginalToolbarUpdatedListener,
} from './original-toolbar-tab-coordinator';

class RecordingAction implements OriginalToolbarActionApi {
  readonly icons: Array<{
    readonly tabId: number;
    readonly imageData?: OriginalToolbarActionImageDataSet;
    readonly path?: OriginalToolbarActionIconPaths;
  }> = [];
  readonly titles: Array<{ readonly tabId: number; readonly title: string }> = [];
  readonly badges: Array<{ readonly tabId: number; readonly text: string }> = [];
  readonly badgeColors: Array<{ readonly tabId: number; readonly color: string }> = [];
  readonly popups: Array<{ readonly tabId: number; readonly popup: string }> = [];

  setIcon(details: {
    readonly tabId: number;
    readonly imageData?: OriginalToolbarActionImageDataSet;
    readonly path?: OriginalToolbarActionIconPaths;
  }): void {
    this.icons.push(details);
  }

  setTitle(details: { readonly tabId: number; readonly title: string }): void {
    this.titles.push(details);
  }

  setBadgeText(details: { readonly tabId: number; readonly text: string }): void {
    this.badges.push(details);
  }

  setBadgeBackgroundColor(details: { readonly tabId: number; readonly color: string }): void {
    this.badgeColors.push(details);
  }

  setPopup(details: { readonly tabId: number; readonly popup: string }): void {
    this.popups.push(details);
  }
}

class ListenerEvent<Listener> implements OriginalToolbarEvent<Listener> {
  readonly listeners = new Set<Listener>();

  addListener(listener: Listener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: Listener): void {
    this.listeners.delete(listener);
  }
}

class TransparentCanvasContext implements OriginalToolbarCanvasContext {
  globalCompositeOperation = 'source-over';
  strokeStyle = '';
  fillStyle = '';
  lineWidth = 0;

  beginPath(): void {}
  arc(): void {}
  closePath(): void {}
  stroke(): void {}
  fill(): void {}
  scale(): void {}
  clearRect(): void {}
  setTransform(): void {}

  getImageData(_x: number, _y: number, width: number, height: number) {
    return { width, height, data: new Uint8ClampedArray(width * height * 4) };
  }
}

class TransparentCanvas implements OriginalToolbarCanvas {
  readonly context = new TransparentCanvasContext();

  getContext(): OriginalToolbarCanvasContext {
    return this.context;
  }
}

class ToolbarI18n implements OriginalToolbarI18nApi {
  getMessage(messageName: string, substitutions?: string | readonly string[]): string {
    if (messageName === 'manifest_icon_default_title') return 'Loading…';
    if (messageName === 'browserAction_titleWithResult') {
      const values = Array.isArray(substitutions) ? substitutions : [];
      return `ZeroOmega:: ${values[0] ?? ''}\n${values[2] ?? ''}`;
    }
    const messages: Readonly<Record<string, string>> = {
      routeDirect: 'Direct',
      routeSystem: 'System Proxy',
      browserAction_directResult: 'DIRECT',
      browserAction_titleExternalProxy: 'controlled externally',
    };
    return messages[messageName] ?? '';
  }
}

class MemoryRepository implements OriginalToolbarProfileStateRepository {
  constructor(readonly state: ProfileWorkflowState | undefined) {}

  async read(): Promise<ProfileWorkflowState | undefined> {
    return this.state;
  }
}

class FixedRuntime implements OriginalToolbarRuntimeInspector {
  constructor(readonly view: ProfileWorkflowRuntimeView) {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return this.view;
  }
}

function workflowState(): ProfileWorkflowState {
  return createProfileWorkflowState(
    createDefaultProfileSpec({
      documentId: 'document-toolbar-runtime',
      revisionId: 'revision-toolbar-runtime',
      createdAt: '2026-07-31T10:00:00.000Z',
    }),
  );
}

function harness() {
  const action = new RecordingAction();
  const updated = new ListenerEvent<OriginalToolbarUpdatedListener>();
  const activated = new ListenerEvent<OriginalToolbarActivatedListener>();
  const removed = new ListenerEvent<OriginalToolbarTabRemovedListener>();
  const tabs: OriginalToolbarTabsApi = {
    onUpdated: updated,
    onActivated: activated,
    async get(tabId) {
      return { id: tabId, url: 'https://example.test/' };
    },
    async query() {
      return [{ id: 7, url: 'https://example.test/' }];
    },
  };
  const canvas = new TransparentCanvas();
  const runtime = registerOriginalToolbarRuntime({
    api: { action, i18n: new ToolbarI18n(), tabs },
    repository: new MemoryRepository(workflowState()),
    runtime: new FixedRuntime({ activeRoute: { kind: 'direct' } }),
    tabRemoved: removed,
    browserRuntime: { canvasFactory: () => canvas },
  });
  return { action, updated, activated, removed, runtime };
}

describe('registered original toolbar runtime', () => {
  it('owns tab listeners and writes repository-backed base state', async () => {
    const { action, updated, activated, removed, runtime } = harness();

    expect(updated.listeners).toHaveLength(1);
    expect(activated.listeners).toHaveLength(1);
    expect(removed.listeners).toHaveLength(1);

    await runtime.refreshAll({ clearIconCache: true });

    expect(action.titles.at(-1)).toEqual({
      tabId: 7,
      title: 'ZeroOmega:: [Direct]\nDIRECT',
    });
    expect(action.badges.at(-1)).toEqual({ tabId: 7, text: '' });
    expect(action.popups.at(-1)).toEqual({ tabId: 7, popup: 'popup-iframe.html' });

    runtime.dispose();
    expect(updated.listeners).toHaveLength(0);
    expect(activated.listeners).toHaveLength(0);
    expect(removed.listeners).toHaveLength(0);
  });

  it('applies Inspect through the same executor and discards it for a closed tab', async () => {
    const { action, removed, runtime } = harness();

    runtime.inspectAction.setBadgeText({ tabId: 7, text: '#' });
    runtime.inspectAction.setBadgeBackgroundColor({ tabId: 7, color: '#aaaaaa' });
    runtime.inspectAction.setTitle({ tabId: 7, title: '[Inspect] example.test' });
    await runtime.refreshAll();

    expect(action.badges.at(-1)).toEqual({ tabId: 7, text: '#' });
    expect(action.badgeColors.at(-1)).toEqual({ tabId: 7, color: '#aaaaaa' });
    expect(action.titles.at(-1)).toEqual({ tabId: 7, title: '[Inspect] example.test' });

    for (const listener of removed.listeners) listener(7);
    await runtime.refreshAll();

    expect(action.badges.at(-1)).toEqual({ tabId: 7, text: '' });
    expect(action.titles.at(-1)).toEqual({
      tabId: 7,
      title: 'ZeroOmega:: [Direct]\nDIRECT',
    });
  });
});
