from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:160]!r}')
    target.write_text(text.replace(old, new, 1))


catalog_path = 'apps/extension/src/lib/ui-messages.ts'
catalog_anchor = "  'fixed.proxyServers': { en: 'Proxy servers', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },\n"
pac_catalog = r'''  'pac.url': { en: 'PAC URL', 'zh-CN': 'PAC 网址', 'zh-TW': 'PAC 網址' },
  'pac.clearUrl': { en: 'Clear PAC URL', 'zh-CN': '清空 PAC 网址', 'zh-TW': '清除 PAC 網址' },
  'pac.clear': { en: 'Clear', 'zh-CN': '清空', 'zh-TW': '清除' },
  'pac.urlHelp': {
    en: 'The application downloads the PAC script from this URL. Leave it empty to use the script below directly.',
    'zh-CN': '应用将从此网址下载PAC脚本。如果网址留空，则直接使用下方的脚本内容。',
    'zh-TW': '將會從此網址下載 PAC 指令碼。如果網址留空，則直接使用下方的指令碼內容。',
  },
  'pac.fileWarning': {
    en: 'A local file PAC can only be used as a standalone profile because browsers restrict local-file access.',
    'zh-CN': '如果您使用本地PAC文件，则该情景模式只能单独使用，无法作为自动切换的结果。这是因为浏览器不允许读取本地文件。',
    'zh-TW': '如果您使用本機 PAC 檔案，則該情境模式只能單獨使用，無法作為自動切換的結果。這是因為瀏覽器不允許讀取本機檔案。',
  },
  'pac.fileReferenced': {
    en: 'This profile is referenced and therefore cannot use a local PAC file. Create a separate PAC Profile for the local file.',
    'zh-CN': '此情景模式已被引用，所以不能使用本地PAC文件。如果您真的需要使用本地文件，请另外新建一个PAC情景模式。',
    'zh-TW': '此情境模式已被引用，所以不能使用本機 PAC 檔案。如果您真的需要使用本機檔案，請另外建立一個 PAC 情境模式。',
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
  'pac.downloadNow': { en: 'Download now', 'zh-CN': '立即更新情景模式', 'zh-TW': '立即更新情境模式' },
  'pac.downloading': { en: 'Downloading…', 'zh-CN': '正在下载…', 'zh-TW': '正在下載…' },
  'pac.obsolete': {
    en: 'The PAC script is obsolete until an update is downloaded.',
    'zh-CN': '修改网址后尚未下载更新，因此脚本已经过时。请使用上方的更新按钮进行下载。',
    'zh-TW': '修改網址後尚未下載更新，因此指令碼已經過時。請使用上方的更新按鈕進行下載。',
  },
  'pac.cachedStale': { en: 'Cached script is stale.', 'zh-CN': '缓存脚本已经过时。', 'zh-TW': '快取指令碼已經過時。' },
  'pac.updateError': { en: 'PAC script update failed.', 'zh-CN': 'PAC 脚本更新失败。', 'zh-TW': 'PAC 指令碼更新失敗。' },
  'pac.script': { en: 'PAC Script', 'zh-CN': 'PAC 脚本', 'zh-TW': 'PAC 指令碼' },
  'pac.fileScriptHidden': {
    en: 'The browser reads this local file directly; cached script text is hidden.',
    'zh-CN': '浏览器会直接读取此本地文件，因此不显示缓存脚本文本。',
    'zh-TW': '瀏覽器會直接讀取此本機檔案，因此不顯示快取指令碼文字。',
  },
  'pac.authTitle': { en: 'Proxy Authentication', 'zh-CN': '代理登录', 'zh-TW': '代理認證' },
  'pac.authHelp': {
    en: 'These credentials answer Basic or Digest proxy challenges only while this PAC Profile is the active top-level route. Ordinary website authentication is never answered.',
    'zh-CN': '这些凭据只在当前 PAC 情景模式作为顶层活动路由时响应代理服务器的 Basic 或 Digest 认证；绝不会响应普通网站认证。',
    'zh-TW': '這些憑證只在目前 PAC 情境模式作為頂層作用中路由時回應 Proxy 伺服器的 Basic 或 Digest 認證；絕不會回應一般網站認證。',
  },
  'pac.authAllWarning': {
    en: 'Warning: the username and password may be offered to any proxy returned by the PAC script, and the target server may be unexpected.',
    'zh-CN': '警告: 用户名密码将会提供给PAC脚本返回的任何服务器，有时目标服务器会出乎您的预料。',
    'zh-TW': '警告：使用者名稱和密碼將會提供給 PAC 指令碼返回的任何伺服器，有時目標伺服器會出乎您的預料。',
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
    'zh-CN': '此外，在其他情景模式（如自动切换）中使用此情景时，可能会导致用户名和密码被发送至其他情景模式中设置的服务器。',
    'zh-TW': '此外，在其他情境模式（如自動切換）中使用此情境時，可能會導致使用者名稱和密碼被傳送至其他情境模式中設定的伺服器。',
  },
  'pac.authSet': { en: 'Set all-proxy authentication', 'zh-CN': '设置全部代理认证', 'zh-TW': '設定全部 Proxy 認證' },
  'pac.authEdit': { en: 'Edit all-proxy authentication', 'zh-CN': '编辑全部代理认证', 'zh-TW': '編輯全部 Proxy 認證' },
  'pac.authConfigured': { en: 'Configured.', 'zh-CN': '已配置。', 'zh-TW': '已設定。' },
  'pac.authNotConfigured': { en: 'Not configured.', 'zh-CN': '尚未配置。', 'zh-TW': '尚未設定。' },
  'pac.fallbackTitle': { en: 'Target capability fallback', 'zh-CN': '目标能力后备情景模式', 'zh-TW': '目標能力後備情境模式' },
  'pac.fallbackHelp': {
    en: 'Used only when the selected browser cannot activate this PAC source. It does not compose the arbitrary PAC script into another profile.',
    'zh-CN': '仅在所选浏览器无法激活此 PAC 来源时使用；不会把任意 PAC 脚本组合到其他情景模式中。',
    'zh-TW': '僅在所選瀏覽器無法啟用此 PAC 來源時使用；不會把任意 PAC 指令碼組合到其他情境模式中。',
  },
  'pac.fallbackAria': { en: 'PAC fallback profile', 'zh-CN': 'PAC 后备情景模式', 'zh-TW': 'PAC 後備情境模式' },
  'pac.noFallback': { en: 'No fallback', 'zh-CN': '不使用后备情景模式', 'zh-TW': '不使用後備情境模式' },
  'pac.authDialogTitle': { en: 'PAC Proxy Authentication', 'zh-CN': 'PAC 代理登录', 'zh-TW': 'PAC 代理認證' },
  'pac.authClose': { en: 'Close PAC authentication', 'zh-CN': '关闭 PAC 代理登录', 'zh-TW': '關閉 PAC 代理認證' },
  'pac.authDialogHelp': {
    en: 'One credential is used only for proxy authentication challenges while this PAC Profile is the active top-level route.',
    'zh-CN': '仅当此 PAC 情景模式作为顶层活动路由时，才使用这一组凭据响应代理认证。',
    'zh-TW': '僅當此 PAC 情境模式作為頂層作用中路由時，才使用這一組憑證回應 Proxy 認證。',
  },
  'pac.username': { en: 'Username', 'zh-CN': '用户名', 'zh-TW': '使用者名稱' },
  'pac.password': { en: 'Password', 'zh-CN': '密码', 'zh-TW': '密碼' },
  'pac.authUsernameAria': { en: 'PAC authentication username', 'zh-CN': 'PAC 代理登录用户名', 'zh-TW': 'PAC 代理認證使用者名稱' },
  'pac.authPasswordAria': { en: 'PAC authentication password', 'zh-CN': 'PAC 代理登录密码', 'zh-TW': 'PAC 代理認證密碼' },
  'pac.showPassword': { en: 'Show password', 'zh-CN': '显示密码', 'zh-TW': '顯示密碼' },
  'pac.hidePassword': { en: 'Hide password', 'zh-CN': '隐藏密码', 'zh-TW': '隱藏密碼' },
  'pac.removeAuthentication': { en: 'Remove authentication', 'zh-CN': '移除代理登录', 'zh-TW': '移除代理認證' },
  'pac.saveAuthentication': { en: 'Save authentication', 'zh-CN': '保存代理登录', 'zh-TW': '儲存代理認證' },
  'pac.authPermissionDenied': { en: 'Proxy authentication permission was not granted.', 'zh-CN': '未授予代理认证权限。', 'zh-TW': '未授予 Proxy 認證權限。' },
  'pac.authPermissionFailed': { en: 'Proxy authentication permission could not be requested.', 'zh-CN': '无法请求代理认证权限。', 'zh-TW': '無法要求 Proxy 認證權限。' },
  'pac.authReadFailed': { en: 'The saved PAC authentication secret could not be read.', 'zh-CN': '无法读取已保存的 PAC 代理认证秘密。', 'zh-TW': '無法讀取已儲存的 PAC 代理認證秘密。' },
  'pac.authSaveFailed': { en: 'PAC authentication could not be saved.', 'zh-CN': '无法保存 PAC 代理认证。', 'zh-TW': '無法儲存 PAC 代理認證。' },
  'pac.authRemoveFailed': { en: 'PAC authentication could not be removed.', 'zh-CN': '无法移除 PAC 代理认证。', 'zh-TW': '無法移除 PAC 代理認證。' },
  'pac.missingProfile': { en: 'PAC Profile no longer exists.', 'zh-CN': 'PAC 情景模式已不存在。', 'zh-TW': 'PAC 情境模式已不存在。' },
'''
replace_once(catalog_path, catalog_anchor, pac_catalog + catalog_anchor)

