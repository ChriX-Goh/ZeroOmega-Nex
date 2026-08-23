const MAX_PROFILE_SPEC_IDENTIFIER_LENGTH = 128;
const FALLBACK_DEVICE_ID = 'zeroomega-nex-extension';

export function normalizeExtensionDeviceId(runtimeId: string): string {
  const sanitized = runtimeId
    .trim()
    .replace(/[^A-Za-z0-9._:-]+/gu, '-')
    .replace(/^[^A-Za-z0-9]+/u, '')
    .replace(/-+$/u, '')
    .slice(0, MAX_PROFILE_SPEC_IDENTIFIER_LENGTH);
  return sanitized.length === 0 ? FALLBACK_DEVICE_ID : sanitized;
}
