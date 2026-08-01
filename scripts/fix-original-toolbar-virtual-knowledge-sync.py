from pathlib import Path

path = Path("scripts/sync-original-toolbar-virtual-knowledge.py")
text = path.read_text(encoding="utf-8")
old = '''            "1. Preserve and integrate the original `matchProfile.results` trace data needed for Switch/PAC/Virtual/attached Rule List/temporary-rule details.",
            "1. Preserve and integrate the original `matchProfile.results` trace data needed for nested Switch/Virtual, PAC, attached Rule List and temporary-rule details.",
            "next action",
'''
new = '''            "1. Preserve and integrate the remaining original `matchProfile.results` trace data for Switch → Direct/System, nested/attached Rule Lists, PAC/Virtual and temporary-rule details.",
            "1. Preserve and integrate the remaining original `matchProfile.results` trace data for nested Switch/Virtual, attached Rule Lists, PAC and temporary-rule details; Switch → System remains original-invalid.",
            "next action",
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"sync-script next-action patch: expected one match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
