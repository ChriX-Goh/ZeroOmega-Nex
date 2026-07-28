from pathlib import Path

path = Path('.github/patches/apply-locale-batch-two-integration.py')
text = path.read_text()
old = "    const independent = createRuleListProfileDraft(baseSpec(), ids, '規則');\n"
new = "    const independent = createRuleListProfileDraft(baseSpec(), ids);\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one Rule List component signature anchor, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
