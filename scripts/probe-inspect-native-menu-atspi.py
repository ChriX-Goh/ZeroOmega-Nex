#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import gi

gi.require_version('Atspi', '2.0')
from gi.repository import Atspi  # noqa: E402

TARGET = sys.argv[1] if len(sys.argv) > 1 else 'Inspect link'
DUMP_PATH = Path('inspect-native-atspi-tree.txt')


def safe(call, fallback=None):
    try:
        return call()
    except Exception:
        return fallback


def children(node):
    count = safe(node.get_child_count, 0) or 0
    for index in range(count):
        child = safe(lambda index=index: node.get_child_at_index(index))
        if child is not None:
            yield child


def describe(node):
    name = safe(node.get_name, '') or ''
    role = safe(lambda: node.get_role_name(), '') or ''
    return role, name


def walk(node, depth=0, seen=None):
    if seen is None:
        seen = set()
    identity = safe(lambda: node.get_object_locale(), '') + repr(node)
    if identity in seen or depth > 30:
        return
    seen.add(identity)
    yield depth, node
    for child in children(node):
        yield from walk(child, depth + 1, seen)


def dump_tree(desktop):
    lines = []
    for depth, node in walk(desktop):
        role, name = describe(node)
        if name or role in {'application', 'frame', 'menu', 'menu item', 'popup menu'}:
            actions = []
            iface = safe(node.get_action_iface)
            if iface is not None:
                count = safe(iface.get_n_actions, 0) or 0
                for index in range(count):
                    actions.append(safe(lambda index=index: iface.get_action_name(index), '') or '')
            lines.append(
                json.dumps(
                    {'depth': depth, 'role': role, 'name': name, 'actions': actions},
                    ensure_ascii=False,
                )
            )
    DUMP_PATH.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def find_target(desktop):
    exact = []
    partial = []
    for _, node in walk(desktop):
        role, name = describe(node)
        normalized = name.strip().casefold()
        if normalized == TARGET.casefold():
            exact.append((node, role, name))
        elif TARGET.casefold() in normalized:
            partial.append((node, role, name))
    return exact or partial


def invoke(node):
    iface = safe(node.get_action_iface)
    if iface is None:
        return False, []
    count = safe(iface.get_n_actions, 0) or 0
    names = [safe(lambda index=index: iface.get_action_name(index), '') or '' for index in range(count)]
    preferred = next(
        (
            index
            for index, name in enumerate(names)
            if name.casefold() in {'click', 'press', 'activate', 'select'}
        ),
        0 if count else None,
    )
    if preferred is None:
        return False, names
    return bool(safe(lambda: iface.do_action(preferred), False)), names


desktop = Atspi.get_desktop(0)
deadline = time.monotonic() + 12
last_candidates = []
while time.monotonic() < deadline:
    candidates = find_target(desktop)
    if candidates:
        last_candidates = candidates
        for node, role, name in candidates:
            invoked, actions = invoke(node)
            print(
                json.dumps(
                    {
                        'target': TARGET,
                        'role': role,
                        'name': name,
                        'actions': actions,
                        'invoked': invoked,
                    },
                    ensure_ascii=False,
                ),
                flush=True,
            )
            if invoked:
                time.sleep(0.5)
                sys.exit(0)
    time.sleep(0.25)

dump_tree(desktop)
print(
    json.dumps(
        {
            'error': 'AT-SPI could not invoke the native menu item',
            'target': TARGET,
            'candidate_count': len(last_candidates),
            'tree_dump': str(DUMP_PATH),
        },
        ensure_ascii=False,
    ),
    file=sys.stderr,
)
sys.exit(1)
