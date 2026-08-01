from pathlib import Path

HEAD = '0ffd09ad00d67b79c29a341a484f32d40c7d0122'
PRODUCT = 'f8e5892bc4a5a7a1b538a9f649e8ec98d61d6dcd'
TRANSACTION = '30674297543'
ORIGINAL_RUN = '30673848467'
RUNS = {
    'ci': '30674564650',
    'browser': '30674564634',
    'parity': '30674564648',
    'visual': '30674564598',
}
OLD_HEAD = '5ce5a21a865a569e327a78062d7d255fe0f76126'
OLD_RUNS = {
    'ci': '30672861182',
    'browser': '30672861154',
    'parity': '30672861161',
    'visual': '30672861171',
}


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


def update(path_name: str, transform) -> None:
    path = Path(path_name)
    text = path.read_text(encoding='utf-8')
    path.write_text(transform(text), encoding='utf-8')


def old_checkpoint() -> str:
    return f'''Clean Head `{OLD_HEAD}` passed all permanent gates after the exact Switch-to-Fixed toolbar trace slice and temporary-file cleanup:

- CI `{OLD_RUNS['ci']}`;
- Browser E2E `{OLD_RUNS['browser']}`;
- Parity Documentation `{OLD_RUNS['parity']}`;
- Milestone 8 Visual Evidence `{OLD_RUNS['visual']}`.'''


def new_checkpoint() -> str:
    return f'''Clean Head `{HEAD}` passed all permanent gates after exact original Switch-to-Direct/Fixed trace integration and temporary-file cleanup:

- CI `{RUNS['ci']}`;
- Browser E2E `{RUNS['browser']}`;
- Parity Documentation `{RUNS['parity']}`;
- Milestone 8 Visual Evidence `{RUNS['visual']}`.'''


def verification(text: str) -> str:
    text = replace_once(text, old_checkpoint(), new_checkpoint(), 'verification checkpoint')
    text = replace_once(
        text,
        'The permanent Browser E2E run passed the Chromium full journey, Chromium toolbar Action, Firefox full journey, the permanent focused Firefox toolbar Action job and native Chromium Inspect acceptance. Chromium and Firefox now directly verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, browser-internal/default fallback, same-tab proxy ↔ bypass transitions and an exact no-attached-list Switch → Fixed proxy matched/default slice with runtime-localized multiline details, two-color state, result Badge and per-tab Popup. Native Inspect directly captures tab-local set, current-page clear, base-state restoration and cross-tab isolation. Dedicated transaction `30672598304` passed full verification, Chromium Switch Action acceptance and three consecutive focused Firefox Switch Action journeys.',
        f'The permanent Browser E2E run passed the Chromium full journey, Chromium toolbar Action, Firefox full journey, the permanent focused Firefox toolbar Action job and native Chromium Inspect acceptance. Chromium and Firefox now directly verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, browser-internal/default fallback, same-tab transitions and exact no-attached-list Switch matched/default results into both built-in Direct and one Fixed proxy. The Switch result preserves the original multiline order, two-color state, localized result Badge and per-tab Popup. Native Inspect directly captures tab-local set, current-page clear, base-state restoration and cross-tab isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch-to-Direct Action acceptance and three consecutive focused Firefox Switch-to-Direct journeys.',
        'verification browser paragraph',
    )
    text = replace_once(
        text,
        'Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy, Fixed bypass and the exact Switch → Fixed matched/default per-tab title/Badge/Popup state on real tabs. The Switch slice preserves the original condition/default transition line followed by the final Fixed PAC-result line and uses a two-color icon contract. Firefox 152.0.6 additionally verifies the historical original `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.',
        'Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy/bypass and exact Switch matched/default results into Direct or Fixed. Exact original package runtime evidence in `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md` fixes `[Direct]`, `(default)`, four-code-unit `Dire`, Direct result color and current Switch color; it also proves Switch → System is rejected by the original PAC runtime. Firefox 152.0.6 additionally verifies the historical original `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.',
        'verification integration boundary',
    )
    text = replace_once(
        text,
        'Still outside the verified slice are Switch results into Direct/System, nested or attached Rule Lists, PAC/Virtual/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS.',
        'Still outside the verified slice are nested Switch/profile chains, attached Rule Lists, PAC/Virtual/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS. Switch → System is not an open parity feature because the original runtime rejects it.',
        'verification remaining boundary',
    )
    return text


