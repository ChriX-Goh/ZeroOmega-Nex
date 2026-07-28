from pathlib import Path

path = Path('docs/MILESTONE_8_STATUS.md')
text = path.read_text()
old = """**Current product implementation head:** `0f8c95eb9e92495a0551be2bb357428a10af7fc3` — Typed Theme and Popup  
**Latest integration verification:** run `30382975947` validates typed Theme and Popup in three locales, safe Popup errors, fresh locale inventory, full repository verification, and the complete Chromium popup interaction chain  
**Last completed exact-Head verification:** `4fb93193d089809dc107cf6d77ba41b9ee42b58b`; CI `30383219144`, Browser E2E `30383224211`, Parity Documentation `30383219516` passed  
"""
new = """**Current product implementation head:** `af81c0a8842b3a2a4d4d8183096755a14010ace5` — Typed Temporary Rules and Network  
**Latest integration verification:** run `30389904319` validates typed Temporary Rules and Network in three locales, safe errors, session/privacy boundaries, fresh locale inventory, full repository verification, and the complete Chromium interaction chain  
**Last completed exact-Head verification:** `15cb75a31cbc67aae6e6553b0e4904e06274e7ec`; CI `30390127680`, Browser E2E `30390127707`, Parity Documentation `30390127706` passed  
"""
if text.count(old) != 1:
    raise SystemExit('status checkpoint header anchor not found exactly once')
text = text.replace(old, new, 1)
anchor = """- Chromium verifies zh-CN manager/table/delete and diagnostics start/capture/clear/stop flows. Firefox verifies zh-TW empty/stopped shells without starting monitoring or broadening permissions.
"""
addition = anchor + "- Integration run `30389904319`; product commit `af81c0a8842b3a2a4d4d8183096755a14010ace5`; clean exact Head `15cb75a31cbc67aae6e6553b0e4904e06274e7ec` passed CI `30390127680`, Browser E2E `30390127707`, and Parity Documentation `30390127706`. The typed inventory now covers fourteen components and reports 90 remaining candidates; stable `ERR_TIMEOUT` remains classified as technical evidence.\n"
if text.count(anchor) != 1:
    raise SystemExit('typed Temporary Rules and Network evidence anchor not found exactly once')
text = text.replace(anchor, addition, 1)
path.write_text(text)
print('Updated typed Temporary Rules and Network durable checkpoint.')
