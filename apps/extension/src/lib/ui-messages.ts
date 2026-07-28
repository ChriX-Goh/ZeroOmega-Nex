import { currentAppLocale, type AppLocale } from './i18n';

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
  'profile.kind.switch': {
    en: 'Switch Profile',
    'zh-CN': '自动切换情景模式',
    'zh-TW': '自動切換情境模式',
  },
  'profile.kind.ruleList': {
    en: 'Rule List Profile',
    'zh-CN': '规则列表情景模式',
    'zh-TW': '規則清單情境模式',
  },
  'profile.kind.pac': { en: 'PAC Profile', 'zh-CN': 'PAC 情景模式', 'zh-TW': 'PAC 情境模式' },
  'profile.kind.autoDetect': {
    en: 'Auto Detect Profile',
    'zh-CN': '自动检测情景模式',
    'zh-TW': '自動偵測情境模式',
  },
  'profile.kind.virtual': {
    en: 'Virtual Profile',
    'zh-CN': '虚拟情景模式',
    'zh-TW': '虛擬情境模式',
  },
  'newProfile.title': { en: 'New Profile', 'zh-CN': '新建情景模式', 'zh-TW': '建立情境模式' },
  'newProfile.type': {
    en: 'Please select the profile type:',
    'zh-CN': '请选择情景模式的类型：',
    'zh-TW': '請選擇情境模式的類型：',
  },
  'newProfile.fixed.title': { en: 'Proxy Profile', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  'newProfile.fixed.description': {
    en: 'Tunneling traffic through proxy servers.',
    'zh-CN': '经过代理服务器访问网站。',
    'zh-TW': '經過代理伺服器訪問網站。',
  },
  'newProfile.switch.title': {
    en: 'Switch Profile',
    'zh-CN': '自动切换模式',
    'zh-TW': '自動切換模式',
  },
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
  'newProfile.virtual.title': {
    en: 'Virtual Profile',
    'zh-CN': '虚拟情景模式',
    'zh-TW': '虛擬情境模式',
  },
  'newProfile.virtual.description': {
    en: 'Create a stable alias that points to another profile.',
    'zh-CN': '创建一个可按需更改目标的稳定情景模式别名。',
    'zh-TW': '建立一個可依需求變更目標的穩定情境模式別名。',
  },
  'newProfile.error.empty': {
    en: 'Profile name cannot be empty.',
    'zh-CN': '情景模式名称不能为空。',
    'zh-TW': '情境模式名稱不能為空。',
  },
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
  'profile.delete.blockedTitle': {
    en: 'Cannot delete profile',
    'zh-CN': '情景模式无法删除',
    'zh-TW': '情境模式無法刪除',
  },
  'profile.delete.blockedInstruction': {
    en: 'Modify every referring profile and remove its reference before deleting this profile.',
    'zh-CN': '修改以上所有情景模式并移除对此情景模式的引用后，方可删除此情景模式。',
    'zh-TW': '修改以上所有情境模式並移除對此情境模式的引用後，方可刪除此情境模式。',
  },
  'profile.delete.confirmTitle': {
    en: 'Delete profile',
    'zh-CN': '删除情景模式',
    'zh-TW': '刪除情境模式',
  },
  'profile.replace.title': {
    en: 'Replace Profile',
    'zh-CN': '替换情景模式',
    'zh-TW': '取代情境模式',
  },
  'profile.replace.questionPrefix': {
    en: 'Do you really want to replace',
    'zh-CN': '您确定要使用',
    'zh-TW': '您確定要使用',
  },
  'profile.replace.questionMiddle': { en: 'with', 'zh-CN': '来代替', 'zh-TW': '來代替' },
  'profile.replace.questionSuffix': { en: '?', 'zh-CN': '吗？', 'zh-TW': '嗎？' },
  'profile.replace.fromAria': {
    en: 'Profile to replace',
    'zh-CN': '要被替换的情景模式',
    'zh-TW': '要被取代的情境模式',
  },
  'profile.replace.toAria': {
    en: 'Replacement profile',
    'zh-CN': '用于替换的情景模式',
    'zh-TW': '用於取代的情境模式',
  },
  'profile.replace.help': {
    en: 'All rules pointing to the first profile will use the second profile instead. Startup, Quick Switch, and other profile references are updated too. The two profiles themselves are not changed or deleted.',
    'zh-CN':
      '所有指向第一个情景模式的规则将改用第二个情景模式；启动情景模式、快速切换及其他引用也会一并更新。两个情景模式本身不会被修改或删除。',
    'zh-TW':
      '所有指向第一個情境模式的規則將改用第二個情境模式；啟動情境模式、快速切換及其他引用也會一併更新。兩個情境模式本身不會被修改或刪除。',
  },
  'fixed.proxyServers': { en: 'Proxy servers', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  'fixed.scheme': { en: 'Scheme', 'zh-CN': '网址协议', 'zh-TW': '網址協定' },
  'fixed.protocol': { en: 'Protocol', 'zh-CN': '协议', 'zh-TW': '通訊協定' },
  'fixed.server': { en: 'Server', 'zh-CN': '服务器', 'zh-TW': '伺服器' },
  'fixed.port': { en: 'Port', 'zh-CN': '端口', 'zh-TW': '連接埠' },
  'fixed.authentication': { en: 'Authentication', 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  'fixed.default': { en: '(default)', 'zh-CN': '(默认)', 'zh-TW': '(預設)' },
  'fixed.direct': { en: 'DIRECT', 'zh-CN': '直接连接', 'zh-TW': '直接連線' },
  'fixed.useDefault': { en: '(use default)', 'zh-CN': '(同默认)', 'zh-TW': '(同預設)' },
  'fixed.showAdvanced': { en: 'Show Advanced', 'zh-CN': '显示高级设置', 'zh-TW': '顯示進階設定' },
  'fixed.bypassList': {
    en: 'Bypass List',
    'zh-CN': '不代理的地址列表',
    'zh-TW': '不代理的位址清單',
  },
  'fixed.bypassHelp': {
    en: 'Servers for which you do not want to use any proxy: (One server on each line.)',
    'zh-CN': '不经过代理连接的主机列表：（每行一个主机）',
    'zh-TW': '不經過代理連線的主機清單：（每行一個主機）',
  },
  'fixed.bypassMore': {
    en: '(Wildcards and more available…)',
    'zh-CN': '（可使用通配符等匹配规则…）',
    'zh-TW': '（可使用萬用字元等比對規則…）',
  },
  'fixed.authTitle': { en: 'Proxy Authentication', 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  'fixed.username': { en: 'Username', 'zh-CN': '用户名', 'zh-TW': '使用者名稱' },
  'fixed.password': { en: 'Password', 'zh-CN': '密码', 'zh-TW': '密碼' },
  'fixed.showPassword': { en: 'Show password', 'zh-CN': '显示密码', 'zh-TW': '顯示密碼' },
  'fixed.hidePassword': { en: 'Hide password', 'zh-CN': '隐藏密码', 'zh-TW': '隱藏密碼' },
  'fixed.noAuthentication': { en: 'No Authentication', 'zh-CN': '(无密码)', 'zh-TW': '(無密碼)' },
  'fixed.error.serverRequired': {
    en: 'Server is required.',
    'zh-CN': '代理服务器不能为空。',
    'zh-TW': '代理伺服器不可留空。',
  },
  'fixed.error.portRange': {
    en: 'Port must be an integer from 1 to 65535.',
    'zh-CN': '代理端口必须是 1 到 65535 之间的整数。',
    'zh-TW': '代理連接埠必須是 1 到 65535 之間的整數。',
  },
  'fixed.error.serverMissing': {
    en: 'Proxy server no longer exists.',
    'zh-CN': '代理服务器已不存在。',
    'zh-TW': '代理伺服器已不存在。',
  },
} as const satisfies Record<string, LocalizedText>;

export type UiTextKey = keyof typeof typedUiTextCatalog;

export type ProfileKind = 'fixed' | 'switch' | 'rule-list' | 'pac' | 'auto-detect' | 'virtual';

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

export function profileKindText(kind: ProfileKind, locale: AppLocale = currentAppLocale()): string {
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
      if (locale === 'zh-TW')
        return `刪除情境模式「${profileName}」？此操作只會修改尚未套用的設定。`;
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
