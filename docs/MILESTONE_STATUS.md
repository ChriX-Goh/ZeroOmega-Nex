# Milestone Status

## Active milestone

Milestone 1 — Monorepo and deterministic tooling.

## Scope

- pnpm workspace.
- Strict TypeScript boundaries.
- WXT plus Svelte extension shell.
- Firefox and Chromium Manifest V3 build commands.
- Popup and options layout shell.
- Unit-test, lint, formatting, architecture-guard, and CI entrypoints.
- No production proxy behavior.

## Delivered in the current branch

- Root workspace and pinned tool configuration.
- Committed `pnpm-lock.yaml` generated through GitHub Actions.
- Frozen-lockfile CI installation with read-only repository permissions.
- `apps/extension` WXT application.
- `packages/core-contracts` workspace boundary and tests.
- Background entrypoint without proxy or request listeners.
- Familiar-profile popup shell.
- Familiar sidebar/editor options shell.
- Architecture guard against premature proxy permission and request listeners.
- Deterministic Chromium MV3 and Firefox MV3 production builds.
- Generated-manifest audit and downloadable CI build archive.
- Firefox stable extension ID and explicit no-data-collection declaration.

## Automated acceptance evidence

GitHub Actions run 40 completed successfully for commit `47bc8d7d66622bdf71a6a3f535c687b4478d2d85`.

The verified pipeline completed:

- Frozen dependency installation.
- Architecture guard.
- ESLint.
- Prettier check.
- Strict TypeScript check.
- Svelte diagnostics with zero errors and zero warnings.
- Vitest: 1 test file and 2 tests passed.
- Chromium Manifest V3 production build.
- Firefox Manifest V3 production build.
- Manifest audit.
- Build archive creation and artifact upload.

Generated manifests were also downloaded and inspected independently:

- Chromium: Manifest V3, empty `permissions`, no host permissions, popup, options page, and service-worker background.
- Firefox: Manifest V3, empty `permissions`, no host permissions, popup, options page, background script, stable Gecko ID, and `data_collection_permissions.required = ["none"]`.
- Neither manifest contains `proxy`, `webRequest`, `webRequestBlocking`, or `<all_urls>`.

## Open acceptance item

- Temporarily load both generated packages in real Chromium and Firefox installations and visually verify popup/options rendering and background startup.

Milestone 1 remains a Draft until the real-browser loading check is recorded. No Milestone 2 compatibility implementation should merge into this PR.
