export interface OriginalToolbarIconStateInput {
  readonly currentProfileColor: string;
  readonly matchedProfileColor: string;
  readonly directProfileColor: string;
  readonly directResult: boolean;
  readonly currentProfileStatic: boolean;
  readonly matchedProfileIsCurrent: boolean;
}

export interface OriginalToolbarIconState {
  readonly mode: 'single-color' | 'two-color';
  readonly outerCircleColor: string;
  readonly innerCircleColor?: string;
}

/**
 * Derive the exact one-color or two-color Ω state used by ZeroOmega v3.5.0.
 *
 * Source authority:
 * zero-peak/ZeroOmega@v3.5.0
 * omega-target-chromium-extension/src/coffee/background.coffee
 * blob 0b2f996210b75df9fe08535de380a6606ac20ac8
 *
 * The outer circle represents the URL result color. The inner circle represents
 * the selected/current profile color. Static profiles whose matched result is
 * themselves use the original one-color cut-out rendering.
 */
export function deriveOriginalToolbarIconState(
  input: OriginalToolbarIconStateInput,
): OriginalToolbarIconState {
  if (input.directResult) {
    return {
      mode: 'two-color',
      outerCircleColor: input.directProfileColor,
      innerCircleColor: input.matchedProfileColor,
    };
  }

  if (input.matchedProfileIsCurrent && input.currentProfileStatic) {
    return {
      mode: 'single-color',
      outerCircleColor: input.matchedProfileColor,
    };
  }

  return {
    mode: 'two-color',
    outerCircleColor: input.matchedProfileColor,
    innerCircleColor: input.currentProfileColor,
  };
}
