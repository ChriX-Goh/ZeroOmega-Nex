from pathlib import Path

runtime = Path('.github/patches/apply-popup-proxy-ownership-runtime.py')
text = runtime.read_text()
old = """import type { ProxyOwnershipView } from '@zeroomega-nex/browser-adapters';
import { browser } from 'wxt/browser';
"""
new = """import type { ProxyOwnershipView } from '@zeroomega-nex/browser-adapters';
export type {
  ProxyOwnershipBlockReason,
  ProxyOwnershipView,
} from '@zeroomega-nex/browser-adapters';
import { browser } from 'wxt/browser';
"""
if text.count(old) != 1:
    raise SystemExit(f'ownership client type boundary match count: {text.count(old)}')
runtime.write_text(text.replace(old, new))

ui = Path('.github/patches/apply-popup-proxy-ownership-ui.py')
text = ui.read_text()
old = """  import type {
    ProxyOwnershipBlockReason,
    ProxyOwnershipView,
  } from '@zeroomega-nex/browser-adapters';
  import { productIdentity } from '@zeroomega-nex/core-contracts';
"""
new = """  import { productIdentity } from '@zeroomega-nex/core-contracts';
"""
if text.count(old) != 1:
    raise SystemExit(f'ownership popup adapter import match count: {text.count(old)}')
text = text.replace(old, new)
old = """  import { sendProxyOwnershipCommand } from '../../lib/proxy-ownership-client';
"""
new = """  import {
    sendProxyOwnershipCommand,
    type ProxyOwnershipBlockReason,
    type ProxyOwnershipView,
  } from '../../lib/proxy-ownership-client';
"""
if text.count(old) != 1:
    raise SystemExit(f'ownership popup client import match count: {text.count(old)}')
ui.write_text(text.replace(old, new))