params_anchor = "  readonly 'fixed.fieldAria': {\n"
pac_params = r'''  readonly 'pac.headerAria': {
    readonly index: number;
    readonly field: 'name' | 'type' | 'value';
  };
  readonly 'pac.updateFailed': { readonly timestamp: string };
  readonly 'pac.lastUpdated': {
    readonly timestamp: string;
    readonly bytes?: number;
    readonly stale: boolean;
  };
  readonly 'pac.authConfiguredFor': { readonly username: string };
'''
replace_once(catalog_path, params_anchor, pac_params + params_anchor)

case_anchor = "    case 'fixed.fieldAria': {\n"
pac_cases = r'''    case 'pac.headerAria': {
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
      const { timestamp } = params as UiMessageParameters['pac.updateFailed'];
      if (locale === 'zh-CN') return `上次更新于 ${timestamp} 失败；已保留现有缓存脚本。`;
      if (locale === 'zh-TW') return `上次更新於 ${timestamp} 失敗；已保留現有快取指令碼。`;
      return `Last update failed ${timestamp}. Existing cached script was preserved.`;
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
      if (locale === 'zh-TW') return `PAC 指令碼最後更新時間：${timestamp}。${byteText}${staleText}`;
      return `Last updated ${timestamp}.${byteText}${staleText}`;
    }
    case 'pac.authConfiguredFor': {
      const { username } = params as UiMessageParameters['pac.authConfiguredFor'];
      if (locale === 'zh-CN') return `已为 ${username} 配置。`;
      if (locale === 'zh-TW') return `已為 ${username} 設定。`;
      return `Configured for ${username}.`;
    }
'''
replace_once(catalog_path, case_anchor, pac_cases + case_anchor)

# Typed unit coverage.
test_path = 'apps/extension/src/lib/ui-messages.test.ts'
test_anchor = "  it('formats dynamic deletion and accessibility messages without English fallback', () => {\n"
pac_test = r'''  it('formats source-backed PAC text and dynamic status in all three locales', () => {
    expect(uiText('pac.url', 'zh-CN')).toBe('PAC 网址');
    expect(uiText('pac.script', 'zh-TW')).toBe('PAC 指令碼');
    expect(
      uiMessage(
        'pac.lastUpdated',
        { timestamp: '2026/7/28 14:00', bytes: 256, stale: true },
        'zh-CN',
      ),
    ).toContain('PAC 脚本下载时间 2026/7/28 14:00');
    expect(uiMessage('pac.authConfiguredFor', { username: '使用者' }, 'zh-TW')).toBe(
      '已為 使用者 設定。',
    );
  });

'''
replace_once(test_path, test_anchor, pac_test + test_anchor)
