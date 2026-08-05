# Audit Evidence 02S — Popup Policy Ownership

## Scope

This evidence closes the last current-site Popup ownership boundary: a browser-managed proxy policy that makes the WebExtension proxy API genuinely not controllable.

It does not simulate ownership with a mocked adapter. Firefox is started with an enterprise `Proxy` policy using `Locked: true`; Nex is then installed through Firefox BiDi and reads the native `browser.proxy.settings` API.

## Original contract

ZeroOmega v3.5.0 maps a non-controllable browser proxy state to its proxy-not-controllable Popup. The profile menu and Options footer disappear. The panel shows the reason/details plus Cancel and Manage.

Nex must preserve that observable boundary while retaining typed ownership mapping internally.

## Probe evidence

One-shot Firefox policy run `31013840605`, job `92332623777`, Firefox `152.0.6`, returned:

```json
{
  "levelOfControl": "not_controllable",
  "reason": "policy",
  "blocked": true,
  "popupState": {
    "ready": true,
    "reason": "policy",
    "profileRows": 0,
    "footers": 0,
    "buttons": 2,
    "manage": 1
  }
}
```

The result simultaneously proves the browser-native control level, Nex ownership mapping and rendered Popup structure.

## Permanent gate

- `scripts/e2e-firefox-policy-owned-popup.mjs` remains as the browser test.
- `test:e2e:firefox-policy-owned-popup` is the stable package command.
- Browser E2E runs the test in an isolated Firefox job after installing a locked enterprise Proxy policy.
- The policy-owned job remains separate from ordinary Firefox E2E so the managed browser state cannot contaminate other journeys.

## State

- policy/browser-owned runtime surface: VERIFIED.
- permanent workflow integration: VERIFIED on exact Head `d63cd181ce68e5176c29a3fb8d8a3c59cc2018a2`.
- Browser E2E run `31015030843`, isolated policy job `92336754415`, passed; the other three Browser E2E jobs and the remaining five permanent workflows also passed on the same Head.
- Session 13 current-site Popup journey: VERIFIED as a bounded slice.
- project progress remains 48%; Order 1 remains 45%.
- owner retest, merge and release remain prohibited.
