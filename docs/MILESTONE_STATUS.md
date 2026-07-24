# Milestone Status

## Active milestone

Milestone 1 — Monorepo and deterministic tooling.

## Scope

- pnpm workspace.
- Strict TypeScript boundaries.
- WXT plus Svelte extension shell.
- Firefox and Chromium build commands.
- Popup and options layout shell.
- Unit-test, lint, formatting, architecture-guard, and CI entrypoints.
- No production proxy behavior.

## Delivered in the current branch

- Root workspace and tool configuration.
- `apps/extension` WXT application.
- `packages/core-contracts` workspace boundary and tests.
- Background entrypoint without proxy or request listeners.
- Familiar-profile popup shell.
- Familiar sidebar/editor options shell.
- CI workflow that installs, checks, tests, and builds both browser targets.
- Architecture guard against premature proxy permission and request listeners.

## Open acceptance items

- Generate and commit `pnpm-lock.yaml` from a trusted online dependency resolution.
- Confirm CI passes with the committed lockfile and switch CI to `--frozen-lockfile`.
- Inspect generated Chromium and Firefox manifests to confirm no proxy permission or all-URL access.
- Load both development packages manually and verify popup/options rendering.

Milestone 1 remains incomplete until those acceptance items have evidence in the implementation PR.
