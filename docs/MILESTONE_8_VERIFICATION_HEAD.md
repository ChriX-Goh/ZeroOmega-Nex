# Milestone 8 Exact Verification Head

Exact moving-Head workflow evidence is maintained in PR #11. This file defines the stable product and acceptance boundary that each human-authored Head must contain.

The current boundary includes:

- integrated PAC target-capability product Head `4233e45340ea0d1185e87270aa9c10cfcd2c7b6b`;
- genuine Chromium/Firefox Basic 407 closure;
- unified fresh-workspace Chromium creation of Fixed, Switch, PAC, and Virtual through the real New Profile dialog;
- explicit PAC browser-target capability detection and Options wiring;
- original `proxy.register/registerProxyScript` unsupported behavior, missing-`proxy.settings` fail-closed behavior, and current writable-`proxy.settings` support;
- unit, component, permanent parity-guard, and real Chromium unsupported-target injection evidence;
- canonical matrix state `DONE=119`, `PARTIAL=7`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`;
- four remaining release-blocking `MUST_MATCH` rows: B-03, C-09, D-04, and D-05;
- synchronized stable status, Session 7 checkpoint, candidate gate, knowledge graph, and canonical matrix;
- removal of temporary proxy, four-profile, and PAC-capability integration machinery;
- explicit retention of Draft state and the no-candidate boundary.

PAC capability integration run `30418355127` passed repository verification and complete Chromium E2E before committing the product slice.

Before B-03 begins, the current human-authored branch Head must have green CI, Browser E2E, Parity Documentation, and Visual Evidence. The exact Head, run IDs, artifact IDs, and digests belong in PR #11 rather than this self-invalidating repository file.
