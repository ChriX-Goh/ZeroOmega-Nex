from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


attached = 'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte'
replace_once(
    attached,
    "  } from '@zeroomega-nex/profile-workflow';\n\n  export let spec",
    "  } from '@zeroomega-nex/profile-workflow';\n\n  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n  import { uiMessage, uiText } from '../../lib/ui-messages';\n\n  export let spec",
)
replace_once(
    attached,
    '''  export let spec: ProfileSpec;
  export let switchProfileId: string;
''',
    '''  export let spec: ProfileSpec;
  export let switchProfileId: string;
  export let locale: AppLocale = currentAppLocale();
''',
)
replace_once(
    attached,
    '''  function formatTimestamp(value: string | undefined): string {
    if (!value) return 'never';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
  }

  function updateSummary(view: ProfileWorkflowRuleSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return 'Never downloaded.';
    if (view.lastError) {
      return `Last update failed ${formatTimestamp(view.lastError.occurredAt)}. Existing cached content was preserved.`;
    }
    const stale = view.stale ? ' Cached content is stale.' : '';
    const bytes = view.lastBytes === undefined ? '' : ` ${view.lastBytes} bytes.`;
    return `Last updated ${formatTimestamp(view.lastSuccessAt)}.${bytes}${stale}`;
  }
''',
    '''  function formatTimestamp(value: string | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString(locale);
  }

  function updateSummary(view: ProfileWorkflowRuleSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return uiText('ruleList.neverDownloaded', locale);
    if (view.lastError) {
      return uiMessage(
        'ruleList.updateFailed',
        { timestamp: formatTimestamp(view.lastError.occurredAt) },
        locale,
      );
    }
    return uiMessage(
      'ruleList.lastUpdated',
      {
        timestamp: formatTimestamp(view.lastSuccessAt),
        bytes: view.lastBytes,
        stale: view.stale,
      },
      locale,
    );
  }
''',
)
attached_replacements = {
    '<section class="settings-section attached-rule-list-config" data-attached-rule-list-config>': '<section class="settings-section attached-rule-list-config" data-attached-rule-list-config data-typed-locale={locale}>',
    '<h2>Attached Rule List configuration</h2>': "<h2>{uiText('ruleList.attachedConfig', locale)}</h2>",
    'The attached profile remains hidden from normal navigation and participates only through this\n      Switch Profile.': "{uiText('ruleList.attachedHiddenHelp', locale)}",
    '<legend>Format</legend>': "<legend>{uiText('ruleList.format', locale)}</legend>",
    '      Source type\n      <select': "      {uiText('ruleList.sourceType', locale)}\n      <select",
    'aria-label="Attached Rule List source type"': "aria-label={uiText('ruleList.attachedSourceType', locale)}",
    '<option value="inline">Inline text</option>': "<option value=\"inline\">{uiText('ruleList.inlineText', locale)}</option>",
    '        Rule List URL\n        <input': "        {uiText('ruleList.url', locale)}\n        <input",
    'aria-label="Attached Rule List URL"': "aria-label={uiText('ruleList.attachedUrl', locale)}",
    "{updateLoading ? 'Downloading…' : 'Download now'}": "{updateLoading ? uiText('ruleList.downloading', locale) : uiText('ruleList.downloadNow', locale)}",
    'Remote content is downloaded by the background service with isolated credentials, bounded\n        size, and atomic cache replacement. Failed downloads keep the previous cache.': "{uiText('ruleList.downloadSafety', locale)}",
    'aria-label="Attached Rule List downloaded text"': "aria-label={uiText('ruleList.downloadedText', locale)}",
    '        Rule List text\n        <textarea': "        {uiText('ruleList.text', locale)}\n        <textarea",
    'aria-label="Attached Rule List text"': "aria-label={uiText('ruleList.attachedText', locale)}",
    '      Update interval (minutes)\n      <input': "      {uiText('ruleList.updateInterval', locale)}\n      <input",
    '<summary>Request headers</summary>': "<summary>{uiText('ruleList.requestHeaders', locale)}</summary>",
    'Sensitive values must use secret references; raw secret values never enter ProfileSpec.': "{uiText('ruleList.headersHelp', locale)}",
    'aria-label={`Attached header ${index + 1} name`}': "aria-label={uiMessage('ruleList.headerAria', { scope: 'attached', index: index + 1, field: 'name' }, locale)}",
    'aria-label={`Attached header ${index + 1} value type`}': "aria-label={uiMessage('ruleList.headerAria', { scope: 'attached', index: index + 1, field: 'type' }, locale)}",
    '<option value="literal">Literal</option>': "<option value=\"literal\">{uiText('ruleList.literal', locale)}</option>",
    '<option value="secret">Secret reference</option>': "<option value=\"secret\">{uiText('ruleList.secretReference', locale)}</option>",
    'aria-label={`Attached header ${index + 1} value`}': "aria-label={uiMessage('ruleList.headerAria', { scope: 'attached', index: index + 1, field: 'value' }, locale)}",
    '>Remove</button>': ">{uiText('ruleList.removeHeader', locale)}</button>",
    '>Add header</button>': ">{uiText('ruleList.addHeader', locale)}</button>",
    '<p class="source-update-error" role="alert">{updateView.lastError.message}</p>': "<p class=\"source-update-error\" role=\"alert\">{uiText('ruleList.updateError', locale)}</p>",
}
for old, new in attached_replacements.items():
    replace_once(attached, old, new)

