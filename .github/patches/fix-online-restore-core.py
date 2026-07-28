from pathlib import Path

path = Path('apps/extension/src/entrypoints/options/LegacyImportPanel.svelte')
text = path.read_text()
old_import = "import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';"
if old_import not in text:
    legacy = "import { uiMessage, uiText } from '../../lib/ui-messages';"
    if text.count(legacy) != 1:
        raise SystemExit(f'expected one UI message import, found {text.count(legacy)}')
    text = text.replace(legacy, old_import)
old_message = "      await analyze();\n      onlineMessage = uiText('legacy.onlineDownloaded', locale);"
new_message = "      await analyze();\n      if (result !== undefined) onlineMessage = uiText('legacy.onlineDownloaded', locale);"
if text.count(old_message) != 1:
    raise SystemExit(f'expected one online success assignment, found {text.count(old_message)}')
path.write_text(text.replace(old_message, new_message))
