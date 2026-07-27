from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    path.write_text(source.replace(old, new))


core = Path('.github/patches/apply-rule-source-core.py')
replace_once(
    core,
    '''replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    ''' + "'''" + '''  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
    ''' + "'''" + '''  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceUpdateService,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
)
''',
    '''replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    ''' + "'''" + '''  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
    ''' + "'''" + '''  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceUpdateService,
  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
)
''',
    'core runtime import patch',
)
replace_once(
    core,
    '''export interface ProfileWorkflowRuleSourceUpdateView extends ProfileWorkflowRuleSourceUpdateRecord {
  readonly updateIntervalMinutes: number;
  readonly stale: boolean;
}
''',
    '''export interface ProfileWorkflowRuleSourceUpdateView {
  readonly sourceId: string;
  readonly url: string;
  readonly updateIntervalMinutes: number;
  readonly stale: boolean;
  readonly lastAttemptAt?: string;
  readonly lastSuccessAt?: string;
  readonly lastBytes?: number;
  readonly lastError?: ProfileWorkflowRuleSourceUpdateError;
}
''',
    'Rule Source update View contract',
)
replace_once(
    core,
    '''  readonly permissions?: {
    contains(permissions: { origins: string[] }): Promise<boolean>;
    request(permissions: { origins: string[] }): Promise<boolean>;
  };
''',
    '''  readonly permissions?: {
    request(permissions: { origins: string[] }): Promise<boolean>;
  };
''',
    'permission client API',
)
replace_once(
    core,
    '''  const permissions = { origins: [origin] };
  if (await api.permissions.contains(permissions)) return true;
  return api.permissions.request(permissions);
''',
    '''  return api.permissions.request({ origins: [origin] });
''',
    'permission request user gesture',
)

ui = Path('.github/patches/apply-rule-source-ui.py')
replace_once(
    ui,
    '''style_marker = ''' + "'''" + '''  .header-row {
''' + "'''" + '''
''',
    '''style_marker = ''' + "'''" + '''<style>
  fieldset {
''' + "'''" + '''
''',
    'UI style-marker declaration',
)
replace_once(
    ui,
    "source = source.replace(style_marker, style + style_marker)",
    "source = source.replace(style_marker, '<style>\\n' + style + '  fieldset {\\n')",
    'UI style replacement',
)

docs = Path('.github/patches/apply-rule-source-e2e-docs.py')
replace_once(
    docs,
    '| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | MISSING  | MISSING | 本切片只保留 URL 缓存和只读语义，尚无后台安全下载、时间戳与错误状态                              | 下一切片实现           |',
    '| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | MISSING  | MISSING | 本切片只保留 URL 缓存和只读语义，尚无后台安全下载、时间戳与错误状态                                                                | 下一切片实现           |',
    'D-19 generator text',
)

update = Path('packages/profile-workflow/src/rule-source-update.ts')
replace_once(
    update,
    "  const lastSuccess = matching?.lastSuccessAt && timestamp(matching.lastSuccessAt);\n",
    '''  const lastSuccess =
    matching?.lastSuccessAt === undefined ? undefined : timestamp(matching.lastSuccessAt);
''',
    'last-success timestamp narrowing',
)
replace_once(
    update,
    '''  const source = sourceById(initial, sourceId);
  if (!source) return { status: 'invalid', message: `Rule Source ${sourceId} does not exist` };
  const attemptedAt = service.now?.() ?? new Date().toISOString();
''',
    '''  const source = sourceById(initial, sourceId);
  if (!source) return { status: 'invalid', message: `Rule Source ${sourceId} does not exist` };
  if (source.location.kind !== 'url') {
    return { status: 'invalid', message: 'Rule Source is inline and cannot be downloaded', state: initial };
  }
  const configuredUrl = source.location.url;
  const attemptedAt = service.now?.() ?? new Date().toISOString();
''',
    'remote-source entrance narrowing',
)
replace_once(
    update,
    '''    const message = normalizedMessage(error);
    if (source.location.kind !== 'url') {
      return { status: 'invalid', message, state: initial };
    }
    return persistFailure(
      repository,
      initial,
      sourceId,
      source.location.url,
''',
    '''    const message = normalizedMessage(error);
    return persistFailure(
      repository,
      initial,
      sourceId,
      configuredUrl,
''',
    'invalid remote-source failure',
)
replace_once(
    update,
    "      source.location.kind === 'url' ? source.location.url : url,\n",
    "      configuredUrl,\n",
    'download failure configured URL',
)
replace_once(
    update,
    "    currentSource.location.url !== source.location.url\n",
    "    currentSource.location.url !== configuredUrl\n",
    'commit configured URL comparison',
)

test = Path('packages/profile-workflow/src/rule-source-update.test.ts')
replace_once(
    test,
    '''    expect(result.status).toBe('invalid');
    expect(result.message).toContain('controlled by the browser');
''',
    '''    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') throw new Error('expected invalid Rule Source update');
    expect(result.message).toContain('controlled by the browser');
''',
    'invalid result test narrowing',
)

component = Path('apps/extension/src/component-rendering.component.spec.ts')
replace_once(
    component,
    "    expect(body).toContain('Attached Rule List text');\n",
    "    expect(body).toContain('Attached Rule List downloaded text');\n",
    'URL component text assertion',
)