independent = 'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte'
replace_once(
    independent,
    "  } from '@zeroomega-nex/profile-workflow';\n\n  export let spec",
    "  } from '@zeroomega-nex/profile-workflow';\n\n  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n  import { uiMessage, uiText } from '../../lib/ui-messages';\n\n  export let spec",
)
replace_once(
    independent,
    '''  export let spec: ProfileSpec;
  export let profileId: string;
''',
    '''  export let spec: ProfileSpec;
  export let profileId: string;
  export let locale: AppLocale = currentAppLocale();
''',
)
replace_once(
    independent,
    '''  function formatTimestamp(value: string | undefined): string {
    if (!value) return 'never';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
  }

  function updateSummary(view: ProfileWorkflowRuleSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return 'Never downloaded.';
    if (view.lastError) {
      return `Last update failed ${formatTimestamp(view.lastError.occurredAt)}. Existing cached content was preserved.`;
    }
    const stale = view.stale ? ' Cached content is stale.' : '';
    const bytes = view.lastBytes === undefined ? '' : ` ${view.lastBytes} bytes.`;
    return `Last updated ${formatTimestamp(view.lastSuccessAt)}.${bytes}${stale}`;
  }
''',
    '''  function formatTimestamp(value: string | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString(locale);
  }

  function updateSummary(view: ProfileWorkflowRuleSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return uiText('ruleList.neverDownloaded', locale);
    if (view.lastError) {
      return uiMessage(
        'ruleList.updateFailed',
        { timestamp: formatTimestamp(view.lastError.occurredAt) },
        locale,
      );
    }
    return uiMessage(
      'ruleList.lastUpdated',
      {
        timestamp: formatTimestamp(view.lastSuccessAt),
        bytes: view.lastBytes,
        stale: view.stale,
      },
      locale,
    );
  }
''',
)
independent_replacements = {
    '<div data-rule-list-profile-editor>': '<div data-rule-list-profile-editor data-typed-locale={locale}>',
    '<h2>Rule List Config</h2>': "<h2>{uiText('ruleList.config', locale)}</h2>",
    '          Match profile\n          <select': "          {uiText('ruleList.matchProfile', locale)}\n          <select",
    'aria-label="Rule List match profile"': "aria-label={uiText('ruleList.matchProfile', locale)}",
    '          Default profile\n          <select': "          {uiText('ruleList.defaultProfile', locale)}\n          <select",
    'aria-label="Rule List default profile"': "aria-label={uiText('ruleList.defaultProfile', locale)}",
    '<legend>Rule List format</legend>': "<legend>{uiText('ruleList.format', locale)}</legend>",
    '<h2>Rule List URL</h2>': "<h2>{uiText('ruleList.url', locale)}</h2>",
    'aria-label="Rule List URL"': "aria-label={uiText('ruleList.url', locale)}",
    'aria-label="Clear Rule List URL"': "aria-label={uiText('ruleList.clearUrl', locale)}",
    '>Clear</button>': ">{uiText('ruleList.clear', locale)}</button>",
    'Leave the URL empty to edit the Rule List text directly. Remote downloads replace the cache\n        atomically; failures preserve the previous text.': "{uiText('ruleList.urlHelp', locale)}",
    '<summary>Request headers</summary>': "<summary>{uiText('ruleList.requestHeaders', locale)}</summary>",
    'Sensitive values use secret references and remain background-owned.': "{uiText('ruleList.headersHelp', locale)}",
    'aria-label={`Rule List header ${index + 1} name`}': "aria-label={uiMessage('ruleList.headerAria', { scope: 'independent', index: index + 1, field: 'name' }, locale)}",
    'aria-label={`Rule List header ${index + 1} value type`}': "aria-label={uiMessage('ruleList.headerAria', { scope: 'independent', index: index + 1, field: 'type' }, locale)}",
    '<option value="literal">Literal</option>': "<option value=\"literal\">{uiText('ruleList.literal', locale)}</option>",
    '<option value="secret">Secret reference</option>': "<option value=\"secret\">{uiText('ruleList.secretReference', locale)}</option>",
    'aria-label={`Rule List header ${index + 1} value`}': "aria-label={uiMessage('ruleList.headerAria', { scope: 'independent', index: index + 1, field: 'value' }, locale)}",
    '>Remove</button>': ">{uiText('ruleList.removeHeader', locale)}</button>",
    '>Add header</button>': ">{uiText('ruleList.addHeader', locale)}</button>",
    '<h2>Rule List Text</h2>': "<h2>{uiText('ruleList.text', locale)}</h2>",
    "{updateLoading ? 'Downloading…' : 'Download now'}": "{updateLoading ? uiText('ruleList.downloading', locale) : uiText('ruleList.downloadNow', locale)}",
    '<p class="source-update-error" role="alert">{updateView.lastError.message}</p>': "<p class=\"source-update-error\" role=\"alert\">{uiText('ruleList.updateError', locale)}</p>",
    'aria-label="Rule List text"': "aria-label={uiText('ruleList.text', locale)}",
}
for old, new in independent_replacements.items():
    replace_once(independent, old, new)
for target in (independent,):
    text = Path(target).read_text()
    direct_count = text.count('<option value="direct">Direct</option>')
    system_count = text.count('<option value="system">System Proxy</option>')
    if direct_count != 2 or system_count != 2:
        raise SystemExit(f'{target}: unexpected route option counts {direct_count}/{system_count}')
    text = text.replace('<option value="direct">Direct</option>', "<option value=\"direct\">{uiText('route.direct', locale)}</option>")
    text = text.replace('<option value="system">System Proxy</option>', "<option value=\"system\">{uiText('route.system', locale)}</option>")
    Path(target).write_text(text)
