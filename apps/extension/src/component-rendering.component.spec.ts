import {
  addSwitchRuleDraft,
  createAttachedRuleListDraft,
  createDefaultProfileSpec,
  createFixedProfileDraft,
  createPacProfileDraft,
  createRuleListProfileDraft,
  createSwitchProfileDraft,
  createVirtualProfileDraft,
  type ProfileWorkflowIdFactory,
} from '@zeroomega-nex/profile-workflow';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import AdvancedProfileEditor from './entrypoints/options/AdvancedProfileEditor.svelte';
import FixedProfileEditor from './entrypoints/options/FixedProfileEditor.svelte';
import NewProfileDialog from './entrypoints/options/NewProfileDialog.svelte';
import PacProfileEditor from './entrypoints/options/PacProfileEditor.svelte';
import ProfileDeletionDialog from './entrypoints/options/ProfileDeletionDialog.svelte';
import ProfileReplacementDialog from './entrypoints/options/ProfileReplacementDialog.svelte';
import RuleListProfileEditor from './entrypoints/options/RuleListProfileEditor.svelte';
import VirtualProfileEditor from './entrypoints/options/VirtualProfileEditor.svelte';
import LegacyImportPanel from './entrypoints/options/LegacyImportPanel.svelte';
import SnapshotHistoryPanel from './entrypoints/options/SnapshotHistoryPanel.svelte';
import SwitchProfileEditor from './entrypoints/options/SwitchProfileEditor.svelte';
import ThemePanel from './entrypoints/options/ThemePanel.svelte';
import ProfileIcon from './components/ProfileIcon.svelte';
import PopupApp from './entrypoints/popup/App.svelte';
import NetworkApp from './entrypoints/network/App.svelte';
import TemporaryRulesApp from './entrypoints/temp-rules/App.svelte';

function baseSpec() {
  return createDefaultProfileSpec({
    documentId: 'document-component-test',
    revisionId: 'revision-component-test',
    createdAt: '2026-07-25T17:15:00.000Z',
    deviceId: 'device-component-test',
  });
}

function idFactory(): ProfileWorkflowIdFactory {
  const counts = new Map<string, number>();
  return (kind) => {
    const next = (counts.get(kind) ?? 0) + 1;
    counts.set(kind, next);
    return `${kind}-component-${next}`;
  };
}

const replaceDraft = async () => true;

