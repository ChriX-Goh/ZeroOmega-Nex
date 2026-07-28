from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


def replace_count(path: str, old: str, new: str, expected: int) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{path}: expected {expected} matches, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new))


Path('apps/extension/src/lib/ui-messages.ts').write_text(r'''import { currentAppLocale, type AppLocale } from './i18n';

type LocalizedText = Readonly<Record<AppLocale, string>>;

export const typedUiTextCatalog = {
  'common.cancel': { en: 'Cancel', 'zh-CN': '取消', 'zh-TW': '取消' },
  'common.close': { en: 'Close', 'zh-CN': '关闭', 'zh-TW': '關閉' },
  'common.create': { en: 'Create', 'zh-CN': '创建', 'zh-TW': '建立' },
  'common.creating': { en: 'Creating…', 'zh-CN': '正在创建…', 'zh-TW': '正在建立…' },
  'common.delete': { en: 'Delete', 'zh-CN': '删除', 'zh-TW': '刪除' },
  'common.duplicate': { en: 'Duplicate', 'zh-CN': '复制', 'zh-TW': '複製' },
  'common.loading': { en: 'Loading…', 'zh-CN': '正在加载…', 'zh-TW': '正在載入…' },
  'common.replace': { en: 'Replace', 'zh-CN': '替换', 'zh-TW': '取代' },
  'common.saveChanges': { en: 'Save changes', 'zh-CN': '保存更改', 'zh-TW': '儲存變更' },
  'common.saving': { en: 'Saving…', 'zh-CN': '正在保存…', 'zh-TW': '正在儲存…' },
  'route.direct': { en: 'Direct', 'zh-CN': '直接连接', 'zh-TW': '直接連線' },
  'route.system': { en: 'System Proxy', 'zh-CN': '系统代理', 'zh-TW': '系統代理' },
  'route.missing': { en: 'Missing profile', 'zh-CN': '情景模式不存在', 'zh-TW': '情境模式不存在' },
  'profile.name': { en: 'Profile name', 'zh-CN': '情景模式名称', 'zh-TW': '情境模式名稱' },
  'profile.color': { en: 'Profile color', 'zh-CN': '情景模式颜色', 'zh-TW': '情境模式顏色' },
  'profile.kind.fixed': { en: 'Fixed Profile', 'zh-CN': '固定情景模式', 'zh-TW': '固定情境模式' },
  'profile.kind.switch': { en: 'Switch Profile', 'zh-CN': '自动切换情景模式', 'zh-TW': '自動切換情境模式' },
  'profile.kind.ruleList': { en: 'Rule List Profile', 'zh-CN': '规则列表情景模式', 'zh-TW': '規則清單情境模式' },
  'profile.kind.pac': { en: 'PAC Profile', 'zh-CN': 'PAC 情景模式', 'zh-TW': 'PAC 情境模式' },
  'profile.kind.autoDetect': { en: 'Auto Detect Profile', 'zh-CN': '自动检测情景模式', 'zh-TW': '自動偵測情境模式' },
  'profile.kind.virtual': { en: 'Virtual Profile', 'zh-CN': '虚拟情景模式', 'zh-TW': '虛擬情境模式' },
  'newProfile.title': { en: 'New Profile', 'zh-CN': '新建情景模式', 'zh-TW': '建立情境模式' },
  'newProfile.type': { en: 'Please select the profile type:', 'zh-CN': '请选择情景模式的类型：', 'zh-TW': '請選擇情境模式的類型：' },
  'newProfile.fixed.title': { en: 'Proxy Profile', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  'newProfile.fixed.description': { en: 'Tunneling traffic through proxy servers.', 'zh-CN': '经过代理服务器访问网站。', 'zh-TW': '經過代理伺服器訪問網站。' },
  'newProfile.switch.title': { en: 'Switch Profile', 'zh-CN': '自动切换模式', 'zh-TW': '自動切換模式' },
  'newProfile.switch.description': {
    en: 'Select another profile by URL, host, or other switching conditions.',
    'zh-CN': '按照网址、主机或其他切换条件自动选择情景模式。',
    'zh-TW': '依據網域、網址或其他切換條件自動選擇情境模式。',
  },
  'newProfile.pac.title': { en: 'PAC Profile', 'zh-CN': 'PAC 情景模式', 'zh-TW': 'PAC 情境模式' },
  'newProfile.pac.description': {
    en: 'Choosing proxies using an online or local PAC script.',
    'zh-CN': '根据在线或本地的 PAC 脚本选择代理。',
    'zh-TW': '依據線上或本機的 PAC 指令碼選擇代理。',
  },
  'newProfile.pac.unsupported': {
    en: 'PAC profiles are not supported by this browser target.',
    'zh-CN': '由于技术限制，PAC 情景模式无法在当前浏览器目标上工作。',
    'zh-TW': '由於技術限制，PAC 情境模式無法在目前瀏覽器目標上工作。',
  },
  'newProfile.virtual.title': { en: 'Virtual Profile', 'zh-CN': '虚拟情景模式', 'zh-TW': '虛擬情境模式' },
  'newProfile.virtual.description': {
    en: 'Create a stable alias that points to another profile.',
    'zh-CN': '创建一个可按需更改目标的稳定情景模式别名。',
    'zh-TW': '建立一個可依需求變更目標的穩定情境模式別名。',
  },
  'newProfile.error.empty': { en: 'Profile name cannot be empty.', 'zh-CN': '情景模式名称不能为空。', 'zh-TW': '情境模式名稱不能為空。' },
  'newProfile.error.reserved': {
    en: 'Names beginning with two underscores and built-in profile names are reserved.',
    'zh-CN': '以双下划线开头的名称及内置情景模式名称为系统保留，禁止使用。',
    'zh-TW': '以雙底線開頭的名稱及內建情境模式名稱為系統保留，禁止使用。',
  },
  'newProfile.error.conflict': {
    en: 'A profile with the same name already exists.',
    'zh-CN': '已经存在相同名称的情景模式。',
    'zh-TW': '已經存在相同名稱的情境模式。',
  },
  'newProfile.hidden': {
    en: 'Profiles beginning with an underscore are hidden from the popup but can still be used as switching results.',
    'zh-CN': '以下划线开头的情景模式不会在弹出菜单中显示，但仍可被用作切换结果。',
    'zh-TW': '以底線開頭的情境模式不會顯示在彈出式選單中，但仍可作為切換結果。',
  },
  'profile.delete.blockedTitle': { en: 'Cannot delete profile', 'zh-CN': '情景模式无法删除', 'zh-TW': '情境模式無法刪除' },
  'profile.delete.blockedInstruction': {
    en: 'Modify every referring profile and remove its reference before deleting this profile.',
    'zh-CN': '修改以上所有情景模式并移除对此情景模式的引用后，方可删除此情景模式。',
    'zh-TW': '修改以上所有情境模式並移除對此情境模式的引用後，方可刪除此情境模式。',
  },
  'profile.delete.confirmTitle': { en: 'Delete profile', 'zh-CN': '删除情景模式', 'zh-TW': '刪除情境模式' },
  'profile.replace.title': { en: 'Replace Profile', 'zh-CN': '替换情景模式', 'zh-TW': '取代情境模式' },
  'profile.replace.questionPrefix': { en: 'Do you really want to replace', 'zh-CN': '您确定要使用', 'zh-TW': '您確定要使用' },
  'profile.replace.questionMiddle': { en: 'with', 'zh-CN': '来代替', 'zh-TW': '來代替' },
  'profile.replace.questionSuffix': { en: '?', 'zh-CN': '吗？', 'zh-TW': '嗎？' },
  'profile.replace.fromAria': { en: 'Profile to replace', 'zh-CN': '要被替换的情景模式', 'zh-TW': '要被取代的情境模式' },
  'profile.replace.toAria': { en: 'Replacement profile', 'zh-CN': '用于替换的情景模式', 'zh-TW': '用於取代的情境模式' },
  'profile.replace.help': {
    en: 'All rules pointing to the first profile will use the second profile instead. Startup, Quick Switch, and other profile references are updated too. The two profiles themselves are not changed or deleted.',
    'zh-CN': '所有指向第一个情景模式的规则将改用第二个情景模式；启动情景模式、快速切换及其他引用也会一并更新。两个情景模式本身不会被修改或删除。',
    'zh-TW': '所有指向第一個情境模式的規則將改用第二個情境模式；啟動情境模式、快速切換及其他引用也會一併更新。兩個情境模式本身不會被修改或刪除。',
  },
  'fixed.proxyServers': { en: 'Proxy servers', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  'fixed.scheme': { en: 'Scheme', 'zh-CN': '网址协议', 'zh-TW': '網址協定' },
  'fixed.protocol': { en: 'Protocol', 'zh-CN': '协议', 'zh-TW': '通訊協定' },
  'fixed.server': { en: 'Server', 'zh-CN': '服务器', 'zh-TW': '伺服器' },
  'fixed.port': { en: 'Port', 'zh-CN': '端口', 'zh-TW': '連接埠' },
  'fixed.authentication': { en: 'Authentication', 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  'fixed.default': { en: '(default)', 'zh-CN': '(默认)', 'zh-TW': '(預設)' },
  'fixed.useDefault': { en: '(use default)', 'zh-CN': '(同默认)', 'zh-TW': '(同預設)' },
  'fixed.showAdvanced': { en: 'Show Advanced', 'zh-CN': '显示高级设置', 'zh-TW': '顯示進階設定' },
  'fixed.bypassList': { en: 'Bypass List', 'zh-CN': '不代理的地址列表', 'zh-TW': '不代理的位址清單' },
  'fixed.bypassHelp': {
    en: 'Servers for which you do not want to use any proxy: (One server on each line.)',
    'zh-CN': '不经过代理连接的主机列表：（每行一个主机）',
    'zh-TW': '不經過代理連線的主機清單：（每行一個主機）',
  },
  'fixed.bypassMore': { en: '(Wildcards and more available…)', 'zh-CN': '（可使用通配符等匹配规则…）', 'zh-TW': '（可使用萬用字元等比對規則…）' },
  'fixed.authTitle': { en: 'Proxy Authentication', 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  'fixed.username': { en: 'Username', 'zh-CN': '用户名', 'zh-TW': '使用者名稱' },
  'fixed.password': { en: 'Password', 'zh-CN': '密码', 'zh-TW': '密碼' },
  'fixed.showPassword': { en: 'Show password', 'zh-CN': '显示密码', 'zh-TW': '顯示密碼' },
  'fixed.hidePassword': { en: 'Hide password', 'zh-CN': '隐藏密码', 'zh-TW': '隱藏密碼' },
  'fixed.noAuthentication': { en: 'No Authentication', 'zh-CN': '(无密码)', 'zh-TW': '(無密碼)' },
  'fixed.error.serverRequired': { en: 'Server is required.', 'zh-CN': '代理服务器不能为空。', 'zh-TW': '代理伺服器不可留空。' },
  'fixed.error.portRange': { en: 'Port must be an integer from 1 to 65535.', 'zh-CN': '代理端口必须是 1 到 65535 之间的整数。', 'zh-TW': '代理連接埠必須是 1 到 65535 之間的整數。' },
  'fixed.error.serverMissing': { en: 'Proxy server no longer exists.', 'zh-CN': '代理服务器已不存在。', 'zh-TW': '代理伺服器已不存在。' },
} as const satisfies Record<string, LocalizedText>;

export type UiTextKey = keyof typeof typedUiTextCatalog;

export type ProfileKind =
  | 'fixed'
  | 'switch'
  | 'rule-list'
  | 'pac'
  | 'auto-detect'
  | 'virtual';

const profileKindKeys: Readonly<Record<ProfileKind, UiTextKey>> = {
  fixed: 'profile.kind.fixed',
  switch: 'profile.kind.switch',
  'rule-list': 'profile.kind.ruleList',
  pac: 'profile.kind.pac',
  'auto-detect': 'profile.kind.autoDetect',
  virtual: 'profile.kind.virtual',
};

export interface UiMessageParameters {
  readonly 'profile.delete.blockedDescription': { readonly profileName: string };
  readonly 'profile.delete.confirmDescription': { readonly profileName: string };
  readonly 'fixed.fieldAria': {
    readonly scheme: string;
    readonly field: 'protocol' | 'server' | 'port';
  };
  readonly 'fixed.authUnsupported': { readonly protocol: string };
}

export type UiMessageKey = keyof UiMessageParameters;

export function uiText(key: UiTextKey, locale: AppLocale = currentAppLocale()): string {
  return typedUiTextCatalog[key][locale];
}

export function profileKindText(
  kind: ProfileKind,
  locale: AppLocale = currentAppLocale(),
): string {
  return uiText(profileKindKeys[kind], locale);
}

export function uiMessage<K extends UiMessageKey>(
  key: K,
  params: UiMessageParameters[K],
  locale: AppLocale = currentAppLocale(),
): string {
  switch (key) {
    case 'profile.delete.blockedDescription': {
      const { profileName } = params as UiMessageParameters['profile.delete.blockedDescription'];
      if (locale === 'zh-CN') return `“${profileName}”仍被以下情景模式引用，因此无法删除。`;
      if (locale === 'zh-TW') return `「${profileName}」仍被以下情境模式使用，因此無法刪除。`;
      return `“${profileName}” is still referenced by the following profiles.`;
    }
    case 'profile.delete.confirmDescription': {
      const { profileName } = params as UiMessageParameters['profile.delete.confirmDescription'];
      if (locale === 'zh-CN') return `删除情景模式“${profileName}”？此操作只会修改尚未应用的设置。`;
      if (locale === 'zh-TW') return `刪除情境模式「${profileName}」？此操作只會修改尚未套用的設定。`;
      return `Delete “${profileName}”? This changes only the Draft until Apply.`;
    }
    case 'fixed.fieldAria': {
      const { scheme, field } = params as UiMessageParameters['fixed.fieldAria'];
      const fieldKey = `fixed.${field}` as 'fixed.protocol' | 'fixed.server' | 'fixed.port';
      return `${scheme} ${uiText(fieldKey, locale)}`;
    }
    case 'fixed.authUnsupported': {
      const { protocol } = params as UiMessageParameters['fixed.authUnsupported'];
      if (locale === 'zh-CN') return `您的浏览器不支持 ${protocol} 代理认证。`;
      if (locale === 'zh-TW') return `您的瀏覽器不支援 ${protocol} 代理認證。`;
      return `Your browser does not support ${protocol} proxy authentication.`;
    }
  }
}
''')

