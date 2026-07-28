from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
old = """      optionsApp.includes(\"action: 'update-rule-source'\") &&
      optionsApp.includes('requestRuleSourceOriginPermission') &&
      runtime.includes('BrowserRuleSourceDownloader') &&
"""
new = """      optionsApp.includes(\"action: 'update-rule-source'\") &&
      workflowClient.includes('runWithRuleSourceOriginPermission') &&
      optionsApp.includes('runWithRuleSourceOriginPermission(url, async () =>') &&
      !optionsApp.includes('requestRuleSourceOriginPermission') &&
      runtime.includes('BrowserRuleSourceDownloader') &&
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one legacy permission guard, found {text.count(old)}')
path.write_text(text.replace(old, new))