describe('Milestone 8 Svelte component rendering contracts', () => {
  it('renders the original two-selector Profile replacement dialog and endpoint preview', () => {
    const source = createVirtualProfileDraft(baseSpec(), idFactory(), 'Alias');
    const from = source.draft.profiles.find((profile) => profile.id === 'profile-default-proxy');
    if (!from) throw new Error('default Fixed profile missing');
    const { body } = render(ProfileReplacementDialog, {
      props: {
        spec: source.draft,
        initialFromProfileId: from.id,
        initialToProfileId: source.profileId,
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    });
    expect(body).toContain('data-profile-replacement-dialog');
    expect(body).toContain('data-profile-replacement-from');
    expect(body).toContain('data-profile-replacement-to');
    expect(body).toContain('data-profile-replacement-preview');
    expect(body).toContain('The two profiles');
    expect(body).toContain('themselves are not changed or deleted.');
  });

  it('renders blocked and confirm profile-deletion dialogs without a destructive blocked action', () => {
    const blocked = render(ProfileDeletionDialog, {
      props: {
        profileName: 'Target',
        blockers: [
          {
            profileId: 'profile-referrer',
            profileName: 'Referrer',
            profileKind: 'switch',
          },
        ],
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    }).body;
    expect(blocked).toContain('<div class="deletion-dialog');
    expect(blocked).toContain('role="alertdialog"');
    expect(blocked).toContain('tabindex="-1"');
    expect(blocked).toContain('data-profile-deletion-mode="blocked"');
    expect(blocked).toContain('Referrer');
    expect(blocked).not.toContain('data-profile-deletion-confirm');

    const confirm = render(ProfileDeletionDialog, {
      props: {
        profileName: 'Disposable',
        blockers: [],
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    }).body;
    expect(confirm).toContain('<div class="deletion-dialog');
    expect(confirm).toContain('role="dialog"');
    expect(confirm).toContain('tabindex="-1"');
    expect(confirm).toContain('data-profile-deletion-mode="confirm"');
    expect(confirm).toContain('data-profile-deletion-confirm');
  });

  it('renders distinct colored profile type icons', () => {
    for (const kind of [
      'direct',
      'system',
      'fixed',
      'switch',
      'rule-list',
      'pac',
      'virtual',
      'auto-detect',
    ] as const) {
      const { body } = render(ProfileIcon, { props: { kind, color: '#123456', size: 24 } });
      expect(body).toContain(`data-profile-kind="${kind}"`);
      expect(body).toContain('--profile-icon-color: #123456');
    }
  });

  it('renders the Popup loading state and familiar settings footer', () => {
    const { body } = render(PopupApp);

    expect(body).toContain('aria-label="ZeroOmega Nex profile switcher"');
    expect(body).toContain('Loading applied profiles');
    expect(body).toContain('popup-footer');
    expect(body).toContain('aria-label="Open ZeroOmega Nex options"');
    expect(body).toContain('<span>Options</span>');
  });

  it('renders the original Fixed Profile proxy table and collapsed advanced rows', () => {
    const mutation = createFixedProfileDraft(baseSpec(), idFactory(), 'Blank proxy');
    const { body } = render(FixedProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        generation: 0,
        disabled: false,
        idFactory: idFactory(),
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
      },
    });

    expect(body).toContain('Proxy servers');
    expect(body).toContain('Scheme');
    expect(body).toContain('(default)');
    expect(body).toContain('DIRECT');
    expect(body).toContain('Show Advanced');
    expect(body).toContain('Bypass List');
    expect(body).toContain('127.0.0.1');
    expect(body).toContain('[::1]');
    expect(body).not.toContain('value="127.0.0.1"');
    expect(body).not.toContain('value="7890"');
  });

  it('renders the original compact Switch Profile rule table and grouped conditions', () => {
    const ids = idFactory();
    const created = createSwitchProfileDraft(baseSpec(), ids);
    const mutation = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    const { body } = render(SwitchProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: created.profileId,
        disabled: true,
        idFactory: ids,
        onReplaceDraft: replaceDraft,
        onRegisterBeforeAction: () => undefined,
        onSourceDirtyChange: () => undefined,
      },
    });

    expect(body).toContain('data-switch-source-mode="table"');
    expect(body).toContain('data-switch-rules-table');
    expect(body).toContain('data-switch-rule-row');
    expect(body).toContain('data-switch-drag-handle');
    expect(body).toContain('Condition type');
    expect(body).toContain('Condition details');
    expect(body).toContain('Result profile');
    expect(body).toContain('Add condition');
    expect(body).toContain('Default profile');
    expect(body).toContain('data-switch-source-toggle');
    expect(body).toContain('Edit Source');
    expect(body).toContain('<optgroup label="Basic conditions">');
    expect(body).not.toContain('Ordered Switch Profile rules');
  });

  it('renders the attached Rule List row, configuration, headers, and detach action', () => {
    const ids = idFactory();
    const created = createSwitchProfileDraft(baseSpec(), ids, 'Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const attachedSource = attached.ruleSources.at(-1);
    if (!attachedSource) throw new Error('attached Rule List source was not created');
    attachedSource.headers = [
      { name: 'X-Component', value: { kind: 'literal', value: 'component-value' } },
    ];
    attachedSource.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/component.txt',
      content: 'cached component rules',
    };
    const { body } = render(SwitchProfileEditor, {
      props: {
        spec: attached,
        profileId: created.profileId,
        disabled: false,
        idFactory: ids,
        onReplaceDraft: replaceDraft,
        onRegisterBeforeAction: () => undefined,
        onSourceDirtyChange: () => undefined,
      },
    });

    expect(body).toContain('data-attached-rule-list-row');
    expect(body).toContain('Use attached Rule List');
    expect(body).toContain('Attached Rule List matching route');
    expect(body).toContain('data-attached-rule-list-config');
    expect(body).toContain('Attached Rule List source type');
    expect(body).toContain('Attached Rule List downloaded text');
    expect(body).toContain('data-attached-rule-list-headers');
    expect(body).toContain('Attached header 1 name');
    expect(body).toContain('X-Component');
    expect(body).toContain('component-value');
    expect(body).toContain('data-rule-source-update-now');
    expect(body).toContain('data-rule-source-update-status');
    expect(body).toContain('Never downloaded.');
    expect(body).toContain('cached component rules');
    expect(body).toContain('Delete attached Rule List');
  });

  it('renders the original independent Rule List sections and update controls', () => {
    const mutation = createRuleListProfileDraft(baseSpec(), idFactory());
    const source = mutation.draft.ruleSources.at(-1);
    if (!source) throw new Error('Rule List source was not created');
    source.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/component.txt',
      content: 'cached independent rules',
    };
    const { body } = render(RuleListProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });

    expect(body).toContain('data-rule-list-profile-editor');
    expect(body).toContain('Rule List Config');
    expect(body).toContain('Rule List URL');
    expect(body).toContain('Rule List Text');
    expect(body).toContain('aria-label="Rule List match profile"');
    expect(body).toContain('aria-label="Rule List default profile"');
    expect(body).toContain('aria-label="Rule List URL"');
    expect(body).toContain('data-independent-rule-source-update-now');
    expect(body).toContain('data-independent-rule-source-update-status');
    expect(body).toContain('readonly');
    expect(body).toContain('cached independent rules');
    expect(body).not.toContain('Source name');
    expect(body).not.toContain('Update interval (minutes)');
  });

  it('renders the second typed locale batch for Switch and Rule List editors', () => {
    const ids = idFactory();
    const created = createSwitchProfileDraft(baseSpec(), ids, '切换');
    const withRule = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    const attached = createAttachedRuleListDraft(withRule.draft, created.profileId, ids);
    const attachedSource = attached.ruleSources.at(-1);
    if (!attachedSource) throw new Error('attached source missing');
    attachedSource.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/typed.txt',
      content: 'typed attached cache',
    };
    attachedSource.headers = [
      { name: 'X-Typed', value: { kind: 'literal', value: 'typed-value' } },
    ];
    const switchBody = render(SwitchProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: attached,
        profileId: created.profileId,
        disabled: false,
        idFactory: ids,
        onReplaceDraft: replaceDraft,
        onRegisterBeforeAction: () => undefined,
        onSourceDirtyChange: () => undefined,
      },
    }).body;
    expect(switchBody).toContain('data-typed-locale="zh-CN"');
    expect(switchBody).toContain('切换规则');
    expect(switchBody).toContain('条件类型');
    expect(switchBody).toContain('条件设置');
    expect(switchBody).toContain('添加条件');
    expect(switchBody).toContain('规则列表规则');
    expect(switchBody).toContain('附属规则列表设置');
    expect(switchBody).toContain('附属请求头 1 名称');
    expect(switchBody).not.toContain('Switch rules');
    expect(switchBody).not.toContain('Attached Rule List configuration');

    const independent = createRuleListProfileDraft(baseSpec(), ids);
    const independentSource = independent.draft.ruleSources.at(-1);
    if (!independentSource) throw new Error('independent source missing');
    independentSource.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/independent.txt',
      content: 'typed independent cache',
    };
    const independentBody = render(RuleListProfileEditor, {
      props: {
        locale: 'zh-TW',
        spec: independent.draft,
        profileId: independent.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    }).body;
    expect(independentBody).toContain('data-typed-locale="zh-TW"');
    expect(independentBody).toContain('規則清單設定');
    expect(independentBody).toContain('規則清單網址');
    expect(independentBody).toContain('規則清單正文');
    expect(independentBody).toContain('規則清單符合時使用的情境模式');
    expect(independentBody).not.toContain('Rule List Config');
  });

  it('renders the original PAC URL, headers, download status, and read-only cache sections', () => {
    const mutation = createPacProfileDraft(baseSpec(), idFactory(), 'PAC component');
    const profile = mutation.draft.profiles.find(
      (candidate) => candidate.id === mutation.profileId,
    );
    if (!profile || profile.kind !== 'pac') throw new Error('PAC profile was not created');
    profile.source = {
      kind: 'url',
      url: 'https://pac.example.invalid/proxy.pac',
      script: "function FindProxyForURL() { return 'DIRECT'; }",
    };
    profile.headers = [
      { name: 'X-Component', value: { kind: 'literal', value: 'component-value' } },
    ];
    profile.credential = {
      username: 'component-user',
      passwordSecretRef: 'secret-pac-component',
    };
    const { body } = render(PacProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
        onRequestAuthenticationPermission: async () => true,
      },
    });

    expect(body).toContain('data-pac-profile-editor');
    expect(body).toContain('data-pac-url-section');
    expect(body).toContain('aria-label="PAC URL"');
    expect(body).toContain('data-pac-request-headers');
    expect(body).toContain('PAC header 1 name');
    expect(body).toContain('data-pac-source-update-now');
    expect(body).toContain('data-pac-source-update-status');
    expect(body).toContain('data-pac-script-section');
    expect(body).toContain('aria-label="PAC Script"');
    expect(body).toContain('readonly');
    expect(body).toContain("function FindProxyForURL() { return 'DIRECT'; }");
    expect(body).toContain('data-pac-authentication');
    expect(body).toContain('data-pac-auth-action="edit"');
    expect(body).toContain('Configured for component-user.');
    expect(body).not.toContain('secret-pac-component');
  });

  it('renders the typed PAC editor in Simplified Chinese without literal English fallback', () => {
    const mutation = createPacProfileDraft(baseSpec(), idFactory(), 'PAC typed');
    const profile = mutation.draft.profiles.find(
      (candidate) => candidate.id === mutation.profileId,
    );
    if (!profile || profile.kind !== 'pac') throw new Error('typed PAC profile was not created');
    profile.source = {
      kind: 'url',
      url: 'https://pac.example.invalid/typed.pac',
      script: "function FindProxyForURL() { return 'DIRECT'; }",
    };
    profile.headers = [{ name: 'X-Typed', value: { kind: 'literal', value: 'typed' } }];
    profile.credential = { username: '测试用户', passwordSecretRef: 'secret-pac-typed' };
    const body = render(PacProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
        onRequestAuthenticationPermission: async () => true,
      },
    }).body;

    expect(body).toContain('data-typed-locale="zh-CN"');
    expect(body).toContain('PAC 网址');
    expect(body).toContain('PAC 脚本');
    expect(body).toContain('PAC 请求头 1 名称');
    expect(body).toContain('已为 测试用户 配置。');
    expect(body).toContain('警告: 用户名密码将会提供给PAC脚本返回的任何服务器');
    expect(body).not.toContain('Clear PAC URL');
    expect(body).not.toContain('Proxy Authentication permission was not granted');
    expect(body).not.toContain('secret-pac-typed');
  });

  it('renders the inactive legacy import review entry point without secret values', () => {
    const { body } = render(LegacyImportPanel, {
      props: {
        disabled: false,
        generation: 0,
        deviceId: 'device-component-test',
        onPrepareExport: async () => baseSpec(),
        onAcceptImport: async () => true,
        onImportAndApply: async () => true,
      },
    });

    expect(body).toContain('Export options');
    expect(body).toContain('data-legacy-export');
    expect(body).toContain('Restore original ZeroOmega / SwitchyOmega backup');
    expect(body).toContain('aria-label="Online backup URL"');
    expect(body).toContain('data-legacy-online-download');
    expect(body).toContain('aria-label="Legacy backup file"');
    expect(body).toContain('Paste backup text instead');
    expect(body).not.toContain('passwordSecretRef');
    expect(body).not.toContain('secretMaterials');
  });

  it('renders typed Legacy Import entry points in both Chinese locales', () => {
    const common = {
      disabled: false,
      generation: 0,
      deviceId: 'device-component-test',
      onPrepareExport: async () => baseSpec(),
      onAcceptImport: async () => true,
      onImportAndApply: async () => true,
    };
    const simplified = render(LegacyImportPanel, {
      props: { ...common, locale: 'zh-CN' },
    }).body;
    expect(simplified).toContain('data-typed-locale="zh-CN"');
    expect(simplified).toContain('导出选项');
    expect(simplified).toContain('恢复原版 ZeroOmega / SwitchyOmega 备份');
    expect(simplified).toContain('aria-label="在线备份网址"');
    expect(simplified).toContain('从在线地址恢复');
    expect(simplified).toContain('aria-label="原版备份文件"');
    expect(simplified).toContain('改为粘贴备份文本');
    expect(simplified).not.toContain('Export options');
    expect(simplified).not.toContain('Legacy backup file');

    const traditional = render(LegacyImportPanel, {
      props: { ...common, locale: 'zh-TW' },
    }).body;
    expect(traditional).toContain('data-typed-locale="zh-TW"');
    expect(traditional).toContain('匯出選項');
    expect(traditional).toContain('還原原版 ZeroOmega / SwitchyOmega 備份');
    expect(traditional).toContain('aria-label="線上備份網址"');
    expect(traditional).toContain('從線上位址還原');
    expect(traditional).toContain('aria-label="原版備份檔案"');
    expect(traditional).toContain('改為貼上備份文字');
    expect(traditional).not.toContain('Export options');
    expect(traditional).not.toContain('Legacy backup file');
  });

  it('renders Automatic, Light, and Dark theme choices', () => {
    const { body } = render(ThemePanel, {
      props: { mode: 'auto', onChange: () => undefined },
    });

    expect(body).toContain('Automatic');
    expect(body).toContain('Light');
    expect(body).toContain('Dark');
    expect(body).toContain('aria-checked="true"');
  });

  it('renders typed Theme and Popup loading shells in both Chinese locales', () => {
    const simplifiedTheme = render(ThemePanel, {
      props: { locale: 'zh-CN', mode: 'dark', onChange: () => undefined },
    }).body;
    expect(simplifiedTheme).toContain('data-typed-locale="zh-CN"');
    expect(simplifiedTheme).toContain('外观');
    expect(simplifiedTheme).toContain('自动');
    expect(simplifiedTheme).toContain('浅色');
    expect(simplifiedTheme).toContain('深色');
    expect(simplifiedTheme).not.toContain('Automatic');

    const traditionalPopup = render(PopupApp, {
      props: { locale: 'zh-TW' },
    }).body;
    expect(traditionalPopup).toContain('data-popup-locale="zh-TW"');
    expect(traditionalPopup).toContain('正在載入已套用的情境模式…');
    expect(traditionalPopup).toContain('aria-label="開啟 ZeroOmega Nex 選項"');
    expect(traditionalPopup).toContain('選項');
    expect(traditionalPopup).not.toContain('Loading applied profiles');
    expect(traditionalPopup).not.toContain('Open ZeroOmega Nex options');
  });

  it('renders history loading and dirty-Draft rollback protection', () => {
    const { body } = render(SnapshotHistoryPanel, {
      props: {
        disabled: false,
        dirty: true,
        generation: 4,
        onRollbackSnapshot: async () => true,
      },
    });

    expect(body).toContain('Configuration history');
    expect(body).toContain('Draft contains unapplied changes');
    expect(body).toContain('Loading verified snapshot and revision history');
    expect(body).not.toContain('Confirm rollback');
  });

  it('renders typed snapshot history text in both Chinese locales', () => {
    const simplified = render(SnapshotHistoryPanel, {
      props: {
        locale: 'zh-CN',
        disabled: false,
        dirty: true,
        generation: 4,
        onRollbackSnapshot: async () => true,
      },
    }).body;
    expect(simplified).toContain('配置历史');
    expect(simplified).toContain('草稿包含尚未应用的更改');
    expect(simplified).toContain('正在加载已验证的快照和修订历史');
    expect(simplified).not.toContain('Configuration history');

    const traditional = render(SnapshotHistoryPanel, {
      props: {
        locale: 'zh-TW',
        disabled: false,
        dirty: true,
        generation: 4,
        onRollbackSnapshot: async () => true,
      },
    }).body;
    expect(traditional).toContain('設定歷史');
    expect(traditional).toContain('草稿包含尚未套用的變更');
    expect(traditional).toContain('正在載入已驗證的快照與修訂歷史');
    expect(traditional).not.toContain('Configuration history');
  });

  it('renders the original four new-profile choices and name validation shell', () => {
    const { body } = render(NewProfileDialog, {
      props: {
        existingNames: ['Existing'],
        disabled: false,
        pacCapability: { supported: true, reason: 'proxy-settings' },
        onCancel: () => undefined,
        onCreate: async () => undefined,
      },
    });

    expect(body).toContain('<div class="new-profile-dialog');
    expect(body).toContain('role="dialog"');
    expect(body).toContain('tabindex="-1"');
    expect(body).toContain('data-new-profile-name-input');
    expect(body).toContain('data-pac-profile-supported="true"');
    expect(body).toContain('data-pac-profile-capability-reason="proxy-settings"');
    expect(body).not.toContain('autofocus');
    expect(body).toContain('Profile name');
    expect(body).toContain('Proxy Profile');
    expect(body).toContain('Switch Profile');
    expect(body).toContain('PAC Profile');
    expect(body).toContain('Virtual Profile');
    expect(body).not.toContain('Rule List Profile');
    expect(body).not.toContain('Auto Detect Profile');
  });

  it('renders the first typed locale batch in both Chinese locales', () => {
    const ids = idFactory();
    const fixed = createFixedProfileDraft(baseSpec(), ids, '固定代理');
    const newProfile = render(NewProfileDialog, {
      props: {
        locale: 'zh-CN',
        existingNames: [],
        disabled: false,
        pacCapability: { supported: false, reason: 'proxy-script-registration' },
        onCancel: () => undefined,
        onCreate: async () => undefined,
      },
    }).body;
    expect(newProfile).toContain('新建情景模式');
    expect(newProfile).toContain('请选择情景模式的类型：');
    expect(newProfile).toContain('代理服务器');
    expect(newProfile).toContain('由于技术限制');
    expect(newProfile).toContain('data-pac-profile-supported="false"');
    expect(newProfile).toContain('data-pac-profile-capability-reason="proxy-script-registration"');
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
        blockers: [{ profileId: 'ref', profileName: '引用者', profileKind: 'switch' }],
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
    const mutation = createVirtualProfileDraft(baseSpec(), idFactory(), 'Virtual');
    const { body } = render(VirtualProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onRequestReplacement: async () => undefined,
      },
    });

    expect(body).toContain('data-virtual-profile-editor');
    expect(body).toContain('data-virtual-target');
    expect(body).toContain('data-virtual-replace');
    expect(body).toContain('Target profile');
    expect(body).toContain('Migrate to Virtual Profile');
    expect(body).toContain('Replace target profile');
  });

  it('renders the imported Auto Detect editor through the typed catalog', () => {
    const autoDetect = baseSpec();
    autoDetect.profiles.push({
      id: 'auto-detect-component',
      name: '自动检测测试',
      kind: 'auto-detect',
      fallbackRoute: { kind: 'direct' },
    });
    const simplified = render(AdvancedProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: autoDetect,
        profileId: 'auto-detect-component',
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    }).body;
    expect(simplified).toContain('data-auto-detect-profile-editor');
    expect(simplified).toContain('data-typed-locale="zh-CN"');
    expect(simplified).toContain('自动检测');
    expect(simplified).toContain('后备情景模式');
    expect(simplified).toContain('自动检测失败时使用的情景模式');
    expect(simplified).not.toContain('Browser auto-detection support');
    expect(simplified).not.toContain('Fallback route');

    const traditional = render(AdvancedProfileEditor, {
      props: {
        locale: 'zh-TW',
        spec: autoDetect,
        profileId: 'auto-detect-component',
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    }).body;
    expect(traditional).toContain('data-typed-locale="zh-TW"');
    expect(traditional).toContain('自動偵測');
    expect(traditional).toContain('後備情境模式');
    expect(traditional).not.toContain('Auto Detect');
  });

  it('renders the typed Virtual Profile editor in both Chinese locales', () => {
    const mutation = createVirtualProfileDraft(baseSpec(), idFactory(), '虛擬');
    const simplified = render(VirtualProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onRequestReplacement: async () => undefined,
      },
    }).body;
    expect(simplified).toContain('data-typed-locale="zh-CN"');
    expect(simplified).toContain('目标情景模式');
    expect(simplified).toContain('迁移到虚拟情景模式');
    expect(simplified).toContain('替换目标情景模式');
    expect(simplified).not.toContain('Target profile');
    expect(simplified).not.toContain('Migrate to Virtual Profile');

    const traditional = render(VirtualProfileEditor, {
      props: {
        locale: 'zh-TW',
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onRequestReplacement: async () => undefined,
      },
    }).body;
    expect(traditional).toContain('data-typed-locale="zh-TW"');
    expect(traditional).toContain('目標情境模式');
    expect(traditional).toContain('移轉到虛擬情境模式');
    expect(traditional).toContain('取代目標情境模式');
    expect(traditional).not.toContain('Target profile');
  });

  it('renders typed Temporary Rules and Network loading shells in both Chinese locales', () => {
    const temporaryRules = render(TemporaryRulesApp, {
      props: { locale: 'zh-CN' },
    }).body;
    expect(temporaryRules).toContain('data-temp-rules-manager');
    expect(temporaryRules).toContain('data-typed-locale="zh-CN"');
    expect(temporaryRules).toContain('临时规则');
    expect(temporaryRules).toContain('正在加载临时规则…');
    expect(temporaryRules).not.toContain('Temporary Rules');
    expect(temporaryRules).not.toContain('Loading temporary rules');

    const network = render(NetworkApp, {
      props: { locale: 'zh-TW' },
    }).body;
    expect(network).toContain('data-network-diagnostics');
    expect(network).toContain('data-typed-locale="zh-TW"');
    expect(network).toContain('請求診斷');
    expect(network).toContain('開始監控');
    expect(network).toContain('正在載入請求診斷…');
    expect(network).not.toContain('Request diagnostics');
    expect(network).not.toContain('Start monitoring');
  });
});