Path('apps/extension/src/entrypoints/options/NewProfileDialog.svelte').write_text(r'''<script lang="ts">
  import { onMount, tick } from 'svelte';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText, type UiTextKey } from '../../lib/ui-messages';

  type NewProfileKind = 'fixed' | 'switch' | 'pac' | 'virtual';

  export let existingNames: readonly string[] = [];
  export let disabled = false;
  export let pacSupported = true;
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onCreate: (kind: NewProfileKind, name: string) => Promise<void>;

  const choices: readonly {
    kind: NewProfileKind;
    color: string;
    titleKey: UiTextKey;
    descriptionKey: UiTextKey;
  }[] = [
    {
      kind: 'fixed',
      color: '#64b5f6',
      titleKey: 'newProfile.fixed.title',
      descriptionKey: 'newProfile.fixed.description',
    },
    {
      kind: 'switch',
      color: '#8bc34a',
      titleKey: 'newProfile.switch.title',
      descriptionKey: 'newProfile.switch.description',
    },
    {
      kind: 'pac',
      color: '#ffb74d',
      titleKey: 'newProfile.pac.title',
      descriptionKey: 'newProfile.pac.description',
    },
    {
      kind: 'virtual',
      color: '#9575cd',
      titleKey: 'newProfile.virtual.title',
      descriptionKey: 'newProfile.virtual.description',
    },
  ];

  let name = '';
  let kind: NewProfileKind = 'fixed';
  let submitting = false;
  let nameInput: HTMLInputElement | undefined;

  onMount(() => {
    void tick().then(() => {
      if (!disabled) nameInput?.focus();
    });
  });

  $: normalizedName = name.trim();
  $: duplicate = existingNames.some(
    (candidate) =>
      candidate.localeCompare(normalizedName, undefined, { sensitivity: 'base' }) === 0,
  );
  $: reserved = normalizedName.startsWith('__') || /^(?:direct|system)$/iu.test(normalizedName);
  $: hidden = normalizedName.startsWith('_') && !reserved;
  $: errorKey =
    normalizedName.length === 0
      ? ('newProfile.error.empty' as const)
      : reserved
        ? ('newProfile.error.reserved' as const)
        : duplicate
          ? ('newProfile.error.conflict' as const)
          : undefined;
  $: canCreate = !disabled && !submitting && errorKey === undefined && (kind !== 'pac' || pacSupported);

  async function create(): Promise<void> {
    if (!canCreate) return;
    submitting = true;
    try {
      await onCreate(kind, normalizedName);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="modal-backdrop" role="presentation">
  <div
    class="new-profile-dialog"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="new-profile-title"
    data-typed-locale={locale}
  >
    <header>
      <h1 id="new-profile-title">{uiText('newProfile.title', locale)}</h1>
    </header>

    <div class="dialog-body">
      <label class="profile-name-field">
        <span>{uiText('profile.name', locale)}</span>
        <input
          bind:this={nameInput}
          data-new-profile-name-input
          aria-describedby="new-profile-name-message"
          aria-invalid={errorKey !== undefined}
          value={name}
          {disabled}
          on:input={(event) => (name = (event.currentTarget as HTMLInputElement).value)}
          on:keydown={(event) => {
            if (event.key === 'Enter') void create();
            if (event.key === 'Escape') onCancel();
          }}
        />
      </label>
      <div
        id="new-profile-name-message"
        class:error-message={errorKey !== undefined}
        class="field-message"
      >
        {#if errorKey}
          {uiText(errorKey, locale)}
        {:else if hidden}
          {uiText('newProfile.hidden', locale)}
        {/if}
      </div>

      <fieldset class="profile-type-choices" {disabled}>
        <legend>{uiText('newProfile.type', locale)}</legend>
        {#each choices as choice (choice.kind)}
          <label class:disabled-choice={choice.kind === 'pac' && !pacSupported}>
            <input
              type="radio"
              name="profile-type"
              value={choice.kind}
              data-new-profile-kind={choice.kind}
              checked={kind === choice.kind}
              disabled={disabled || (choice.kind === 'pac' && !pacSupported)}
              on:change={() => (kind = choice.kind)}
            />
            <ProfileIcon kind={choice.kind} color={choice.color} size={31} />
            <span>
              <strong>{uiText(choice.titleKey, locale)}</strong>
              <small>{uiText(choice.descriptionKey, locale)}</small>
              {#if choice.kind === 'pac' && !pacSupported}
                <small class="error-message">{uiText('newProfile.pac.unsupported', locale)}</small>
              {/if}
            </span>
          </label>
        {/each}
      </fieldset>
    </div>

    <footer>
      <button type="button" disabled={submitting} on:click={onCancel}
        >{uiText('common.cancel', locale)}</button
      >
      <button
        type="button"
        class="primary"
        data-new-profile-create
        disabled={!canCreate}
        on:click={create}
      >
        {submitting ? uiText('common.creating', locale) : uiText('common.create', locale)}
      </button>
    </footer>
  </div>
</div>
''')

