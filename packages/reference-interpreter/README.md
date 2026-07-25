# Reference Interpreter

This package is the correctness-first executable definition of ZeroOmega Nex policy semantics.

It is intentionally independent from browser proxy APIs, PAC generation, storage, and UI code. Optimized backends must reproduce its decisions and traces against the same committed vectors.

Current verified scope:

- request normalization inputs;
- all ProfileSpec condition families;
- ordered SwitchProfile evaluation;
- recursive profile graph resolution;
- FixedProfile bypass and endpoint selection;
- SwitchyOmega modern and legacy rule lists;
- AutoProxy normal and exclusive rules;
- deterministic trace, cycle, depth, missing-reference, and indeterminate handling.

Arbitrary PAC execution and browser auto-detection remain explicit target-dependent boundaries. They are not simulated by guessed behavior.
