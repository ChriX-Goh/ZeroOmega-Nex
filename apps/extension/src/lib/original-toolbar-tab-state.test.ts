import { describe, expect, it } from 'vitest';

import { deriveOriginalToolbarTabState } from './original-toolbar-tab-state';

describe('original per-tab toolbar state', () => {
  it('composes a static profile result without Nex-only state', () => {
    expect(
      deriveOriginalToolbarTabState({
        currentProfileName: 'Proxy',
        resultProfileName: 'Proxy',
        details: 'HTTPS example.test => Proxy\n',
        icon: {
          currentProfileColor: '#32a8e6',
          matchedProfileColor: '#32a8e6',
          directProfileColor: '#7f8c8d',
          directResult: false,
          currentProfileStatic: true,
          matchedProfileIsCurrent: true,
        },
        badge: {
          enabled: false,
          resultProfileName: 'Proxy',
          resultProfileBuiltin: false,
        },
      }),
    ).toEqual({
      icon: {
        mode: 'single-color',
        outerCircleColor: '#32a8e6',
      },
      titleArguments: {
        currentProfileName: 'Proxy',
        resultProfileName: 'Proxy',
        details: 'HTTPS example.test => Proxy\n',
      },
    });
  });

  it('composes an inclusive result with original Badge and detail prefix', () => {
    expect(
      deriveOriginalToolbarTabState({
        currentProfileName: 'Auto Switch',
        resultProfileName: 'Proxy-US',
        details: '(列表) *.example.test => Proxy-US\n',
        detailPrefix: '(列表) ',
        icon: {
          currentProfileColor: '#f39c12',
          matchedProfileColor: '#32a8e6',
          directProfileColor: '#7f8c8d',
          directResult: false,
          currentProfileStatic: false,
          matchedProfileIsCurrent: false,
        },
        badge: {
          enabled: true,
          resultProfileName: 'Proxy-US',
          resultProfileBuiltin: false,
        },
      }),
    ).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#32a8e6',
        innerCircleColor: '#f39c12',
      },
      titleArguments: {
        currentProfileName: 'Auto Switch',
        resultProfileName: 'Proxy-US',
        details: '(列表) *.example.test => Proxy-US\n',
      },
      badgeText: 'Prox',
      detailPrefix: '(列表) ',
    });
  });

  it('composes a localized Direct result with the original two-color branch', () => {
    expect(
      deriveOriginalToolbarTabState({
        currentProfileName: '自动切换',
        resultProfileName: '直接连接',
        details: 'DIRECT\n',
        icon: {
          currentProfileColor: '#f39c12',
          matchedProfileColor: '#7f8c8d',
          directProfileColor: '#7f8c8d',
          directResult: true,
          currentProfileStatic: false,
          matchedProfileIsCurrent: false,
        },
        badge: {
          enabled: true,
          resultProfileName: 'direct',
          resultProfileBuiltin: true,
          builtinBadgeText: '直接连接',
        },
      }),
    ).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#7f8c8d',
        innerCircleColor: '#7f8c8d',
      },
      titleArguments: {
        currentProfileName: '自动切换',
        resultProfileName: '直接连接',
        details: 'DIRECT\n',
      },
      badgeText: '直接连接',
    });
  });
});
