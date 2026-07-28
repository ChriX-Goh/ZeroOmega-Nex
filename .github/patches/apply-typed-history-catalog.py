from pathlib import Path

path = Path('apps/extension/src/lib/ui-messages.ts')
text = path.read_text()

catalog_anchor = "  'fixed.proxyServers':"
catalog = """  'history.nav': { en: 'Snapshot History', 'zh-CN': '配置历史', 'zh-TW': '設定歷史' },
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
  'history.revisions': { en: 'ProfileSpec revisions', 'zh-CN': 'ProfileSpec 修订', 'zh-TW': 'ProfileSpec 修訂' },
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
  'history.profileSpecHash': { en: 'ProfileSpec hash', 'zh-CN': 'ProfileSpec 哈希', 'zh-TW': 'ProfileSpec 雜湊' },
  'history.verificationMode': { en: 'Verification mode', 'zh-CN': '验证模式', 'zh-TW': '驗證模式' },
  'history.verificationVectors': { en: 'Verification vectors', 'zh-CN': '验证向量', 'zh-TW': '驗證向量' },
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
  'history.currentlyActive': { en: 'Currently active', 'zh-CN': '当前正在使用', 'zh-TW': '目前正在使用' },
  'history.rollbackToSnapshot': {
    en: 'Rollback to this snapshot',
    'zh-CN': '回滚到此快照',
    'zh-TW': '復原到此快照',
  },
"""
if text.count(catalog_anchor) != 1:
    raise SystemExit(f'catalog anchor count: {text.count(catalog_anchor)}')
text = text.replace(catalog_anchor, catalog + catalog_anchor, 1)

interface_anchor = "  readonly 'fixed.fieldAria': {"
interfaces = """  readonly 'history.profileRoute': { readonly profileId: string };
  readonly 'history.snapshotLabel': { readonly snapshotId: string };
  readonly 'history.vectorMatch': {
    readonly matchedCount: number;
    readonly vectorCount: number;
  };
  readonly 'history.warningCount': { readonly count: number };
  readonly 'history.rollbackDescription': { readonly revisionId: string };
"""
if text.count(interface_anchor) != 1:
    raise SystemExit(f'interface anchor count: {text.count(interface_anchor)}')
text = text.replace(interface_anchor, interfaces + interface_anchor, 1)

case_anchor = "    case 'fixed.fieldAria': {"
cases = """    case 'history.profileRoute': {
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
"""
if text.count(case_anchor) != 1:
    raise SystemExit(f'case anchor count: {text.count(case_anchor)}')
path.write_text(text.replace(case_anchor, cases + case_anchor, 1))