Path('apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte').write_text(r'''<script lang="ts">
  import type { ProfileReferenceBlocker } from '@zeroomega-nex/profile-workflow';
  import { onMount, tick } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { profileKindText, uiMessage, uiText } from '../../lib/ui-messages';

  export let profileName: string;
  export let blockers: readonly ProfileReferenceBlocker[] = [];
  export let disabled = false;
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onConfirm: () => Promise<void>;

  let initialButton: HTMLButtonElement | undefined;

  onMount(() => {
    void tick().then(() => initialButton?.focus());
  });
</script>

<div class="deletion-backdrop" data-profile-deletion-backdrop>
  {#if blockers.length > 0}
    <div
      class="deletion-dialog"
      role="alertdialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="profile-deletion-blocked-title"
      aria-describedby="profile-deletion-blocked-description profile-deletion-blocked-instruction"
      data-profile-deletion-dialog
      data-profile-deletion-mode="blocked"
      data-typed-locale={locale}
    >
      <h2 id="profile-deletion-blocked-title">{uiText('profile.delete.blockedTitle', locale)}</h2>
      <p id="profile-deletion-blocked-description">
        {uiMessage('profile.delete.blockedDescription', { profileName }, locale)}
      </p>
      <ul class="reference-list" data-profile-deletion-blockers>
        {#each blockers as blocker (blocker.profileId)}
          <li data-profile-deletion-blocker={blocker.profileId}>
            <strong>{blocker.profileName}</strong>
            <span>{profileKindText(blocker.profileKind, locale)}</span>
          </li>
        {/each}
      </ul>
      <p id="profile-deletion-blocked-instruction">
        {uiText('profile.delete.blockedInstruction', locale)}
      </p>
      <div class="dialog-actions">
        <button
          bind:this={initialButton}
          type="button"
          data-profile-deletion-close
          onclick={onCancel}>{uiText('common.close', locale)}</button
        >
      </div>
    </div>
  {:else}
    <div
      class="deletion-dialog"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="profile-deletion-confirm-title"
      aria-describedby="profile-deletion-confirm-description"
      data-profile-deletion-dialog
      data-profile-deletion-mode="confirm"
      data-typed-locale={locale}
    >
      <h2 id="profile-deletion-confirm-title">{uiText('profile.delete.confirmTitle', locale)}</h2>
      <p id="profile-deletion-confirm-description">
        {uiMessage('profile.delete.confirmDescription', { profileName }, locale)}
      </p>
      <div class="dialog-actions">
        <button
          bind:this={initialButton}
          type="button"
          data-profile-deletion-cancel
          {disabled}
          onclick={onCancel}>{uiText('common.cancel', locale)}</button
        >
        <button
          type="button"
          class="danger"
          data-profile-deletion-confirm
          {disabled}
          onclick={() => void onConfirm()}>{uiText('common.delete', locale)}</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  .deletion-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .deletion-dialog {
    width: min(520px, 100%);
    padding: 22px;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  h2 {
    margin: 0 0 9px;
    font-size: 20px;
    font-weight: 500;
  }

  p {
    margin: 0 0 16px;
    color: var(--muted);
  }

  .reference-list {
    max-height: 260px;
    margin: 0 0 18px;
    padding: 0;
    overflow-y: auto;
    border-top: 1px solid var(--border);
    list-style: none;
  }

  .reference-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 9px 2px;
    border-bottom: 1px solid var(--border);
  }

  .reference-list span {
    color: var(--muted);
    font-size: 12px;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    min-height: 32px;
    padding: 5px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--text);
  }

  button.danger {
    border-color: var(--danger);
    background: var(--danger);
    color: #fff;
  }
</style>
''')

