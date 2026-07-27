export type AppLocale = 'en' | 'zh-CN' | 'zh-TW';

interface TranslationPair {
  readonly 'zh-CN': string;
  readonly 'zh-TW': string;
}

const translations: Readonly<Record<string, TranslationPair>> = {
  Settings: { 'zh-CN': '设置', 'zh-TW': '設定' },
  Profiles: { 'zh-CN': '情景模式', 'zh-TW': '情景模式' },
  Actions: { 'zh-CN': '操作', 'zh-TW': '操作' },
  Interface: { 'zh-CN': '界面', 'zh-TW': '介面' },
  General: { 'zh-CN': '通用', 'zh-TW': '一般' },
  'Import / Export': { 'zh-CN': '导入 / 导出', 'zh-TW': '匯入 / 匯出' },
  Theme: { 'zh-CN': '主题', 'zh-TW': '佈景主題' },
  'Snapshot History': { 'zh-CN': '配置历史', 'zh-TW': '設定歷史' },
  'Built-in Profiles': { 'zh-CN': '内置情景模式', 'zh-TW': '內建情景模式' },
  'New profile…': { 'zh-CN': '新建情景模式…', 'zh-TW': '新增情景模式…' },
  'New Profile': { 'zh-CN': '新建情景模式', 'zh-TW': '新增情景模式' },
  'Profile type': { 'zh-CN': '情景模式类型', 'zh-TW': '情景模式類型' },
  'Profile name cannot be empty.': {
    'zh-CN': '情景模式名称不能为空。',
    'zh-TW': '情景模式名稱不可留空。',
  },
  'Names beginning with two underscores and built-in profile names are reserved.': {
    'zh-CN': '以双下划线开头的名称及内置情景模式名称为系统保留，禁止使用。',
    'zh-TW': '以雙底線開頭的名稱及內建情景模式名稱為系統保留，禁止使用。',
  },
  'A profile with the same name already exists.': {
    'zh-CN': '已经存在相同名称的情景模式。',
    'zh-TW': '已經存在相同名稱的情景模式。',
  },
  'Profiles beginning with an underscore are hidden from the popup but can still be used as switching results.':
    {
      'zh-CN': '以下划线开头的情景模式不会在弹出菜单中显示，但仍可被用作切换结果。',
      'zh-TW': '以底線開頭的情景模式不會顯示在彈出式選單中，但仍可作為切換結果。',
    },
  'Configure proxy servers separately for each URL scheme.': {
    'zh-CN': '为不同 URL 协议分别配置代理服务器。',
    'zh-TW': '為不同 URL 通訊協定分別設定代理伺服器。',
  },
  'Select another profile by URL, host, or other switching conditions.': {
    'zh-CN': '按照 URL、主机或其他切换条件选择情景模式。',
    'zh-TW': '依 URL、主機或其他切換條件選擇情景模式。',
  },
  'Use a PAC script from a URL or edit the script directly.': {
    'zh-CN': '从 URL 获取 PAC 脚本，或直接编辑脚本。',
    'zh-TW': '從 URL 取得 PAC 指令碼，或直接編輯指令碼。',
  },
  'Virtual Profile': { 'zh-CN': '虚拟情景模式', 'zh-TW': '虛擬情景模式' },
  'Create a stable alias that points to another profile.': {
    'zh-CN': '创建一个指向其他情景模式的稳定别名。',
    'zh-TW': '建立一個指向其他情景模式的穩定別名。',
  },
  Cancel: { 'zh-CN': '取消', 'zh-TW': '取消' },
  Create: { 'zh-CN': '创建', 'zh-TW': '建立' },
  'Creating…': { 'zh-CN': '正在创建…', 'zh-TW': '正在建立…' },
  'Target profile': { 'zh-CN': '目标情景模式', 'zh-TW': '目標情景模式' },
  'Virtual Profile target': { 'zh-CN': '虚拟情景模式目标', 'zh-TW': '虛擬情景模式目標' },
  'Migrate to Virtual Profile': { 'zh-CN': '迁移到虚拟情景模式', 'zh-TW': '移轉到虛擬情景模式' },
  'Replace target profile': { 'zh-CN': '替换目标情景模式', 'zh-TW': '取代目標情景模式' },
  'Apply changes': { 'zh-CN': '应用选项', 'zh-TW': '套用選項' },
  'Discard changes': { 'zh-CN': '撤销更改', 'zh-TW': '復原變更' },
  'Working…': { 'zh-CN': '处理中…', 'zh-TW': '處理中…' },
  'Draft contains unapplied changes.': {
    'zh-CN': '有尚未应用的更改。',
    'zh-TW': '有尚未套用的變更。',
  },
  'Draft matches the currently applied revision.': {
    'zh-CN': '当前设置已全部应用。',
    'zh-TW': '目前設定已全部套用。',
  },
  'Loading profiles': { 'zh-CN': '正在加载情景模式', 'zh-TW': '正在載入情景模式' },
  'Reading the saved ZeroOmega configuration.': {
    'zh-CN': '正在读取已保存的 ZeroOmega 配置。',
    'zh-TW': '正在讀取已儲存的 ZeroOmega 設定。',
  },
  'Operation failed': { 'zh-CN': '操作失败', 'zh-TW': '操作失敗' },
  Direct: { 'zh-CN': '直接连接', 'zh-TW': '直接連線' },
  'System Proxy': { 'zh-CN': '系统代理', 'zh-TW': '系統代理' },
  'Another application is controlling proxy settings. Disable or remove the conflicting application.':
    {
      'zh-CN': '其他应用正在控制代理设置。请禁用或者卸载发生冲突的应用。',
      'zh-TW': '其他應用程式正在控制 Proxy 設定。請停用或移除發生衝突的應用程式。',
    },
  'Proxy settings are enforced by local policy and cannot be changed. Contact your administrator.':
    {
      'zh-CN': '代理设置被本地策略强制指定，无法修改。请联系系统管理员。',
      'zh-TW': 'Proxy 設定由本機原則強制指定，無法修改。請聯絡系統管理員。',
    },
  'ZeroOmega cannot control proxy settings because a required browser permission is disabled.': {
    'zh-CN': '浏览器所需权限已关闭，ZeroOmega 无法控制代理设置。',
    'zh-TW': '瀏覽器所需權限已關閉，ZeroOmega 無法控制 Proxy 設定。',
  },
  'ZeroOmega cannot inspect or change the browser proxy settings.': {
    'zh-CN': 'ZeroOmega 无法检查或修改浏览器代理设置。',
    'zh-TW': 'ZeroOmega 無法檢查或修改瀏覽器 Proxy 設定。',
  },
  'ZeroOmega cannot switch profiles until this problem is resolved.': {
    'zh-CN': '如果不解决以上问题，则无法使用 ZeroOmega 切换代理。',
    'zh-TW': '若不解決以上問題，則無法使用 ZeroOmega 切換 Proxy。',
  },
  'Manage extensions': { 'zh-CN': '管理扩展', 'zh-TW': '管理擴充功能' },
  'External Profile': { 'zh-CN': '外部情景模式', 'zh-TW': '外部情景模式' },
  'Save name': { 'zh-CN': '保存名称', 'zh-TW': '儲存名稱' },
  'Profile name is required.': {
    'zh-CN': '必须输入情景模式名称。',
    'zh-TW': '必須輸入情景模式名稱。',
  },
  'Profile name cannot start with an underscore.': {
    'zh-CN': '情景模式名称不能以下划线开头。',
    'zh-TW': '情景模式名稱不能以下劃線開頭。',
  },
  'A profile with this name already exists.': {
    'zh-CN': '已存在同名情景模式。',
    'zh-TW': '已存在同名情景模式。',
  },
  'Missing profile': { 'zh-CN': '情景模式不存在', 'zh-TW': '情景模式不存在' },
  Options: { 'zh-CN': '选项', 'zh-TW': '選項' },
  'Opening…': { 'zh-CN': '正在打开…', 'zh-TW': '正在開啟…' },
  'Switching…': { 'zh-CN': '正在切换…', 'zh-TW': '正在切換…' },
  'Loading applied profiles…': {
    'zh-CN': '正在加载已应用的情景模式…',
    'zh-TW': '正在載入已套用的情景模式…',
  },
  'Quick switching is disabled in Options.': {
    'zh-CN': '快速切换已在选项中关闭。',
    'zh-TW': '快速切換已在選項中關閉。',
  },
  'No quick-switch routes are configured.': {
    'zh-CN': '尚未配置快速切换情景模式。',
    'zh-TW': '尚未設定快速切換情景模式。',
  },
  'Startup profile': { 'zh-CN': '启动情景模式', 'zh-TW': '啟動情景模式' },
  'Profile used when the extension starts': {
    'zh-CN': '扩展启动时使用的情景模式',
    'zh-TW': '擴充功能啟動時使用的情景模式',
  },
  'Keep current browser setting': { 'zh-CN': '保持浏览器当前设置', 'zh-TW': '保留瀏覽器目前設定' },
  'Revert proxy changes when ZeroOmega releases control': {
    'zh-CN': 'ZeroOmega 释放控制时恢复原代理设置',
    'zh-TW': 'ZeroOmega 釋放控制時還原原代理設定',
  },
  'Quick Switch': { 'zh-CN': '快速切换', 'zh-TW': '快速切換' },
  'Enable quick switching in the popup': {
    'zh-CN': '在左键菜单中启用快速切换',
    'zh-TW': '在左鍵選單中啟用快速切換',
  },
  'Refresh active tabs after switching': {
    'zh-CN': '切换后刷新活动标签页',
    'zh-TW': '切換後重新整理作用中分頁',
  },
  Up: { 'zh-CN': '上移', 'zh-TW': '上移' },
  Down: { 'zh-CN': '下移', 'zh-TW': '下移' },
  Remove: { 'zh-CN': '移除', 'zh-TW': '移除' },
  'Add profile…': { 'zh-CN': '添加情景模式…', 'zh-TW': '加入情景模式…' },
  'Startup and quick-switch behavior.': {
    'zh-CN': '启动及快速切换行为。',
    'zh-TW': '啟動及快速切換行為。',
  },
  'Confirmation and editing': { 'zh-CN': '确认与编辑', 'zh-TW': '確認與編輯' },
  'Confirm before deleting a profile': {
    'zh-CN': '删除情景模式前确认',
    'zh-TW': '刪除情景模式前確認',
  },
  'Add new switching conditions to the bottom': {
    'zh-CN': '将新的切换条件添加到末尾',
    'zh-TW': '將新的切換條件新增到末尾',
  },
  'Show advanced condition types': { 'zh-CN': '显示高级条件类型', 'zh-TW': '顯示進階條件類型' },
  'Menus and status': { 'zh-CN': '菜单与状态', 'zh-TW': '選單與狀態' },
  'Show inspect menu': { 'zh-CN': '显示检查菜单', 'zh-TW': '顯示檢查選單' },
  'Show result profile on the toolbar badge': {
    'zh-CN': '在工具栏徽章显示结果情景模式',
    'zh-TW': '在工具列徽章顯示結果情景模式',
  },
  'Show profiles controlled by other extensions': {
    'zh-CN': '显示由其他扩展控制的情景模式',
    'zh-TW': '顯示由其他擴充功能控制的情景模式',
  },
  'Export legacy rule-list format when requested': {
    'zh-CN': '按需导出旧版规则列表格式',
    'zh-TW': '依需求匯出舊版規則清單格式',
  },
  Appearance: { 'zh-CN': '外观', 'zh-TW': '外觀' },
  Automatic: { 'zh-CN': '自动', 'zh-TW': '自動' },
  Light: { 'zh-CN': '浅色', 'zh-TW': '淺色' },
  Dark: { 'zh-CN': '深色', 'zh-TW': '深色' },
  'Follow the operating-system light or dark appearance.': {
    'zh-CN': '跟随操作系统的浅色或深色外观。',
    'zh-TW': '跟隨作業系統的淺色或深色外觀。',
  },
  'Always use the original light options appearance.': {
    'zh-CN': '始终使用浅色选项界面。',
    'zh-TW': '一律使用淺色選項介面。',
  },
  'Always use the dark options appearance.': {
    'zh-CN': '始终使用深色选项界面。',
    'zh-TW': '一律使用深色選項介面。',
  },
  'Automatic is the default and changes immediately when the system appearance changes.': {
    'zh-CN': '默认使用自动模式，并会随系统外观即时变化。',
    'zh-TW': '預設使用自動模式，並會隨系統外觀即時變更。',
  },
  'Default: follow the operating-system appearance.': {
    'zh-CN': '默认：跟随操作系统外观。',
    'zh-TW': '預設：跟隨作業系統外觀。',
  },
  'Restore original ZeroOmega / SwitchyOmega backup': {
    'zh-CN': '恢复原版 ZeroOmega / SwitchyOmega 备份',
    'zh-TW': '還原原版 ZeroOmega / SwitchyOmega 備份',
  },
  'Backup file': { 'zh-CN': '备份文件', 'zh-TW': '備份檔案' },
  'Legacy backup file': { 'zh-CN': '原版备份文件', 'zh-TW': '原版備份檔案' },
  'Legacy backup': { 'zh-CN': '原版备份', 'zh-TW': '原版備份' },
  'Options theme': { 'zh-CN': '选项主题', 'zh-TW': '選項佈景主題' },
  'Paste the complete ZeroOmega / SwitchyOmega backup': {
    'zh-CN': '粘贴完整的 ZeroOmega / SwitchyOmega 备份',
    'zh-TW': '貼上完整的 ZeroOmega / SwitchyOmega 備份',
  },
  'Paste backup text instead': { 'zh-CN': '改为粘贴备份文本', 'zh-TW': '改為貼上備份文字' },
  'Read backup': { 'zh-CN': '读取备份', 'zh-TW': '讀取備份' },
  'Reading backup…': { 'zh-CN': '正在读取备份…', 'zh-TW': '正在讀取備份…' },
  'Compatibility check': { 'zh-CN': '兼容性检查', 'zh-TW': '相容性檢查' },
  Encoding: { 'zh-CN': '编码', 'zh-TW': '編碼' },
  'Proxy endpoints': { 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  'Rule sources': { 'zh-CN': '规则来源', 'zh-TW': '規則來源' },
  Credentials: { 'zh-CN': '凭据', 'zh-TW': '憑證' },
  'Will be migrated securely': { 'zh-CN': '将安全迁移', 'zh-TW': '將安全移轉' },
  None: { 'zh-CN': '无', 'zh-TW': '無' },
  Exact: { 'zh-CN': '完全兼容', 'zh-TW': '完全相容' },
  'Target-dependent': { 'zh-CN': '取决于浏览器', 'zh-TW': '視瀏覽器而定' },
  Downgraded: { 'zh-CN': '降级处理', 'zh-TW': '降級處理' },
  Preserved: { 'zh-CN': '已保留', 'zh-TW': '已保留' },
  'Regenerated automatically': { 'zh-CN': '将自动重新生成', 'zh-TW': '將自動重新產生' },
  'Runtime state ignored': { 'zh-CN': '已忽略运行状态', 'zh-TW': '已忽略執行狀態' },
  Unsupported: { 'zh-CN': '不支持', 'zh-TW': '不支援' },
  'Import and use now': { 'zh-CN': '导入并立即使用', 'zh-TW': '匯入並立即使用' },
  'Import without activating': { 'zh-CN': '只导入，暂不启用', 'zh-TW': '僅匯入，暫不啟用' },
  'Importing…': { 'zh-CN': '正在导入…', 'zh-TW': '正在匯入…' },
  'Technical migration details': { 'zh-CN': '技术迁移详情', 'zh-TW': '技術移轉詳情' },
  'Import completed. The original configuration is now active.': {
    'zh-CN': '导入完成，原版配置现已启用。',
    'zh-TW': '匯入完成，原版設定現已啟用。',
  },
  'Import completed without changing the active proxy. Use Apply changes when ready.': {
    'zh-CN': '导入完成，但未改变当前代理。确认后请点击“应用选项”。',
    'zh-TW': '匯入完成，但未變更目前代理。確認後請按「套用選項」。',
  },
  'Configuration History': { 'zh-CN': '配置历史', 'zh-TW': '設定歷史' },
  'Verified PAC snapshots': { 'zh-CN': '已验证的 PAC 快照', 'zh-TW': '已驗證的 PAC 快照' },
  'Profile name': { 'zh-CN': '情景模式名称', 'zh-TW': '情景模式名稱' },
  'Profile color': { 'zh-CN': '情景模式颜色', 'zh-TW': '情景模式顏色' },
  Duplicate: { 'zh-CN': '复制', 'zh-TW': '複製' },
  Delete: { 'zh-CN': '删除', 'zh-TW': '刪除' },
  'Proxy servers': { 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  Scheme: { 'zh-CN': '网址协议', 'zh-TW': '網址協定' },
  Authentication: { 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  '(default)': { 'zh-CN': '(默认)', 'zh-TW': '(預設)' },
  DIRECT: { 'zh-CN': '直接连接', 'zh-TW': '直接連線' },
  '(use default)': { 'zh-CN': '(同默认)', 'zh-TW': '(同預設)' },
  'Show Advanced': { 'zh-CN': '显示高级设置', 'zh-TW': '顯示進階設定' },
  'Bypass List': { 'zh-CN': '不代理的地址列表', 'zh-TW': '不代理的位址清單' },
  'Servers for which you do not want to use any proxy: (One server on each line.)': {
    'zh-CN': '不经过代理连接的主机列表: (每行一个主机)',
    'zh-TW': '不經過代理連線的主機清單: (每行一個主機)',
  },
  '(Wildcards and more available…)': {
    'zh-CN': '(可使用通配符等匹配规则…)',
    'zh-TW': '(可使用萬用字元等比對規則…)',
  },
  'Proxy Authentication': { 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  Username: { 'zh-CN': '用户名', 'zh-TW': '使用者名稱' },
  Password: { 'zh-CN': '密码', 'zh-TW': '密碼' },
  'Show password': { 'zh-CN': '显示密码', 'zh-TW': '顯示密碼' },
  'Hide password': { 'zh-CN': '隐藏密码', 'zh-TW': '隱藏密碼' },
  'No Authentication': { 'zh-CN': '(无密码)', 'zh-TW': '(無密碼)' },
  'Save changes': { 'zh-CN': '保存更改', 'zh-TW': '儲存變更' },
  'Saving…': { 'zh-CN': '正在保存…', 'zh-TW': '正在儲存…' },
  'Loading…': { 'zh-CN': '正在加载…', 'zh-TW': '正在載入…' },
  Close: { 'zh-CN': '关闭', 'zh-TW': '關閉' },
  'Server is required.': { 'zh-CN': '代理服务器不能为空。', 'zh-TW': '代理伺服器不可留空。' },
  'Port must be an integer from 1 to 65535.': {
    'zh-CN': '代理端口必须是 1 到 65535 之间的整数。',
    'zh-TW': '代理連接埠必須是 1 到 65535 之間的整數。',
  },
  'Proxy server no longer exists.': {
    'zh-CN': '代理服务器已不存在。',
    'zh-TW': '代理伺服器已不存在。',
  },
  Protocol: { 'zh-CN': '协议', 'zh-TW': '通訊協定' },
  Server: { 'zh-CN': '服务器', 'zh-TW': '伺服器' },
  Port: { 'zh-CN': '端口', 'zh-TW': '連接埠' },
  'Bypass list': { 'zh-CN': '不代理的地址列表', 'zh-TW': '不使用代理的位址清單' },
  'One pattern per line.': { 'zh-CN': '每行一个匹配模式。', 'zh-TW': '每行一個比對模式。' },
  'Proxy Profile': { 'zh-CN': '代理服务器情景模式', 'zh-TW': '代理伺服器情景模式' },
  'Fixed Profile': { 'zh-CN': '固定情景模式', 'zh-TW': '固定情景模式' },
  'Switch Profile': { 'zh-CN': '自动切换情景模式', 'zh-TW': '自動切換情景模式' },
  'Rule List Profile': { 'zh-CN': '规则列表情景模式', 'zh-TW': '規則清單情景模式' },
  'PAC Profile': { 'zh-CN': 'PAC 情景模式', 'zh-TW': 'PAC 情景模式' },
  'Auto Detect Profile': { 'zh-CN': '自动检测情景模式', 'zh-TW': '自動偵測情景模式' },
  'No user profiles': { 'zh-CN': '没有用户情景模式', 'zh-TW': '沒有使用者情景模式' },
  'Connect without a proxy.': { 'zh-CN': '不通过代理直接连接。', 'zh-TW': '不透過代理直接連線。' },
  'Use the browser or operating-system proxy.': {
    'zh-CN': '使用浏览器或操作系统代理。',
    'zh-TW': '使用瀏覽器或作業系統代理。',
  },
  'Direct profile color': { 'zh-CN': '直接连接颜色', 'zh-TW': '直接連線顏色' },
  'System profile color': { 'zh-CN': '系统代理颜色', 'zh-TW': '系統代理顏色' },
  'Open ZeroOmega Nex options': {
    'zh-CN': '打开 ZeroOmega Nex 选项',
    'zh-TW': '開啟 ZeroOmega Nex 選項',
  },
  'Current profile': { 'zh-CN': '当前情景模式', 'zh-TW': '目前情景模式' },
};

const dynamicTranslations: readonly {
  readonly pattern: RegExp;
  readonly replace: (match: RegExpMatchArray, locale: Exclude<AppLocale, 'en'>) => string;
}[] = [
  {
    pattern: /^Activate (.+)$/u,
    replace: (match, locale) => (locale === 'zh-CN' ? `切换到 ${match[1]}` : `切換到 ${match[1]}`),
  },
  {
    pattern: /^(.+) is active$/u,
    replace: (match, locale) =>
      locale === 'zh-CN' ? `${match[1]} 当前已启用` : `${match[1]} 目前已啟用`,
  },
  {
    pattern: /^(.+) is disabled\.$/u,
    replace: (match, locale) =>
      locale === 'zh-CN' ? `${match[1]} 已禁用。` : `${match[1]} 已停用。`,
  },
  {
    pattern: /^Delete profile “(.+)”\? This changes only the Draft\.$/u,
    replace: (match, locale) =>
      locale === 'zh-CN'
        ? `删除情景模式“${match[1]}”？此操作只会修改尚未应用的设置。`
        : `刪除情景模式「${match[1]}」？此操作只會修改尚未套用的設定。`,
  },
  {
    pattern: /^(.+) proxy protocol$/u,
    replace: (match, locale) =>
      locale === 'zh-CN'
        ? `${translate(match[1] ?? '', locale)} 代理协议`
        : `${translate(match[1] ?? '', locale)} 代理協定`,
  },
  {
    pattern: /^(.+) proxy server$/u,
    replace: (match, locale) =>
      locale === 'zh-CN'
        ? `${translate(match[1] ?? '', locale)} 代理服务器`
        : `${translate(match[1] ?? '', locale)} 代理伺服器`,
  },
  {
    pattern: /^(.+) proxy port$/u,
    replace: (match, locale) =>
      locale === 'zh-CN'
        ? `${translate(match[1] ?? '', locale)} 代理端口`
        : `${translate(match[1] ?? '', locale)} 代理連接埠`,
  },
  {
    pattern: /^Your browser does not support (.+) proxy authentication\.$/u,
    replace: (match, locale) =>
      locale === 'zh-CN'
        ? `您的浏览器不支持 ${match[1]} 代理认证。`
        : `您的瀏覽器不支持 ${match[1]} 代理認證。`,
  },
];

export function resolveAppLocale(languages: readonly string[]): AppLocale {
  for (const candidate of languages) {
    const language = candidate.trim().replaceAll('_', '-').toLowerCase();
    if (/^zh(?:-|$)/u.test(language)) {
      if (/(?:-|^)(?:tw|hk|mo|hant)(?:-|$)/u.test(language)) return 'zh-TW';
      return 'zh-CN';
    }
  }
  return 'en';
}

export function currentAppLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'en';
  const languages = [
    ...(navigator.languages ?? []),
    navigator.language,
    typeof Intl === 'undefined' ? '' : Intl.DateTimeFormat().resolvedOptions().locale,
  ].filter(Boolean);
  return resolveAppLocale(languages);
}

export function translate(value: string, locale: AppLocale = currentAppLocale()): string {
  if (locale === 'en') return value;
  const exact = translations[value];
  if (exact) return exact[locale];
  for (const entry of dynamicTranslations) {
    const match = value.match(entry.pattern);
    if (match) return entry.replace(match, locale);
  }
  return value;
}

function translateTextNode(node: Text, locale: AppLocale): void {
  const match = node.data.match(/^(\s*)(.*?)(\s*)$/su);
  if (!match) return;
  const source = match[2] ?? '';
  if (!source) return;
  const translated = translate(source, locale);
  if (translated !== source) node.data = `${match[1]}${translated}${match[3]}`;
}

function translateElement(element: Element, locale: AppLocale): void {
  for (const attribute of ['aria-label', 'title', 'placeholder'] as const) {
    const source = element.getAttribute(attribute);
    if (!source) continue;
    const translated = translate(source, locale);
    if (translated !== source) element.setAttribute(attribute, translated);
  }
  for (const child of element.childNodes) translateNode(child, locale);
}

function translateNode(node: Node, locale: AppLocale): void {
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node as Text, locale);
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE) translateElement(node as Element, locale);
}

export function localizeDocument(
  root: Document = document,
  locale: AppLocale = currentAppLocale(),
): () => void {
  root.documentElement.lang = locale;
  translateElement(root.documentElement, locale);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        translateElement(record.target as Element, locale);
        continue;
      }
      if (record.type === 'characterData') {
        translateTextNode(record.target as Text, locale);
        continue;
      }
      for (const node of record.addedNodes) translateNode(node, locale);
    }
  });
  observer.observe(root.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'placeholder'],
  });
  return () => observer.disconnect();
}
