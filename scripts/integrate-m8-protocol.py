from __future__ import annotations

import argparse
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one anchor, found {count}")
    return text.replace(old, new)


def prepare_patch() -> None:
    path = Path('.github/patches/apply-m8-proxy-protocol-capabilities.py')
    text = path.read_text()

    text = replace_once(
        text,
        '''"""import { PAC_COMPILER_VERSION } from './contracts.js';
"""''',
        '''"""import {
  PAC_COMPILER_VERSION,
  type PacCapability,
  type PacCapabilityAnalysis,
  type PacCapabilityIssue,
  type PacTarget,
} from './contracts.js';
"""''',
        'PAC capability import patch',
    )

    start_marker = '''replace_once(
    capabilities,
    """        endpointCapability'''
    end_marker = "\n\ncompiler_tests = Path('packages/pac-compiler/src/compiler.test.ts')"
    start = text.find(start_marker)
    end = text.find(end_marker, start)
    if start == -1 or end == -1:
        raise SystemExit(f'endpoint traversal markers missing: start={start}, end={end}')
    traversal = '''replace_once(
    capabilities,
    """  const visitEndpoint = (endpointId: string, path: string): void => {
    if (visitedEndpoints.has(endpointId)) return;
    visitedEndpoints.add(endpointId);
    const endpoint = endpointById.get(endpointId);
    if (!endpoint) {
      addIssue({
        code: 'endpoint.missing',
        path,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message: `Referenced proxy endpoint ${endpointId} does not exist.`,
      });
      return;
    }
    reachableEndpointIds.push(endpointId);
    endpointCapability(
      endpoint,
      `/proxyEndpoints/${spec.proxyEndpoints.indexOf(endpoint)}`,
      addIssue,
    );
  };
""",
    """  const visitEndpoint = (
    endpointId: string,
    path: string,
    slot: FixedProxySlot,
  ): void => {
    const endpoint = endpointById.get(endpointId);
    if (!endpoint) {
      addIssue({
        code: 'endpoint.missing',
        path,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message: `Referenced proxy endpoint ${endpointId} does not exist.`,
      });
      return;
    }
    endpointCapability(endpoint, path, target, slot, addIssue);
    if (visitedEndpoints.has(endpointId)) return;
    visitedEndpoints.add(endpointId);
    reachableEndpointIds.push(endpointId);
  };
""",
    'target-aware endpoint traversal',
)
replace_once(
    capabilities,
    """            visitEndpoint(endpointId, `${profilePath}/proxyByScheme/${slot}`);
""",
    """            visitEndpoint(
              endpointId,
              `${profilePath}/proxyByScheme/${slot}`,
              slot as FixedProxySlot,
            );
""",
    'target-aware Fixed slot traversal',
)'''
    text = text[:start] + traversal + text[end:]

    app_start = text.find("app = Path('apps/extension/src/entrypoints/options/App.svelte')")
    app_end = text.find('\n\n# Typed direct strings.', app_start)
    if app_start == -1 or app_end == -1:
        raise SystemExit(f'Fixed editor wiring markers missing: start={app_start}, end={app_end}')
    text = text[:app_start] + "app = Path('apps/extension/src/entrypoints/options/App.svelte')" + text[app_end:]

    text = replace_once(
        text,
        '''anchor = """  'fixed.authUnsupported': {
"""''',
        '''anchor = """  'fixed.proxyServers': { en: 'Proxy servers', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
"""''',
        'Fixed capability strings anchor',
    )

    component_path = "components = Path('apps/extension/src/component-rendering.component.spec.ts')"
    component_start = text.find(component_path)
    component_replace = text.find('replace_once(', component_start)
    component_anchor = text.find('\nanchor = ', component_replace)
    if component_start == -1 or component_replace == -1 or component_anchor == -1:
        raise SystemExit(
            f'Fixed component prop patch markers missing: path={component_start}, replace={component_replace}, anchor={component_anchor}'
        )
    text = text[:component_replace] + text[component_anchor + 1:]
    path.write_text(text)


