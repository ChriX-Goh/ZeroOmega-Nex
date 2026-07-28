import type { ProfileWorkflowSourceUpdateErrorCode } from '@zeroomega-nex/profile-workflow';

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
  'options.builtin.help': {
    en: 'Direct and System Proxy are always available.',
    'zh-CN': '直接连接和系统代理始终可用。',
    'zh-TW': '直接連線與系統代理始終可用。',
  },
  'options.builtin.directHelp': {
    en: 'Connect without a proxy.',
    'zh-CN': '不使用代理，直接连接网络。',
    'zh-TW': '不使用代理，直接連線網路。',
  },
  'options.builtin.systemHelp': {
    en: 'Use the browser or operating-system proxy.',
    'zh-CN': '使用浏览器或操作系统的代理设置。',
    'zh-TW': '使用瀏覽器或作業系統的代理設定。',
  },
  'options.builtin.directColorAria': {
    en: 'Direct profile color',
    'zh-CN': '直接连接情景模式颜色',
    'zh-TW': '直接連線情境模式顏色',
  },
  'options.builtin.systemColorAria': {
    en: 'System Proxy profile color',
    'zh-CN': '系统代理情景模式颜色',
    'zh-TW': '系統代理情境模式顏色',
  },
  'options.newProfileShell.help': {
    en: 'Create a profile using the original ZeroOmega workflow.',
    'zh-CN': '按照原版 ZeroOmega 流程创建情景模式。',
    'zh-TW': '依照原版 ZeroOmega 流程建立情境模式。',
  },
  'options.about.compatibilityTitle': {
    en: 'Compatibility-first continuation',
    'zh-CN': '兼容性优先的延续版本',
    'zh-TW': '相容性優先的延續版本',
  },
  'options.about.compatibilityHelp': {
    en: 'This build preserves the original ZeroOmega navigation and migration workflow while replacing the proxy control plane with a verified cross-browser implementation.',
    'zh-CN':
      '此版本保留原版 ZeroOmega 的导航和迁移流程，同时以经过验证的跨浏览器实现替换代理控制平面。',
    'zh-TW':
      '此版本保留原版 ZeroOmega 的導覽與移轉流程，同時以經過驗證的跨瀏覽器實作取代代理控制平面。',
  },
  'options.empty.title': {
    en: 'No user profiles',
    'zh-CN': '没有用户情景模式',
    'zh-TW': '沒有使用者情境模式',
  },
  'options.empty.help': {
    en: 'Create a new profile from the left navigation or restore an original ZeroOmega backup.',
    'zh-CN': '请从左侧导航新建情景模式，或恢复原版 ZeroOmega 备份。',
    'zh-TW': '請從左側導覽建立情境模式，或還原原版 ZeroOmega 備份。',
  },
  'options.export.ruleList': {
    en: 'Publish rule list',
    'zh-CN': '发布规则列表',
    'zh-TW': '發佈規則清單',
  },
  'options.export.ruleListTitle': {
    en: 'Export this Switch Profile as a rule-list file.',
    'zh-CN': '将此自动切换情景模式导出为规则列表文件。',
    'zh-TW': '將此自動切換情境模式匯出為規則清單檔案。',
  },
  'options.export.pac': { en: 'Export PAC', 'zh-CN': '导出 PAC', 'zh-TW': '匯出 PAC' },
  'options.export.pacTitle': {
    en: 'Export the current profile as a PAC file for another browser.',
    'zh-CN': '将当前情景模式导出为可供其他浏览器使用的 PAC 文件。',
    'zh-TW': '將目前情境模式匯出為可供其他瀏覽器使用的 PAC 檔案。',
  },
  'autoDetect.help': {
    en: 'Browser auto-detection support depends on the browser target. Choose an explicit fallback for deterministic failure handling.',
    'zh-CN':
      '浏览器自动检测能力取决于浏览器目标。请选择明确的后备情景模式，以便在检测失败时确定处理方式。',
    'zh-TW':
      '瀏覽器自動偵測能力取決於瀏覽器目標。請選擇明確的後備情境模式，以便在偵測失敗時確定處理方式。',
  },
  'autoDetect.fallback': {
    en: 'Fallback profile',
    'zh-CN': '后备情景模式',
    'zh-TW': '後備情境模式',
  },
  'autoDetect.fallbackAria': {
    en: 'Profile used when automatic detection fails',
    'zh-CN': '自动检测失败时使用的情景模式',
    'zh-TW': '自動偵測失敗時使用的情境模式',
  },
  'autoDetect.noFallback': {
    en: 'No fallback',
    'zh-CN': '不使用后备情景模式',
    'zh-TW': '不使用後備情境模式',
  },
  'virtual.target.title': {
    en: 'Target profile',
    'zh-CN': '目标情景模式',
    'zh-TW': '目標情境模式',
  },
  'virtual.target.help': {
    en: 'A virtual profile is a stable alias. Change this target later without editing every rule that refers to the virtual profile.',
    'zh-CN': '虚拟情景模式是稳定别名。以后可以在此更改目标，无需逐条修改引用该虚拟情景模式的规则。',
    'zh-TW': '虛擬情境模式是穩定別名。日後可在此變更目標，無需逐條修改引用該虛擬情境模式的規則。',
  },
  'virtual.target.aria': {
    en: 'Virtual Profile target',
    'zh-CN': '虚拟情景模式目标',
    'zh-TW': '虛擬情境模式目標',
  },
  'virtual.migrate.title': {
    en: 'Migrate to Virtual Profile',
    'zh-CN': '迁移到虚拟情景模式',
    'zh-TW': '移轉到虛擬情境模式',
  },
  'virtual.migrate.help': {
    en: 'Replace references to the selected target with this virtual profile. Future target changes can then be made here in one place.',
    'zh-CN': '将对所选目标的引用替换为此虚拟情景模式。以后只需在此处更改目标。',
    'zh-TW': '將對所選目標的引用取代為此虛擬情境模式。日後只需在此處變更目標。',
  },
  'virtual.migrate.action': {
    en: 'Replace target profile',
    'zh-CN': '替换目标情景模式',
    'zh-TW': '取代目標情境模式',
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
  'switch.conditionHelp': {
    en: 'Condition help',
    'zh-CN': '条件类型说明',
    'zh-TW': '條件類型說明',
  },
  'switch.closeConditionHelp': {
    en: 'Close condition help',
    'zh-CN': '关闭条件类型说明',
    'zh-TW': '關閉條件類型說明',
  },
  'switch.rules': { en: 'Switch rules', 'zh-CN': '切换规则', 'zh-TW': '切換規則' },
  'switch.rulesHelp': {
    en: 'Rules are evaluated from top to bottom. The first matching rule selects its result profile.',
    'zh-CN': '规则按从上到下的顺序匹配；第一个匹配的规则决定使用的情景模式。',
    'zh-TW': '規則依照由上到下的順序比對；第一個符合的規則決定使用的情境模式。',
  },
  'switch.editSource': { en: 'Edit Source', 'zh-CN': '编辑源代码', 'zh-TW': '編輯原始碼' },
  'switch.urlWarning': {
    en: 'Full-URL conditions depend on browser request information and may be limited for some requests.',
    'zh-CN': '完整网址条件依赖浏览器提供的请求信息，部分请求可能受到限制。',
    'zh-TW': '完整網址條件依賴瀏覽器提供的請求資訊，部分請求可能受到限制。',
  },
  'switch.source': {
    en: 'Switch Profile source',
    'zh-CN': '自动切换情景模式源代码',
    'zh-TW': '自動切換情境模式原始碼',
  },
  'switch.sourceHelp': {
    en: 'Uses the original result-enabled SwitchyOmega conditions format. Invalid source remains in this editor until corrected.',
    'zh-CN':
      '使用原版支持结果情景模式的 SwitchyOmega 条件格式。无效源代码会保留在编辑器中，直到修正为止。',
    'zh-TW':
      '使用原版支援結果情境模式的 SwitchyOmega 條件格式。無效原始碼會保留在編輯器中，直到修正為止。',
  },
  'switch.formatHelp': { en: 'Format help', 'zh-CN': '格式帮助', 'zh-TW': '格式說明' },
  'switch.sort': { en: 'Sort', 'zh-CN': '排序', 'zh-TW': '排序' },
  'switch.conditionType': { en: 'Condition type', 'zh-CN': '条件类型', 'zh-TW': '條件類型' },
  'switch.conditionDetails': { en: 'Condition details', 'zh-CN': '条件设置', 'zh-TW': '條件設定' },
  'switch.resultProfile': { en: 'Result profile', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'switch.actions': { en: 'Actions', 'zh-CN': '操作', 'zh-TW': '操作' },
  'switch.note': { en: 'Note', 'zh-CN': '备注', 'zh-TW': '備註' },
  'switch.dragToReorder': { en: 'Drag to reorder', 'zh-CN': '拖动排序', 'zh-TW': '拖曳排序' },
  'switch.alwaysMatches': { en: 'Always matches', 'zh-CN': '总是匹配', 'zh-TW': '永遠符合' },
  'switch.neverMatches': { en: 'Never matches', 'zh-CN': '永不匹配', 'zh-TW': '永不符合' },
  'switch.rangeTo': { en: 'to', 'zh-CN': '至', 'zh-TW': '至' },
  'switch.legacyWarning': {
    en: 'Legacy Nex-only rule state cannot be represented in original source format.',
    'zh-CN': '旧版 Nex 专用规则状态无法用原版源代码格式表示。',
    'zh-TW': '舊版 Nex 專用規則狀態無法用原版原始碼格式表示。',
  },
  'switch.deleteRule': { en: 'Delete rule', 'zh-CN': '删除规则', 'zh-TW': '刪除規則' },
  'switch.cloneRule': { en: 'Clone rule', 'zh-CN': '克隆规则', 'zh-TW': '複製規則' },
  'switch.normalizeRule': { en: 'Normalize', 'zh-CN': '规范化', 'zh-TW': '正規化' },
  'switch.normalizeRuleTitle': {
    en: 'Remove legacy Nex-only rule state',
    'zh-CN': '移除旧版 Nex 专用规则状态',
    'zh-TW': '移除舊版 Nex 專用規則狀態',
  },
  'switch.addNote': { en: 'Add note', 'zh-CN': '添加备注', 'zh-TW': '加入備註' },
  'switch.optionalNote': { en: 'Optional note', 'zh-CN': '可选备注', 'zh-TW': '選填備註' },
  'switch.empty': {
    en: 'No conditions. Requests use the default profile below.',
    'zh-CN': '没有条件。请求将使用下方的默认情景模式。',
    'zh-TW': '沒有條件。請求將使用下方的預設情境模式。',
  },
  'switch.addCondition': { en: 'Add condition', 'zh-CN': '添加条件', 'zh-TW': '加入條件' },
  'switch.attachedUse': {
    en: 'Use attached Rule List',
    'zh-CN': '规则列表规则',
    'zh-TW': '規則清單規則',
  },
  'switch.attachedEnabled': {
    en: 'Matching attached rules use the selected result profile.',
    'zh-CN': '匹配规则列表的请求将使用所选情景模式。',
    'zh-TW': '符合規則清單的請求將使用所選情境模式。',
  },
  'switch.attachedDisabled': {
    en: 'Attached rules are retained but bypassed.',
    'zh-CN': '规则列表已禁用，但内容仍会保留。',
    'zh-TW': '規則清單已停用，但內容仍會保留。',
  },
  'switch.attachedMatchRoute': {
    en: 'Attached Rule List matching route',
    'zh-CN': '规则列表匹配时使用的情景模式',
    'zh-TW': '規則清單符合時使用的情境模式',
  },
  'switch.deleteAttached': {
    en: 'Delete attached Rule List',
    'zh-CN': '移除规则列表',
    'zh-TW': '移除規則清單',
  },
  'switch.detachConfirm': {
    en: 'Delete the attached Rule List? The Switch default route will be restored before removal.',
    'zh-CN': '移除附属规则列表吗？移除前会先恢复自动切换模式的默认情景模式。',
    'zh-TW': '移除附屬規則清單嗎？移除前會先還原自動切換模式的預設情境模式。',
  },
  'switch.defaultProfile': {
    en: 'Default profile',
    'zh-CN': '默认情景模式',
    'zh-TW': '預設情境模式',
  },
  'switch.defaultRouteAria': {
    en: 'Switch Profile default route',
    'zh-CN': '自动切换情景模式的默认路由',
    'zh-TW': '自動切換情境模式的預設路由',
  },
  'switch.attachTitle': {
    en: 'Import online Rule List',
    'zh-CN': '导入在线规则列表',
    'zh-TW': '匯入線上規則清單',
  },
  'switch.attachHelp': {
    en: 'Attach a hidden Rule List Profile to extend this Switch Profile without adding another normal navigation entry.',
    'zh-CN': '添加隐藏的规则列表情景模式，以引用在线发布的规则，同时不增加普通导航项。',
    'zh-TW': '加入隱藏的規則清單情境模式，以引用線上發布的規則，同時不增加一般導覽項目。',
  },
  'switch.attachButton': { en: 'Add Rule List', 'zh-CN': '添加规则列表', 'zh-TW': '加入規則清單' },
  'switch.group.basic': { en: 'Basic conditions', 'zh-CN': '基础条件', 'zh-TW': '基本條件' },
  'switch.group.host': { en: 'Host', 'zh-CN': '域名', 'zh-TW': '網域' },
  'switch.group.url': { en: 'URL', 'zh-CN': '网址', 'zh-TW': '網址' },
  'switch.group.special': { en: 'Special', 'zh-CN': '特殊', 'zh-TW': '特殊' },
  'switch.condition.hostWildcard': {
    en: 'Host wildcard',
    'zh-CN': '域名通配符',
    'zh-TW': '網域萬用字元',
  },
  'switch.condition.hostWildcardHelp': {
    en: 'Match a hostname wildcard without path or port details.',
    'zh-CN': '匹配不包含路径或端口的域名通配符。',
    'zh-TW': '比對不包含路徑或連接埠的網域萬用字元。',
  },
  'switch.condition.urlWildcard': {
    en: 'URL wildcard',
    'zh-CN': '网址通配符',
    'zh-TW': '網址萬用字元',
  },
  'switch.condition.urlWildcardHelp': {
    en: 'Match a complete URL wildcard pattern.',
    'zh-CN': '匹配完整网址的通配符模式。',
    'zh-TW': '比對完整網址的萬用字元模式。',
  },
  'switch.condition.urlRegex': {
    en: 'URL regular expression',
    'zh-CN': '网址正则',
    'zh-TW': '網址正規表示式',
  },
  'switch.condition.urlRegexHelp': {
    en: 'Match a complete URL using a regular expression.',
    'zh-CN': '使用正则表达式匹配完整网址。',
    'zh-TW': '使用正規表示式比對完整網址。',
  },
  'switch.condition.hostRegex': {
    en: 'Host regular expression',
    'zh-CN': '域名正则',
    'zh-TW': '網域正規表示式',
  },
  'switch.condition.hostRegexHelp': {
    en: 'Match the hostname using a regular expression.',
    'zh-CN': '使用正则表达式匹配域名。',
    'zh-TW': '使用正規表示式比對網域。',
  },
  'switch.condition.hostLevels': { en: 'Host levels', 'zh-CN': '域名层数', 'zh-TW': '網域層數' },
  'switch.condition.hostLevelsHelp': {
    en: 'Match hostnames whose label count falls inside a range.',
    'zh-CN': '匹配域名层数位于指定范围内的主机。',
    'zh-TW': '比對網域層數位於指定範圍內的主機。',
  },
  'switch.condition.ip': { en: 'IP network', 'zh-CN': 'IP 网络', 'zh-TW': 'IP 網路' },
  'switch.condition.ipHelp': {
    en: 'Match an IPv4 or IPv6 network and prefix length.',
    'zh-CN': '匹配 IPv4 或 IPv6 网络及其前缀长度。',
    'zh-TW': '比對 IPv4 或 IPv6 網路及其前綴長度。',
  },
  'switch.condition.bypass': {
    en: 'Bypass pattern',
    'zh-CN': '不代理地址模式',
    'zh-TW': '不代理位址模式',
  },
  'switch.condition.bypassHelp': {
    en: 'Match a browser bypass-list pattern.',
    'zh-CN': '匹配浏览器不代理地址列表的模式。',
    'zh-TW': '比對瀏覽器不代理位址清單的模式。',
  },
  'switch.condition.keyword': { en: 'URL keyword', 'zh-CN': '关键字', 'zh-TW': '關鍵字' },
  'switch.condition.keywordHelp': {
    en: 'Match an HTTP URL containing a keyword.',
    'zh-CN': '匹配包含指定关键字的 HTTP 网址。',
    'zh-TW': '比對包含指定關鍵字的 HTTP 網址。',
  },
  'switch.condition.weekday': { en: 'Weekday', 'zh-CN': '每周几', 'zh-TW': '每週幾' },
  'switch.condition.weekdayHelp': {
    en: 'Match selected local weekdays.',
    'zh-CN': '匹配所选的本地星期。',
    'zh-TW': '比對所選的本機星期。',
  },
  'switch.condition.time': { en: 'Local time', 'zh-CN': '当前时间', 'zh-TW': '目前時間' },
  'switch.condition.timeHelp': {
    en: 'Match a local-time hour range.',
    'zh-CN': '匹配本地时间的小时范围。',
    'zh-TW': '比對本機時間的小時範圍。',
  },
  'switch.condition.always': { en: 'Always', 'zh-CN': '总是', 'zh-TW': '永遠' },
  'switch.condition.alwaysHelp': {
    en: 'Always match. Imported profiles may retain this explicit form.',
    'zh-CN': '始终匹配；导入的情景模式可能保留此显式形式。',
    'zh-TW': '永遠符合；匯入的情境模式可能保留此明確形式。',
  },
  'switch.condition.never': { en: 'Never', 'zh-CN': '(禁用)', 'zh-TW': '(停用)' },
  'switch.condition.neverHelp': {
    en: 'Never match; useful as a retained placeholder.',
    'zh-CN': '永不匹配，可用于保留占位规则。',
    'zh-TW': '永不符合，可用於保留預留規則。',
  },
  'switch.weekday.sun': { en: 'Sun', 'zh-CN': '日', 'zh-TW': '日' },
  'switch.weekday.mon': { en: 'Mon', 'zh-CN': '一', 'zh-TW': '一' },
  'switch.weekday.tue': { en: 'Tue', 'zh-CN': '二', 'zh-TW': '二' },
  'switch.weekday.wed': { en: 'Wed', 'zh-CN': '三', 'zh-TW': '三' },
  'switch.weekday.thu': { en: 'Thu', 'zh-CN': '四', 'zh-TW': '四' },
  'switch.weekday.fri': { en: 'Fri', 'zh-CN': '五', 'zh-TW': '五' },
  'switch.weekday.sat': { en: 'Sat', 'zh-CN': '六', 'zh-TW': '六' },
  'ruleList.config': { en: 'Rule List Config', 'zh-CN': '规则列表设置', 'zh-TW': '規則清單設定' },
  'ruleList.matchProfile': {
    en: 'Match profile',
    'zh-CN': '匹配则使用情景模式',
    'zh-TW': '比對則使用情境模式',
  },
  'ruleList.defaultProfile': {
    en: 'Default profile',
    'zh-CN': '不匹配则使用情景模式',
    'zh-TW': '不比對則使用情境模式',
  },
  'ruleList.format': { en: 'Rule List format', 'zh-CN': '规则列表格式', 'zh-TW': '規則清單格式' },
  'ruleList.url': { en: 'Rule List URL', 'zh-CN': '规则列表网址', 'zh-TW': '規則清單網址' },
  'ruleList.text': { en: 'Rule List Text', 'zh-CN': '规则列表正文', 'zh-TW': '規則清單正文' },
  'ruleList.urlHelp': {
    en: 'The application downloads the Rule List from this URL. Leave it empty to use the text below directly.',
    'zh-CN': '应用将从此网址下载规则列表。如果网址留空，则以下文本会被直接处理后作为规则列表使用。',
    'zh-TW': '應用將從此網址下載規則清單。如果網址留空，則以下文字會被直接處理後作為規則清單使用。',
  },
  'ruleList.clearUrl': {
    en: 'Clear Rule List URL',
    'zh-CN': '清除规则列表网址',
    'zh-TW': '清除規則清單網址',
  },
  'ruleList.clear': { en: 'Clear', 'zh-CN': '清除', 'zh-TW': '清除' },
  'ruleList.requestHeaders': { en: 'Request headers', 'zh-CN': '请求头', 'zh-TW': '請求標頭' },
  'ruleList.headersHelp': {
    en: 'Sensitive values use background-owned secret references and never enter ordinary configuration text.',
    'zh-CN': '敏感值使用后台持有的秘密引用，绝不会进入普通配置文本。',
    'zh-TW': '敏感值使用背景持有的秘密參照，絕不會進入一般設定文字。',
  },
  'ruleList.headerName': { en: 'Header name', 'zh-CN': '请求头名称', 'zh-TW': '請求標頭名稱' },
  'ruleList.headerType': {
    en: 'Header value type',
    'zh-CN': '请求头值类型',
    'zh-TW': '請求標頭值類型',
  },
  'ruleList.headerValue': { en: 'Header value', 'zh-CN': '请求头值', 'zh-TW': '請求標頭值' },
  'ruleList.literal': { en: 'Literal', 'zh-CN': '文本值', 'zh-TW': '文字值' },
  'ruleList.secretReference': { en: 'Secret reference', 'zh-CN': '秘密引用', 'zh-TW': '秘密參照' },
  'ruleList.removeHeader': { en: 'Remove', 'zh-CN': '移除', 'zh-TW': '移除' },
  'ruleList.addHeader': { en: 'Add header', 'zh-CN': '添加请求头', 'zh-TW': '加入請求標頭' },
  'ruleList.downloadNow': {
    en: 'Download now',
    'zh-CN': '立即更新情景模式',
    'zh-TW': '立即更新情境模式',
  },
  'ruleList.downloading': { en: 'Downloading…', 'zh-CN': '正在下载…', 'zh-TW': '正在下載…' },
  'ruleList.neverDownloaded': {
    en: 'Never downloaded.',
    'zh-CN': '尚未下载。',
    'zh-TW': '尚未下載。',
  },
  'ruleList.cachedStale': {
    en: 'Cached content is stale.',
    'zh-CN': '缓存内容已经过时。',
    'zh-TW': '快取內容已經過時。',
  },
  'ruleList.updateError': {
    en: 'Rule List update failed.',
    'zh-CN': '规则列表更新失败。',
    'zh-TW': '規則清單更新失敗。',
  },
  'ruleList.downloadSafety': {
    en: 'Remote content is downloaded by the background service with isolated credentials, bounded size, and atomic cache replacement. Failed downloads keep the previous cache.',
    'zh-CN': '远程内容由后台服务使用隔离凭据下载，并限制大小及原子替换缓存；下载失败时保留原缓存。',
    'zh-TW': '遠端內容由背景服務使用隔離憑證下載，並限制大小及原子取代快取；下載失敗時保留原快取。',
  },
  'ruleList.downloadedText': {
    en: 'Downloaded Rule List text',
    'zh-CN': '已下载的规则列表正文',
    'zh-TW': '已下載的規則清單正文',
  },
  'ruleList.updateInterval': {
    en: 'Update interval (minutes)',
    'zh-CN': '更新间隔（分钟）',
    'zh-TW': '更新間隔（分鐘）',
  },
  'ruleList.attachedConfig': {
    en: 'Attached Rule List configuration',
    'zh-CN': '附属规则列表设置',
    'zh-TW': '附屬規則清單設定',
  },
  'ruleList.attachedHiddenHelp': {
    en: 'The attached profile remains hidden from normal navigation and participates only through this Switch Profile.',
    'zh-CN': '附属情景模式不会显示在普通导航中，只通过当前自动切换情景模式参与匹配。',
    'zh-TW': '附屬情境模式不會顯示在一般導覽中，只透過目前自動切換情境模式參與比對。',
  },
  'ruleList.sourceType': { en: 'Source type', 'zh-CN': '来源类型', 'zh-TW': '來源類型' },
  'ruleList.inlineText': { en: 'Inline text', 'zh-CN': '内嵌文本', 'zh-TW': '內嵌文字' },
  'ruleList.attachedSourceType': {
    en: 'Attached Rule List source type',
    'zh-CN': '附属规则列表来源类型',
    'zh-TW': '附屬規則清單來源類型',
  },
  'ruleList.attachedUrl': {
    en: 'Attached Rule List URL',
    'zh-CN': '附属规则列表网址',
    'zh-TW': '附屬規則清單網址',
  },
  'ruleList.attachedText': {
    en: 'Attached Rule List text',
    'zh-CN': '附属规则列表正文',
    'zh-TW': '附屬規則清單正文',
  },
  'ruleList.attachedDownloadedText': {
    en: 'Attached Rule List downloaded text',
    'zh-CN': '附属规则列表已下载正文',
    'zh-TW': '附屬規則清單已下載正文',
  },
  'ruleList.matchProfileAria': {
    en: 'Rule List match profile',
    'zh-CN': '规则列表匹配时使用的情景模式',
    'zh-TW': '規則清單符合時使用的情境模式',
  },
  'ruleList.defaultProfileAria': {
    en: 'Rule List default profile',
    'zh-CN': '规则列表不匹配时使用的情景模式',
    'zh-TW': '規則清單不符合時使用的情境模式',
  },
  'ruleList.textAria': { en: 'Rule List text', 'zh-CN': '规则列表正文', 'zh-TW': '規則清單正文' },
  'pac.url': { en: 'PAC URL', 'zh-CN': 'PAC 网址', 'zh-TW': 'PAC 網址' },
  'pac.clearUrl': { en: 'Clear PAC URL', 'zh-CN': '清空 PAC 网址', 'zh-TW': '清除 PAC 網址' },
  'pac.clear': { en: 'Clear', 'zh-CN': '清空', 'zh-TW': '清除' },
  'pac.urlHelp': {
    en: 'The application downloads the PAC script from this URL. Leave it empty to use the script below directly.',
    'zh-CN': '应用将从此网址下载PAC脚本。如果网址留空，则直接使用下方的脚本内容。',
    'zh-TW': '將會從此網址下載 PAC 指令碼。如果網址留空，則直接使用下方的指令碼內容。',
  },
  'pac.fileWarning': {
    en: 'A local file PAC can only be used as a standalone profile because browsers restrict local-file access.',
    'zh-CN':
      '如果您使用本地PAC文件，则该情景模式只能单独使用，无法作为自动切换的结果。这是因为浏览器不允许读取本地文件。',
    'zh-TW':
      '如果您使用本機 PAC 檔案，則該情境模式只能單獨使用，無法作為自動切換的結果。這是因為瀏覽器不允許讀取本機檔案。',
  },
  'pac.fileReferenced': {
    en: 'This profile is referenced and therefore cannot use a local PAC file. Create a separate PAC Profile for the local file.',
    'zh-CN':
      '此情景模式已被引用，所以不能使用本地PAC文件。如果您真的需要使用本地文件，请另外新建一个PAC情景模式。',
    'zh-TW':
      '此情境模式已被引用，所以不能使用本機 PAC 檔案。如果您真的需要使用本機檔案，請另外建立一個 PAC 情境模式。',
  },
  'pac.requestHeaders': { en: 'Request headers', 'zh-CN': '请求头', 'zh-TW': '請求標頭' },
  'pac.headersHelp': {
    en: 'Sensitive values use background-owned secret references and never enter ordinary configuration text.',
    'zh-CN': '敏感值使用后台持有的秘密引用，绝不会进入普通配置文本。',
    'zh-TW': '敏感值使用背景持有的秘密參照，絕不會進入一般設定文字。',
  },
  'pac.headerName': { en: 'Header name', 'zh-CN': '请求头名称', 'zh-TW': '請求標頭名稱' },
  'pac.headerType': { en: 'Header value type', 'zh-CN': '请求头值类型', 'zh-TW': '請求標頭值類型' },
  'pac.headerValue': { en: 'Header value', 'zh-CN': '请求头值', 'zh-TW': '請求標頭值' },
  'pac.literal': { en: 'Literal', 'zh-CN': '文本值', 'zh-TW': '文字值' },
  'pac.secretReference': { en: 'Secret reference', 'zh-CN': '秘密引用', 'zh-TW': '秘密參照' },
  'pac.removeHeader': { en: 'Remove', 'zh-CN': '移除', 'zh-TW': '移除' },
  'pac.addHeader': { en: 'Add header', 'zh-CN': '添加请求头', 'zh-TW': '加入請求標頭' },
  'pac.downloadNow': {
    en: 'Download now',
    'zh-CN': '立即更新情景模式',
    'zh-TW': '立即更新情境模式',
  },
  'pac.downloading': { en: 'Downloading…', 'zh-CN': '正在下载…', 'zh-TW': '正在下載…' },
  'pac.obsolete': {
    en: 'The PAC script is obsolete until an update is downloaded.',
    'zh-CN': '修改网址后尚未下载更新，因此脚本已经过时。请使用上方的更新按钮进行下载。',
    'zh-TW': '修改網址後尚未下載更新，因此指令碼已經過時。請使用上方的更新按鈕進行下載。',
  },
  'pac.cachedStale': {
    en: 'Cached script is stale.',
    'zh-CN': '缓存脚本已经过时。',
    'zh-TW': '快取指令碼已經過時。',
  },
  'pac.updateError': {
    en: 'PAC script update failed.',
    'zh-CN': 'PAC 脚本更新失败。',
    'zh-TW': 'PAC 指令碼更新失敗。',
  },
  'pac.script': { en: 'PAC Script', 'zh-CN': 'PAC 脚本', 'zh-TW': 'PAC 指令碼' },
  'pac.fileScriptHidden': {
    en: 'The browser reads this local file directly; cached script text is hidden.',
    'zh-CN': '浏览器会直接读取此本地文件，因此不显示缓存脚本文本。',
    'zh-TW': '瀏覽器會直接讀取此本機檔案，因此不顯示快取指令碼文字。',
  },
  'pac.authTitle': { en: 'Proxy Authentication', 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  'pac.authHelp': {
    en: 'These credentials answer Basic or Digest proxy challenges only while this PAC Profile is the active top-level route. Ordinary website authentication is never answered.',
    'zh-CN':
      '这些凭据只在当前 PAC 情景模式作为顶层活动路由时响应代理服务器的 Basic 或 Digest 认证；绝不会响应普通网站认证。',
    'zh-TW':
      '這些憑證只在目前 PAC 情境模式作為頂層作用中路由時回應 Proxy 伺服器的 Basic 或 Digest 認證；絕不會回應一般網站認證。',
  },
  'pac.authAllWarning': {
    en: 'Warning: the username and password may be offered to any proxy returned by the PAC script, and the target server may be unexpected.',
    'zh-CN': '警告: 用户名密码将会提供给PAC脚本返回的任何服务器，有时目标服务器会出乎您的预料。',
    'zh-TW':
      '警告：使用者名稱和密碼將會提供給 PAC 指令碼返回的任何伺服器，有時目標伺服器會出乎您的預料。',
  },
  'pac.authTrustUrl': {
    en: 'Before providing credentials, make sure you trust the PAC script supplied by the URL above.',
    'zh-CN': '在提供用户名和密码时，请先确保您可以信任以上网址提供的PAC脚本。',
    'zh-TW': '在提供使用者名稱和密碼時，請先確保您可以信任以上網址提供的 PAC 指令碼。',
  },
  'pac.authTrustScript': {
    en: 'Before providing credentials, make sure you trust the PAC script entered below.',
    'zh-CN': '在提供用户名和密码时，请先确保您可以信任以下输入的PAC脚本。',
    'zh-TW': '在提供使用者名稱和密碼時，請先確保您可以信任以下輸入的 PAC 指令碼。',
  },
  'pac.authReferencedWarning': {
    en: 'Using this profile from another profile may send the credentials to proxy servers configured elsewhere.',
    'zh-CN':
      '此外，在其他情景模式（如自动切换）中使用此情景时，可能会导致用户名和密码被发送至其他情景模式中设置的服务器。',
    'zh-TW':
      '此外，在其他情境模式（如自動切換）中使用此情境時，可能會導致使用者名稱和密碼被傳送至其他情境模式中設定的伺服器。',
  },
  'pac.authSet': {
    en: 'Set all-proxy authentication',
    'zh-CN': '设置全部代理认证',
    'zh-TW': '設定全部 Proxy 認證',
  },
  'pac.authEdit': {
    en: 'Edit all-proxy authentication',
    'zh-CN': '编辑全部代理认证',
    'zh-TW': '編輯全部 Proxy 認證',
  },
  'pac.authConfigured': { en: 'Configured.', 'zh-CN': '已配置。', 'zh-TW': '已設定。' },
  'pac.authNotConfigured': { en: 'Not configured.', 'zh-CN': '尚未配置。', 'zh-TW': '尚未設定。' },
  'pac.fallbackTitle': {
    en: 'Target capability fallback',
    'zh-CN': '目标能力后备情景模式',
    'zh-TW': '目標能力後備情境模式',
  },
  'pac.fallbackHelp': {
    en: 'Used only when the selected browser cannot activate this PAC source. It does not compose the arbitrary PAC script into another profile.',
    'zh-CN': '仅在所选浏览器无法激活此 PAC 来源时使用；不会把任意 PAC 脚本组合到其他情景模式中。',
    'zh-TW': '僅在所選瀏覽器無法啟用此 PAC 來源時使用；不會把任意 PAC 指令碼組合到其他情境模式中。',
  },
  'pac.fallbackAria': {
    en: 'PAC fallback profile',
    'zh-CN': 'PAC 后备情景模式',
    'zh-TW': 'PAC 後備情境模式',
  },
  'pac.noFallback': {
    en: 'No fallback',
    'zh-CN': '不使用后备情景模式',
    'zh-TW': '不使用後備情境模式',
  },
  'pac.authDialogTitle': {
    en: 'PAC Proxy Authentication',
    'zh-CN': 'PAC 代理登录',
    'zh-TW': 'PAC 代理認證',
  },
  'pac.authClose': {
    en: 'Close PAC authentication',
    'zh-CN': '关闭 PAC 代理登录',
    'zh-TW': '關閉 PAC 代理認證',
  },
  'pac.authDialogHelp': {
    en: 'One credential is used only for proxy authentication challenges while this PAC Profile is the active top-level route.',
    'zh-CN': '仅当此 PAC 情景模式作为顶层活动路由时，才使用这一组凭据响应代理认证。',
    'zh-TW': '僅當此 PAC 情境模式作為頂層作用中路由時，才使用這一組憑證回應 Proxy 認證。',
  },
  'pac.username': { en: 'Username', 'zh-CN': '用户名', 'zh-TW': '使用者名稱' },
  'pac.password': { en: 'Password', 'zh-CN': '密码', 'zh-TW': '密碼' },
  'pac.authUsernameAria': {
    en: 'PAC authentication username',
    'zh-CN': 'PAC 代理登录用户名',
    'zh-TW': 'PAC 代理認證使用者名稱',
  },
  'pac.authPasswordAria': {
    en: 'PAC authentication password',
    'zh-CN': 'PAC 代理登录密码',
    'zh-TW': 'PAC 代理認證密碼',
  },
  'pac.showPassword': { en: 'Show password', 'zh-CN': '显示密码', 'zh-TW': '顯示密碼' },
  'pac.hidePassword': { en: 'Hide password', 'zh-CN': '隐藏密码', 'zh-TW': '隱藏密碼' },
  'pac.removeAuthentication': {
    en: 'Remove authentication',
    'zh-CN': '移除代理登录',
    'zh-TW': '移除代理認證',
  },
  'pac.saveAuthentication': {
    en: 'Save authentication',
    'zh-CN': '保存代理登录',
    'zh-TW': '儲存代理認證',
  },
  'pac.authPermissionDenied': {
    en: 'Proxy authentication permission was not granted.',
    'zh-CN': '未授予代理认证权限。',
    'zh-TW': '未授予 Proxy 認證權限。',
  },
  'pac.authPermissionFailed': {
    en: 'Proxy authentication permission could not be requested.',
    'zh-CN': '无法请求代理认证权限。',
    'zh-TW': '無法要求 Proxy 認證權限。',
  },
  'pac.authReadFailed': {
    en: 'The saved PAC authentication secret could not be read.',
    'zh-CN': '无法读取已保存的 PAC 代理认证秘密。',
    'zh-TW': '無法讀取已儲存的 PAC 代理認證秘密。',
  },
  'pac.authSaveFailed': {
    en: 'PAC authentication could not be saved.',
    'zh-CN': '无法保存 PAC 代理认证。',
    'zh-TW': '無法儲存 PAC 代理認證。',
  },
  'pac.authRemoveFailed': {
    en: 'PAC authentication could not be removed.',
    'zh-CN': '无法移除 PAC 代理认证。',
    'zh-TW': '無法移除 PAC 代理認證。',
  },
  'pac.missingProfile': {
    en: 'PAC Profile no longer exists.',
    'zh-CN': 'PAC 情景模式已不存在。',
    'zh-TW': 'PAC 情境模式已不存在。',
  },
  'options.documentTitle': {
    en: 'ZeroOmega Nex Options',
    'zh-CN': 'ZeroOmega Nex 选项',
    'zh-TW': 'ZeroOmega Nex 選項',
  },
  'options.navAria': {
    en: 'ZeroOmega options',
    'zh-CN': 'ZeroOmega 选项',
    'zh-TW': 'ZeroOmega 選項',
  },
  'options.nav.settings': { en: 'Settings', 'zh-CN': '设置', 'zh-TW': '設定' },
  'options.nav.profiles': { en: 'Profiles', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'options.nav.actions': { en: 'Actions', 'zh-CN': '操作', 'zh-TW': '操作' },
  'options.nav.interface': { en: 'Interface', 'zh-CN': '界面', 'zh-TW': '介面' },
  'options.nav.general': { en: 'General', 'zh-CN': '通用', 'zh-TW': '一般' },
  'options.nav.theme': { en: 'Theme', 'zh-CN': '主题', 'zh-TW': '佈景主題' },
  'options.nav.builtIn': {
    en: 'Built-in Profiles',
    'zh-CN': '内置情景模式',
    'zh-TW': '內建情境模式',
  },
  'options.nav.newProfile': {
    en: 'New profile…',
    'zh-CN': '新建情景模式…',
    'zh-TW': '新增情境模式…',
  },
  'options.actions.working': { en: 'Working…', 'zh-CN': '处理中…', 'zh-TW': '處理中…' },
  'options.actions.apply': { en: 'Apply changes', 'zh-CN': '应用选项', 'zh-TW': '套用選項' },
  'options.actions.discard': { en: 'Discard changes', 'zh-CN': '撤销更改', 'zh-TW': '復原變更' },
  'options.draft.applying': {
    en: 'Apply is in progress.',
    'zh-CN': '正在应用选项。',
    'zh-TW': '正在套用選項。',
  },
  'options.draft.sourceDirty': {
    en: 'Switch source contains unapplied changes.',
    'zh-CN': '自动切换源代码有尚未应用的更改。',
    'zh-TW': '自動切換原始碼有尚未套用的變更。',
  },
  'options.draft.dirty': {
    en: 'Draft contains unapplied changes.',
    'zh-CN': '有尚未应用的更改。',
    'zh-TW': '有尚未套用的變更。',
  },
  'options.draft.clean': {
    en: 'Draft matches the currently applied revision.',
    'zh-CN': '当前设置已全部应用。',
    'zh-TW': '目前設定已全部套用。',
  },
  'options.error.title': { en: 'Operation failed', 'zh-CN': '操作失败', 'zh-TW': '操作失敗' },
  'options.error.safeMessage': {
    en: 'The operation could not be completed. Retry or review the relevant status panel.',
    'zh-CN': '无法完成此操作。请重试或查看相关状态区域。',
    'zh-TW': '無法完成此操作。請重試或查看相關狀態區域。',
  },
  'options.error.ruleListPermission': {
    en: 'Host permission is required before downloading this Rule List URL.',
    'zh-CN': '下载此规则列表网址前，需要授予网站权限。',
    'zh-TW': '下載此規則清單網址前，需要授予網站權限。',
  },
  'options.error.pacPermission': {
    en: 'Host permission is required before downloading this PAC URL.',
    'zh-CN': '下载此 PAC 网址前，需要授予网站权限。',
    'zh-TW': '下載此 PAC 網址前，需要授予網站權限。',
  },
  'options.error.replacementMissing': {
    en: 'A replacement endpoint no longer exists.',
    'zh-CN': '用于替换的情景模式已不存在。',
    'zh-TW': '用於取代的情境模式已不存在。',
  },
  'options.loading.title': {
    en: 'Loading profiles',
    'zh-CN': '正在加载情景模式',
    'zh-TW': '正在載入情境模式',
  },
  'options.loading.help': {
    en: 'Reading the saved ZeroOmega configuration.',
    'zh-CN': '正在读取已保存的 ZeroOmega 配置。',
    'zh-TW': '正在讀取已儲存的 ZeroOmega 設定。',
  },
  'options.confirm.export': {
    en: 'Apply current changes before exporting the Options backup?',
    'zh-CN': '导出选项备份前，先应用当前更改吗？',
    'zh-TW': '匯出選項備份前，先套用目前變更嗎？',
  },
  'options.confirm.replace': {
    en: 'Apply current changes before replacing profile references?',
    'zh-CN': '替换情景模式引用前，先应用当前更改吗？',
    'zh-TW': '取代情境模式參照前，先套用目前變更嗎？',
  },
  'options.apply.noAttempt': {
    en: 'No Apply attempt recorded.',
    'zh-CN': '尚无应用记录。',
    'zh-TW': '尚無套用記錄。',
  },
  'options.apply.succeeded': {
    en: 'The latest Apply completed successfully.',
    'zh-CN': '最近一次应用已成功完成。',
    'zh-TW': '最近一次套用已成功完成。',
  },
  'options.apply.failed': {
    en: 'The latest Apply failed.',
    'zh-CN': '最近一次应用失败。',
    'zh-TW': '最近一次套用失敗。',
  },
  'general.title': { en: 'General', 'zh-CN': '通用', 'zh-TW': '一般' },
  'general.help': {
    en: 'Startup and quick-switch behavior.',
    'zh-CN': '启动和快速切换行为。',
    'zh-TW': '啟動與快速切換行為。',
  },
  'general.startup.title': {
    en: 'Startup profile',
    'zh-CN': '启动情景模式',
    'zh-TW': '啟動情境模式',
  },
  'general.startup.label': {
    en: 'Profile used when the extension starts',
    'zh-CN': '扩展启动时使用的情景模式',
    'zh-TW': '擴充功能啟動時使用的情境模式',
  },
  'general.startup.aria': { en: 'Startup route', 'zh-CN': '启动路由', 'zh-TW': '啟動路由' },
  'general.startup.keepCurrent': {
    en: 'Keep current browser setting',
    'zh-CN': '保持当前浏览器设置',
    'zh-TW': '保留目前瀏覽器設定',
  },
  'general.startup.revert': {
    en: 'Revert proxy changes when ZeroOmega releases control',
    'zh-CN': 'ZeroOmega 释放控制权时恢复代理更改',
    'zh-TW': 'ZeroOmega 釋放控制權時復原 Proxy 變更',
  },
  'general.quickSwitch.title': { en: 'Quick Switch', 'zh-CN': '快速切换', 'zh-TW': '快速切換' },
  'general.quickSwitch.enable': {
    en: 'Enable quick switching in the popup',
    'zh-CN': '在弹出菜单中启用快速切换',
    'zh-TW': '在彈出式選單中啟用快速切換',
  },
  'general.quickSwitch.refreshTabs': {
    en: 'Refresh active tabs after switching',
    'zh-CN': '切换后刷新活动标签页',
    'zh-TW': '切換後重新整理作用中分頁',
  },
  'general.quickSwitch.orderAria': {
    en: 'Quick-switch route order',
    'zh-CN': '快速切换路由顺序',
    'zh-TW': '快速切換路由順序',
  },
  'general.quickSwitch.up': { en: 'Up', 'zh-CN': '上移', 'zh-TW': '上移' },
  'general.quickSwitch.down': { en: 'Down', 'zh-CN': '下移', 'zh-TW': '下移' },
  'general.quickSwitch.remove': { en: 'Remove', 'zh-CN': '移除', 'zh-TW': '移除' },
  'general.quickSwitch.addAria': {
    en: 'Add quick-switch route',
    'zh-CN': '添加快速切换路由',
    'zh-TW': '加入快速切換路由',
  },
  'general.quickSwitch.addProfile': {
    en: 'Add profile…',
    'zh-CN': '添加情景模式…',
    'zh-TW': '加入情境模式…',
  },
  'general.diagnostics.title': {
    en: 'Request diagnostics',
    'zh-CN': '请求诊断',
    'zh-TW': '請求診斷',
  },
  'general.diagnostics.allow': {
    en: 'Allow bounded request diagnostics',
    'zh-CN': '允许有界请求诊断',
    'zh-TW': '允許有界請求診斷',
  },
  'general.diagnostics.help': {
    en: 'Monitoring starts only from the diagnostics page for this browser session. Headers, bodies, cookies, credentials, query strings, and response content are never collected.',
    'zh-CN':
      '只有从诊断页明确启动后，才会在当前浏览器会话中监控。不会收集请求头、正文、Cookie、凭据、查询参数或响应内容。',
    'zh-TW':
      '只有從診斷頁明確啟動後，才會在目前瀏覽器工作階段中監控。不會收集請求標頭、本文、Cookie、憑證、查詢參數或回應內容。',
  },
  'general.diagnostics.permissionGranted': {
    en: 'Browser permission granted.',
    'zh-CN': '浏览器权限已授予。',
    'zh-TW': '瀏覽器權限已授予。',
  },
  'general.diagnostics.requesting': {
    en: 'Requesting…',
    'zh-CN': '正在请求…',
    'zh-TW': '正在要求…',
  },
  'general.diagnostics.grant': {
    en: 'Grant monitoring permission',
    'zh-CN': '授予监控权限',
    'zh-TW': '授予監控權限',
  },
  'general.diagnostics.open': {
    en: 'Open request diagnostics',
    'zh-CN': '打开请求诊断',
    'zh-TW': '開啟請求診斷',
  },
  'general.diagnostics.permissionDenied': {
    en: 'Request monitoring permission was not granted.',
    'zh-CN': '未授予请求监控权限。',
    'zh-TW': '未授予請求監控權限。',
  },
  'general.diagnostics.permissionFailed': {
    en: 'Request monitoring permission could not be requested.',
    'zh-CN': '无法请求监控权限。',
    'zh-TW': '無法要求監控權限。',
  },
  'interface.title': { en: 'Interface', 'zh-CN': '界面', 'zh-TW': '介面' },
  'interface.help': {
    en: 'Behavior matching the original ZeroOmega options page.',
    'zh-CN': '与原版 ZeroOmega 选项页一致的界面行为。',
    'zh-TW': '與原版 ZeroOmega 選項頁一致的介面行為。',
  },
  'interface.confirmation.title': {
    en: 'Confirmation and editing',
    'zh-CN': '确认和编辑',
    'zh-TW': '確認與編輯',
  },
  'interface.confirmDeletion': {
    en: 'Confirm before deleting a profile',
    'zh-CN': '删除情景模式前要求确认',
    'zh-TW': '刪除情境模式前要求確認',
  },
  'interface.addConditionsBottom': {
    en: 'Add new switching conditions to the bottom',
    'zh-CN': '将新的切换条件添加到底部',
    'zh-TW': '將新的切換條件加入底部',
  },
  'interface.showAdvanced': {
    en: 'Show advanced condition types',
    'zh-CN': '显示高级条件类型',
    'zh-TW': '顯示進階條件類型',
  },
  'interface.menus.title': { en: 'Menus and status', 'zh-CN': '菜单和状态', 'zh-TW': '選單與狀態' },
  'interface.showInspect': {
    en: 'Show inspect menu',
    'zh-CN': '显示检查菜单',
    'zh-TW': '顯示檢查選單',
  },
  'interface.showResultBadge': {
    en: 'Show result profile on the toolbar badge',
    'zh-CN': '在工具栏徽章上显示结果情景模式',
    'zh-TW': '在工具列徽章上顯示結果情境模式',
  },
  'interface.showExternal': {
    en: 'Show profiles controlled by other extensions',
    'zh-CN': '显示由其他扩展控制的情景模式',
    'zh-TW': '顯示由其他擴充功能控制的情境模式',
  },
  'interface.exportLegacyRuleList': {
    en: 'Export legacy rule-list format when requested',
    'zh-CN': '按需导出旧版规则列表格式',
    'zh-TW': '依需求匯出舊版規則清單格式',
  },
  'theme.pageTitle': { en: 'Theme', 'zh-CN': '主题', 'zh-TW': '佈景主題' },
  'theme.pageHelp': {
    en: 'Default: follow the operating-system appearance.',
    'zh-CN': '默认跟随操作系统外观。',
    'zh-TW': '預設跟隨作業系統外觀。',
  },
  'theme.appearance': { en: 'Appearance', 'zh-CN': '外观', 'zh-TW': '外觀' },
  'theme.groupAria': { en: 'Theme', 'zh-CN': '主题', 'zh-TW': '佈景主題' },
  'theme.auto.title': { en: 'Automatic', 'zh-CN': '自动', 'zh-TW': '自動' },
  'theme.auto.description': {
    en: 'Follow the operating-system appearance.',
    'zh-CN': '跟随操作系统外观。',
    'zh-TW': '跟隨作業系統外觀。',
  },
  'theme.light.title': { en: 'Light', 'zh-CN': '浅色', 'zh-TW': '淺色' },
  'theme.light.description': {
    en: 'Use the light appearance everywhere.',
    'zh-CN': '始终使用浅色外观。',
    'zh-TW': '一律使用淺色外觀。',
  },
  'theme.dark.title': { en: 'Dark', 'zh-CN': '深色', 'zh-TW': '深色' },
  'theme.dark.description': {
    en: 'Use the dark appearance everywhere.',
    'zh-CN': '始终使用深色外观。',
    'zh-TW': '一律使用深色外觀。',
  },
  'theme.defaultHelp': {
    en: 'Automatic is the default and follows the current browser and operating-system preference.',
    'zh-CN': '“自动”为默认设置，会跟随当前浏览器和操作系统偏好。',
    'zh-TW': '「自動」為預設設定，會跟隨目前瀏覽器與作業系統偏好。',
  },
  'popup.switcherAria': {
    en: 'ZeroOmega Nex profile switcher',
    'zh-CN': 'ZeroOmega Nex 情景模式切换器',
    'zh-TW': 'ZeroOmega Nex 情境模式切換器',
  },
  'popup.profilesAria': { en: 'Profiles', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'popup.loading': {
    en: 'Loading applied profiles…',
    'zh-CN': '正在加载已应用的情景模式…',
    'zh-TW': '正在載入已套用的情境模式…',
  },
  'popup.error.safe': {
    en: 'The popup operation could not be completed. Reopen the popup and retry.',
    'zh-CN': '无法完成弹出菜单操作。请重新打开弹出菜单后重试。',
    'zh-TW': '無法完成彈出式選單操作。請重新開啟彈出式選單後重試。',
  },
  'popup.ownership.app': {
    en: 'Another application is controlling proxy settings. Disable or remove the conflicting application.',
    'zh-CN': '其他应用正在控制代理设置。请禁用或者卸载发生冲突的应用。',
    'zh-TW': '其他應用程式正在控制 Proxy 設定。請停用或移除發生衝突的應用程式。',
  },
  'popup.ownership.policy': {
    en: 'Proxy settings are enforced by local policy and cannot be changed. Contact your administrator.',
    'zh-CN': '代理设置被本地策略强制指定，无法修改。请联系系统管理员。',
    'zh-TW': 'Proxy 設定由本機原則強制指定，無法修改。請聯絡系統管理員。',
  },
  'popup.ownership.disabled': {
    en: 'ZeroOmega cannot control proxy settings because a required browser permission is disabled.',
    'zh-CN': '浏览器所需权限已关闭，ZeroOmega 无法控制代理设置。',
    'zh-TW': '瀏覽器所需權限已關閉，ZeroOmega 無法控制 Proxy 設定。',
  },
  'popup.ownership.unknown': {
    en: 'ZeroOmega cannot inspect or change the browser proxy settings.',
    'zh-CN': 'ZeroOmega 无法检查或修改浏览器代理设置。',
    'zh-TW': 'ZeroOmega 無法檢查或修改瀏覽器 Proxy 設定。',
  },
  'popup.ownership.details': {
    en: 'ZeroOmega cannot switch profiles until this problem is resolved.',
    'zh-CN': '如果不解决以上问题，则无法使用 ZeroOmega 切换代理。',
    'zh-TW': '若不解決以上問題，則無法使用 ZeroOmega 切換 Proxy。',
  },
  'popup.cancel': { en: 'Cancel', 'zh-CN': '取消', 'zh-TW': '取消' },
  'popup.manageExtensions': {
    en: 'Manage extensions',
    'zh-CN': '管理扩展',
    'zh-TW': '管理擴充功能',
  },
  'popup.quickDisabled': {
    en: 'Quick switching is disabled in Options.',
    'zh-CN': '快速切换已在选项中关闭。',
    'zh-TW': '快速切換已在選項中關閉。',
  },
  'popup.noRoutes': {
    en: 'No quick-switch routes are configured.',
    'zh-CN': '尚未配置快速切换路由。',
    'zh-TW': '尚未設定快速切換路由。',
  },
  'popup.currentProfile': {
    en: 'Current profile',
    'zh-CN': '当前情景模式',
    'zh-TW': '目前情境模式',
  },
  'popup.result': { en: 'Result', 'zh-CN': '结果', 'zh-TW': '結果' },
  'popup.externalProfile': {
    en: 'External Profile',
    'zh-CN': '外部情景模式',
    'zh-TW': '外部情境模式',
  },
  'popup.profileName': { en: 'Profile name', 'zh-CN': '情景模式名称', 'zh-TW': '情境模式名稱' },
  'popup.externalNameAria': {
    en: 'External profile name',
    'zh-CN': '外部情景模式名称',
    'zh-TW': '外部情境模式名稱',
  },
  'popup.saving': { en: 'Saving…', 'zh-CN': '正在保存…', 'zh-TW': '正在儲存…' },
  'popup.saveName': { en: 'Save name', 'zh-CN': '保存名称', 'zh-TW': '儲存名稱' },
  'popup.name.required': {
    en: 'Profile name is required.',
    'zh-CN': '必须输入情景模式名称。',
    'zh-TW': '必須輸入情境模式名稱。',
  },
  'popup.name.underscore': {
    en: 'Profile name cannot start with an underscore.',
    'zh-CN': '情景模式名称不能以下划线开头。',
    'zh-TW': '情境模式名稱不能以下劃線開頭。',
  },
  'popup.name.duplicate': {
    en: 'A profile with this name already exists.',
    'zh-CN': '已存在同名情景模式。',
    'zh-TW': '已存在同名情境模式。',
  },
  'popup.inspectingContext': {
    en: 'Inspecting context target',
    'zh-CN': '正在检查右键目标',
    'zh-TW': '正在檢查右鍵目標',
  },
  'popup.inspectRequests': { en: 'Inspect requests', 'zh-CN': '检查请求', 'zh-TW': '檢查請求' },
  'popup.temporaryRulesAria': {
    en: 'Temporary rules',
    'zh-CN': '临时规则',
    'zh-TW': '暫時規則',
  },
  'popup.noTemporaryRule': {
    en: 'No temporary rule',
    'zh-CN': '不使用临时规则',
    'zh-TW': '不使用暫時規則',
  },
  'popup.condition.hostWildcard': {
    en: 'Host wildcard',
    'zh-CN': '主机通配符',
    'zh-TW': '主機萬用字元',
  },
  'popup.condition.hostRegex': {
    en: 'Host regular expression',
    'zh-CN': '主机正则表达式',
    'zh-TW': '主機規則運算式',
  },
  'popup.condition.urlWildcard': {
    en: 'URL wildcard',
    'zh-CN': '网址通配符',
    'zh-TW': '網址萬用字元',
  },
  'popup.condition.urlRegex': {
    en: 'URL regular expression',
    'zh-CN': '网址正则表达式',
    'zh-TW': '網址規則運算式',
  },
  'popup.condition.keyword': { en: 'URL keyword', 'zh-CN': '网址关键词', 'zh-TW': '網址關鍵字' },
  'popup.conditionType': { en: 'Condition type', 'zh-CN': '条件类型', 'zh-TW': '條件類型' },
  'popup.conditionTypeAria': {
    en: 'Current site condition type',
    'zh-CN': '当前网站条件类型',
    'zh-TW': '目前網站條件類型',
  },
  'popup.pattern': { en: 'Pattern', 'zh-CN': '匹配内容', 'zh-TW': '比對內容' },
  'popup.patternAria': {
    en: 'Current site condition pattern',
    'zh-CN': '当前网站条件匹配内容',
    'zh-TW': '目前網站條件比對內容',
  },
  'popup.resultProfile': { en: 'Result profile', 'zh-CN': '结果情景模式', 'zh-TW': '結果情境模式' },
  'popup.resultProfileAria': {
    en: 'Current site result profile',
    'zh-CN': '当前网站结果情景模式',
    'zh-TW': '目前網站結果情境模式',
  },
  'popup.adding': { en: 'Adding…', 'zh-CN': '正在添加…', 'zh-TW': '正在加入…' },
  'popup.addCondition': { en: 'Add condition', 'zh-CN': '添加条件', 'zh-TW': '加入條件' },
  'popup.currentSiteActionsAria': {
    en: 'Current site actions',
    'zh-CN': '当前网站操作',
    'zh-TW': '目前網站操作',
  },
  'popup.optionsAria': {
    en: 'Open ZeroOmega Nex options',
    'zh-CN': '打开 ZeroOmega Nex 选项',
    'zh-TW': '開啟 ZeroOmega Nex 選項',
  },
  'popup.opening': { en: 'Opening…', 'zh-CN': '正在打开…', 'zh-TW': '正在開啟…' },
  'popup.options': { en: 'Options', 'zh-CN': '选项', 'zh-TW': '選項' },
  'popup.switching': { en: 'Switching…', 'zh-CN': '正在切换…', 'zh-TW': '正在切換…' },
  'tempRules.pageAria': {
    en: 'Temporary rules manager',
    'zh-CN': '临时规则管理器',
    'zh-TW': '暫時規則管理器',
  },
  'tempRules.title': { en: 'Temporary Rules', 'zh-CN': '临时规则', 'zh-TW': '暫時規則' },
  'tempRules.help': {
    en: 'These rules last for the current browser session and are not written to Options.',
    'zh-CN': '这些规则仅在当前浏览器会话中有效，不会写入选项。',
    'zh-TW': '這些規則僅在目前瀏覽器工作階段中有效，不會寫入選項。',
  },
  'tempRules.clearAll': {
    en: 'Delete all temporary rules',
    'zh-CN': '删除所有临时规则',
    'zh-TW': '刪除所有暫時規則',
  },
  'tempRules.error.safe': {
    en: 'The temporary-rule operation could not be completed. Retry the operation.',
    'zh-CN': '无法完成临时规则操作。请重试。',
    'zh-TW': '無法完成暫時規則操作。請重試。',
  },
  'tempRules.loading': {
    en: 'Loading temporary rules…',
    'zh-CN': '正在加载临时规则…',
    'zh-TW': '正在載入暫時規則…',
  },
  'tempRules.empty': {
    en: 'No temporary rules are active.',
    'zh-CN': '当前没有生效的临时规则。',
    'zh-TW': '目前沒有作用中的暫時規則。',
  },
  'tempRules.tableAria': {
    en: 'Temporary rules',
    'zh-CN': '临时规则列表',
    'zh-TW': '暫時規則清單',
  },
  'tempRules.domain': { en: 'Domain', 'zh-CN': '域名', 'zh-TW': '網域' },
  'tempRules.resultProfile': {
    en: 'Result profile',
    'zh-CN': '结果情景模式',
    'zh-TW': '結果情境模式',
  },
  'tempRules.action': { en: 'Action', 'zh-CN': '操作', 'zh-TW': '操作' },
  'network.pageAria': {
    en: 'Request diagnostics',
    'zh-CN': '请求诊断',
    'zh-TW': '請求診斷',
  },
  'network.title': { en: 'Request diagnostics', 'zh-CN': '请求诊断', 'zh-TW': '請求診斷' },
  'network.help': {
    en: 'Failed and timed-out requests for this browser session.',
    'zh-CN': '当前浏览器会话中失败和超时的请求。',
    'zh-TW': '目前瀏覽器工作階段中失敗與逾時的請求。',
  },
  'network.start': { en: 'Start monitoring', 'zh-CN': '开始监控', 'zh-TW': '開始監控' },
  'network.stop': { en: 'Stop monitoring', 'zh-CN': '停止监控', 'zh-TW': '停止監控' },
  'network.refresh': { en: 'Refresh', 'zh-CN': '刷新', 'zh-TW': '重新整理' },
  'network.clear': { en: 'Clear diagnostics', 'zh-CN': '清除诊断', 'zh-TW': '清除診斷' },
  'network.error.safe': {
    en: 'Request diagnostics could not be updated. Retry the operation.',
    'zh-CN': '无法更新请求诊断。请重试。',
    'zh-TW': '無法更新請求診斷。請重試。',
  },
  'network.permissionDenied': {
    en: 'Request monitoring permission was not granted.',
    'zh-CN': '未授予请求监控权限。',
    'zh-TW': '未授予請求監控權限。',
  },
  'network.disabled': {
    en: 'Monitoring is disabled in Options.',
    'zh-CN': '请求监控已在选项中关闭。',
    'zh-TW': '請求監控已在選項中關閉。',
  },
  'network.stopped': {
    en: 'Monitoring is stopped for this browser session.',
    'zh-CN': '当前浏览器会话的监控已停止。',
    'zh-TW': '目前瀏覽器工作階段的監控已停止。',
  },
  'network.permissionPending': {
    en: 'Permission will be requested when monitoring starts.',
    'zh-CN': '开始监控时才会请求权限。',
    'zh-TW': '開始監控時才會要求權限。',
  },
  'network.loading': {
    en: 'Loading request diagnostics…',
    'zh-CN': '正在加载请求诊断…',
    'zh-TW': '正在載入請求診斷…',
  },
  'network.empty': {
    en: 'No request errors recorded.',
    'zh-CN': '没有记录到请求错误。',
    'zh-TW': '沒有記錄到請求錯誤。',
  },
  'network.tableAria': {
    en: 'Request diagnostics records',
    'zh-CN': '请求诊断记录',
    'zh-TW': '請求診斷記錄',
  },
  'network.time': { en: 'Time', 'zh-CN': '时间', 'zh-TW': '時間' },
  'network.status': { en: 'Status', 'zh-CN': '状态', 'zh-TW': '狀態' },
  'network.type': { en: 'Type', 'zh-CN': '类型', 'zh-TW': '類型' },
  'network.url': { en: 'URL', 'zh-CN': '网址', 'zh-TW': '網址' },
  'network.error': { en: 'Error', 'zh-CN': '错误', 'zh-TW': '錯誤' },
  'network.timedOut': { en: 'Timed out', 'zh-CN': '超时', 'zh-TW': '逾時' },
  'network.failed': { en: 'Failed', 'zh-CN': '失败', 'zh-TW': '失敗' },
  'history.nav': { en: 'Snapshot History', 'zh-CN': '配置历史', 'zh-TW': '設定歷史' },
  'history.pageTitle': { en: 'Configuration History', 'zh-CN': '配置历史', 'zh-TW': '設定歷史' },
  'history.pageHelp': {
    en: 'Inspect or restore a previously verified configuration.',
    'zh-CN': '检查或恢复以前验证通过的配置。',
    'zh-TW': '檢查或還原先前驗證通過的設定。',
  },
  'history.configurationHistory': {
    en: 'Configuration history',
    'zh-CN': '配置历史',
    'zh-TW': '設定歷史',
  },
  'history.configurationHelp': {
    en: 'Revision, compiler, and verification metadata. Profile contents, PAC source, and secret material are never returned to this page.',
    'zh-CN': '显示修订、编译器和验证元数据。本页面不会读取情景模式内容、PAC 源代码或秘密材料。',
    'zh-TW': '顯示修訂、編譯器與驗證中繼資料。本頁面不會讀取情境模式內容、PAC 原始碼或秘密資料。',
  },
  'history.refresh': { en: 'Refresh history', 'zh-CN': '刷新历史', 'zh-TW': '重新整理歷史' },
  'history.refreshing': { en: 'Refreshing…', 'zh-CN': '正在刷新…', 'zh-TW': '正在重新整理…' },
  'history.dirtyDraft': {
    en: 'Draft contains unapplied changes. Apply or Discard those changes before rolling back a snapshot.',
    'zh-CN': '草稿包含尚未应用的更改。请先应用或放弃这些更改，再回滚快照。',
    'zh-TW': '草稿包含尚未套用的變更。請先套用或捨棄這些變更，再復原快照。',
  },
  'history.loading': {
    en: 'Loading verified snapshot and revision history…',
    'zh-CN': '正在加载已验证的快照和修订历史…',
    'zh-TW': '正在載入已驗證的快照與修訂歷史…',
  },
  'history.loadFailed': {
    en: 'Configuration history could not be loaded.',
    'zh-CN': '无法加载配置历史。',
    'zh-TW': '無法載入設定歷史。',
  },
  'history.rollbackFailed': {
    en: 'Snapshot rollback failed. Review the workflow error and retry.',
    'zh-CN': '快照回滚失败。请检查工作流错误后重试。',
    'zh-TW': '快照復原失敗。請檢查工作流程錯誤後重試。',
  },
  'history.revisions': {
    en: 'ProfileSpec revisions',
    'zh-CN': 'ProfileSpec 修订',
    'zh-TW': 'ProfileSpec 修訂',
  },
  'history.noRevisions': {
    en: 'No archived revisions are available.',
    'zh-CN': '没有可用的已归档修订。',
    'zh-TW': '沒有可用的已封存修訂。',
  },
  'history.revisionHistoryAria': {
    en: 'ProfileSpec revision history',
    'zh-CN': 'ProfileSpec 修订历史',
    'zh-TW': 'ProfileSpec 修訂歷史',
  },
  'history.applied': { en: 'Applied', 'zh-CN': '已应用', 'zh-TW': '已套用' },
  'history.parent': { en: 'Parent', 'zh-CN': '父修订', 'zh-TW': '上層修訂' },
  'history.device': { en: 'Device', 'zh-CN': '设备', 'zh-TW': '裝置' },
  'history.profiles': { en: 'Profiles', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'history.endpoints': { en: 'Endpoints', 'zh-CN': '代理端点', 'zh-TW': '代理端點' },
  'history.ruleSources': { en: 'Rule sources', 'zh-CN': '规则源', 'zh-TW': '規則來源' },
  'history.snapshots': {
    en: 'Verified PAC snapshots',
    'zh-CN': '已验证的 PAC 快照',
    'zh-TW': '已驗證的 PAC 快照',
  },
  'history.noSnapshots': {
    en: 'No verified PAC snapshots are stored yet. Direct and System activations do not create PAC snapshots.',
    'zh-CN': '尚未保存已验证的 PAC 快照。直接连接和系统代理不会创建 PAC 快照。',
    'zh-TW': '尚未儲存已驗證的 PAC 快照。直接連線與系統代理不會建立 PAC 快照。',
  },
  'history.snapshotStatusAria': { en: 'Snapshot status', 'zh-CN': '快照状态', 'zh-TW': '快照狀態' },
  'history.active': { en: 'Active', 'zh-CN': '当前活动', 'zh-TW': '目前作用中' },
  'history.lastKnownGood': {
    en: 'Last known good',
    'zh-CN': '上一个已知可用快照',
    'zh-TW': '上一個已知可用快照',
  },
  'history.sourceRevision': { en: 'Source revision', 'zh-CN': '源修订', 'zh-TW': '來源修訂' },
  'history.startRoute': { en: 'Start route', 'zh-CN': '起始路由', 'zh-TW': '起始路由' },
  'history.browserTarget': { en: 'Browser target', 'zh-CN': '浏览器目标', 'zh-TW': '瀏覽器目標' },
  'history.capability': { en: 'Capability', 'zh-CN': '能力级别', 'zh-TW': '能力等級' },
  'history.compiler': { en: 'Compiler', 'zh-CN': '编译器', 'zh-TW': '編譯器' },
  'history.pacHash': { en: 'PAC hash', 'zh-CN': 'PAC 哈希', 'zh-TW': 'PAC 雜湊' },
  'history.profileSpecHash': {
    en: 'ProfileSpec hash',
    'zh-CN': 'ProfileSpec 哈希',
    'zh-TW': 'ProfileSpec 雜湊',
  },
  'history.verificationMode': { en: 'Verification mode', 'zh-CN': '验证模式', 'zh-TW': '驗證模式' },
  'history.verificationVectors': {
    en: 'Verification vectors',
    'zh-CN': '验证向量',
    'zh-TW': '驗證向量',
  },
  'history.verificationDifferential': {
    en: 'Node differential execution',
    'zh-CN': 'Node 差分执行',
    'zh-TW': 'Node 差分執行',
  },
  'history.verificationReferenceSafety': {
    en: 'Extension reference-safety check plus browser install confirmation',
    'zh-CN': '扩展引用安全检查及浏览器安装确认',
    'zh-TW': '擴充功能引用安全檢查及瀏覽器安裝確認',
  },
  'history.verificationLegacy': {
    en: 'Legacy verification record',
    'zh-CN': '旧版验证记录',
    'zh-TW': '舊版驗證記錄',
  },
  'history.pacSize': { en: 'PAC size', 'zh-CN': 'PAC 大小', 'zh-TW': 'PAC 大小' },
  'history.bytes': { en: 'bytes', 'zh-CN': '字节', 'zh-TW': '位元組' },
  'history.conditions': { en: 'Conditions', 'zh-CN': '条件', 'zh-TW': '條件' },
  'history.sourceUnavailable': {
    en: 'The source ProfileSpec revision is unavailable; rollback is disabled.',
    'zh-CN': '源 ProfileSpec 修订不可用，因此无法回滚。',
    'zh-TW': '來源 ProfileSpec 修訂不可用，因此無法復原。',
  },
  'history.confirmTitle': {
    en: 'Confirm snapshot rollback',
    'zh-CN': '确认回滚快照',
    'zh-TW': '確認復原快照',
  },
  'history.confirmRollback': { en: 'Confirm rollback', 'zh-CN': '确认回滚', 'zh-TW': '確認復原' },
  'history.rollingBack': { en: 'Rolling back…', 'zh-CN': '正在回滚…', 'zh-TW': '正在復原…' },
  'history.currentlyActive': {
    en: 'Currently active',
    'zh-CN': '当前正在使用',
    'zh-TW': '目前正在使用',
  },
  'history.rollbackToSnapshot': {
    en: 'Rollback to this snapshot',
    'zh-CN': '回滚到此快照',
    'zh-TW': '復原到此快照',
  },
  'legacy.pageTitle': { en: 'Import / Export', 'zh-CN': '导入 / 导出', 'zh-TW': '匯入 / 匯出' },
  'legacy.pageHelp': {
    en: 'Move from original ZeroOmega or SwitchyOmega without rebuilding profiles.',
    'zh-CN': '无需重新创建情景模式，即可从原版 ZeroOmega 或 SwitchyOmega 迁移。',
    'zh-TW': '無需重新建立情境模式，即可從原版 ZeroOmega 或 SwitchyOmega 移轉。',
  },
  'legacy.exportTitle': { en: 'Export options', 'zh-CN': '导出选项', 'zh-TW': '匯出選項' },
  'legacy.exportHelp': {
    en: 'Download an original-compatible schema-v2 .bak file. Current editor changes are applied first, matching the original extension. Passwords and sensitive request headers are never included.',
    'zh-CN':
      '下载兼容原版的 schema-v2 .bak 文件。与原版扩展一致，当前编辑器更改会先应用；密码和敏感请求头绝不会写入备份。',
    'zh-TW':
      '下載相容原版的 schema-v2 .bak 檔案。與原版擴充功能一致，目前編輯器變更會先套用；密碼與敏感請求標頭絕不會寫入備份。',
  },
  'legacy.exportAria': {
    en: 'Export options backup',
    'zh-CN': '导出选项备份',
    'zh-TW': '匯出選項備份',
  },
  'legacy.preparing': {
    en: 'Preparing backup…',
    'zh-CN': '正在准备备份…',
    'zh-TW': '正在準備備份…',
  },
  'legacy.exportAction': { en: 'Export options', 'zh-CN': '导出选项', 'zh-TW': '匯出選項' },
  'legacy.exported': { en: 'Backup exported.', 'zh-CN': '备份已导出。', 'zh-TW': '備份已匯出。' },
  'legacy.exportFailed': {
    en: 'The options backup could not be exported.',
    'zh-CN': '无法导出选项备份。',
    'zh-TW': '無法匯出選項備份。',
  },
  'legacy.exportWarningDetail': {
    en: 'This compatibility or secret-safety item was omitted from the backup.',
    'zh-CN': '为确保兼容性或秘密安全，此项目未写入备份。',
    'zh-TW': '為確保相容性或秘密安全，此項目未寫入備份。',
  },
  'legacy.restoreTitle': {
    en: 'Restore original ZeroOmega / SwitchyOmega backup',
    'zh-CN': '恢复原版 ZeroOmega / SwitchyOmega 备份',
    'zh-TW': '還原原版 ZeroOmega / SwitchyOmega 備份',
  },
  'legacy.restoreHelp': {
    en: 'Select the backup file exported by the original extension. JSON, base64 backup text, and common .bak/.txt files are accepted.',
    'zh-CN': '请选择原版扩展导出的备份文件。支持 JSON、Base64 备份文本以及常见的 .bak/.txt 文件。',
    'zh-TW':
      '請選擇原版擴充功能匯出的備份檔案。支援 JSON、Base64 備份文字及常見的 .bak/.txt 檔案。',
  },
  'legacy.backupFile': { en: 'Backup file', 'zh-CN': '备份文件', 'zh-TW': '備份檔案' },
  'legacy.backupFileAria': {
    en: 'Legacy backup file',
    'zh-CN': '原版备份文件',
    'zh-TW': '原版備份檔案',
  },
  'legacy.pasteInstead': {
    en: 'Paste backup text instead',
    'zh-CN': '改为粘贴备份文本',
    'zh-TW': '改為貼上備份文字',
  },
  'legacy.backupTextAria': { en: 'Legacy backup', 'zh-CN': '原版备份', 'zh-TW': '原版備份' },
  'legacy.backupPlaceholder': {
    en: 'Paste the complete ZeroOmega / SwitchyOmega backup',
    'zh-CN': '粘贴完整的 ZeroOmega / SwitchyOmega 备份',
    'zh-TW': '貼上完整的 ZeroOmega / SwitchyOmega 備份',
  },
  'legacy.reading': { en: 'Reading backup…', 'zh-CN': '正在读取备份…', 'zh-TW': '正在讀取備份…' },
  'legacy.read': { en: 'Read backup', 'zh-CN': '读取备份', 'zh-TW': '讀取備份' },
  'legacy.readFailed': {
    en: 'The selected backup could not be read or decoded.',
    'zh-CN': '无法读取或解析所选备份。',
    'zh-TW': '無法讀取或解析所選備份。',
  },
  'legacy.compatibilityTitle': {
    en: 'Compatibility check',
    'zh-CN': '兼容性检查',
    'zh-TW': '相容性檢查',
  },
  'legacy.encoding': { en: 'Encoding', 'zh-CN': '编码', 'zh-TW': '編碼' },
  'legacy.encoding.json': { en: 'JSON', 'zh-CN': 'JSON', 'zh-TW': 'JSON' },
  'legacy.encoding.base64': { en: 'Base64 JSON', 'zh-CN': 'Base64 JSON', 'zh-TW': 'Base64 JSON' },
  'legacy.encoding.object': { en: 'Object', 'zh-CN': '对象', 'zh-TW': '物件' },
  'legacy.profiles': { en: 'Profiles', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'legacy.endpoints': { en: 'Proxy endpoints', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  'legacy.ruleSources': { en: 'Rule sources', 'zh-CN': '规则来源', 'zh-TW': '規則來源' },
  'legacy.credentials': { en: 'Credentials', 'zh-CN': '凭据', 'zh-TW': '憑證' },
  'legacy.credentialsSecure': {
    en: 'Will be migrated securely',
    'zh-CN': '将安全迁移',
    'zh-TW': '將安全移轉',
  },
  'legacy.credentialsNone': { en: 'None', 'zh-CN': '无', 'zh-TW': '無' },
  'legacy.secretNotice': {
    en: 'Passwords, sensitive request headers, and sync credentials are extracted into background-owned secret storage and never enter ProfileSpec, reports, logs, or ordinary exports.',
    'zh-CN':
      '密码、敏感请求头和同步凭据会被抽离到后台管理的秘密存储中，绝不会进入 ProfileSpec、报告、日志或普通导出文件。',
    'zh-TW':
      '密碼、敏感請求標頭與同步憑證會被抽離到背景管理的秘密儲存中，絕不會進入 ProfileSpec、報告、記錄或一般匯出檔案。',
  },
  'legacy.statusTotalsAria': {
    en: 'Import status totals',
    'zh-CN': '导入状态统计',
    'zh-TW': '匯入狀態統計',
  },
  'legacy.status.exact': { en: 'Exact', 'zh-CN': '完全兼容', 'zh-TW': '完全相容' },
  'legacy.status.targetDependent': {
    en: 'Target-dependent',
    'zh-CN': '取决于浏览器',
    'zh-TW': '視瀏覽器而定',
  },
  'legacy.status.downgraded': { en: 'Downgraded', 'zh-CN': '降级处理', 'zh-TW': '降級處理' },
  'legacy.status.preserved': { en: 'Preserved', 'zh-CN': '已保留', 'zh-TW': '已保留' },
  'legacy.status.generated': {
    en: 'Regenerated automatically',
    'zh-CN': '将自动重新生成',
    'zh-TW': '將自動重新產生',
  },
  'legacy.status.runtime': {
    en: 'Runtime state ignored',
    'zh-CN': '已忽略运行状态',
    'zh-TW': '已忽略執行狀態',
  },
  'legacy.status.unsupported': { en: 'Unsupported', 'zh-CN': '不支持', 'zh-TW': '不支援' },
  'legacy.detail.exact': {
    en: 'Imported without a semantic change.',
    'zh-CN': '已按原语义导入。',
    'zh-TW': '已依原語意匯入。',
  },
  'legacy.detail.targetDependent': {
    en: 'Behavior depends on browser capability and remains explicitly marked.',
    'zh-CN': '行为取决于浏览器能力，并保留明确标记。',
    'zh-TW': '行為取決於瀏覽器能力，並保留明確標記。',
  },
  'legacy.detail.downgraded': {
    en: 'Imported through a documented compatibility fallback.',
    'zh-CN': '已通过明确记录的兼容后备方式导入。',
    'zh-TW': '已透過明確記錄的相容後備方式匯入。',
  },
  'legacy.detail.preserved': {
    en: 'Preserved as safe legacy metadata.',
    'zh-CN': '已作为安全的原版元数据保留。',
    'zh-TW': '已作為安全的原版中繼資料保留。',
  },
  'legacy.detail.generated': {
    en: 'Generated data is omitted and will be rebuilt.',
    'zh-CN': '生成数据已省略，并会自动重新生成。',
    'zh-TW': '產生的資料已省略，並會自動重新產生。',
  },
  'legacy.detail.runtime': {
    en: 'Device or session runtime state is not part of the imported configuration.',
    'zh-CN': '设备或会话运行状态不属于导入配置。',
    'zh-TW': '裝置或工作階段執行狀態不屬於匯入設定。',
  },
  'legacy.detail.unsupported': {
    en: 'This item cannot be activated safely.',
    'zh-CN': '此项目无法安全启用。',
    'zh-TW': '此項目無法安全啟用。',
  },
  'legacy.technicalHelp': {
    en: 'Stable machine codes and source/target paths are shown instead of backend exception text.',
    'zh-CN': '此处显示稳定机器代码和源/目标路径，不直接呈现后台异常文本。',
    'zh-TW': '此處顯示穩定機器代碼與來源/目標路徑，不直接呈現背景例外文字。',
  },
  'legacy.importing': { en: 'Importing…', 'zh-CN': '正在导入…', 'zh-TW': '正在匯入…' },
  'legacy.importAndUse': {
    en: 'Import and use now',
    'zh-CN': '导入并立即使用',
    'zh-TW': '匯入並立即使用',
  },
  'legacy.importInactive': {
    en: 'Import without activating',
    'zh-CN': '只导入，暂不启用',
    'zh-TW': '僅匯入，暫不啟用',
  },
  'legacy.importActivated': {
    en: 'Import completed. The original configuration is now active.',
    'zh-CN': '导入完成，原版配置现已启用。',
    'zh-TW': '匯入完成，原版設定現已啟用。',
  },
  'legacy.importSaved': {
    en: 'Import completed without changing the active proxy. Use Apply changes when ready.',
    'zh-CN': '导入完成，但未改变当前代理。确认后请点击“应用选项”。',
    'zh-TW': '匯入完成，但未變更目前代理。確認後請按「套用選項」。',
  },
  'legacy.activateFailed': {
    en: 'The imported configuration could not be activated.',
    'zh-CN': '无法启用导入的配置。',
    'zh-TW': '無法啟用匯入的設定。',
  },
  'legacy.saveFailed': {
    en: 'The imported configuration could not be saved.',
    'zh-CN': '无法保存导入的配置。',
    'zh-TW': '無法儲存匯入的設定。',
  },
  'legacy.unsupportedAlert': {
    en: 'This backup contains unsupported or invalid entries. Open the technical details above.',
    'zh-CN': '此备份包含不支持或无效的项目。请展开上方技术迁移详情。',
    'zh-TW': '此備份包含不支援或無效的項目。請展開上方技術移轉詳情。',
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

export interface SourceUpdateFailureMessageParameters {
  readonly timestamp: string;
  readonly code: ProfileWorkflowSourceUpdateErrorCode;
  readonly httpStatus?: number;
  readonly limitBytes?: number;
}

export interface UiMessageParameters {
  readonly 'popup.profileMissing': { readonly profileId: string };
  readonly 'popup.profileDisabled': { readonly name: string };
  readonly 'popup.profileActive': { readonly name: string };
  readonly 'popup.activateProfile': { readonly name: string };
  readonly 'popup.resultFor': { readonly name: string };
  readonly 'popup.requestErrors': { readonly count: number };
  readonly 'popup.temporaryFor': { readonly domain: string };
  readonly 'popup.manageTemporary': { readonly count: number };
  readonly 'popup.addConditionTitle': { readonly name: string };
  readonly 'popup.currentSite': { readonly hostname: string };
  readonly 'popup.scope': { readonly domain: string };
  readonly 'popup.addFor': { readonly domain: string };
  readonly 'options.exported': { readonly filename: string; readonly warnings: number };
  readonly 'tempRules.deleteAria': { readonly domain: string };
  readonly 'network.bounds': {
    readonly records: number;
    readonly perTabLimit: number;
    readonly globalLimit: number;
    readonly minutes: number;
  };
  readonly 'profile.delete.blockedDescription': { readonly profileName: string };
  readonly 'profile.delete.confirmDescription': { readonly profileName: string };
  readonly 'pac.headerAria': {
    readonly index: number;
    readonly field: 'name' | 'type' | 'value';
  };
  readonly 'pac.updateFailed': SourceUpdateFailureMessageParameters;
  readonly 'pac.lastUpdated': {
    readonly timestamp: string;
    readonly bytes?: number;
    readonly stale: boolean;
  };
  readonly 'pac.authConfiguredFor': { readonly username: string };
  readonly 'history.profileRoute': { readonly profileId: string };
  readonly 'history.snapshotLabel': { readonly snapshotId: string };
  readonly 'history.vectorMatch': {
    readonly matchedCount: number;
    readonly vectorCount: number;
  };
  readonly 'history.warningCount': { readonly count: number };
  readonly 'history.rollbackDescription': { readonly revisionId: string };
  readonly 'legacy.compatibilityWarnings': { readonly count: number };
  readonly 'legacy.exportedWithWarnings': { readonly count: number };
  readonly 'legacy.technicalDetails': { readonly count: number };
  readonly 'fixed.fieldAria': {
    readonly scheme: string;
    readonly field: 'protocol' | 'server' | 'port';
  };
  readonly 'fixed.authUnsupported': { readonly protocol: string };
  readonly 'switch.ruleFieldAria': {
    readonly index: number;
    readonly field:
      | 'drag'
      | 'moveUp'
      | 'moveDown'
      | 'conditionType'
      | 'pattern'
      | 'ipAddress'
      | 'prefixLength'
      | 'minimumHostLevels'
      | 'maximumHostLevels'
      | 'weekdays'
      | 'startHour'
      | 'endHour'
      | 'resultProfile'
      | 'note';
  };
  readonly 'switch.ruleActionAria': {
    readonly index: number;
    readonly action: 'delete' | 'clone' | 'normalize' | 'showNote';
  };
  readonly 'switch.sourceError': {
    readonly code: string;
    readonly line?: number;
  };
  readonly 'ruleList.headerAria': {
    readonly scope: 'attached' | 'independent';
    readonly index: number;
    readonly field: 'name' | 'type' | 'value';
  };
  readonly 'ruleList.updateFailed': SourceUpdateFailureMessageParameters;
  readonly 'ruleList.lastUpdated': {
    readonly timestamp: string;
    readonly bytes?: number;
    readonly stale: boolean;
  };
}

export type UiMessageKey = keyof UiMessageParameters;

export function uiText(key: UiTextKey, locale: AppLocale = currentAppLocale()): string {
  return typedUiTextCatalog[key][locale];
}

export function profileKindText(kind: ProfileKind, locale: AppLocale = currentAppLocale()): string {
  return uiText(profileKindKeys[kind], locale);
}

function sourceUpdateFailureDetail(
  params: SourceUpdateFailureMessageParameters,
  locale: AppLocale,
): string {
  const { code, httpStatus, limitBytes } = params;
  const messages: Readonly<Record<ProfileWorkflowSourceUpdateErrorCode, LocalizedText>> = {
    'url-invalid': {
      en: 'The download URL is invalid.',
      'zh-CN': '下载网址无效。',
      'zh-TW': '下載網址無效。',
    },
    'url-scheme-unsupported': {
      en: 'Only HTTP and HTTPS downloads are supported.',
      'zh-CN': '仅支持 HTTP 和 HTTPS 下载。',
      'zh-TW': '僅支援 HTTP 與 HTTPS 下載。',
    },
    'url-credentials-forbidden': {
      en: 'The download URL cannot contain a username or password.',
      'zh-CN': '下载网址不能包含用户名或密码。',
      'zh-TW': '下載網址不可包含使用者名稱或密碼。',
    },
    'header-name-required': {
      en: 'A request-header name is required.',
      'zh-CN': '请求头名称不能为空。',
      'zh-TW': '請求標頭名稱不可留空。',
    },
    'header-name-invalid': {
      en: 'A request-header name is invalid.',
      'zh-CN': '请求头名称无效。',
      'zh-TW': '請求標頭名稱無效。',
    },
    'header-browser-controlled': {
      en: 'A request header is controlled by the browser.',
      'zh-CN': '该请求头由浏览器控制。',
      'zh-TW': '該請求標頭由瀏覽器控制。',
    },
    'header-duplicate': {
      en: 'A request-header name is duplicated.',
      'zh-CN': '请求头名称重复。',
      'zh-TW': '請求標頭名稱重複。',
    },
    'header-secret-unavailable': {
      en: 'A required secret request-header value is unavailable.',
      'zh-CN': '请求头所需的秘密值不可用。',
      'zh-TW': '請求標頭所需的秘密值不可用。',
    },
    'request-timeout': {
      en: 'The download request timed out.',
      'zh-CN': '下载请求超时。',
      'zh-TW': '下載請求逾時。',
    },
    'request-network-failed': {
      en: 'The download request failed before a response was received.',
      'zh-CN': '建立下载请求失败。',
      'zh-TW': '建立下載請求失敗。',
    },
    'response-http-error': {
      en: 'The server returned an HTTP error.',
      'zh-CN': '服务器返回 HTTP 错误。',
      'zh-TW': '伺服器傳回 HTTP 錯誤。',
    },
    'response-too-large': {
      en: 'The downloaded content exceeded the size limit.',
      'zh-CN': '下载内容超过大小上限。',
      'zh-TW': '下載內容超過大小上限。',
    },
    'response-empty': {
      en: 'The downloaded content was empty.',
      'zh-CN': '下载内容为空。',
      'zh-TW': '下載內容為空。',
    },
    'response-byte-count-invalid': {
      en: 'The downloader returned an invalid content size.',
      'zh-CN': '下载器返回了无效的内容大小。',
      'zh-TW': '下載器傳回了無效的內容大小。',
    },
    'unknown-failure': {
      en: 'The download failed for an unclassified reason.',
      'zh-CN': '下载失败，原因未分类。',
      'zh-TW': '下載失敗，原因未分類。',
    },
  };
  const base = messages[code][locale];
  if (code === 'response-http-error' && httpStatus !== undefined) {
    return locale === 'en'
      ? `${base.slice(0, -1)} (${httpStatus}).`
      : locale === 'zh-CN'
        ? `服务器返回 HTTP 错误（${httpStatus}）。`
        : `伺服器傳回 HTTP 錯誤（${httpStatus}）。`;
  }
  if (code === 'response-too-large' && limitBytes !== undefined) {
    return locale === 'en'
      ? `${base.slice(0, -1)} (${limitBytes} bytes).`
      : locale === 'zh-CN'
        ? `下载内容超过大小上限（${limitBytes} 字节）。`
        : `下載內容超過大小上限（${limitBytes} 位元組）。`;
  }
  return base;
}

export function uiMessage<K extends UiMessageKey>(
  key: K,
  params: UiMessageParameters[K],
  locale: AppLocale = currentAppLocale(),
): string {
  switch (key) {
    case 'popup.profileMissing': {
      const { profileId } = params as UiMessageParameters['popup.profileMissing'];
      if (locale === 'zh-CN') return `已应用配置中缺少情景模式 ${profileId}。`;
      if (locale === 'zh-TW') return `已套用設定中缺少情境模式 ${profileId}。`;
      return `Profile ${profileId} is missing from the applied configuration.`;
    }
    case 'popup.profileDisabled': {
      const { name } = params as UiMessageParameters['popup.profileDisabled'];
      if (locale === 'zh-CN') return `${name} 已禁用。`;
      if (locale === 'zh-TW') return `${name} 已停用。`;
      return `${name} is disabled.`;
    }
    case 'popup.profileActive': {
      const { name } = params as UiMessageParameters['popup.profileActive'];
      if (locale === 'zh-CN') return `${name} 当前已启用`;
      if (locale === 'zh-TW') return `${name} 目前已啟用`;
      return `${name} is active`;
    }
    case 'popup.activateProfile': {
      const { name } = params as UiMessageParameters['popup.activateProfile'];
      if (locale === 'zh-CN') return `启用 ${name}`;
      if (locale === 'zh-TW') return `啟用 ${name}`;
      return `Activate ${name}`;
    }
    case 'popup.resultFor': {
      const { name } = params as UiMessageParameters['popup.resultFor'];
      if (locale === 'zh-CN') return `${name} 的结果情景模式`;
      if (locale === 'zh-TW') return `${name} 的結果情境模式`;
      return `Result profile for ${name}`;
    }
    case 'popup.requestErrors': {
      const { count } = params as UiMessageParameters['popup.requestErrors'];
      if (locale === 'zh-CN') return `${count} 个请求错误`;
      if (locale === 'zh-TW') return `${count} 個請求錯誤`;
      return `${count} request error${count === 1 ? '' : 's'}`;
    }
    case 'popup.temporaryFor': {
      const { domain } = params as UiMessageParameters['popup.temporaryFor'];
      if (locale === 'zh-CN') return `${domain} 的临时情景模式`;
      if (locale === 'zh-TW') return `${domain} 的暫時情境模式`;
      return `Temporary profile for ${domain}`;
    }
    case 'popup.manageTemporary': {
      const { count } = params as UiMessageParameters['popup.manageTemporary'];
      if (locale === 'zh-CN') return `管理临时规则（${count}）`;
      if (locale === 'zh-TW') return `管理暫時規則（${count}）`;
      return `Manage temporary rules (${count})`;
    }
    case 'popup.addConditionTitle': {
      const { name } = params as UiMessageParameters['popup.addConditionTitle'];
      if (locale === 'zh-CN') return `向 ${name} 添加条件`;
      if (locale === 'zh-TW') return `向 ${name} 加入條件`;
      return `Add condition to ${name}`;
    }
    case 'popup.currentSite': {
      const { hostname } = params as UiMessageParameters['popup.currentSite'];
      if (locale === 'zh-CN') return `当前网站：${hostname}`;
      if (locale === 'zh-TW') return `目前網站：${hostname}`;
      return `Current site: ${hostname}`;
    }
    case 'popup.scope': {
      const { domain } = params as UiMessageParameters['popup.scope'];
      if (locale === 'zh-CN') return `范围：${domain}`;
      if (locale === 'zh-TW') return `範圍：${domain}`;
      return `Scope: ${domain}`;
    }
    case 'popup.addFor': {
      const { domain } = params as UiMessageParameters['popup.addFor'];
      if (locale === 'zh-CN') return `为 ${domain} 添加条件`;
      if (locale === 'zh-TW') return `為 ${domain} 加入條件`;
      return `Add condition for ${domain}`;
    }
    case 'options.exported': {
      const { filename, warnings } = params as UiMessageParameters['options.exported'];
      if (locale === 'zh-CN') {
        return warnings === 0
          ? `已导出 ${filename}。`
          : `已导出 ${filename}，包含 ${warnings} 条警告。`;
      }
      if (locale === 'zh-TW') {
        return warnings === 0
          ? `已匯出 ${filename}。`
          : `已匯出 ${filename}，包含 ${warnings} 條警告。`;
      }
      return warnings === 0
        ? `Exported ${filename}.`
        : `Exported ${filename} with ${warnings} warning(s).`;
    }
    case 'tempRules.deleteAria': {
      const { domain } = params as UiMessageParameters['tempRules.deleteAria'];
      if (locale === 'zh-CN') return `删除 ${domain} 的临时规则`;
      if (locale === 'zh-TW') return `刪除 ${domain} 的暫時規則`;
      return `Delete temporary rule for ${domain}`;
    }
    case 'network.bounds': {
      const { records, perTabLimit, globalLimit, minutes } =
        params as UiMessageParameters['network.bounds'];
      if (locale === 'zh-CN') {
        return `共 ${records} 条记录 · 每个标签页最多 ${perTabLimit} 条 · 总计最多 ${globalLimit} 条 · 保留 ${minutes} 分钟`;
      }
      if (locale === 'zh-TW') {
        return `共 ${records} 筆記錄 · 每個分頁最多 ${perTabLimit} 筆 · 總計最多 ${globalLimit} 筆 · 保留 ${minutes} 分鐘`;
      }
      return `${records} record${records === 1 ? '' : 's'} · max ${perTabLimit} per tab · max ${globalLimit} total · retained ${minutes} minutes`;
    }
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
    case 'switch.ruleFieldAria': {
      const { index, field } = params as UiMessageParameters['switch.ruleFieldAria'];
      const labels = {
        en: {
          drag: 'Drag rule {index} to reorder',
          moveUp: 'Move rule {index} up',
          moveDown: 'Move rule {index} down',
          conditionType: 'Rule {index} condition type',
          pattern: 'Rule {index} pattern',
          ipAddress: 'Rule {index} IP address',
          prefixLength: 'Rule {index} prefix length',
          minimumHostLevels: 'Rule {index} minimum host levels',
          maximumHostLevels: 'Rule {index} maximum host levels',
          weekdays: 'Rule {index} weekdays',
          startHour: 'Rule {index} start hour',
          endHour: 'Rule {index} end hour',
          resultProfile: 'Rule {index} result profile',
          note: 'Rule {index} note',
        },
        'zh-CN': {
          drag: '拖动规则 {index} 进行排序',
          moveUp: '上移规则 {index}',
          moveDown: '下移规则 {index}',
          conditionType: '规则 {index} 的条件类型',
          pattern: '规则 {index} 的匹配内容',
          ipAddress: '规则 {index} 的 IP 地址',
          prefixLength: '规则 {index} 的前缀长度',
          minimumHostLevels: '规则 {index} 的最小域名层数',
          maximumHostLevels: '规则 {index} 的最大域名层数',
          weekdays: '规则 {index} 的星期',
          startHour: '规则 {index} 的开始小时',
          endHour: '规则 {index} 的结束小时',
          resultProfile: '规则 {index} 的结果情景模式',
          note: '规则 {index} 的备注',
        },
        'zh-TW': {
          drag: '拖曳規則 {index} 進行排序',
          moveUp: '上移規則 {index}',
          moveDown: '下移規則 {index}',
          conditionType: '規則 {index} 的條件類型',
          pattern: '規則 {index} 的比對內容',
          ipAddress: '規則 {index} 的 IP 位址',
          prefixLength: '規則 {index} 的前綴長度',
          minimumHostLevels: '規則 {index} 的最小網域層數',
          maximumHostLevels: '規則 {index} 的最大網域層數',
          weekdays: '規則 {index} 的星期',
          startHour: '規則 {index} 的開始小時',
          endHour: '規則 {index} 的結束小時',
          resultProfile: '規則 {index} 的結果情境模式',
          note: '規則 {index} 的備註',
        },
      } as const;
      return labels[locale][field].replace('{index}', String(index));
    }
    case 'switch.ruleActionAria': {
      const { index, action } = params as UiMessageParameters['switch.ruleActionAria'];
      const labels = {
        en: {
          delete: 'Delete rule {index}',
          clone: 'Clone rule {index}',
          normalize: 'Normalize rule {index} for source editing',
          showNote: 'Show note for rule {index}',
        },
        'zh-CN': {
          delete: '删除规则 {index}',
          clone: '克隆规则 {index}',
          normalize: '规范化规则 {index} 以便编辑源代码',
          showNote: '显示规则 {index} 的备注',
        },
        'zh-TW': {
          delete: '刪除規則 {index}',
          clone: '複製規則 {index}',
          normalize: '正規化規則 {index} 以便編輯原始碼',
          showNote: '顯示規則 {index} 的備註',
        },
      } as const;
      return labels[locale][action].replace('{index}', String(index));
    }
    case 'switch.sourceError': {
      const { code, line } = params as UiMessageParameters['switch.sourceError'];
      const messages: Record<string, LocalizedText> = {
        'switch-source.multiline-value': {
          en: 'A source value cannot contain a line break.',
          'zh-CN': '源代码值不能包含换行符。',
          'zh-TW': '原始碼值不能包含換行符號。',
        },
        'switch-source.edge-whitespace': {
          en: 'A source value cannot start or end with whitespace.',
          'zh-CN': '源代码值不能以空白开头或结尾。',
          'zh-TW': '原始碼值不能以空白開頭或結尾。',
        },
        'switch-source.ambiguous-profile-name': {
          en: 'A result profile name contains the reserved “ +” sequence.',
          'zh-CN': '结果情景模式名称包含保留序列“ +”。',
          'zh-TW': '結果情境模式名稱包含保留序列「 +」。',
        },
        'switch-source.unsupported-regex-flags': {
          en: 'Regular-expression flags cannot be represented in the original source format.',
          'zh-CN': '原版源代码格式无法表示正则表达式标志。',
          'zh-TW': '原版原始碼格式無法表示正規表示式旗標。',
        },
        'switch-source.missing-profile': {
          en: 'The Switch Profile no longer exists.',
          'zh-CN': '自动切换情景模式已不存在。',
          'zh-TW': '自動切換情境模式已不存在。',
        },
        'switch-source.unsupported-disabled-rule': {
          en: 'A rule contains legacy Nex-only disabled state. Normalize it before editing source.',
          'zh-CN': '规则包含旧版 Nex 专用禁用状态；请先规范化再编辑源代码。',
          'zh-TW': '規則包含舊版 Nex 專用停用狀態；請先正規化再編輯原始碼。',
        },
        'switch-source.missing-result-profile': {
          en: 'A result profile is missing.',
          'zh-CN': '缺少结果情景模式。',
          'zh-TW': '缺少結果情境模式。',
        },
        'switch-source.missing-default-profile': {
          en: 'The default profile is missing.',
          'zh-CN': '默认情景模式不存在。',
          'zh-TW': '預設情境模式不存在。',
        },
        'switch-source.empty-result-profile': {
          en: 'The result profile name is empty.',
          'zh-CN': '结果情景模式名称为空。',
          'zh-TW': '結果情境模式名稱為空。',
        },
        'switch-source.results-required': {
          en: 'Source editing requires an “@with result” directive.',
          'zh-CN': '源代码编辑需要“@with result”指令。',
          'zh-TW': '原始碼編輯需要「@with result」指令。',
        },
        'switch-source.orphan-note': {
          en: 'The final @note directive has no following rule.',
          'zh-CN': '最后一个 @note 指令后没有规则。',
          'zh-TW': '最後一個 @note 指令後沒有規則。',
        },
        'switch-source.no-default-rule': {
          en: 'The final “* +profile” default rule is required.',
          'zh-CN': '必须以“* +profile”默认规则结尾。',
          'zh-TW': '必須以「* +profile」預設規則結尾。',
        },
        'switch-source.default-note': {
          en: 'The final default rule cannot have a note.',
          'zh-CN': '最后的默认规则不能包含备注。',
          'zh-TW': '最後的預設規則不能包含備註。',
        },
        'switch-source.unknown-profile': {
          en: 'The source references an unknown result profile.',
          'zh-CN': '源代码引用了未知的结果情景模式。',
          'zh-TW': '原始碼引用了未知的結果情境模式。',
        },
        'switch-source.invalid-rule': {
          en: 'The SwitchyOmega condition is invalid.',
          'zh-CN': 'SwitchyOmega 条件无效。',
          'zh-TW': 'SwitchyOmega 條件無效。',
        },
        'switch-source.invalid-draft': {
          en: 'The parsed source produced an invalid Draft.',
          'zh-CN': '解析后的源代码生成了无效的草稿。',
          'zh-TW': '解析後的原始碼產生了無效的草稿。',
        },
      };
      const message =
        messages[code]?.[locale] ??
        (locale === 'en'
          ? 'Switch source is invalid.'
          : locale === 'zh-CN'
            ? '自动切换源代码无效。'
            : '自動切換原始碼無效。');
      if (line === undefined) return message;
      return locale === 'en'
        ? `Line ${line}: ${message}`
        : locale === 'zh-CN'
          ? `第 ${line} 行：${message}`
          : `第 ${line} 行：${message}`;
    }
    case 'ruleList.headerAria': {
      const { scope, index, field } = params as UiMessageParameters['ruleList.headerAria'];
      if (locale === 'en') {
        const prefix = scope === 'attached' ? 'Attached header' : 'Rule List header';
        const suffix = field === 'name' ? 'name' : field === 'type' ? 'value type' : 'value';
        return `${prefix} ${index} ${suffix}`;
      }
      const prefix =
        scope === 'attached'
          ? locale === 'zh-CN'
            ? '附属请求头'
            : '附屬請求標頭'
          : locale === 'zh-CN'
            ? '规则列表请求头'
            : '規則清單請求標頭';
      const suffix =
        field === 'name'
          ? locale === 'zh-CN'
            ? '名称'
            : '名稱'
          : field === 'type'
            ? locale === 'zh-CN'
              ? '值类型'
              : '值類型'
            : '值';
      return `${prefix} ${index} ${suffix}`;
    }
    case 'ruleList.updateFailed': {
      const failure = params as UiMessageParameters['ruleList.updateFailed'];
      const detail = sourceUpdateFailureDetail(failure, locale);
      if (locale === 'zh-CN') {
        return `上次更新于 ${failure.timestamp} 失败：${detail} 已保留现有缓存内容。`;
      }
      if (locale === 'zh-TW') {
        return `上次更新於 ${failure.timestamp} 失敗：${detail} 已保留現有快取內容。`;
      }
      return `Last update failed ${failure.timestamp}: ${detail} Existing cached content was preserved.`;
    }
    case 'ruleList.lastUpdated': {
      const { timestamp, bytes, stale } = params as UiMessageParameters['ruleList.lastUpdated'];
      const byteText =
        bytes === undefined
          ? ''
          : locale === 'en'
            ? ` ${bytes} bytes.`
            : locale === 'zh-CN'
              ? ` ${bytes} 字节。`
              : ` ${bytes} 位元組。`;
      const staleText = stale ? ` ${uiText('ruleList.cachedStale', locale)}` : '';
      if (locale === 'zh-CN') return `规则列表最后更新于 ${timestamp}。${byteText}${staleText}`;
      if (locale === 'zh-TW') return `規則清單最後更新於 ${timestamp}。${byteText}${staleText}`;
      return `Last updated ${timestamp}.${byteText}${staleText}`;
    }
    case 'pac.headerAria': {
      const { index, field } = params as UiMessageParameters['pac.headerAria'];
      if (locale === 'en') {
        const suffix = field === 'name' ? 'name' : field === 'type' ? 'value type' : 'value';
        return `PAC header ${index} ${suffix}`;
      }
      const prefix = locale === 'zh-CN' ? 'PAC 请求头' : 'PAC 請求標頭';
      const suffix =
        field === 'name'
          ? locale === 'zh-CN'
            ? '名称'
            : '名稱'
          : field === 'type'
            ? locale === 'zh-CN'
              ? '值类型'
              : '值類型'
            : '值';
      return `${prefix} ${index} ${suffix}`;
    }
    case 'pac.updateFailed': {
      const failure = params as UiMessageParameters['pac.updateFailed'];
      const detail = sourceUpdateFailureDetail(failure, locale);
      if (locale === 'zh-CN') {
        return `上次更新于 ${failure.timestamp} 失败：${detail} 已保留现有缓存脚本。`;
      }
      if (locale === 'zh-TW') {
        return `上次更新於 ${failure.timestamp} 失敗：${detail} 已保留現有快取指令碼。`;
      }
      return `Last update failed ${failure.timestamp}: ${detail} Existing cached script was preserved.`;
    }
    case 'pac.lastUpdated': {
      const { timestamp, bytes, stale } = params as UiMessageParameters['pac.lastUpdated'];
      const byteText =
        bytes === undefined
          ? ''
          : locale === 'en'
            ? ` ${bytes} bytes.`
            : locale === 'zh-CN'
              ? ` ${bytes} 字节。`
              : ` ${bytes} 位元組。`;
      const staleText = stale ? ` ${uiText('pac.cachedStale', locale)}` : '';
      if (locale === 'zh-CN') return `PAC 脚本下载时间 ${timestamp}。${byteText}${staleText}`;
      if (locale === 'zh-TW')
        return `PAC 指令碼最後更新時間：${timestamp}。${byteText}${staleText}`;
      return `Last updated ${timestamp}.${byteText}${staleText}`;
    }
    case 'pac.authConfiguredFor': {
      const { username } = params as UiMessageParameters['pac.authConfiguredFor'];
      if (locale === 'zh-CN') return `已为 ${username} 配置。`;
      if (locale === 'zh-TW') return `已為 ${username} 設定。`;
      return `Configured for ${username}.`;
    }
    case 'history.profileRoute': {
      const { profileId } = params as UiMessageParameters['history.profileRoute'];
      if (locale === 'zh-CN') return `情景模式 ${profileId}`;
      if (locale === 'zh-TW') return `情境模式 ${profileId}`;
      return `Profile ${profileId}`;
    }
    case 'history.snapshotLabel': {
      const { snapshotId } = params as UiMessageParameters['history.snapshotLabel'];
      if (locale === 'zh-CN') return `快照 ${snapshotId}`;
      if (locale === 'zh-TW') return `快照 ${snapshotId}`;
      return `Snapshot ${snapshotId}`;
    }
    case 'history.vectorMatch': {
      const { matchedCount, vectorCount } = params as UiMessageParameters['history.vectorMatch'];
      if (locale === 'zh-CN') return `${matchedCount}/${vectorCount} 个向量匹配`;
      if (locale === 'zh-TW') return `${matchedCount}/${vectorCount} 個向量符合`;
      return `${matchedCount}/${vectorCount} vectors matched`;
    }
    case 'history.warningCount': {
      const { count } = params as UiMessageParameters['history.warningCount'];
      if (locale === 'zh-CN') return `警告（${count}）`;
      if (locale === 'zh-TW') return `警告（${count}）`;
      return `Warnings (${count})`;
    }
    case 'history.rollbackDescription': {
      const { revisionId } = params as UiMessageParameters['history.rollbackDescription'];
      if (locale === 'zh-CN') {
        return `此操作会立即切换浏览器流量，并将已应用设置和草稿都替换为修订 ${revisionId}。系统会验证归档快照；若工作流提交失败，将恢复当前浏览器状态。`;
      }
      if (locale === 'zh-TW') {
        return `此操作會立即切換瀏覽器流量，並將已套用設定與草稿都替換為修訂 ${revisionId}。系統會驗證封存快照；若工作流程提交失敗，將還原目前瀏覽器狀態。`;
      }
      return `This immediately switches browser traffic and replaces both Applied and Draft with revision ${revisionId}. The operation verifies the archived snapshot and restores the current browser state if the workflow commit fails.`;
    }
    case 'legacy.compatibilityWarnings': {
      const { count } = params as UiMessageParameters['legacy.compatibilityWarnings'];
      if (locale === 'zh-CN') return `兼容性警告（${count}）`;
      if (locale === 'zh-TW') return `相容性警告（${count}）`;
      return `Compatibility warnings (${count})`;
    }
    case 'legacy.exportedWithWarnings': {
      const { count } = params as UiMessageParameters['legacy.exportedWithWarnings'];
      if (locale === 'zh-CN') return `备份已导出，包含 ${count} 条兼容性警告。`;
      if (locale === 'zh-TW') return `備份已匯出，包含 ${count} 條相容性警告。`;
      return `Backup exported with ${count} compatibility warning(s).`;
    }
    case 'legacy.technicalDetails': {
      const { count } = params as UiMessageParameters['legacy.technicalDetails'];
      if (locale === 'zh-CN') return `技术迁移详情（${count}）`;
      if (locale === 'zh-TW') return `技術移轉詳情（${count}）`;
      return `Technical migration details (${count})`;
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
