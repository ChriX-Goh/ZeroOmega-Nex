from pathlib import Path

core = Path('.github/patches/apply-popup-temporary-rules-core.py')
text = core.read_text()
replacements = [
    (
        "export const POPUP_TEMPORARY_PROFILE_ID_PREFIX = '__zeroomega_nex_popup_temporary__/';",
        "export const POPUP_TEMPORARY_PROFILE_ID_PREFIX = 'zeroomega-nex.popup-temporary';",
    ),
    (
        """export function popupTemporaryProfileIdForBaseRoute(route: ProfileRouteTarget): string {
  return `${POPUP_TEMPORARY_PROFILE_ID_PREFIX}${routeToken(route)}`;
}

export function decodePopupTemporaryProfileId(value: string): ProfileRouteTarget | undefined {
  return value.startsWith(POPUP_TEMPORARY_PROFILE_ID_PREFIX)
    ? routeFromToken(value.slice(POPUP_TEMPORARY_PROFILE_ID_PREFIX.length))
    : undefined;
}

export function popupTemporarySnapshotId(profileId: string, nonce: string): string {
  if (!profileId.startsWith(POPUP_TEMPORARY_PROFILE_ID_PREFIX)) {
    throw new TypeError('temporary snapshot requires a temporary profile ID');
  }
  return `${POPUP_TEMPORARY_SNAPSHOT_ID_PREFIX}${profileId.slice(POPUP_TEMPORARY_PROFILE_ID_PREFIX.length)}/${encodeURIComponent(nonce)}`;
}
""",
        """export function popupTemporaryProfileIdForBaseRoute(_route: ProfileRouteTarget): string {
  return POPUP_TEMPORARY_PROFILE_ID_PREFIX;
}

export function popupTemporarySnapshotId(baseRoute: ProfileRouteTarget, nonce: string): string {
  return `${POPUP_TEMPORARY_SNAPSHOT_ID_PREFIX}${routeToken(baseRoute)}/${encodeURIComponent(nonce)}`;
}
""",
    ),
    ("id: `${profileId}/rule/${index}`,", "id: `${profileId}:rule:${index}`,"),
    (
        """  it('round-trips the base route through temporary profile and snapshot IDs', () => {
    const route = { kind: 'profile', profileId: 'profile:with/slash' } as const;
    const profileId = popupTemporaryProfileIdForBaseRoute(route);
    expect(decodePopupTemporaryProfileId(profileId)).toEqual(route);
    expect(decodePopupTemporarySnapshotId(popupTemporarySnapshotId(profileId, 'nonce'))).toEqual(route);
  });
""",
        """  it('uses a valid fixed profile ID and round-trips the base route through snapshot IDs', () => {
    const route = { kind: 'profile', profileId: 'profile:with:colon' } as const;
    const profileId = popupTemporaryProfileIdForBaseRoute(route);
    expect(profileId).toMatch(/^[A-Za-z0-9][A-Za-z0-9._:-]+$/u);
    expect(decodePopupTemporarySnapshotId(popupTemporarySnapshotId(route, 'nonce'))).toEqual(route);
  });
""",
    ),
]
for old, new in replacements:
    if text.count(old) != 1:
        raise SystemExit(f'temporary identifier patch match count {text.count(old)}: {old[:100]!r}')
    text = text.replace(old, new)

decoder_export = "  decodePopupTemporaryProfileId,\n"
if text.count(decoder_export) != 2:
    raise SystemExit(f'temporary decoder export match count: {text.count(decoder_export)}')
core.write_text(text.replace(decoder_export, ''))