Path('apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte').write_text(r'''<script lang="ts">
  import type { ProfileSpec, UserProfile } from '@zeroomega-nex/profile-spec';
  import { attachedRuleListProfileIds } from '@zeroomega-nex/profile-workflow';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText } from '../../lib/ui-messages';

  export let spec: ProfileSpec;
  export let initialFromProfileId: string;
  export let initialToProfileId: string;
  export let disabled = false;
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onConfirm: (fromProfileId: string, toProfileId: string) => Promise<void>;

  let fromProfileId = initialFromProfileId;
  let toProfileId = initialToProfileId;
  let candidates: readonly UserProfile[] = [];
  let fromProfile: UserProfile | undefined;
  let toProfile: UserProfile | undefined;

  $: {
    const hiddenProfileIds = attachedRuleListProfileIds(spec);
    candidates = spec.profiles.filter((profile) => !hiddenProfileIds.has(profile.id));
  }
  $: fromProfile = candidates.find((profile) => profile.id === fromProfileId);
  $: toProfile = candidates.find((profile) => profile.id === toProfileId);

  function profileColor(profile: UserProfile | undefined): string {
    if (!profile) return '#90a4ae';
    const visited = new Set<string>();
    let current: UserProfile | undefined = profile;
    while (current?.kind === 'virtual' && current.targetRoute.kind === 'profile') {
      if (visited.has(current.id)) return '#90a4ae';
      visited.add(current.id);
      const targetProfileId: string = current.targetRoute.profileId;
      current = spec.profiles.find((candidate) => candidate.id === targetProfileId);
    }
    if (current?.kind === 'virtual') {
      return current.targetRoute.kind === 'direct'
        ? (spec.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee')
        : (spec.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88');
    }
    return current?.color ?? '#90a4ae';
  }
</script>

<div class="replacement-backdrop" data-profile-replacement-backdrop>
  <div
    class="replacement-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="profile-replacement-title"
    aria-describedby="profile-replacement-description"
    data-profile-replacement-dialog
    data-typed-locale={locale}
  >
    <h2 id="profile-replacement-title">{uiText('profile.replace.title', locale)}</h2>
    <p id="profile-replacement-description" class="replacement-question">
      {#if locale === 'en'}
        {uiText('profile.replace.questionPrefix', locale)}
        <select
          aria-label={uiText('profile.replace.fromAria', locale)}
          data-profile-replacement-from
          bind:value={fromProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>
        {uiText('profile.replace.questionMiddle', locale)}
        <select
          aria-label={uiText('profile.replace.toAria', locale)}
          data-profile-replacement-to
          bind:value={toProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>{uiText('profile.replace.questionSuffix', locale)}
      {:else}
        {uiText('profile.replace.questionPrefix', locale)}
        <select
          aria-label={uiText('profile.replace.toAria', locale)}
          data-profile-replacement-to
          bind:value={toProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>
        {uiText('profile.replace.questionMiddle', locale)}
        <select
          aria-label={uiText('profile.replace.fromAria', locale)}
          data-profile-replacement-from
          bind:value={fromProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>{uiText('profile.replace.questionSuffix', locale)}
      {/if}
    </p>

    <div class="replacement-preview" data-profile-replacement-preview>
      <span class="profile-inline">
        <ProfileIcon kind={fromProfile?.kind ?? 'fixed'} color={profileColor(fromProfile)} size={24} />
        <strong>{fromProfile?.name ?? uiText('route.missing', locale)}</strong>
      </span>
      <span class="replacement-arrow" aria-hidden="true">→</span>
      <span class="profile-inline">
        <ProfileIcon kind={toProfile?.kind ?? 'fixed'} color={profileColor(toProfile)} size={24} />
        <strong>{toProfile?.name ?? uiText('route.missing', locale)}</strong>
      </span>
    </div>

    <p class="replacement-help">{uiText('profile.replace.help', locale)}</p>

    <div class="dialog-actions">
      <button type="button" data-profile-replacement-cancel {disabled} onclick={onCancel}
        >{uiText('common.cancel', locale)}</button
      >
      <button
        type="button"
        class="warning"
        data-profile-replacement-confirm
        disabled={disabled || !fromProfile || !toProfile}
        onclick={() => void onConfirm(fromProfileId, toProfileId)}>{uiText('common.replace', locale)}</button
      >
    </div>
  </div>
</div>

<style>
  .replacement-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .replacement-dialog {
    width: min(680px, 100%);
    padding: 22px;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  h2 {
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 500;
  }

  .replacement-question,
  .replacement-help {
    margin: 0 0 16px;
  }

  .replacement-question select {
    display: inline-block;
    width: auto;
    min-width: 150px;
    margin: 0 5px;
  }

  .replacement-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--page-bg);
  }

  .profile-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .replacement-arrow {
    color: var(--muted);
    font-size: 20px;
  }

  .replacement-help {
    color: var(--muted);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    min-height: 32px;
    padding: 5px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--text);
  }

  button.warning {
    border-color: #b77800;
    background: #b77800;
    color: #fff;
  }
</style>
''')

