# Audit Evidence 01K — Original ZeroOmega v3.5.0 URL-Backed PAC Toolbar State

## Authority

- Package: official ZeroOmega `v3.5.0` Chromium release.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Runtime browser: Chromium `149.0.7827.55` on Ubuntu 24.04.
- Successful workflow run: `30716953006`.
- Artifact: `original-toolbar-evidence-v3.5.0`, ID `8823628953`.
- Artifact digest: `sha256:1741f776a3e58388babeb2406d28b828971bcf98bfc04ea889617eae1cdab2df`.
- Scenario: `pac` in the permanent read-only parameterized `Original Toolbar Evidence` workflow.

The scenario used one self-contained URL-backed `PacProfile`. Its PAC script returns `PROXY 127.0.0.1:18186` for `pac-proxy.test` and `DIRECT` for every other host. The workflow applied the profile through the original runtime and captured `_actionForUrl` for one proxy-returning URL and one direct-returning URL.

## Original profile

- name: `Runtime PAC`;
- profile type: `PacProfile`;
- color: `#4db6ac`;
- source: URL-backed PAC with a cached script;
- result Badge option: enabled.

A `data:` PAC URL was used only to keep the original runtime evidence independent of external network availability. The original Action displays the source URL verbatim.

## Exact observable result

Both `http://pac-proxy.test/path` and `http://pac-direct.test/path` produced the same Action contract:

```text
ZeroOmega:: Runtime PAC
<PAC source URL>
```

- current name: `Runtime PAC`;
- result name: `Runtime PAC`;
- details: the exact PAC source URL, with no synthetic route line;
- Badge: `Runt`;
- result color: `#4db6ac`;
- profile/current color: `#4db6ac`;
- icon input: one color;
- prefix: empty.

## Source/runtime consequences

1. The original Toolbar does not expose the PAC return value for each tab URL.
2. A PAC result of `PROXY ...` and a PAC result of `DIRECT` do not create different Action titles, result names, Badges or colors.
3. The applied PAC profile remains both current and result profile.
4. The PAC source URL is displayed verbatim as the detail line.
5. The profile name supplies the four-code-unit Badge.
6. The profile color supplies both Action color inputs, producing a one-color icon.
7. PAC execution remains delegated to the browser PAC runtime; the Toolbar projection must not execute arbitrary PAC merely to manufacture a per-URL explanation.

## Acceptance boundary

This evidence establishes only:

- one enabled URL-backed PAC profile;
- a cached PAC script;
- no custom request headers;
- no authentication metadata;
- no fallback profile;
- one explicit HTTP proxy return and one Direct return;
- ordinary HTTP tab URLs.

Inline-only PAC, uncached URL PAC, download errors, stale cache, headers, authentication, fallback profiles, SOCKS/HTTPS chains, invalid scripts, update transitions, temporary-rule prefixes and external-control overlays remain separate evidence gates and must remain fail-closed in the Original-observable projector.

This evidence closes only the represented PAC Toolbar slice. It does not close the complete PAC lifecycle, `KG-ICON-001` or repository-owner acceptance.
