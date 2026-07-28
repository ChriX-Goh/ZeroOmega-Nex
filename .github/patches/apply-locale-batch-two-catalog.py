from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


catalog_entries = r'''  'switch.conditionHelp': { en: 'Condition help', 'zh-CN': '条件类型说明', 'zh-TW': '條件類型說明' },
  'switch.closeConditionHelp': { en: 'Close condition help', 'zh-CN': '关闭条件类型说明', 'zh-TW': '關閉條件類型說明' },
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
  'switch.source': { en: 'Switch Profile source', 'zh-CN': '自动切换情景模式源代码', 'zh-TW': '自動切換情境模式原始碼' },
  'switch.sourceHelp': {
    en: 'Uses the original result-enabled SwitchyOmega conditions format. Invalid source remains in this editor until corrected.',
    'zh-CN': '使用原版支持结果情景模式的 SwitchyOmega 条件格式。无效源代码会保留在编辑器中，直到修正为止。',
    'zh-TW': '使用原版支援結果情境模式的 SwitchyOmega 條件格式。無效原始碼會保留在編輯器中，直到修正為止。',
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
  'switch.attachedUse': { en: 'Use attached Rule List', 'zh-CN': '规则列表规则', 'zh-TW': '規則清單規則' },
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
  'switch.deleteAttached': { en: 'Delete attached Rule List', 'zh-CN': '移除规则列表', 'zh-TW': '移除規則清單' },
  'switch.detachConfirm': {
    en: 'Delete the attached Rule List? The Switch default route will be restored before removal.',
    'zh-CN': '移除附属规则列表吗？移除前会先恢复自动切换模式的默认情景模式。',
    'zh-TW': '移除附屬規則清單嗎？移除前會先還原自動切換模式的預設情境模式。',
  },
  'switch.defaultProfile': { en: 'Default profile', 'zh-CN': '默认情景模式', 'zh-TW': '預設情境模式' },
  'switch.defaultRouteAria': {
    en: 'Switch Profile default route',
    'zh-CN': '自动切换情景模式的默认路由',
    'zh-TW': '自動切換情境模式的預設路由',
  },
  'switch.attachTitle': { en: 'Import online Rule List', 'zh-CN': '导入在线规则列表', 'zh-TW': '匯入線上規則清單' },
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
  'switch.condition.hostWildcard': { en: 'Host wildcard', 'zh-CN': '域名通配符', 'zh-TW': '網域萬用字元' },
  'switch.condition.hostWildcardHelp': {
    en: 'Match a hostname wildcard without path or port details.',
    'zh-CN': '匹配不包含路径或端口的域名通配符。',
    'zh-TW': '比對不包含路徑或連接埠的網域萬用字元。',
  },
  'switch.condition.urlWildcard': { en: 'URL wildcard', 'zh-CN': '网址通配符', 'zh-TW': '網址萬用字元' },
  'switch.condition.urlWildcardHelp': {
    en: 'Match a complete URL wildcard pattern.',
    'zh-CN': '匹配完整网址的通配符模式。',
    'zh-TW': '比對完整網址的萬用字元模式。',
  },
  'switch.condition.urlRegex': { en: 'URL regular expression', 'zh-CN': '网址正则', 'zh-TW': '網址正規表示式' },
  'switch.condition.urlRegexHelp': {
    en: 'Match a complete URL using a regular expression.',
    'zh-CN': '使用正则表达式匹配完整网址。',
    'zh-TW': '使用正規表示式比對完整網址。',
  },
  'switch.condition.hostRegex': { en: 'Host regular expression', 'zh-CN': '域名正则', 'zh-TW': '網域正規表示式' },
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
  'switch.condition.bypass': { en: 'Bypass pattern', 'zh-CN': '不代理地址模式', 'zh-TW': '不代理位址模式' },
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
  'ruleList.matchProfile': { en: 'Match profile', 'zh-CN': '匹配则使用情景模式', 'zh-TW': '比對則使用情境模式' },
  'ruleList.defaultProfile': { en: 'Default profile', 'zh-CN': '不匹配则使用情景模式', 'zh-TW': '不比對則使用情境模式' },
  'ruleList.format': { en: 'Rule List format', 'zh-CN': '规则列表格式', 'zh-TW': '規則清單格式' },
  'ruleList.url': { en: 'Rule List URL', 'zh-CN': '规则列表网址', 'zh-TW': '規則清單網址' },
  'ruleList.text': { en: 'Rule List Text', 'zh-CN': '规则列表正文', 'zh-TW': '規則清單正文' },
  'ruleList.urlHelp': {
    en: 'The application downloads the Rule List from this URL. Leave it empty to use the text below directly.',
    'zh-CN': '应用将从此网址下载规则列表。如果网址留空，则以下文本会被直接处理后作为规则列表使用。',
    'zh-TW': '應用將從此網址下載規則清單。如果網址留空，則以下文字會被直接處理後作為規則清單使用。',
  },
  'ruleList.clearUrl': { en: 'Clear Rule List URL', 'zh-CN': '清除规则列表网址', 'zh-TW': '清除規則清單網址' },
  'ruleList.clear': { en: 'Clear', 'zh-CN': '清除', 'zh-TW': '清除' },
  'ruleList.requestHeaders': { en: 'Request headers', 'zh-CN': '请求头', 'zh-TW': '請求標頭' },
  'ruleList.headersHelp': {
    en: 'Sensitive values use background-owned secret references and never enter ordinary configuration text.',
    'zh-CN': '敏感值使用后台持有的秘密引用，绝不会进入普通配置文本。',
    'zh-TW': '敏感值使用背景持有的秘密參照，絕不會進入一般設定文字。',
  },
  'ruleList.headerName': { en: 'Header name', 'zh-CN': '请求头名称', 'zh-TW': '請求標頭名稱' },
  'ruleList.headerType': { en: 'Header value type', 'zh-CN': '请求头值类型', 'zh-TW': '請求標頭值類型' },
  'ruleList.headerValue': { en: 'Header value', 'zh-CN': '请求头值', 'zh-TW': '請求標頭值' },
  'ruleList.literal': { en: 'Literal', 'zh-CN': '文本值', 'zh-TW': '文字值' },
  'ruleList.secretReference': { en: 'Secret reference', 'zh-CN': '秘密引用', 'zh-TW': '秘密參照' },
  'ruleList.removeHeader': { en: 'Remove', 'zh-CN': '移除', 'zh-TW': '移除' },
  'ruleList.addHeader': { en: 'Add header', 'zh-CN': '添加请求头', 'zh-TW': '加入請求標頭' },
  'ruleList.downloadNow': { en: 'Download now', 'zh-CN': '立即更新情景模式', 'zh-TW': '立即更新情境模式' },
  'ruleList.downloading': { en: 'Downloading…', 'zh-CN': '正在下载…', 'zh-TW': '正在下載…' },
  'ruleList.neverDownloaded': { en: 'Never downloaded.', 'zh-CN': '尚未下载。', 'zh-TW': '尚未下載。' },
  'ruleList.cachedStale': { en: 'Cached content is stale.', 'zh-CN': '缓存内容已经过时。', 'zh-TW': '快取內容已經過時。' },
  'ruleList.updateError': { en: 'Rule List update failed.', 'zh-CN': '规则列表更新失败。', 'zh-TW': '規則清單更新失敗。' },
  'ruleList.downloadSafety': {
    en: 'Remote content is downloaded by the background service with isolated credentials, bounded size, and atomic cache replacement. Failed downloads keep the previous cache.',
    'zh-CN': '远程内容由后台服务使用隔离凭据下载，并限制大小及原子替换缓存；下载失败时保留原缓存。',
    'zh-TW': '遠端內容由背景服務使用隔離憑證下載，並限制大小及原子取代快取；下載失敗時保留原快取。',
  },
  'ruleList.downloadedText': { en: 'Downloaded Rule List text', 'zh-CN': '已下载的规则列表正文', 'zh-TW': '已下載的規則清單正文' },
  'ruleList.updateInterval': { en: 'Update interval (minutes)', 'zh-CN': '更新间隔（分钟）', 'zh-TW': '更新間隔（分鐘）' },
  'ruleList.attachedConfig': { en: 'Attached Rule List configuration', 'zh-CN': '附属规则列表设置', 'zh-TW': '附屬規則清單設定' },
  'ruleList.attachedHiddenHelp': {
    en: 'The attached profile remains hidden from normal navigation and participates only through this Switch Profile.',
    'zh-CN': '附属情景模式不会显示在普通导航中，只通过当前自动切换情景模式参与匹配。',
    'zh-TW': '附屬情境模式不會顯示在一般導覽中，只透過目前自動切換情境模式參與比對。',
  },
  'ruleList.sourceType': { en: 'Source type', 'zh-CN': '来源类型', 'zh-TW': '來源類型' },
  'ruleList.inlineText': { en: 'Inline text', 'zh-CN': '内嵌文本', 'zh-TW': '內嵌文字' },
  'ruleList.attachedSourceType': { en: 'Attached Rule List source type', 'zh-CN': '附属规则列表来源类型', 'zh-TW': '附屬規則清單來源類型' },
  'ruleList.attachedUrl': { en: 'Attached Rule List URL', 'zh-CN': '附属规则列表网址', 'zh-TW': '附屬規則清單網址' },
  'ruleList.attachedText': { en: 'Attached Rule List text', 'zh-CN': '附属规则列表正文', 'zh-TW': '附屬規則清單正文' },
'''
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  'fixed.proxyServers': { en: 'Proxy servers', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },\n",
    catalog_entries + "  'fixed.proxyServers': { en: 'Proxy servers', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },\n",
)

replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  readonly 'fixed.authUnsupported': { readonly protocol: string };\n",
    r'''  readonly 'fixed.authUnsupported': { readonly protocol: string };
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
  readonly 'ruleList.updateFailed': { readonly timestamp: string };
  readonly 'ruleList.lastUpdated': {
    readonly timestamp: string;
    readonly bytes?: number;
    readonly stale: boolean;
  };
''',
)

replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    '''    case 'fixed.fieldAria': {
''',
    r'''    case 'switch.ruleFieldAria': {
      const { index, field } = params as UiMessageParameters['switch.ruleFieldAria'];
      const labels = {
        en: {
          drag: 'Drag rule {index} to reorder', moveUp: 'Move rule {index} up', moveDown: 'Move rule {index} down',
          conditionType: 'Rule {index} condition type', pattern: 'Rule {index} pattern', ipAddress: 'Rule {index} IP address',
          prefixLength: 'Rule {index} prefix length', minimumHostLevels: 'Rule {index} minimum host levels',
          maximumHostLevels: 'Rule {index} maximum host levels', weekdays: 'Rule {index} weekdays',
          startHour: 'Rule {index} start hour', endHour: 'Rule {index} end hour', resultProfile: 'Rule {index} result profile',
          note: 'Rule {index} note',
        },
        'zh-CN': {
          drag: '拖动规则 {index} 进行排序', moveUp: '上移规则 {index}', moveDown: '下移规则 {index}',
          conditionType: '规则 {index} 的条件类型', pattern: '规则 {index} 的匹配内容', ipAddress: '规则 {index} 的 IP 地址',
          prefixLength: '规则 {index} 的前缀长度', minimumHostLevels: '规则 {index} 的最小域名层数',
          maximumHostLevels: '规则 {index} 的最大域名层数', weekdays: '规则 {index} 的星期',
          startHour: '规则 {index} 的开始小时', endHour: '规则 {index} 的结束小时', resultProfile: '规则 {index} 的结果情景模式',
          note: '规则 {index} 的备注',
        },
        'zh-TW': {
          drag: '拖曳規則 {index} 進行排序', moveUp: '上移規則 {index}', moveDown: '下移規則 {index}',
          conditionType: '規則 {index} 的條件類型', pattern: '規則 {index} 的比對內容', ipAddress: '規則 {index} 的 IP 位址',
          prefixLength: '規則 {index} 的前綴長度', minimumHostLevels: '規則 {index} 的最小網域層數',
          maximumHostLevels: '規則 {index} 的最大網域層數', weekdays: '規則 {index} 的星期',
          startHour: '規則 {index} 的開始小時', endHour: '規則 {index} 的結束小時', resultProfile: '規則 {index} 的結果情境模式',
          note: '規則 {index} 的備註',
        },
      } as const;
      return labels[locale][field].replace('{index}', String(index));
    }
    case 'switch.ruleActionAria': {
      const { index, action } = params as UiMessageParameters['switch.ruleActionAria'];
      const labels = {
        en: { delete: 'Delete rule {index}', clone: 'Clone rule {index}', normalize: 'Normalize rule {index} for source editing', showNote: 'Show note for rule {index}' },
        'zh-CN': { delete: '删除规则 {index}', clone: '克隆规则 {index}', normalize: '规范化规则 {index} 以便编辑源代码', showNote: '显示规则 {index} 的备注' },
        'zh-TW': { delete: '刪除規則 {index}', clone: '複製規則 {index}', normalize: '正規化規則 {index} 以便編輯原始碼', showNote: '顯示規則 {index} 的備註' },
      } as const;
      return labels[locale][action].replace('{index}', String(index));
    }
    case 'switch.sourceError': {
      const { code, line } = params as UiMessageParameters['switch.sourceError'];
      const messages: Record<string, LocalizedText> = {
        'switch-source.multiline-value': { en: 'A source value cannot contain a line break.', 'zh-CN': '源代码值不能包含换行符。', 'zh-TW': '原始碼值不能包含換行符號。' },
        'switch-source.edge-whitespace': { en: 'A source value cannot start or end with whitespace.', 'zh-CN': '源代码值不能以空白开头或结尾。', 'zh-TW': '原始碼值不能以空白開頭或結尾。' },
        'switch-source.ambiguous-profile-name': { en: 'A result profile name contains the reserved “ +” sequence.', 'zh-CN': '结果情景模式名称包含保留序列“ +”。', 'zh-TW': '結果情境模式名稱包含保留序列「 +」。' },
        'switch-source.unsupported-regex-flags': { en: 'Regular-expression flags cannot be represented in the original source format.', 'zh-CN': '原版源代码格式无法表示正则表达式标志。', 'zh-TW': '原版原始碼格式無法表示正規表示式旗標。' },
        'switch-source.missing-profile': { en: 'The Switch Profile no longer exists.', 'zh-CN': '自动切换情景模式已不存在。', 'zh-TW': '自動切換情境模式已不存在。' },
        'switch-source.unsupported-disabled-rule': { en: 'A rule contains legacy Nex-only disabled state. Normalize it before editing source.', 'zh-CN': '规则包含旧版 Nex 专用禁用状态；请先规范化再编辑源代码。', 'zh-TW': '規則包含舊版 Nex 專用停用狀態；請先正規化再編輯原始碼。' },
        'switch-source.missing-result-profile': { en: 'A result profile is missing.', 'zh-CN': '缺少结果情景模式。', 'zh-TW': '缺少結果情境模式。' },
        'switch-source.missing-default-profile': { en: 'The default profile is missing.', 'zh-CN': '默认情景模式不存在。', 'zh-TW': '預設情境模式不存在。' },
        'switch-source.empty-result-profile': { en: 'The result profile name is empty.', 'zh-CN': '结果情景模式名称为空。', 'zh-TW': '結果情境模式名稱為空。' },
        'switch-source.results-required': { en: 'Source editing requires an “@with result” directive.', 'zh-CN': '源代码编辑需要“@with result”指令。', 'zh-TW': '原始碼編輯需要「@with result」指令。' },
        'switch-source.orphan-note': { en: 'The final @note directive has no following rule.', 'zh-CN': '最后一个 @note 指令后没有规则。', 'zh-TW': '最後一個 @note 指令後沒有規則。' },
        'switch-source.no-default-rule': { en: 'The final “* +profile” default rule is required.', 'zh-CN': '必须以“* +profile”默认规则结尾。', 'zh-TW': '必須以「* +profile」預設規則結尾。' },
        'switch-source.default-note': { en: 'The final default rule cannot have a note.', 'zh-CN': '最后的默认规则不能包含备注。', 'zh-TW': '最後的預設規則不能包含備註。' },
        'switch-source.unknown-profile': { en: 'The source references an unknown result profile.', 'zh-CN': '源代码引用了未知的结果情景模式。', 'zh-TW': '原始碼引用了未知的結果情境模式。' },
        'switch-source.invalid-rule': { en: 'The SwitchyOmega condition is invalid.', 'zh-CN': 'SwitchyOmega 条件无效。', 'zh-TW': 'SwitchyOmega 條件無效。' },
        'switch-source.invalid-draft': { en: 'The parsed source produced an invalid Draft.', 'zh-CN': '解析后的源代码生成了无效的草稿。', 'zh-TW': '解析後的原始碼產生了無效的草稿。' },
      };
      const message = messages[code]?.[locale] ?? (locale === 'en' ? 'Switch source is invalid.' : locale === 'zh-CN' ? '自动切换源代码无效。' : '自動切換原始碼無效。');
      if (line === undefined) return message;
      return locale === 'en' ? `Line ${line}: ${message}` : locale === 'zh-CN' ? `第 ${line} 行：${message}` : `第 ${line} 行：${message}`;
    }
    case 'ruleList.headerAria': {
      const { scope, index, field } = params as UiMessageParameters['ruleList.headerAria'];
      const scopeText = scope === 'attached'
        ? (locale === 'en' ? 'Attached' : locale === 'zh-CN' ? '附属' : '附屬')
        : (locale === 'en' ? 'Rule List' : locale === 'zh-CN' ? '规则列表' : '規則清單');
      const fieldText = field === 'name' ? uiText('ruleList.headerName', locale) : field === 'type' ? uiText('ruleList.headerType', locale) : uiText('ruleList.headerValue', locale);
      return `${scopeText} ${index} ${fieldText}`;
    }
    case 'ruleList.updateFailed': {
      const { timestamp } = params as UiMessageParameters['ruleList.updateFailed'];
      if (locale === 'zh-CN') return `上次更新于 ${timestamp} 失败；已保留现有缓存内容。`;
      if (locale === 'zh-TW') return `上次更新於 ${timestamp} 失敗；已保留現有快取內容。`;
      return `Last update failed ${timestamp}. Existing cached content was preserved.`;
    }
    case 'ruleList.lastUpdated': {
      const { timestamp, bytes, stale } = params as UiMessageParameters['ruleList.lastUpdated'];
      const byteText = bytes === undefined ? '' : locale === 'en' ? ` ${bytes} bytes.` : locale === 'zh-CN' ? ` ${bytes} 字节。` : ` ${bytes} 位元組。`;
      const staleText = stale ? ` ${uiText('ruleList.cachedStale', locale)}` : '';
      if (locale === 'zh-CN') return `规则列表最后更新于 ${timestamp}。${byteText}${staleText}`;
      if (locale === 'zh-TW') return `規則清單最後更新於 ${timestamp}。${byteText}${staleText}`;
      return `Last updated ${timestamp}.${byteText}${staleText}`;
    }
    case 'fixed.fieldAria': {
''',
)