# Fixed Profile direct typed localization.
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    "  import { tick } from 'svelte';\n",
    "  import { tick } from 'svelte';\n\n  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n  import { uiMessage, uiText } from '../../lib/ui-messages';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''  export let spec: ProfileSpec;
  export let profileId: string;
''',
    '''  export let spec: ProfileSpec;
  export let profileId: string;
  export let locale: AppLocale = currentAppLocale();
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''  function protocolLabel(protocol: ProxyProtocol): string {
    return protocol === 'http'
      ? 'HTTP'
      : protocol === 'https'
        ? 'HTTPS'
        : protocol === 'socks4'
          ? 'SOCKS4'
          : 'SOCKS5';
  }
''',
    '''  function protocolLabel(protocol: ProxyProtocol): string {
    return protocol === 'http'
      ? 'HTTP'
      : protocol === 'https'
        ? 'HTTPS'
        : protocol === 'socks4'
          ? 'SOCKS4'
          : 'SOCKS5';
  }

  function rowDisplayLabel(row: SchemeRow): string {
    return row.key === 'fallback' ? uiText('fixed.default', locale) : row.label;
  }
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    "      rowErrors = { ...rowErrors, [scheme]: 'Server is required.' };\n",
    "      rowErrors = { ...rowErrors, [scheme]: uiText('fixed.error.serverRequired', locale) };\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    "      rowErrors = { ...rowErrors, [scheme]: 'Port must be an integer from 1 to 65535.' };\n",
    "      rowErrors = { ...rowErrors, [scheme]: uiText('fixed.error.portRange', locale) };\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    "      authError = `Your browser does not support ${protocolLabel(authProtocol)} proxy authentication.`;\n",
    "      authError = uiMessage('fixed.authUnsupported', { protocol: protocolLabel(authProtocol) }, locale);\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    "      authError = 'Proxy server no longer exists.';\n",
    "      authError = uiText('fixed.error.serverMissing', locale);\n",
)
replacements = {
    '<h2>Proxy servers</h2>': "<h2>{uiText('fixed.proxyServers', locale)}</h2>",
    '<th>Scheme</th>': "<th>{uiText('fixed.scheme', locale)}</th>",
    '<th>Protocol</th>': "<th>{uiText('fixed.protocol', locale)}</th>",
    '<th>Server</th>': "<th>{uiText('fixed.server', locale)}</th>",
    '<th>Port</th>': "<th>{uiText('fixed.port', locale)}</th>",
    '<th><span class="sr-only">Authentication</span></th>': "<th><span class=\"sr-only\">{uiText('fixed.authentication', locale)}</span></th>",
    '<td>{row.label}</td>': '<td>{rowDisplayLabel(row)}</td>',
    'aria-label={`${row.label} proxy protocol`}': "aria-label={uiMessage('fixed.fieldAria', { scheme: rowDisplayLabel(row), field: 'protocol' }, locale)}",
    'aria-label={`${row.label} proxy server`}': "aria-label={uiMessage('fixed.fieldAria', { scheme: rowDisplayLabel(row), field: 'server' }, locale)}",
    'aria-label={`${row.label} proxy port`}': "aria-label={uiMessage('fixed.fieldAria', { scheme: rowDisplayLabel(row), field: 'port' }, locale)}",
    '<option value="">{row.advanced ? \'(use default)\' : \'DIRECT\'}</option>': "<option value=\"\">{row.advanced ? uiText('fixed.useDefault', locale) : uiText('route.direct', locale)}</option>",
    'aria-label="Authentication"': "aria-label={uiText('fixed.authentication', locale)}",
    'title="Authentication"': "title={uiText('fixed.authentication', locale)}",
    'on:click={() => (showAdvanced = true)}>⌄ Show Advanced</button': "on:click={() => (showAdvanced = true)}>⌄ {uiText('fixed.showAdvanced', locale)}</button",
    '<h2>Bypass List</h2>': "<h2>{uiText('fixed.bypassList', locale)}</h2>",
    'Servers for which you do not want to use any proxy: (One server on each line.)': "{uiText('fixed.bypassHelp', locale)}",
    'rel="noreferrer">(Wildcards and more available…)</a': "rel=\"noreferrer\">{uiText('fixed.bypassMore', locale)}</a",
    'aria-label="Bypass List"': "aria-label={uiText('fixed.bypassList', locale)}",
    '<h2 id="auth-title">Proxy Authentication</h2>': "<h2 id=\"auth-title\">{uiText('fixed.authTitle', locale)}</h2>",
    'aria-label="Close"': "aria-label={uiText('common.close', locale)}",
    'Your browser does not support {protocolLabel(authProtocol)} proxy authentication.': "{uiMessage('fixed.authUnsupported', { protocol: protocolLabel(authProtocol) }, locale)}",
    '<span class="sr-only">Username</span>': "<span class=\"sr-only\">{uiText('fixed.username', locale)}</span>",
    'aria-label="Username"': "aria-label={uiText('fixed.username', locale)}",
    'placeholder="Username"': "placeholder={uiText('fixed.username', locale)}",
    '<span class="sr-only">Password</span>': "<span class=\"sr-only\">{uiText('fixed.password', locale)}</span>",
    'aria-label="Password"': "aria-label={uiText('fixed.password', locale)}",
    "placeholder={authUsername ? 'Password' : 'No Authentication'}": "placeholder={authUsername ? uiText('fixed.password', locale) : uiText('fixed.noAuthentication', locale)}",
    "title={showPassword ? 'Hide password' : 'Show password'}": "title={showPassword ? uiText('fixed.hidePassword', locale) : uiText('fixed.showPassword', locale)}",
    "aria-label={showPassword ? 'Hide password' : 'Show password'}": "aria-label={showPassword ? uiText('fixed.hidePassword', locale) : uiText('fixed.showPassword', locale)}",
    '{#if authLoading}<p>Loading…</p>{/if}': "{#if authLoading}<p>{uiText('common.loading', locale)}</p>{/if}",
    '<button type="button" disabled={authSaving} on:click={closeAuthentication}>Cancel</button>': "<button type=\"button\" disabled={authSaving} on:click={closeAuthentication}>{uiText('common.cancel', locale)}</button>",
    "on:click={saveAuthentication}>{authSaving ? 'Saving…' : 'Save changes'}</button": "on:click={saveAuthentication}>{authSaving ? uiText('common.saving', locale) : uiText('common.saveChanges', locale)}</button",
}
for old, new in replacements.items():
    replace_once('apps/extension/src/entrypoints/options/FixedProfileEditor.svelte', old, new)

# Options App locale propagation and typed route/profile labels.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import { translate } from '../../lib/i18n';\n",
    "  import { currentAppLocale, translate } from '../../lib/i18n';\n  import { profileKindText, uiText } from '../../lib/ui-messages';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  let ruleListExportWarning = '';\n",
    "  let ruleListExportWarning = '';\n  const locale = currentAppLocale();\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  function profileType(profile: UserProfile): string {
    switch (profile.kind) {
      case 'fixed':
        return 'Fixed Profile';
      case 'switch':
        return 'Switch Profile';
      case 'rule-list':
        return 'Rule List Profile';
      case 'pac':
        return 'PAC Profile';
      case 'auto-detect':
        return 'Auto Detect Profile';
      case 'virtual':
        return 'Virtual Profile';
    }
  }