def post_patch() -> None:
    app_path = Path('apps/extension/src/entrypoints/options/App.svelte')
    app_lines = app_path.read_text().splitlines()
    matches = [index for index, line in enumerate(app_lines) if '<FixedProfileEditor' in line]
    if len(matches) != 1:
        raise SystemExit(f'FixedProfileEditor component matches: {len(matches)}')
    index = matches[0]
    if index + 1 >= len(app_lines) or app_lines[index + 1].strip() != '{locale}':
        raise SystemExit('FixedProfileEditor locale prop shape changed')
    indent = app_lines[index + 1][: len(app_lines[index + 1]) - len(app_lines[index + 1].lstrip())]
    app_lines.insert(index + 2, f'{indent}browserTarget={{browserTargetCapabilities.target}}')
    app_path.write_text('\n'.join(app_lines) + '\n')

    component_path = Path('apps/extension/src/component-rendering.component.spec.ts')
    component_lines = component_path.read_text().splitlines()
    markers = [
        index
        for index, line in enumerate(component_lines)
        if 'renders the original Fixed Profile proxy table and collapsed advanced rows' in line
    ]
    if len(markers) != 1:
        raise SystemExit(f'Fixed component test markers: {len(markers)}')
    test_start = markers[0]
    renders = [
        index
        for index in range(test_start, min(test_start + 30, len(component_lines)))
        if 'render(FixedProfileEditor' in component_lines[index]
    ]
    if len(renders) != 1:
        raise SystemExit(f'FixedProfileEditor target render matches: {len(renders)}')
    generation_matches = [
        index
        for index in range(renders[0], min(renders[0] + 20, len(component_lines)))
        if component_lines[index].strip() == 'generation: 0,'
    ]
    if len(generation_matches) != 1:
        raise SystemExit(f'Fixed component generation matches: {len(generation_matches)}')
    generation_index = generation_matches[0]
    indent = component_lines[generation_index][
        : len(component_lines[generation_index]) - len(component_lines[generation_index].lstrip())
    ]
    component_lines.insert(generation_index + 1, f"{indent}browserTarget: 'firefox',")
    component_path.write_text('\n'.join(component_lines) + '\n')

    validator_path = Path('scripts/validate-parity-docs.mjs')
    validator = validator_path.read_text()
    replacements = {
        'const [proxyCapabilities, pacCapabilities, fixedEditor, browserTargetCapabilities, componentRendering] =':
            'const [proxyProtocolCapabilities, pacProtocolCapabilities, fixedProtocolEditor, protocolBrowserTargetCapabilities, protocolComponentRendering] =',
        "requireAll('proxy protocol target matrix', proxyCapabilities, [":
            "requireAll('proxy protocol target matrix', proxyProtocolCapabilities, [",
        "requireAll('PAC protocol capability enforcement', pacCapabilities, [":
            "requireAll('PAC protocol capability enforcement', pacProtocolCapabilities, [",
        "requireAll('Fixed protocol capability UI', fixedEditor, [":
            "requireAll('Fixed protocol capability UI', fixedProtocolEditor, [",
        "requireAll('browser family capability', browserTargetCapabilities, [":
            "requireAll('browser family capability', protocolBrowserTargetCapabilities, [",
        "requireAll('protocol capability component rendering', componentRendering, [":
            "requireAll('protocol capability component rendering', protocolComponentRendering, [",
    }
    for old, new in replacements.items():
        validator = replace_once(validator, old, new, f'protocol guard rename {old!r}')
    validator_path.write_text(validator)

    capabilities_path = Path('packages/pac-compiler/src/capabilities.ts')
    capabilities = capabilities_path.read_text()
    capabilities = replace_once(
        capabilities,
        """import { PAC_COMPILER_VERSION } from './contracts.js';
import {
  fixedProxySlotCapability,
  proxyProtocolCapability,
  type FixedProxySlot,
} from './proxy-capabilities.js';
""",
        """import {
  PAC_COMPILER_VERSION,
  type PacCapability,
  type PacCapabilityAnalysis,
  type PacCapabilityIssue,
  type PacTarget,
} from './contracts.js';
import {
  fixedProxySlotCapability,
  proxyProtocolCapability,
  type FixedProxySlot,
} from './proxy-capabilities.js';
""",
        'PAC capability contracts import',
    )
    issue_helper = """function issue(
  code: string,
  path: string,
  capability: PacCapability,
  severity: PacCapabilityIssue['severity'],
  blocking: boolean,
  message: string,
): PacCapabilityIssue {
  return { code, path, capability, severity, blocking, message };
}

"""
    capabilities = replace_once(
        capabilities,
        'function endpointCapability(',
        issue_helper + 'function endpointCapability(',
        'PAC capability issue helper',
    )
    strongest_helper = """function strongestCapability(
  issues: readonly PacCapabilityIssue[],
): PacCapability {
  if (issues.some((entry) => entry.blocking && entry.capability === 'unsupported')) {
    return 'unsupported';
  }
  if (issues.some((entry) => entry.blocking && entry.capability === 'target-dependent')) {
    return 'target-dependent';
  }
  return 'exact';
}

"""
    capabilities = replace_once(
        capabilities,
        'export function analyzePacCompatibility(',
        strongest_helper + 'export function analyzePacCompatibility(',
        'PAC strongest capability helper',
    )
    capabilities_path.write_text(capabilities)

    proxy_path = Path('packages/pac-compiler/src/proxy-capabilities.ts')
    proxy_text = proxy_path.read_text()
    proxy_text = replace_once(
        proxy_text,
        '''export function fixedProxySlotCapability(
  slot: FixedProxySlot,
  _target: PacTarget,
): FixedProxySlotCapability {
  return slot === 'ftp'
''',
        '''export function fixedProxySlotCapability(
  slot: FixedProxySlot,
  target: PacTarget,
): FixedProxySlotCapability {
  void target;
  return slot === 'ftp'
''',
        'Fixed slot target contract',
    )
    proxy_path.write_text(proxy_text)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=('prepare', 'post'))
    args = parser.parse_args()
    if args.mode == 'prepare':
        prepare_patch()
    else:
        post_patch()


if __name__ == '__main__':
    main()
