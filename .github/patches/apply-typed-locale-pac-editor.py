from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


path = 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte'
replace_once(
    path,
    "  import { tick } from 'svelte';\n",
    "  import { tick } from 'svelte';\n\n  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n  import { uiMessage, uiText } from '../../lib/ui-messages';\n",
)
replace_once(path, '  export let spec: ProfileSpec;\n', '  export let locale: AppLocale = currentAppLocale();\n  export let spec: ProfileSpec;\n')
replace_once(
    path,
    "      authError = error instanceof Error ? error.message : String(error);\n",
    "      authError = uiText('pac.authReadFailed', locale);\n",
)
replace_once(
    path,
    "    } catch (error) {\n      authError = error instanceof Error ? error.message : String(error);\n      authSaving = false;\n      return;\n    }\n    if (!granted) {\n      authError = 'Proxy authentication permission was not granted.';\n",
    "    } catch {\n      authError = uiText('pac.authPermissionFailed', locale);\n      authSaving = false;\n      return;\n    }\n    if (!granted) {\n      authError = uiText('pac.authPermissionDenied', locale);\n",
)
replace_once(
    path,
    "      authError = 'PAC Profile no longer exists.';\n",
    "      authError = uiText('pac.missingProfile', locale);\n",
)
# Save and remove catches occur after the read catch; replace their exact remaining raw-error forms.
replace_once(
    path,
    "    } catch (error) {\n      authError = error instanceof Error ? error.message : String(error);\n    } finally {\n      authSaving = false;\n    }\n  }\n\n  async function removeAuthentication",
    "    } catch {\n      authError = uiText('pac.authSaveFailed', locale);\n    } finally {\n      authSaving = false;\n    }\n  }\n\n  async function removeAuthentication",
)
replace_once(
    path,
    "    } catch (error) {\n      authError = error instanceof Error ? error.message : String(error);\n    } finally {\n      authSaving = false;\n    }\n  }\n\n  function formatTimestamp",
    "    } catch {\n      authError = uiText('pac.authRemoveFailed', locale);\n    } finally {\n      authSaving = false;\n    }\n  }\n\n  function formatTimestamp",
)
replace_once(
    path,
    r'''  function formatTimestamp(value: string | undefined): string {
    if (!value) return 'never';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
  }

  function updateSummary(view: ProfileWorkflowPacSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return 'PAC script is obsolete until downloaded.';
    if (view.lastError) {
      return `Last update failed ${formatTimestamp(view.lastError.occurredAt)}. Existing cached script was preserved.`;
    }
    const stale = view.stale ? ' Cached script is stale.' : '';
    const bytes = view.lastBytes === undefined ? '' : ` ${view.lastBytes} bytes.`;
    return `Last updated ${formatTimestamp(view.lastSuccessAt)}.${bytes}${stale}`;
  }
''',
    r'''  function formatTimestamp(value: string | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString(locale);
  }

  function updateSummary(view: ProfileWorkflowPacSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return uiText('pac.obsolete', locale);
    if (view.lastError) {
      return uiMessage(
        'pac.updateFailed',
        { timestamp: formatTimestamp(view.lastError.occurredAt) },
        locale,
      );
    }
    return uiMessage(
      'pac.lastUpdated',
      {
        timestamp: formatTimestamp(view.lastSuccessAt),
        ...(view.lastBytes === undefined ? {} : { bytes: view.lastBytes }),
        stale: view.stale,
      },
      locale,
    );
  }
''',
)