''',
    '''  function profileType(profile: UserProfile): string {
    return profileKindText(profile.kind, locale);
  }
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  function routeLabel(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return 'Direct';
    if (route.kind === 'system') return 'System Proxy';
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? 'Missing profile'
    );
  }
''',
    '''  function routeLabel(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return uiText('route.direct', locale);
    if (route.kind === 'system') return uiText('route.system', locale);
    return spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? uiText('route.missing', locale);
  }
''',
)
replace_count(
    'apps/extension/src/entrypoints/options/App.svelte',
    '<option value="direct">Direct</option>',
    '<option value="direct">{uiText(\'route.direct\', locale)}</option>',
    2,
)
replace_count(
    'apps/extension/src/entrypoints/options/App.svelte',
    '<option value="system">System Proxy</option>',
    '<option value="system">{uiText(\'route.system\', locale)}</option>',
    2,
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''        <NewProfileDialog
          existingNames={profiles.map((profile) => profile.name)}
''',
    '''        <NewProfileDialog
          {locale}
          existingNames={profiles.map((profile) => profile.name)}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''        <FixedProfileEditor
          spec={state.draft}
''',
    '''        <FixedProfileEditor
          {locale}
          spec={state.draft}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  <ProfileDeletionDialog
    profileName={pendingProfileDeletion.profileName}
''',
    '''  <ProfileDeletionDialog
    {locale}
    profileName={pendingProfileDeletion.profileName}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  <ProfileReplacementDialog
    spec={state.draft}
''',
    '''  <ProfileReplacementDialog
    {locale}
    spec={state.draft}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          <button
            type="button"
            disabled={view?.busy || saving || profileExporting}
            onclick={duplicateSelectedProfile}>Duplicate</button
          ><button
''',
    '''          <button
            type="button"
            disabled={view?.busy || saving || profileExporting}
            onclick={duplicateSelectedProfile}>{uiText('common.duplicate', locale)}</button
          ><button
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''            disabled={view?.busy || saving}
            onclick={deleteSelectedProfile}>Delete</button
''',
    '''            disabled={view?.busy || saving}
            onclick={deleteSelectedProfile}>{uiText('common.delete', locale)}</button
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          <span>Profile name</span>
          <input
            aria-label="Profile name"
''',
    '''          <span>{uiText('profile.name', locale)}</span>
          <input
            aria-label={uiText('profile.name', locale)}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          <span>Profile color</span>
          <input
            aria-label="Profile color"
''',
    '''          <span>{uiText('profile.color', locale)}</span>
          <input
            aria-label={uiText('profile.color', locale)}
''',
)

