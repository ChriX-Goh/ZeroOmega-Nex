from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let openingExtensionManager = false;
  let conditionFormOpen = false;
""",
    """  let openingExtensionManager = false;
  let importingExternalProfile = false;
  let externalProfileFormOpen = false;
  let externalProfileName = '';
  let externalProfileNameError = '';
  let conditionFormOpen = false;
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  async function openExtensionManager(): Promise<void> {
""",
    """  function validateExternalProfileName(): string {
    const name = externalProfileName.trim();
    if (!name) return translate('Profile name is required.');
    if (name.startsWith('_')) return translate('Profile name cannot start with an underscore.');
    if (state?.applied.profiles.some((profile) => profile.name === name)) {
      return translate('A profile with this name already exists.');
    }
    return '';
  }

  function openExternalProfileForm(): void {
    externalProfileName = '';
    externalProfileNameError = '';
    externalProfileFormOpen = true;
  }

  function closeExternalProfileForm(): void {
    externalProfileFormOpen = false;
    externalProfileName = '';
    externalProfileNameError = '';
  }

  async function importExternalProfile(): Promise<void> {
    if (!state || importingExternalProfile) return;
    externalProfileNameError = validateExternalProfileName();
    if (externalProfileNameError) return;
    importingExternalProfile = true;
    errorMessage = '';
    try {
      const accepted = acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'import-external-profile',
          expectedAppliedRevisionId: state.applied.revision.id,
          name: externalProfileName.trim(),
        }),
      );
      if (accepted) window.close();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      importingExternalProfile = false;
    }
  }

  async function openExtensionManager(): Promise<void> {
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  aria-busy={loading || switching || addingCondition || settingResult || settingTemporaryRule}
""",
    """  aria-busy={loading ||
    switching ||
    addingCondition ||
    settingResult ||
    settingTemporaryRule ||
    importingExternalProfile}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """      {/each}
    {/if}
  </section>
""",
    """      {/each}
      {#if proxyOwnership?.externalProfile}
        <div class="profile-divider" role="separator"></div>
        <div class="external-profile-row" data-popup-external-profile>
          {#if externalProfileFormOpen}
            <form
              class="external-profile-form"
              data-popup-external-profile-form
              onsubmit={(event) => {
                event.preventDefault();
                void importExternalProfile();
              }}
            >
              <label>
                {translate('Profile name')}
                <input
                  aria-label="External profile name"
                  bind:value={externalProfileName}
                  placeholder={translate('External Profile')}
                  oninput={() => (externalProfileNameError = '')}
                />
              </label>
              {#if externalProfileNameError}
                <p class="external-profile-error" role="alert">{externalProfileNameError}</p>
              {/if}
              <div class="external-profile-actions">
                <button
                  type="button"
                  disabled={importingExternalProfile}
                  onclick={closeExternalProfileForm}
                >
                  {translate('Cancel')}
                </button>
                <button type="submit" class="primary" disabled={importingExternalProfile}>
                  {importingExternalProfile ? translate('Saving…') : translate('Save name')}
                </button>
              </div>
            </form>
          {:else}
            <button
              type="button"
              class="external-profile-button"
              disabled={switching || importingExternalProfile}
              onclick={openExternalProfileForm}
            >
              <ProfileIcon
                kind={proxyOwnership.externalProfile.kind}
                color={proxyOwnership.externalProfile.kind === 'fixed' ? '#64b5f6' : '#ffb74d'}
                size={21}
              />
              <span>{translate('External Profile')}</span>
            </button>
          {/if}
        </div>
      {/if}
    {/if}
  </section>
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """      >{switching || settingTemporaryRule ? 'Switching…' : productIdentity.name}</span
""",
    """      >{switching || settingTemporaryRule || importingExternalProfile
        ? 'Switching…'
        : productIdentity.name}</span
""",
)

replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.profile-divider {
""",
    """.external-profile-row {
  border-bottom: 1px solid var(--popup-border);
}

.external-profile-button {
  display: grid;
  grid-template-columns: 29px 1fr;
  gap: 6px;
  align-items: center;
  width: 100%;
  min-height: 39px;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  color: var(--popup-text);
  text-align: left;
  cursor: pointer;
}

.external-profile-button:hover:not(:disabled) {
  background: var(--popup-hover);
}

.external-profile-button:focus-visible,
.external-profile-form input:focus-visible,
.external-profile-actions button:focus-visible {
  outline: 3px solid var(--popup-focus);
  outline-offset: 1px;
}

.external-profile-form {
  display: grid;
  gap: 7px;
  padding: 9px 11px;
  background: var(--popup-footer);
}

.external-profile-form label {
  display: grid;
  gap: 4px;
  color: var(--popup-muted);
  font-size: 11px;
}

.external-profile-form input {
  min-height: 30px;
  padding: 4px 7px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-bg);
  color: var(--popup-text);
  font: inherit;
}

.external-profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.external-profile-actions button {
  min-height: 29px;
  padding: 4px 9px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-bg);
  color: var(--popup-text);
  cursor: pointer;
}

.external-profile-actions button.primary {
  border-color: var(--popup-accent);
}

.external-profile-error {
  margin: 0;
  color: var(--popup-error-text);
  font-size: 11px;
}

.profile-divider {
""",
)

replace_once(
    'apps/extension/src/lib/i18n.ts',
    """  'Manage extensions': { 'zh-CN': '管理扩展', 'zh-TW': '管理擴充功能' },
""",
    """  'Manage extensions': { 'zh-CN': '管理扩展', 'zh-TW': '管理擴充功能' },
  'External Profile': { 'zh-CN': '外部情景模式', 'zh-TW': '外部情景模式' },
  'Profile name': { 'zh-CN': '情景模式名称', 'zh-TW': '情景模式名稱' },
  'Save name': { 'zh-CN': '保存名称', 'zh-TW': '儲存名稱' },
  'Saving…': { 'zh-CN': '正在保存…', 'zh-TW': '正在儲存…' },
  'Profile name is required.': { 'zh-CN': '必须输入情景模式名称。', 'zh-TW': '必須輸入情景模式名稱。' },
  'Profile name cannot start with an underscore.': {
    'zh-CN': '情景模式名称不能以下划线开头。',
    'zh-TW': '情景模式名稱不能以下劃線開頭。',
  },
  'A profile with this name already exists.': {
    'zh-CN': '已存在同名情景模式。',
    'zh-TW': '已存在同名情景模式。',
  },
""",
)
