from pathlib import Path

path = Path('scripts/sync-switch-fixed-toolbar-knowledge.py')
text = path.read_text(encoding='utf-8')
old = '''    text = replace_once(
        text,
        "- repository-backed Direct/System/Fixed resolver;",
        "- repository-backed Direct/System/Fixed resolver plus the strict Switch → Fixed matched/default trace slice;",
        "delivery source implementation resolver",
    )
    return text
'''
new = '''    text = replace_once(
        text,
        "- permanent Chromium E2E reads real per-tab title, Badge and Popup for System, Direct, Fixed proxy and Fixed bypass.",
        "- permanent Chromium E2E reads real per-tab title, Badge and Popup for System, Direct, Fixed proxy/bypass and exact Switch → Fixed matched/default states.",
        "delivery TO04 browser coverage",
    )
    text = replace_once(
        text,
        "- Switch/PAC/Virtual/Rule List/temp-rule/external-control states.",
        "- Switch → Direct/System, nested/attached Rule List, PAC/Virtual/temp-rule/external-control states.",
        "delivery TO04 remaining",
    )
    text = replace_once(
        text,
        "- repository-backed Direct, System, Fixed proxy and Fixed bypass resolution;",
        "- repository-backed Direct, System, Fixed proxy/bypass and strict exact Switch → Fixed matched/default resolution;",
        "delivery TO05 resolver",
    )
    text = replace_once(
        text,
        "- per-tab Fixed proxy/bypass isolation in permanent Chromium Action E2E;",
        "- per-tab Fixed proxy/bypass isolation plus Switch matched/default and same-tab transitions in permanent Chromium and Firefox Action E2E;",
        "delivery TO05 browser proof",
    )
    text = replace_once(
        text,
        "- complete original multiline trace for Switch, PAC, Virtual, attached Rule List and temporary rules;",
        "- complete original multiline trace for Switch → Direct/System, nested/attached Rule Lists, PAC, Virtual and temporary rules;",
        "delivery TO05 remaining trace",
    )
    text = replace_once(
        text,
        "Remaining inputs include temporary-rule transitions, ownership/external control and inclusive-profile trace display.",
        "Remaining inputs include temporary-rule transitions, ownership/external control and the unresolved inclusive-profile trace shapes outside the strict Switch → Fixed slice.",
        "delivery TO06 remaining",
    )
    text = replace_once(
        text,
        "Automation now asserts visible Action title/Badge/Popup for System, Direct, Fixed proxy/bypass, internal/default fallback, same-tab URL transitions and Inspect set/clear/isolation. Inclusive traces, renderer failure and owner acceptance remain open.",
        "Automation now asserts visible Action title/Badge/Popup for System, Direct, Fixed proxy/bypass, strict Switch → Fixed matched/default, internal/default fallback, same-tab URL transitions and Inspect set/clear/isolation. Remaining inclusive traces, renderer failure and owner acceptance remain open.",
        "delivery TO07 automation",
    )
    text = replace_once(
        text,
        "Exact clean engineering checkpoint Head `d201d203cd0fd64a14342414935a48c3c295e60c` passed:\\n\\n- CI `30671118969`;\\n- Browser E2E `30671118975`, including Chromium full/toolbar, Firefox full/focused-toolbar and native Inspect;\\n- Parity Documentation `30671118993`;\\n- Milestone 8 Visual Evidence `30671118990`.",
        f"Exact clean engineering checkpoint Head `{HEAD}` passed:\\n\\n- CI `{RUNS['ci']}`;\\n- Browser E2E `{RUNS['browser']}`, including Chromium full/toolbar, Firefox full/focused-toolbar and native Inspect;\\n- Parity Documentation `{RUNS['parity']}`;\\n- Milestone 8 Visual Evidence `{RUNS['visual']}`.",
        "delivery verification checkpoint",
    )
    text = replace_once(
        text,
        "The dedicated transaction `30670819111` additionally passed full verification, Chromium toolbar acceptance, three consecutive Firefox toolbar transition journeys and native Inspect set/clear/isolation before the permanent files were committed. This checkpoint validates visible Action state for the mapped source-certain slice but does not close a `TB-*` row without owner acceptance.",
        f"Dedicated transaction `{TRANSACTION}` passed full verification, Chromium exact Switch Action acceptance and three consecutive Firefox exact Switch Action journeys before the permanent files were committed. This checkpoint validates visible Action state for the mapped source-certain slice but does not close a `TB-*` row without owner acceptance.",
        "delivery dedicated transaction",
    )
    text = replace_once(
        text,
        "1. Preserve and integrate the original `matchProfile.results` trace data needed for Switch/PAC/Virtual/attached Rule List/temporary-rule details.",
        "1. Preserve and integrate the remaining original `matchProfile.results` trace data for Switch → Direct/System, nested/attached Rule Lists, PAC/Virtual and temporary-rule details.",
        "delivery next trace",
    )
    return text
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'delivery sync block: expected one match, found {count}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