Path('apps/extension/src/lib/ui-messages.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import { profileKindText, typedUiTextCatalog, uiMessage, uiText } from './ui-messages';

describe('typed UI messages', () => {
  it('contains complete English, Simplified Chinese, and Traditional Chinese values', () => {
    for (const localized of Object.values(typedUiTextCatalog)) {
      expect(localized.en.length).toBeGreaterThan(0);
      expect(localized['zh-CN'].length).toBeGreaterThan(0);
      expect(localized['zh-TW'].length).toBeGreaterThan(0);
    }
  });

  it('uses source-backed New Profile and Fixed terminology', () => {
    expect(uiText('newProfile.title', 'zh-CN')).toBe('新建情景模式');
    expect(uiText('newProfile.title', 'zh-TW')).toBe('建立情境模式');
    expect(uiText('newProfile.fixed.title', 'zh-CN')).toBe('代理服务器');
    expect(uiText('fixed.authTitle', 'zh-TW')).toBe('代理認證');
    expect(profileKindText('virtual', 'zh-TW')).toBe('虛擬情境模式');
  });

  it('formats dynamic deletion and accessibility messages without English fallback', () => {
    expect(
      uiMessage('profile.delete.confirmDescription', { profileName: '工作' }, 'zh-CN'),
    ).toBe('删除情景模式“工作”？此操作只会修改尚未应用的设置。');
    expect(
      uiMessage(
        'fixed.fieldAria',
        { scheme: '(預設)', field: 'port' },
        'zh-TW',
      ),
    ).toBe('(預設) 連接埠');
    expect(uiMessage('fixed.authUnsupported', { protocol: 'SOCKS5' }, 'zh-TW')).toBe(
      '您的瀏覽器不支援 SOCKS5 代理認證。',
    );
  });
});
''')

# Component rendering locale coverage.
component_path = 'apps/extension/src/component-rendering.component.spec.ts'
replace_once(
    component_path,
    '''  it('renders a Virtual Profile target and migration workflow', () => {
''',
    '''  it('renders the first typed locale batch in both Chinese locales', () => {
    const ids = idFactory();
    const fixed = createFixedProfileDraft(baseSpec(), ids, '固定代理');
    const newProfile = render(NewProfileDialog, {
      props: {
        locale: 'zh-CN',
        existingNames: [],
        disabled: false,
        pacSupported: false,
        onCancel: () => undefined,
        onCreate: async () => undefined,
      },
    }).body;
    expect(newProfile).toContain('新建情景模式');
    expect(newProfile).toContain('请选择情景模式的类型：');
    expect(newProfile).toContain('代理服务器');
    expect(newProfile).toContain('由于技术限制');
    expect(newProfile).not.toContain('New Profile');

    const fixedEditor = render(FixedProfileEditor, {
      props: {
        locale: 'zh-TW',
        spec: fixed.draft,
        profileId: fixed.profileId,
        generation: 0,
        disabled: false,
        idFactory: ids,
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
      },
    }).body;
    expect(fixedEditor).toContain('代理伺服器');
    expect(fixedEditor).toContain('網址協定');
    expect(fixedEditor).toContain('不代理的位址清單');
    expect(fixedEditor).not.toContain('Proxy servers');

    const deletion = render(ProfileDeletionDialog, {
      props: {
        locale: 'zh-CN',
        profileName: '目标',
        blockers: [
          { profileId: 'ref', profileName: '引用者', profileKind: 'switch' },
        ],
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    }).body;
    expect(deletion).toContain('情景模式无法删除');
    expect(deletion).toContain('自动切换情景模式');
    expect(deletion).not.toContain('Cannot delete profile');

    const virtual = createVirtualProfileDraft(fixed.draft, ids, '別名');
    const replacement = render(ProfileReplacementDialog, {
      props: {
        locale: 'zh-TW',
        spec: virtual.draft,
        initialFromProfileId: fixed.profileId,
        initialToProfileId: virtual.profileId,
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    }).body;
    expect(replacement).toContain('取代情境模式');
    expect(replacement).toContain('您確定要使用');
    expect(replacement).toContain('兩個情境模式本身不會被修改或刪除');
    expect(replacement).not.toContain('Replace Profile');
  });

  it('renders a Virtual Profile target and migration workflow', () => {
''',
)

# Chromium assertions prove direct zh-CN rendering in real dialogs.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await blockedDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
''',
    '''  await blockedDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await blockedDeletion.getByRole('heading', { name: '情景模式无法删除', exact: true }).waitFor();
  assert.equal(await blockedDeletion.getAttribute('data-typed-locale'), 'zh-CN');
  assert.match(await blockedDeletion.innerText(), /自动切换情景模式/u);
  await assertEventually(
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
''',
    '''  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await newVirtualDialog.getByRole('heading', { name: '新建情景模式', exact: true }).waitFor();
  assert.equal(await newVirtualDialog.getAttribute('data-typed-locale'), 'zh-CN');
  assert.match(await newVirtualDialog.innerText(), /请选择情景模式的类型/u);
  assert.doesNotMatch(await newVirtualDialog.innerText(), /New Profile|Profile type/u);
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  const replacementDialog = virtualOptions.locator('[data-profile-replacement-dialog]');
  await replacementDialog.waitFor({ state: 'visible', timeout: 20_000 });
''',
    '''  const replacementDialog = virtualOptions.locator('[data-profile-replacement-dialog]');
  await replacementDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await replacementDialog.getByRole('heading', { name: '替换情景模式', exact: true }).waitFor();
  assert.equal(await replacementDialog.getAttribute('data-typed-locale'), 'zh-CN');
  await replacementDialog.getByLabel('要被替换的情景模式', { exact: true }).waitFor();
  await replacementDialog.getByLabel('用于替换的情景模式', { exact: true }).waitFor();
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await confirmDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
''',
    '''  await confirmDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await confirmDeletion.getByRole('heading', { name: '删除情景模式', exact: true }).waitFor();
  assert.equal(await confirmDeletion.getAttribute('data-typed-locale'), 'zh-CN');
  await assertEventually(
''',
)

Path('scripts/generate-locale-inventory.mjs').write_text(r'''import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const sourceRoot = 'apps/extension/src';
const outputPath = 'docs/LOCALE_INVENTORY.json';
const typedBatchFiles = [
  'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
  'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
  'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const candidate = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(candidate)));
    else if (entry.isFile() && candidate.endsWith('.svelte')) files.push(candidate);
  }
  return files;
}

function normalize(value) {
  return value.replace(/\s+/gu, ' ').trim();
}

function visibleCandidate(value) {
  const text = normalize(value);
  if (!/[A-Za-z]/u.test(text)) return undefined;
  if (/^(?:https?:|chrome:|moz-extension:|#|\.|\/)/u.test(text)) return undefined;
  if (/^[a-z][a-z0-9_-]*$/u.test(text)) return undefined;
  if (/^(?:true|false|undefined|null)$/u.test(text)) return undefined;
  return text;
}

function extract(pathname, source) {
  let template = source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, '')
    .replace(/<!--([\s\S]*?)-->/gu, '');
  template = template.replace(/\b(?:uiText|uiMessage|profileKindText)\([^)]*\)/gu, '');
  const candidates = [];
  const seen = new Set();
  const add = (kind, raw) => {
    const text = visibleCandidate(raw);
    if (!text) return;
    const identity = `${kind}\u0000${text}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    candidates.push({ path: pathname, kind, text });
  };
  for (const match of template.matchAll(/>([^<>{]*[A-Za-z][^<>{]*)</gu)) add('text', match[1]);
  for (const match of template.matchAll(/\b(aria-label|title|placeholder)="([^"{}]*[A-Za-z][^"{}]*)"/gu)) {
    add(match[1], match[2]);
  }
  for (const expression of template.matchAll(/\{([^{}]*)\}/gu)) {
    for (const literal of expression[1].matchAll(/(['"])([^'"]*[A-Za-z][^'"]*)\1/gu)) {
      add('expression-literal', literal[2]);
    }
  }
  return candidates;
}

const files = await collect(sourceRoot);
const candidates = [];
for (const filename of files) candidates.push(...extract(filename, await readFile(filename, 'utf8')));
candidates.sort((left, right) =>
  left.path.localeCompare(right.path) || left.kind.localeCompare(right.kind) || left.text.localeCompare(right.text),
);
const inventory = {
  schemaVersion: 1,
  description:
    'Machine-generated candidate inventory of remaining literal English text in Svelte templates. Typed uiText/uiMessage calls are excluded; candidates require human classification before migration.',
  typedBatchFiles,
  candidateCount: candidates.length,
  candidates,
};
const serialized = `${JSON.stringify(inventory, null, 2)}\n`;
if (process.argv.includes('--write')) {
  await writeFile(outputPath, serialized);
} else if (process.argv.includes('--check')) {
  const existing = await readFile(outputPath, 'utf8').catch(() => '');
  if (existing !== serialized) {
    console.error(`${outputPath} is stale. Run pnpm locale:inventory.`);
    process.exitCode = 1;
  }
} else {
  process.stdout.write(serialized);
}
''')

Path('scripts/validate-localization.mjs').write_text(r'''import { readFile } from 'node:fs/promises';

const files = {
  catalog: 'apps/extension/src/lib/ui-messages.ts',
  fixed: 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
  newProfile: 'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
  deletion: 'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
  replacement: 'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
  app: 'apps/extension/src/entrypoints/options/App.svelte',
  package: 'package.json',
};
const entries = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, filename]) => [key, await readFile(filename, 'utf8')])),
);
const failures = [];
const requireText = (source, marker, message) => {
  if (!source.includes(marker)) failures.push(message);
};
const forbidText = (source, marker, message) => {
  if (source.includes(marker)) failures.push(message);
};

requireText(entries.catalog, 'export const typedUiTextCatalog', 'Typed locale catalog is missing.');
requireText(entries.catalog, "readonly 'fixed.fieldAria'", 'Typed dynamic Fixed ARIA message is missing.');
requireText(entries.catalog, "'zh-TW': '建立情境模式'", 'Traditional Chinese New Profile source-backed label is missing.');
for (const [name, source] of [
  ['New Profile', entries.newProfile],
  ['Profile deletion', entries.deletion],
  ['Profile replacement', entries.replacement],
  ['Fixed Profile', entries.fixed],
]) {
  requireText(source, "from '../../lib/ui-messages'", `${name} must render through the typed locale catalog.`);
  requireText(source, 'data-typed-locale={locale}', `${name} must expose its resolved typed locale for browser verification.`);
}
for (const [source, marker, message] of [
  [entries.newProfile, '<h1 id="new-profile-title">New Profile</h1>', 'New Profile title regressed to literal English.'],
  [entries.newProfile, '>Profile type</legend>', 'New Profile type label regressed to literal English.'],
  [entries.deletion, '>Cannot delete profile</h2>', 'Deletion blocker title regressed to literal English.'],
  [entries.deletion, '>Delete profile</h2>', 'Deletion confirmation title regressed to literal English.'],
  [entries.replacement, '>Replace Profile</h2>', 'Replacement title regressed to literal English.'],
  [entries.fixed, '<h2>Proxy servers</h2>', 'Fixed Profile heading regressed to literal English.'],
  [entries.fixed, 'aria-label="Authentication"', 'Fixed authentication ARIA regressed to literal English.'],
  [entries.fixed, "authError = 'Proxy server no longer exists.'", 'Fixed error regressed to literal English.'],
]) forbidText(source, marker, message);
requireText(entries.app, 'const locale = currentAppLocale();', 'Options must resolve one locale for typed child components.');
requireText(entries.app, '<FixedProfileEditor\n          {locale}', 'Options must pass locale to Fixed Profile.');
requireText(entries.app, '<ProfileDeletionDialog\n    {locale}', 'Options must pass locale to deletion dialog.');
requireText(entries.app, "return uiText('route.direct', locale);", 'Shared Direct route label must be typed.');
requireText(entries.package, '"validate:locale"', 'Repository verify scripts must include the locale guard.');

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Typed localization batch and untranslated-string guard passed.');
}
''')

# Wire inventory and validation into repository verification.
replace_once(
    'package.json',
    '    "validate:parity-docs": "node scripts/validate-parity-docs.mjs",\n',
    '    "validate:parity-docs": "node scripts/validate-parity-docs.mjs",\n    "locale:inventory": "node scripts/generate-locale-inventory.mjs --write",\n    "validate:locale": "node scripts/generate-locale-inventory.mjs --check && node scripts/validate-localization.mjs",\n',
)
replace_once(
    'package.json',
    '    "verify": "pnpm guard:architecture && pnpm validate:ui && pnpm validate:parity-docs && pnpm lint',
    '    "verify": "pnpm guard:architecture && pnpm validate:ui && pnpm validate:parity-docs && pnpm validate:locale && pnpm lint',
)

# Durable project knowledge.
kg = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg.write_text(
    kg.read_text().rstrip()
    + r'''

- 原版 locale 证据来自固定 v3.5.0 Artifact 的 `locale-zh_CN/omega-web.po`、`locale-zh_TW/omega-web.po` 及 New/Delete/Cannot Delete/Replace/Fixed Auth Jade。第一批不再依赖 DOM MutationObserver 猜测英文原文，而使用 `ui-messages.ts` 的 semantic typed keys 与参数化消息。
- `NewProfileDialog`、`ProfileDeletionDialog`、`ProfileReplacementDialog`、`FixedProfileEditor` 直接接收 `AppLocale` 并同步渲染正文、按钮、错误、placeholder、title 与 ARIA；Options 只解析一次 locale 并传入。旧 observer 暂留给尚未迁移页面，形成可逐批收缩的兼容层。
- `LOCALE_INVENTORY.json` 由源码扫描器稳定生成，记录剩余 Svelte 模板中的字面英文候选；typed `uiText/uiMessage/profileKindText` 调用被排除。`validate:locale` 同时检查 inventory 新鲜度和第一批英文回流，纳入全仓 `verify`。
'''
    + '\n'
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
audit = audit_path.read_text()
audit = audit.replace(
    '| H-02 | 简体中文               | `zh_CN`                  | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | 主导航可用，编辑器大量英文                     | 建立键级清单              |',
    '| H-02 | 简体中文               | `zh_CN`                  | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | typed 第一批已覆盖 New Profile、生命周期对话框、Fixed、路由/Profile 类型；机器 inventory 跟踪其余页面 | 继续 Switch/PAC/Rule List |',
)
audit = audit.replace(
    '| H-03 | 正體中文               | `zh_TW/zh_Hant`          | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | 同上                                           | 键级清单                  |',
    '| H-03 | 正體中文               | `zh_TW/zh_Hant`          | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | typed 第一批使用原版 `情境模式/代理認證/連接埠` 术语；组件覆盖，机器 inventory 跟踪其余页面 | 继续 Switch/PAC/Rule List |',
)
audit = audit.replace(
    '| H-04 | 动态文本               | locale/controller        | 状态变化后仍翻译                  | MUST_MATCH | PARTIAL    | PARTIAL  | observer 已修，但词典不全                      | 组件级验证                |',
    '| H-04 | 动态文本               | locale/controller        | 状态变化后仍翻译                  | MUST_MATCH | PARTIAL    | PARTIAL  | 删除说明、Fixed 错误/ARIA 已改为 typed 参数消息；observer 仅作为未迁移页面兼容层 | 继续迁移动态状态          |',
)
audit = audit.replace(
    '| H-06 | placeholder/title/aria | locale/template          | 一同翻译                          | MUST_MATCH | PARTIAL    | PARTIAL  | 部分已覆盖                                     | 自动 DOM 巡查             |',
    '| H-06 | placeholder/title/aria | locale/template          | 一同翻译                          | MUST_MATCH | PARTIAL    | PARTIAL  | 第一批 Fixed/New/Profile 生命周期的 placeholder/title/ARIA 直接 typed；Chromium zh-CN 断言覆盖 | 扩展自动 DOM 巡查         |',
)
audit = audit.replace(
    '| H-07 | 错误和确认框           | locale                   | 全部本地化                        | MUST_MATCH | BROKEN     | MISSING  | 端口错误、删除确认等英文                       | 统一错误码翻译            |',
    '| H-07 | 错误和确认框           | locale                   | 全部本地化                        | MUST_MATCH | PARTIAL    | PARTIAL  | New Profile 校验、Fixed 错误、删除/替换确认已 typed 覆盖三语；其余编辑器仍待迁移 | 继续统一错误码翻译        |',
)
audit = audit.replace(
    '| H-08 | 内置名显示翻译         | locale/filter            | 内部 direct/system 与显示名分离   | MUST_MATCH | PARTIAL    | PARTIAL  | Popup 好于 Options select                      | 统一 route label          |',
    '| H-08 | 内置名显示翻译         | locale/filter            | 内部 direct/system 与显示名分离   | MUST_MATCH | DONE       | COMPLETE | Options/Popup 的 Direct/System 显示与内部 route 值分离；共享 routeLabel 使用 typed catalog | 保持 route 守卫           |',
)
audit_path.write_text(audit)

status = Path('docs/MILESTONE_8_STATUS.md')
status.write_text(
    status.read_text().rstrip()
    + r'''

### Typed locale inventory and first vertical batch

- Fixed v3.5.0 `zh_CN` / `zh_TW` PO files and original New/Delete/Cannot Delete/Replace/Fixed Auth templates are the wording evidence. A semantic `ui-messages.ts` catalog now gives compile-time keys and typed parameter objects instead of relying on English text matching after render.
- New Profile, shared deletion/replacement dialogs, Fixed Profile, shared Profile-kind labels, and Direct/System/Missing route labels render English, Simplified Chinese, and Traditional Chinese directly. The global observer remains only as a compatibility layer for pending components.
- Unit tests validate every catalog entry has all three locales and dynamic messages never fall back to English. Component tests cover zh-CN and zh-TW; Chromium verifies zh-CN headings, ARIA selectors, blocker kind labels, and locale identity through real workflows.
- `scripts/generate-locale-inventory.mjs` produces `docs/LOCALE_INVENTORY.json`; `validate:locale` blocks a stale inventory or literal-English regression in the completed batch and is part of `pnpm verify`.
'''
    + '\n'
)