def session(text: str) -> str:
    marker = '## Remaining Order 1 work\n'
    section = f'''## Exact original Switch → Direct runtime and Nex integration

Official package workflow `{ORIGINAL_RUN}` directly called the original v3.5.0 `_actionForUrl` implementation and is preserved in `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`:

- matched Direct title detail: `direct-match.test => [Direct]`;
- default Direct title detail: `(default) => [Direct]`;
- optional result Badge: `Dire`;
- result/current colors: Direct `#aaaaaa` plus active Switch `#ffb74d`;
- matched Fixed retains the condition transition followed by the final PAC-result line;
- `system` is absent from valid result profiles and original Apply rejects a Switch targeting System with `SystemProfile cannot be used in PAC scripts`.

Product commit `{PRODUCT}` extends the strict resolver from Switch → Fixed to exact matched/default Switch → Direct/Fixed results. It accepts only one colored Switch without an attached Rule List, an exact graph trace and either built-in Direct or one colored Fixed target. Nested/attached/PAC/Virtual/temp/external shapes remain fail-closed.

Two focused tests bring the unit total to `522`. Dedicated transaction `{TRANSACTION}` passed full `pnpm verify`, Chromium real Action acceptance and three consecutive Firefox focused Action journeys covering matched Fixed, matched Direct, default Direct, internal fallback and same-tab Fixed ↔ Direct transitions. Clean Head `{HEAD}` passed CI `{RUNS['ci']}`, Browser E2E `{RUNS['browser']}`, Parity Documentation `{RUNS['parity']}` and Milestone 8 Visual Evidence `{RUNS['visual']}`. The first native Inspect attempt in the permanent Browser E2E run missed the menu result; the unchanged failed job was rerun on the same Head and passed, while Chromium and Firefox Switch jobs passed on their first attempt.

'''
    if marker not in text:
        raise SystemExit('session remaining marker missing')
    text = text.replace(marker, section + marker, 1)
    text = replace_once(
        text,
        '- Switch results into Direct/System, nested or attached Rule Lists, plus PAC default and matched-result traces;',
        '- nested Switch/profile chains, attached Rule Lists, plus PAC default and matched-result traces; Switch → System is original-invalid, not a missing result state;',
        'session remaining Switch',
    )
    text = replace_once(
        text,
        '1. Preserve and integrate the remaining original `matchProfile.results` traces for Switch→Direct/System, nested/attached Rule Lists, PAC/Virtual/temporary-rule/external-control states.',
        '1. Preserve and integrate the remaining original `matchProfile.results` traces for nested Switch/profile chains, attached Rule Lists, PAC/Virtual/temporary-rule/external-control states.',
        'session next trace',
    )
    return text


def status(text: str) -> str:
    text = replace_once(
        text,
        '- the repository resolver covers Direct, System, Fixed proxy/bypass and a strict exact Switch → Fixed matched/default slice;',
        '- the repository resolver covers Direct, System, Fixed proxy/bypass and strict exact Switch matched/default results into Direct or one Fixed proxy;',
        'status resolver',
    )
    text = replace_once(
        text,
        '- permanent Chromium and Firefox Action E2E directly verify real tab IDs across System → Direct → Fixed proxy / Fixed bypass and exact Switch → Fixed matched/default transitions;',
        '- permanent Chromium and Firefox Action E2E directly verify real tab IDs across System → Direct → Fixed proxy/bypass and exact Switch matched/default results into Direct/Fixed;',
        'status E2E',
    )
    text = replace_once(text, old_checkpoint(), new_checkpoint(), 'status checkpoint')
    text = replace_once(
        text,
        'The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions. Native Inspect verifies target-tab set, current-page clear, base restoration and cross-tab isolation. Dedicated transaction `30672598304` passed full verification, Chromium Switch acceptance and three consecutive focused Firefox Switch journeys.',
        f'The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies target-tab set, current-page clear, base restoration and cross-tab isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch-to-Direct acceptance and three consecutive focused Firefox Switch-to-Direct journeys.',
        'status browser paragraph',
    )
    text = replace_once(
        text,
        '- Switch results into Direct/System, nested or attached Rule Lists, plus PAC/Virtual/temporary-rule/external-control result traces;',
        '- nested Switch/profile chains, attached Rule Lists, plus PAC/Virtual/temporary-rule/external-control result traces; Switch → System is rejected by the original runtime;',
        'status remaining traces',
    )
    text = text.replace(
        '- headed toolbar pixels where browser-readable state is insufficient;\n- headed toolbar pixels where browser-readable state is insufficient;',
        '- headed toolbar pixels where browser-readable state is insufficient;',
        1,
    )
    text = replace_once(
        text,
        'Switch → Fixed matched/default traces are now an exact integrated input. Switch → Direct/System, nested/attached profiles, PAC/Virtual, temporary rules and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.',
        'Switch matched/default results into Direct and Fixed are now exact integrated inputs backed by official runtime evidence. Switch → System is original-invalid. Nested/attached profile chains, PAC/Virtual, temporary rules and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.',
        'status runtime boundary',
    )
    text = replace_once(
        text,
        '- capture and map Switch → Direct/System, nested/attached results and PAC default/matched results;',
        '- capture and map nested Switch/profile chains, attached Rule List results and PAC default/matched results;',
        'status immediate work',
    )
    return text