replacements = {
    '  <div data-pac-profile-editor>': '  <div data-pac-profile-editor data-typed-locale={locale}>',
    '<h2>PAC URL</h2>': "<h2>{uiText('pac.url', locale)}</h2>",
    'aria-label="PAC URL"': "aria-label={uiText('pac.url', locale)}",
    'aria-label="Clear PAC URL"': "aria-label={uiText('pac.clearUrl', locale)}",
    'onclick={clearUrl}>Clear</button': "onclick={clearUrl}>{uiText('pac.clear', locale)}</button",
    '<p class="section-help">Leave the URL empty to edit PAC Script directly.</p>': "<p class=\"section-help\">{uiText('pac.urlHelp', locale)}</p>",
    'Local file PAC URLs depend on browser file-access capability.': "{uiText('pac.fileWarning', locale)}",
    'A file PAC cannot be referenced by another profile. Use it only as a top-level route.': "{uiText('pac.fileReferenced', locale)}",
    '<summary>Request headers</summary>': "<summary>{uiText('pac.requestHeaders', locale)}</summary>",
    '<p class="section-help">Sensitive values use background-owned secret references.</p>': "<p class=\"section-help\">{uiText('pac.headersHelp', locale)}</p>",
    'aria-label={`PAC header ${index + 1} name`}': "aria-label={uiMessage('pac.headerAria', { index: index + 1, field: 'name' }, locale)}",
    'aria-label={`PAC header ${index + 1} value type`}': "aria-label={uiMessage('pac.headerAria', { index: index + 1, field: 'type' }, locale)}",
    'aria-label={`PAC header ${index + 1} value`}': "aria-label={uiMessage('pac.headerAria', { index: index + 1, field: 'value' }, locale)}",
    '<option value="literal">Literal</option>': "<option value=\"literal\">{uiText('pac.literal', locale)}</option>",
    '<option value="secret">Secret reference</option>': "<option value=\"secret\">{uiText('pac.secretReference', locale)}</option>",
    '<button type="button" {disabled} onclick={() => removeHeader(index)}>Remove</button>': "<button type=\"button\" {disabled} onclick={() => removeHeader(index)}>{uiText('pac.removeHeader', locale)}</button>",
    '<button type="button" {disabled} onclick={addHeader}>Add header</button>': "<button type=\"button\" {disabled} onclick={addHeader}>{uiText('pac.addHeader', locale)}</button>",
    "{updateLoading ? 'Downloading…' : 'Download now'}": "{updateLoading ? uiText('pac.downloading', locale) : uiText('pac.downloadNow', locale)}",
    '<p class="source-update-error" role="alert">{updateView.lastError.message}</p>': "<p class=\"source-update-error\" role=\"alert\">{uiText('pac.updateError', locale)}</p>",
    '<h2>PAC Script</h2>': "<h2>{uiText('pac.script', locale)}</h2>",
    'The browser reads this local file directly; cached script text is hidden.': "{uiText('pac.fileScriptHidden', locale)}",
    'aria-label="PAC Script"': "aria-label={uiText('pac.script', locale)}",
    '<h2>Proxy Authentication</h2>': "<h2>{uiText('pac.authTitle', locale)}</h2>",
    'aria-label="PAC fallback profile"': "aria-label={uiText('pac.fallbackAria', locale)}",
    '<option value="">No fallback</option>': "<option value=\"\">{uiText('pac.noFallback', locale)}</option>",
    '<option value="direct">Direct</option>': "<option value=\"direct\">{uiText('route.direct', locale)}</option>",
    '<option value="system">System Proxy</option>': "<option value=\"system\">{uiText('route.system', locale)}</option>",
    '<h2 id="pac-auth-title">PAC Proxy Authentication</h2>': "<h2 id=\"pac-auth-title\">{uiText('pac.authDialogTitle', locale)}</h2>",
    'aria-label="Close PAC authentication"': "aria-label={uiText('pac.authClose', locale)}",
    'One credential is used only for proxy authentication challenges while this PAC Profile is\n          the active top-level route.': "{uiText('pac.authDialogHelp', locale)}",
    '          Username': "          {uiText('pac.username', locale)}",
    'aria-label="PAC authentication username"': "aria-label={uiText('pac.authUsernameAria', locale)}",
    '          Password': "          {uiText('pac.password', locale)}",
    'aria-label="PAC authentication password"': "aria-label={uiText('pac.authPasswordAria', locale)}",
    '          Show password': "          {uiText(showAuthPassword ? 'pac.hidePassword' : 'pac.showPassword', locale)}",
    'onclick={() => void removeAuthentication()}>Remove authentication</button': "onclick={() => void removeAuthentication()}>{uiText('pac.removeAuthentication', locale)}</button",
    '<button type="button" disabled={authSaving} onclick={closeAuthentication}>Cancel</button>': "<button type=\"button\" disabled={authSaving} onclick={closeAuthentication}>{uiText('common.cancel', locale)}</button>",
    "{authSaving ? 'Saving…' : 'Save authentication'}": "{authSaving ? uiText('common.saving', locale) : uiText('pac.saveAuthentication', locale)}",
}
for old, new in replacements.items():
    replace_once(path, old, new)

replace_once(
    path,
    r'''      <p class="section-help">
        These credentials answer Basic or Digest authentication challenges from any proxy returned
        by this top-level PAC Script. Ordinary website authentication is never answered.
      </p>
''',
    r'''      <p class="section-help">{uiText('pac.authHelp', locale)}</p>
      {#if profile.credential}
        <div class="auth-warning" role="alert" data-pac-auth-warning>
          <p>{uiText('pac.authAllWarning', locale)}</p>
          <p>
            {uiText(profile.source.kind === 'url' ? 'pac.authTrustUrl' : 'pac.authTrustScript', locale)}
          </p>
          {#if referenced}<p>{uiText('pac.authReferencedWarning', locale)}</p>{/if}
        </div>
      {/if}
''',
)
replace_once(
    path,
    "          {profile.credential ? 'Edit all-proxy authentication' : 'Set all-proxy authentication'}\n",
    "          {uiText(profile.credential ? 'pac.authEdit' : 'pac.authSet', locale)}\n",
)
replace_once(
    path,
    r'''          {profile.credential
            ? `Configured${profile.credential.username ? ` for ${profile.credential.username}` : ''}.`
            : 'Not configured.'}
''',
    r'''          {profile.credential
            ? profile.credential.username
              ? uiMessage('pac.authConfiguredFor', { username: profile.credential.username }, locale)
              : uiText('pac.authConfigured', locale)
            : uiText('pac.authNotConfigured', locale)}
''',
)
replace_once(
    path,
    r'''      <h2>Target capability fallback</h2>
      <p class="section-help">
        Used only when the selected browser cannot activate this PAC source. It does not compose the
        arbitrary PAC script into another profile.
      </p>
''',
    r'''      <h2>{uiText('pac.fallbackTitle', locale)}</h2>
      <p class="section-help">{uiText('pac.fallbackHelp', locale)}</p>
''',
)
# Style source-backed warning block without changing layout.
replace_once(
    path,
    "  .stale,\n  .source-update-error,\n  .file-warning {\n",
    "  .stale,\n  .source-update-error,\n  .file-warning,\n  .auth-warning {\n",
)
replace_once(
    path,
    "  .header-row {\n",
    "  .auth-warning {\n    width: min(100%, 920px);\n    margin: 0.75rem 0;\n    padding: 0.7rem 0.85rem;\n    border: 1px solid var(--danger);\n    background: color-mix(in srgb, var(--danger) 8%, transparent);\n  }\n\n  .auth-warning p {\n    margin: 0.25rem 0;\n  }\n\n  .header-row {\n",
)
