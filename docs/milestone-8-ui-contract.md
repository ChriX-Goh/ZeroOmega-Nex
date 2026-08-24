# Milestone 8 — Original-Compatible UI and Profile Workflow

## Objective

Deliver a ZeroOmega Nex workflow that an existing ZeroOmega/SwitchyOmega user can use without relearning the Options layout or manually rebuilding an exported configuration.

Compatibility means more than similar colors or terminology. The information architecture, page boundaries, navigation order, profile workflow, Apply/Discard placement, and migration path must remain recognizably original.

The UI remains a control surface. It never calls browser proxy APIs or persistent secret storage directly and never treats edited data as active merely because it was rendered or saved.

## Primary user contract

1. Opening Options produces a complete browser tab, not a cramped extension dialog.
2. The left navigation remains persistent while the selected page opens independently on the right.
3. Existing users find Settings, Profiles, and Actions in the same conceptual order as original ZeroOmega.
4. Global settings never appear inside a profile editor.
5. There is one `New profile…` entry, followed by an independent profile-type selection page.
6. An original schema-version-2 export can be selected as a file and used without reconstructing profiles by hand.
7. Automatic, Light, and Dark appearance modes are available; Automatic is the default.
8. Internal safety concepts such as candidate revisions and compare-and-swap remain implemented but do not force users to learn a new navigation model.

## User-facing state model

The control plane keeps these states distinct internally:

1. **Draft** — edited configuration not yet active.
2. **Candidate** — a revision submitted for validation and compilation.
3. **Verified** — a candidate that passed validation and the applicable PAC safety checks.
4. **Installed** — a verified runtime snapshot written to the browser proxy API.
5. **Active** — installed state confirmed from the browser and committed as active.
6. **Failed** — validation, compilation, installation, confirmation, commit, or rollback failed with a visible reason.

The familiar user-facing actions remain `Apply changes` and `Discard changes`. A successful Apply is reported only after browser confirmation and workflow commit.

## Required Options architecture

### Full-tab shell

- Options declares the browser `open_in_tab` behavior.
- The shell uses a fixed-width left navigation and a flexible right-hand editor.
- The right side is not artificially constrained to a narrow card column on desktop.
- Narrow screens may collapse to one column, but navigation and actions remain available.

### Settings group

Independent pages, in this order:

- Interface
- General
- Import / Export
- Theme
- Snapshot History

General owns startup and Quick Switch behavior. Those controls must not be duplicated beneath every profile.

### Profiles group

- Built-in Profiles
- One entry per user profile, preserving profile name and color
- One `New profile…` entry

Selecting a profile changes only the right-hand editor page. Direct and System remain built-in routes, not editable user profiles.

### Actions group

- Apply changes
- Discard changes
- Visible Draft/busy status

These actions remain available in the persistent navigation rather than moving unpredictably among profile pages.

## Independent page requirements

### Interface

Contains confirmation, condition-order, advanced-condition, inspect-menu, badge, external-profile, and legacy-export preferences supported by ProfileSpec.

### General

Contains startup route, release-control restoration, Quick Switch enabled state, refresh behavior, route order, and route additions/removals.

### Import / Export

Provides file-first original backup restoration, optional pasted backup text, compatibility analysis, explicit `Import and use now`, and `Import without activating`.

### Theme

Provides:

- Automatic — default; follows `prefers-color-scheme`
- Light — persistent device-local override
- Dark — persistent device-local override

Appearance preference is UI-local and must not change routing state, ProfileSpec revision identity, or imported configuration bytes.

### Snapshot History

Lists redacted revision and PAC snapshot metadata, active/last-known-good state, verification mode, warnings, and two-step rollback.

### Built-in Profiles

Shows Direct and System Proxy behavior and editable colors without creating fake user profiles.

### New Profile

Offers Fixed, Switch, Rule List, PAC, and Auto Detect types from one independent selection page.

### User profile

Contains only the selected profile’s identity and detailed configuration, plus profile-scoped duplicate/delete actions.