def audit(text: str) -> str:
    text = replace_once(
        text,
        'Resolver coverage now includes Direct/System/Fixed and a strict exact Switch → Fixed matched/default slice.',
        'Resolver coverage now includes Direct/System/Fixed and strict exact Switch matched/default results into Direct or one Fixed proxy.',
        'audit current resolver',
    )
    text = replace_once(
        text,
        'the exact Switch → Fixed matched/default path, two-tab isolation',
        'exact Switch matched/default paths into Direct/Fixed, two-tab isolation',
        'audit acceptance summary',
    )
    text = replace_once(
        text,
        'Direct/System/Fixed plus exact Switch→Fixed resolver',
        'Direct/System/Fixed plus exact Switch→Direct/Fixed resolver',
        'audit order table',
    )
    runtime_marker = 'Firefox evidence is durable in `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md` and records:\n'
    addition = f'''Switch-result runtime evidence is durable in `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md` and records official Chromium workflow `{ORIGINAL_RUN}`:

- matched/default Switch → Direct titles and `Dire` Badge;
- Direct result color plus current Switch color;
- matched Switch → Fixed multiline details;
- original rejection of Switch → System.

'''
    if runtime_marker not in text:
        raise SystemExit('audit runtime marker missing')
    text = text.replace(runtime_marker, addition + runtime_marker, 1)
    text = replace_once(
        text,
        '- Switch/PAC result and two-color icon state;',
        '- PAC result state and Switch shapes beyond direct Direct/Fixed targets;',
        'audit unknown Switch runtime',
    )
    text = replace_once(
        text,
        '- the repository-backed resolver covers Direct, System, Fixed proxy/bypass and an exact Switch matched/default transition directly into one Fixed proxy;',
        '- the repository-backed resolver covers Direct, System, Fixed proxy/bypass and exact Switch matched/default transitions directly into Direct or one Fixed proxy;',
        'audit current Nex resolver',
    )
    text = replace_once(
        text,
        'exact Switch → Fixed matched/default transitions;',
        'exact Switch matched/default transitions into Direct/Fixed;',
        'audit permanent transitions',
    )
    text = replace_once(
        text,
        '- Switch results into Direct/System, nested or attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still lack the complete original result trace;',
        '- nested Switch/profile chains, attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still lack the complete original result trace; Switch → System is original-invalid;',
        'audit remaining trace',
    )
    text = replace_once(
        text,
        '- repository-backed Direct/System/Fixed resolver plus strict exact Switch → Fixed matched/default reconstruction;',
        '- repository-backed Direct/System/Fixed resolver plus strict exact Switch matched/default reconstruction into Direct/Fixed;',
        'audit source implementation',
    )
    text = replace_once(text, old_checkpoint(), new_checkpoint(), 'audit checkpoint')
    text = replace_once(
        text,
        'The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions. Native Inspect verifies tab-local set/clear/base restoration/isolation. Dedicated transaction `30672598304` passed full verification, Chromium Switch acceptance and three consecutive focused Firefox Switch journeys.',
        f'The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies tab-local set/clear/base restoration/isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch-to-Direct acceptance and three consecutive focused Firefox Switch-to-Direct journeys.',
        'audit browser paragraph',
    )
    text = replace_once(
        text,
        '- Firefox runtime evidence: `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`.',
        '- Firefox runtime evidence: `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`;\n- Switch-result runtime evidence: `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`.',
        'audit official evidence list',
    )
    return text


