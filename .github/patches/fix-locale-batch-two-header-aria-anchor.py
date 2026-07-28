from pathlib import Path

path = Path('.github/patches/apply-locale-batch-two-integration.py')
text = path.read_text()
old = '''    ''' + "'''" + '''    case 'ruleList.headerAria': {
      const { scope, index, field } = params as UiMessageParameters['ruleList.headerAria'];
      const scopeText =
        scope === 'attached'
          ? locale === 'en'
            ? 'Attached'
            : locale === 'zh-CN'
              ? '附属'
              : '附屬'
          : locale === 'en'
            ? 'Rule List'
            : locale === 'zh-CN'
              ? '规则列表'
              : '規則清單';
      const fieldText =
        field === 'name'
          ? uiText('ruleList.headerName', locale)
          : field === 'type'
            ? uiText('ruleList.headerType', locale)
            : uiText('ruleList.headerValue', locale);
      return `${scopeText} ${index} ${fieldText}`;
    }
''' + "'''" + ''',
'''
new = '''    ''' + "'''" + '''    case 'ruleList.headerAria': {
      const { scope, index, field } = params as UiMessageParameters['ruleList.headerAria'];
      const scopeText = scope === 'attached'
        ? (locale === 'en' ? 'Attached' : locale === 'zh-CN' ? '附属' : '附屬')
        : (locale === 'en' ? 'Rule List' : locale === 'zh-CN' ? '规则列表' : '規則清單');
      const fieldText = field === 'name' ? uiText('ruleList.headerName', locale) : field === 'type' ? uiText('ruleList.headerType', locale) : uiText('ruleList.headerValue', locale);
      return `${scopeText} ${index} ${fieldText}`;
    }
''' + "'''" + ''',
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one Rule List header ARIA integration anchor, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
