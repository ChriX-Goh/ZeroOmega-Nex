import { describe, expect, it } from 'vitest';

import { deriveOriginalToolbarIconState } from './original-toolbar-icon-state';

describe('original toolbar icon state', () => {
  const base = {
    currentProfileColor: '#111111',
    matchedProfileColor: '#222222',
    directProfileColor: '#333333',
    directResult: false,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  } as const;

  it('uses a one-color cut-out icon when a static current profile matches itself', () => {
    expect(
      deriveOriginalToolbarIconState({
        ...base,
        currentProfileStatic: true,
        matchedProfileIsCurrent: true,
      }),
    ).toEqual({
      mode: 'single-color',
      outerCircleColor: '#222222',
    });
  });

  it('uses result/current colors when an inclusive profile resolves elsewhere', () => {
    expect(deriveOriginalToolbarIconState(base)).toEqual({
      mode: 'two-color',
      outerCircleColor: '#222222',
      innerCircleColor: '#111111',
    });
  });

  it('preserves the two-color branch when an inclusive profile resolves to itself', () => {
    expect(
      deriveOriginalToolbarIconState({
        ...base,
        matchedProfileIsCurrent: true,
      }),
    ).toEqual({
      mode: 'two-color',
      outerCircleColor: '#222222',
      innerCircleColor: '#111111',
    });
  });

  it('uses the Direct color outside and the matched profile color inside', () => {
    expect(
      deriveOriginalToolbarIconState({
        ...base,
        directResult: true,
      }),
    ).toEqual({
      mode: 'two-color',
      outerCircleColor: '#333333',
      innerCircleColor: '#222222',
    });
  });
});