def delivery(text: str) -> str:
    text = replace_once(
        text,
        '- Compiled target constants: `AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`.',
        '- Compiled target constants: `AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`.\n- Switch-result runtime evidence: `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`.',
        'delivery authority evidence',
    )
    text = replace_once(
        text,
        'Resolver coverage is verified for Direct, System, Fixed proxy, Fixed bypass and an exact no-attached-list Switch → Fixed proxy matched/default slice;',
        'Resolver coverage is verified for Direct, System, Fixed proxy/bypass and exact no-attached-list Switch matched/default results into built-in Direct or one Fixed proxy;',
        'delivery top resolver',
    )
    text = replace_once(text, old_checkpoint(), new_checkpoint(), 'delivery checkpoint')
    text = replace_once(
        text,
        'The permanent Browser E2E run passed Chromium full/toolbar journeys, Firefox full/focused-toolbar journeys and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab proxy ↔ bypass transitions and the exact Switch → Fixed matched/default slice. Native Inspect verifies tab-local set, current-page clear, base Action restoration and isolation. Dedicated transaction `30672598304` passed full verification, Chromium Switch Action acceptance and three consecutive focused Firefox Switch Action journeys.',
        f'The permanent Browser E2E run passed Chromium full/toolbar journeys, Firefox full/focused-toolbar journeys and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies tab-local set, current-page clear, base Action restoration and isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch-to-Direct Action acceptance and three consecutive focused Firefox Switch-to-Direct journeys.',
        'delivery browser paragraph',
    )
    text = replace_once(
        text,
        '4. current source-certain resolver coverage includes Direct, System, Fixed proxy/bypass and a strict Switch matched/default transition directly into one Fixed proxy; all other inclusive trace shapes remain unresolved/default.',
        '4. current source-certain resolver coverage includes Direct, System, Fixed proxy/bypass and strict Switch matched/default transitions directly into built-in Direct or one Fixed proxy; nested/attached/PAC/Virtual shapes remain unresolved/default, while Switch → System is original-invalid.',
        'delivery trace consequence',
    )
    text = replace_once(
        text,
        'RES[Repository resolver: Direct / System / Fixed + exact Switch-to-Fixed] --> COORD',
        'RES[Repository resolver: Direct / System / Fixed + exact Switch-to-Direct-or-Fixed] --> COORD',
        'delivery graph resolver',
    )
    text = replace_once(
        text,
        '- Switch results into Direct/System, nested or attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace;',
        '- nested Switch/profile chains, attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace; Switch → System is rejected by the original runtime;',
        'delivery remaining gaps',
    )
    text = replace_once(
        text,
        '| `TB-004` | Inclusive Switch/PAC default uses Direct/current two-color state      | source                             | pure color decision exists; runtime state uncaptured',
        '| `TB-004` | Inclusive Switch/PAC default uses Direct/current two-color state      | source; exact Switch runtime       | original and Nex Chromium/Firefox verify Switch default → Direct title, `Dire` Badge and Direct/current two-color inputs; PAC default remains uncaptured',
        'delivery TB004',
    )
    text = replace_once(
        text,
        '| `TB-006` | Switch/PAC resolves to another profile: two-color result/current icon | source                             | Chromium and Firefox now verify one exact Switch matched/default path directly into a Fixed proxy, including multiline title, result Badge, Popup and same-tab matched ↔ default transitions               | `PARTIAL`; original runtime still `UNKNOWN` | capture original runtime and extend Direct/System/nested/PAC results         |',
        '| `TB-006` | Switch/PAC resolves to another profile: two-color result/current icon | source; exact Switch runtime       | official original runtime plus Chromium/Firefox Nex E2E verify matched/default Switch results into Direct or Fixed, multiline details, result Badge, Popup and same-tab transitions                         | `PARTIAL`                                  | extend to nested/attached/PAC results and owner review                       |',
        'delivery TB006',
    )
    text = replace_once(
        text,
        '| `TB-007` | Direct result receives Direct color                                   | source; Direct runtime title       | Direct is activated through the real workflow and reflected across two Chromium tabs; renderer/color contract remains source/unit-backed',
        '| `TB-007` | Direct result receives Direct color                                   | source; Direct and Switch runtime  | active Direct and Switch → Direct are verified through real Chromium/Firefox Action state; original runtime fixes Direct result color and current Switch color',
        'delivery TB007',
    )
    text = replace_once(
        text,
        '| `TB-015` | Tab URL update recalculates result                                    | source                             | both targets verify same-tab Fixed proxy ↔ bypass and Switch matched ↔ default transitions, reading the exact per-tab Action state after each committed URL',
        '| `TB-015` | Tab URL update recalculates result                                    | source                             | both targets verify same-tab Fixed proxy ↔ bypass plus Switch Fixed ↔ matched Direct ↔ default Direct transitions, reading exact per-tab Action state',
        'delivery TB015',
    )
    text = replace_once(
        text,
        '3. Switch results into Direct/System/nested/attached profiles and PAC default/matched-result states;',
        '3. nested Switch/profile chains, attached Rule Lists and PAC default/matched-result states; Switch → System is original-invalid;',
        'delivery unknown 3',
    )
    text = replace_once(
        text,
        '- repository-backed Direct, System, Fixed proxy/bypass and strict exact Switch → Fixed matched/default resolution;',
        '- repository-backed Direct, System, Fixed proxy/bypass and strict exact Switch matched/default resolution into Direct/Fixed;',
        'delivery TO05 resolver',
    )
    text = replace_once(
        text,
        '- complete original multiline trace for Switch → Direct/System, nested/attached Rule Lists, PAC, Virtual and temporary rules;',
        '- complete original multiline trace for nested Switch/profile chains, attached Rule Lists, PAC, Virtual and temporary rules;',
        'delivery TO05 remaining',
    )
    text = replace_once(
        text,
        'Automation now asserts visible Action title/Badge/Popup for System, Direct, Fixed proxy/bypass, strict Switch → Fixed matched/default, internal/default fallback, same-tab URL transitions and Inspect set/clear/isolation.',
        'Automation now asserts visible Action title/Badge/Popup for System, Direct, Fixed proxy/bypass, strict Switch matched/default results into Direct/Fixed, internal/default fallback, same-tab URL transitions and Inspect set/clear/isolation.',
        'delivery TO07 automation',
    )
    return text


