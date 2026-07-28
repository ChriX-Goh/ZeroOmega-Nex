from pathlib import Path

path = Path('docs/MILESTONE_8_STATUS.md')
text = path.read_text()
old = """**Current product implementation head:** `3f427b27a28bef113811599c578d989042403eb7` — Typed normal Options surfaces and Virtual Profile  
**Latest integration verification:** run `30391735431` validates Built-in/About/shell/export/Virtual typed presentation, fresh locale inventory, full repository verification, and the complete Chromium interaction chain  
**Last completed exact-Head verification:** `a8bf7529b40e900495c39fd76797dda61157f11d`; CI `30391968353`, Browser E2E `30391971791`, Parity Documentation `30391968361` passed  
"""
new = """**Current product implementation head:** `d0d1e39bb2ba74cd7471438f21eb7fb301c0774f` — Typed imported Auto Detect and closed visible locale inventory  
**Latest integration verification:** run `30393341874` validates fallback-only Auto Detect, locale inventory schema v2, zero untranslated user-visible candidates, full repository verification, and the complete Chromium migration chain  
**Last completed exact-Head verification:** `eec8b0301e730550ccb27a9ed4b3742b3dc7754e`; CI `30393572363`, Browser E2E `30393572347`, Parity Documentation `30393572430` passed  
"""
if text.count(old) != 1:
    raise SystemExit('Auto Detect status header anchor not found exactly once')
text = text.replace(old, new, 1)
anchor = """- Locale inventory schema v2 classifies every remaining literal candidate. Verification now fails when any candidate is `user-visible-untranslated`; field keys, format names, keyboard keys, examples, stable technical codes, and scanner code fragments remain explicitly classified rather than mistranslated.
"""
addition = anchor + "- Integration run `30393341874`; product commit `d0d1e39bb2ba74cd7471438f21eb7fb301c0774f`; clean exact Head `eec8b0301e730550ccb27a9ed4b3742b3dc7754e` passed CI `30393572363`, Browser E2E `30393572347`, and Parity Documentation `30393572430`. Inventory schema v2 covers sixteen components, contains 25 classified technical candidates, and reports `untranslatedUserVisibleCount: 0`.\n"
if text.count(anchor) != 1:
    raise SystemExit('Auto Detect evidence anchor not found exactly once')
text = text.replace(anchor, addition, 1)
path.write_text(text)
print('Updated typed Auto Detect durable checkpoint.')