## Profile editors

### Fixed profile

- Protocol, server, port, and bypass settings use the full right-hand workspace.
- Supported credential references remain background-owned and secrets never re-enter ordinary form state.
- Original imported endpoint ordering and bypass entries are preserved where representable.

### Switch profile

- Ordered rules, default route, condition editor, enable/disable, duplicate, delete, and move operations.
- First-match order remains explicit.
- Imported condition order must not be silently rearranged.

### Rule-list profile

- Inline or URL source, source format, refresh interval, match route, default route, and request-header references.
- Original Switchy and AutoProxy formats are mapped deterministically.

### PAC profile

- Inline or URL source, fallback route, and request-header references.
- Browser-target-dependent behavior is disclosed instead of silently treated as exact.

### Auto-detect profile

- Explicit browser capability warning and fallback route.

## Original backup migration contract

1. Accept an original `.bak`, `.json`, or `.txt` file, or pasted JSON/base64 backup text.
2. Decode and validate without changing Draft or active traffic.
3. Show encoding, profile count, endpoint count, rule-source count, credential presence, migration status totals, and technical details.
4. Extract secrets into background-owned storage without showing their values.
5. Preserve supported profile names, colors, types, endpoint values, bypass entries, switch-rule order, rule-list sources, PAC definitions, startup route, Quick Switch order, and interface settings.
6. `Import and use now` performs the typed import transaction followed by the normal verified Apply transaction as one explicit user action.
7. `Import without activating` writes the imported configuration to Draft only.
8. Corrupt, unknown, cyclic, internally inconsistent, or unsupported records are rejected explicitly rather than guessed.

Selecting a file or viewing compatibility results never activates traffic automatically. Activation requires the explicit `Import and use now` action.

## Compile and activation workflow

1. Persist Draft as a new immutable revision.
2. Validate ProfileSpec.
3. Select start route and target browser contract.
4. Compile and run the applicable verification path.
5. Persist the verified runtime snapshot.
6. Prepare authentication bindings and optional permissions where required.
7. Install through the browser-adapter transaction.
8. Read back browser ownership and installed identity.
9. Commit active workflow state only after confirmation.
10. Restore prior browser/authentication state if any later step fails.

Failures expose stage, reason, and rollback outcome globally in Options.

## Popup contract

- Popup reads Applied configuration only.
- Ordered Quick Switch routes include supported user profiles, Direct, and System.
- Active route is based on browser-confirmed state.
- Busy, failed, stale-revision, conflict, and permission-required states remain visible.
- Options-page entry remains available.

## Accessibility and interaction

- Full keyboard access for navigation, forms, rule lists, dialogs, themes, actions, and rollback.
- Visible focus state.
- Semantic labels and headings.
- Color never carries status alone.
- Destructive actions require explicit confirmation identifying the affected object.

## Permanent automated acceptance

- UI guard checks full-tab behavior, original navigation groups, independent General/profile pages, one-step original backup migration, themes, responsive layout, focus visibility, rollback confirmation, and global error visibility.
- Component tests cover Popup, profile editors, import entry, theme choices, and history/rollback states.
- Importer tests cover schema-v2 JSON, base64, every supported profile and condition family, built-in colors, rule formats, secrets, invalid records, and representative scale.
- Chromium real-browser E2E uploads an original backup fixture and completes `Import and use now`, in addition to theme, edit, Apply, history, Popup, and Direct switching.
- Firefox real-browser E2E covers the restored navigation, edit, Apply, history, Popup, Direct switching, and private-window proxy prerequisites.
- Production builds pass manifest, CSP/dynamic-code, architecture, type, format, lint, and packaging checks.

## Repository-owner QC

Automated checks cannot determine whether the result feels like original ZeroOmega or whether a personal real-world export is fully usable. Repository-owner QC must compare navigation and fields against the original extension, import an actual personal export, and record exact defects. The PR remains Draft until that replacement candidate passes.