def delivery_graph(text: str) -> str:
    text = replace_once(text, old_checkpoint(), new_checkpoint(), 'delivery graph checkpoint')
    text = replace_once(
        text,
        'The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions. Native Inspect verifies tab-local set, current-page clear, base restoration and isolation. Dedicated transaction `30672598304` passed full verification, Chromium Switch acceptance and three consecutive focused Firefox Switch journeys.',
        f'The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies tab-local set, current-page clear, base restoration and isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch-to-Direct acceptance and three consecutive focused Firefox Switch-to-Direct journeys.',
        'delivery graph browser paragraph',
    )
    text = replace_once(
        text,
        'exact Switch→Fixed matched/default, internal/default fallback',
        'exact Switch→Direct/Fixed matched/default, internal/default fallback',
        'delivery graph KG icon',
    )
    text = replace_once(
        text,
        'remaining Switch/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open.',
        'nested/attached/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open; Switch → System is original-invalid.',
        'delivery graph KG remaining',
    )
    return text


def original_graph(text: str) -> str:
    text = replace_once(
        text,
        f'- clean Head：`700f290a5ade70497cb1c757007c4bd3dc7a4d9d`；CI `30673413888`、Browser E2E `30673413855`、Parity `30673413863`、Visual `30673413901` 全绿。',
        f'- clean Head：`{HEAD}`；CI `{RUNS["ci"]}`、Browser E2E `{RUNS["browser"]}`、Parity `{RUNS["parity"]}`、Visual `{RUNS["visual"]}` 全绿。',
        'original graph checkpoint',
    )
    text = replace_once(
        text,
        '严格 Switch → Fixed matched/default、内部页／默认回退及同标签状态转换验收',
        '严格 Switch → Direct/Fixed matched/default、内部页／默认回退及同标签状态转换验收',
        'original graph acceptance',
    )
    text = replace_once(
        text,
        '严格 Switch → Fixed matched/default、Chromium Inspect Action set/clear/base restoration/isolation 已完成自动验收；Switch → Direct/System、嵌套／附属 Rule List、PAC/Virtual/临时规则/外部控制完整 trace、真实渲染失败／像素证据和 owner PASS 仍未完成。',
        '严格 Switch → Direct/Fixed matched/default、Chromium Inspect Action set/clear/base restoration/isolation 已完成自动验收；Switch → System 已由原版运行时证实为非法结果，嵌套／附属 Rule List、PAC/Virtual/临时规则/外部控制完整 trace、真实渲染失败／像素证据和 owner PASS 仍未完成。',
        'original graph remaining',
    )
    return text


update('docs/MILESTONE_8_VERIFICATION_HEAD.md', verification)
update('docs/MILESTONE_8_SESSION_8_CHECKPOINT.md', session)
update('docs/MILESTONE_8_STATUS.md', status)
update('docs/ACTIVE_PARITY_AUDIT_INDEX.md', audit)
update('docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md', delivery)
update('docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md', delivery_graph)
update('docs/ORIGINAL_KNOWLEDGE_GRAPH.md', original_graph)
