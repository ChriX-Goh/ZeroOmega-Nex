# Milestone 8 — Familiar UI and Profile Workflow

## Objective

Deliver a recognizable ZeroOmega/SwitchyOmega-style workflow on top of the verified ProfileSpec, importer, compiler, and browser-adapter layers.

The UI is a control surface. It never calls browser proxy APIs directly and never treats an edited document as active merely because it was saved.

## User-facing state model

The interface must keep these states visibly distinct:

1. **Saved** — the persisted ProfileSpec revision.
2. **Draft** — local edits that have not been saved.
3. **Candidate** — a saved revision submitted for validation and PAC compilation.
4. **Verified** — a candidate that passed ProfileSpec validation, PAC capability analysis, and differential verification.
5. **Installed** — a verified runtime snapshot written to the browser proxy API.
6. **Active** — the installed snapshot confirmed as browser-controlled and recorded as active.
7. **Failed** — validation, compilation, installation, confirmation, or rollback failed with a reviewable reason.

No UI action may collapse these stages into a single optimistic “Apply” success state.

## Familiar layout

### Options page

- Persistent left profile navigation with profile color, name, type, and active/draft indicators.
- Built-in Direct and System routes shown as special routes, not editable user profiles.
- Main editor area for the selected profile.
- Top-level Save/Revert and Compile/Apply actions with clear disabled and busy states.
- General, Import/Export, Interface, Snapshot History, and About sections.
- Responsive behavior that preserves navigation and primary actions at narrow widths.

### Popup

- Active route shown first and clearly marked.
- Ordered quick-switch routes, including Direct and System.
- One-click activation only for already saved and compilable routes.
- Busy, failed, conflict, and permission-required states remain visible rather than closing silently.
- Options-page entry remains available at all times.

## Profile editors

### Fixed profile

- Per-scheme proxy endpoint selection with fallback endpoint.
- Endpoint protocol, host, port, display name, and optional username.
- Password represented only through secret storage; never echoed into ordinary form state after save.
- Ordered bypass entries with enabled state and validation feedback.

### Switch profile

- Ordered rules with condition editor and route target.
- First-match ordering is visually explicit.
- Drag, keyboard reorder, duplicate, enable/disable, and delete operations.
- Default route remains separate from ordered rules.

### Rule-list profile

- Source selection, format, match route, and default route.
- Inline source editor or URL source configuration.
- Sensitive request headers use secret references and masked editing.
- Parsed-rule preview and update state are separate from the saved source definition.

### PAC profile

- Inline or URL source selection.
- Sensitive request headers use secret references.
- Fallback route is explicit.
- Arbitrary PAC profiles are visibly marked as outside the deterministic compiler path.

### Auto-detect profile

- Browser-dependent capability warning.
- Explicit fallback route.

## Import workflow

1. Select or paste a ZeroOmega/SwitchyOmega backup.
2. Decode and validate without changing the active browser proxy state.
3. Show exact, preserved, downgraded, target-dependent, ignored, and rejected migration items.
4. Show extracted secret-material destinations without rendering secret values.
5. Allow profile-by-profile review before accepting the imported candidate.
6. Save as a new ProfileSpec revision.
7. Compile and activate only through the normal candidate pipeline.

Import never activates automatically.

## Compile and activation workflow

1. Save the draft as a new immutable revision.
2. Validate ProfileSpec.
3. Select a start route and target browser contract.
4. Compile and run differential verification.
5. Persist the verified runtime snapshot.
6. Activate through the browser-adapter transaction.
7. Read back browser ownership and installed snapshot identity.
8. Report active only after confirmation.

Failures expose stage, reason, prior active snapshot, and rollback status.

## Snapshot history and rollback

- List verified snapshots by creation time, source revision, start route, browser target, compiler version, and script hash prefix.
- Mark active and last-known-good snapshots.
- Allow inspection of warnings and verification counts without exposing PAC source secrets.
- Rollback uses the same atomic activation transaction as normal activation.
- Missing or corrupted snapshots cannot be selected.

## Component and state boundaries

- Svelte components use explicit Svelte 5 runes for local reactive state.
- Persistent state and browser operations live behind typed service interfaces.
- Background messaging is typed and command-oriented.
- Browser APIs are accessed only inside background adapters, never during component module evaluation.
- UI state must be serializable for deterministic tests, except ephemeral DOM focus and animation state.
- Effects are reserved for browser/DOM synchronization, not ordinary derived state.

## Accessibility and interaction

- Full keyboard navigation for profile lists, rule lists, dialogs, and action bars.
- Visible focus state and semantic labels.
- Color never carries status alone.
- Destructive actions require explicit confirmation and identify the affected profile or snapshot.
- Long-running operations expose progress and remain cancellable where cancellation is safe.

## Automated acceptance

- State-machine tests cover save, revert, compile, activation, conflict, failure, and rollback transitions.
- Component tests cover every profile editor and popup route action.
- Import fixtures render deterministic migration summaries.
- Snapshot history excludes secrets and rejects corrupted records.
- Keyboard and accessibility checks cover primary workflows.
- Chromium and Firefox production builds pass manifest and architecture audits.
- No component source contains direct `proxy.settings`, `proxy.onRequest`, or WebRequest listener registration.

## Repository-owner QC

Intermediate UI slices are verified through GitHub CI and automated browser/component checks. Repository-owner QC is deferred until the complete installable release candidate, with a single prepared package and focused checklist.