export interface OriginalToolbarBadgeInput {
  readonly enabled: boolean;
  readonly resultProfileName?: string;
  readonly resultProfileBuiltin: boolean;
  readonly builtinBadgeText?: string;
}

/**
 * Derive the result-profile Badge text used by ZeroOmega v3.5.0.
 *
 * Source authority:
 * zero-peak/ZeroOmega@v3.5.0
 * omega-target-chromium-extension/src/coffee/background.coffee
 * blob 0b2f996210b75df9fe08535de380a6606ac20ac8
 *
 * The original uses the localized built-in Badge label when available, then
 * truncates the visible text to four JavaScript string code units.
 */
export function deriveOriginalToolbarBadgeText(
  input: OriginalToolbarBadgeInput,
): string | undefined {
  if (!input.enabled) return undefined;

  const source =
    input.resultProfileBuiltin && input.builtinBadgeText !== undefined
      ? input.builtinBadgeText
      : (input.resultProfileName ?? '');

  return source.substring(0, 4);
}
