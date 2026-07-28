from pathlib import Path

path = Path('docs/MILESTONE_8_STATUS.md')
text = path.read_text()
old = """**Current product implementation head:** `af81c0a8842b3a2a4d4d8183096755a14010ace5` — Typed Temporary Rules and Network  
**Latest integration verification:** run `30389904319` validates typed Temporary Rules and Network in three locales, safe errors, session/privacy boundaries, fresh locale inventory, full repository verification, and the complete Chromium interaction chain  
**Last completed exact-Head verification:** `15cb75a31cbc67aae6e6553b0e4904e06274e7ec`; CI `30390127680`, Browser E2E `30390127707`, Parity Documentation `30390127706` passed  
"""
new = """**Current product implementation head:** `3f427b27a28bef113811599c578d989042403eb7` — Typed normal Options surfaces and Virtual Profile  
**Latest integration verification:** run `30391735431` validates Built-in/About/shell/export/Virtual typed presentation, fresh locale inventory, full repository verification, and the complete Chromium interaction chain  
**Last completed exact-Head verification:** `a8bf7529b40e900495c39fd76797dda61157f11d`; CI `30391968353`, Browser E2E `30391971791`, Parity Documentation `30391968361` passed  
"""
if text.count(old) != 1:
    raise SystemExit('status checkpoint header anchor not found exactly once')
text = text.replace(old, new, 1)
anchor = """- Chromium visits the real Built-in and About pages, verifies localized color controls, observes localized profile export status, and completes the existing Virtual creation/reference migration chain through the typed zh-CN editor.
"""
addition = anchor + "- Integration run `30391735431`; product commit `3f427b27a28bef113811599c578d989042403eb7`; clean exact Head `a8bf7529b40e900495c39fd76797dda61157f11d` passed CI `30391968353`, Browser E2E `30391971791`, and Parity Documentation `30391968361`. The typed inventory now covers fifteen components and reports 62 remaining candidates.\n"
if text.count(anchor) != 1:
    raise SystemExit('normal Options and Virtual evidence anchor not found exactly once')
text = text.replace(anchor, addition, 1)
path.write_text(text)
print('Updated typed normal Options and Virtual durable checkpoint.')
