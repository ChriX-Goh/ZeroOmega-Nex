from pathlib import Path

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
replacements = {
    "**Current product implementation head:** `e0dec06345cf496ceb4a4ac18725223a8b3b0937` — Typed three-locale catalog, machine inventory, and first complete vertical localization batch": "**Current product implementation head:** `85ce92bd443591f94a11adce4191f8c648b4d0fc` — Typed Switch, Attached Rule List, and Independent Rule List three-locale vertical batch",
    "**Latest integration verification:** run `30332516697` validates semantic typed keys, parameterized messages, fresh locale inventory, 417 core tests, 15 component tests, zero Svelte warnings, dual-target builds, and real Chromium zh-CN lifecycle workflows": "**Latest integration verification:** run `30368429932` validates typed condition/help/source errors, attached and independent Rule List controls/status/ARIA, fresh locale inventory, zero Svelte warnings, full repository verification, dual-target builds, and real Chromium zh-CN workflows",
    "**Last completed exact-Head verification:** `999ec55f13529176c7032e2d7f40acd8383e03e5`; CI `30332908321`, Browser E2E `30332908331`, Parity Documentation `30332908361` passed": "**Last completed exact-Head verification:** `6998ddf6d42e646403856e0372943c2778b6ad7a`; CI `30368666864`, Browser E2E `30368666918`, Parity Documentation `30368666640` passed",
    "- typed Switch plus Attached/Independent Rule List localization, including condition help, source-editor errors, update states, headers, actions, placeholders, and ARIA,\n- PAC localization, Firefox activation/download coverage, real proxy-challenge manual QC, and explicit file-URL target decision,\n- remaining General/Interface/Import/Theme/History/Popup/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,": "- PAC localization, Firefox activation/download coverage, real proxy-challenge manual QC, and explicit file-URL target decision,\n- stable Rule Source downloader failure codes for complete semantic error localization,\n- remaining General/Interface/Import/Theme/History/Popup/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,\n- online restore and Gist/WebDAV/browser sync remain explicitly `UNCERTAIN`,",
    "Use `docs/LOCALE_INVENTORY.json` to migrate Switch plus Attached/Independent Rule List as the second typed vertical batch; keep file PAC activation under an explicit target capability decision. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.": "Use `docs/LOCALE_INVENTORY.json` and the fixed v3.5.0 PAC locale/templates to migrate the PAC editor as the next typed vertical batch: URL/Clear, request headers, download/cache states, script text, authentication, file warnings, errors, titles, placeholders, and ARIA. Add Firefox PAC interaction coverage while keeping `file:` activation under an explicit target-capability decision.",
}
for old, new in replacements.items():
    if status.count(old) != 1:
        raise SystemExit(f'status expected one match, found {status.count(old)}: {old[:100]!r}')
    status = status.replace(old, new, 1)
checkpoint = "- Integration run `30368429932`; product commit `85ce92bd443591f94a11adce4191f8c648b4d0fc`; clean exact Head `6998ddf6d42e646403856e0372943c2778b6ad7a` passed CI `30368666864`, Browser E2E `30368666918`, and Parity Documentation `30368666640`."
if checkpoint not in status:
    anchor = "- Component tests cover zh-CN Switch/attached flows and zh-TW independent Rule List. Chromium asserts direct zh-CN headings, table columns, field ARIA, update status, and URL/text controls. Inventory and locale regression guards include all three components."
    if status.count(anchor) != 1:
        raise SystemExit('second locale batch status anchor missing')
    status = status.replace(anchor, anchor + "\n" + checkpoint, 1)
status_path.write_text(status)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
rows = {
    'B-04': '| B-04 | 删除按钮/确认 | `profile.jade`、`delete_profile.jade` | 页头删除，按设置确认 | MUST_MATCH | DONE | COMPLETE | 页头删除按 `confirmDeletion` 使用 typed 三语可访问对话框；Cancel 初始焦点、Draft→Apply 全链、0-warning 与 Chromium 回归均验证 | 保持双浏览器回归 |',
    'B-05': '| B-05 | 被引用时禁止删除 | `cannot_delete_profile.jade`、`profile.coffee` | 列出引用者，不允许损坏引用 | MUST_MATCH | DONE | COMPLETE | typed blocker 覆盖所有 route；附属 Rule List 折叠为父 Switch；标题、说明、按钮及引用类型均直接三语渲染 | 保持回归 |',
    'B-06': '| B-06 | 替换情景模式引用 | `replace_profile.jade`、`master.coffee` | Virtual 入口打开双选择器通用对话框；批量把 from 引用替换为 to | MUST_MATCH | DONE | COMPLETE | Apply-before-dialog、双端选择/预览、完整 typed transaction、端点保留及三语正文/ARIA 均已验证 | 保持回归 |',
    'D-01': '| D-01 | 条件帮助区 | `profile_switch.jade` | 基础/高级分组，可展开关闭 | MUST_MATCH | DONE | COMPLETE | 分组、条件名称、帮助、开关及关闭 ARIA 全部使用 typed 三语 catalog；组件与 Chromium 已验证 | 视觉巡查 |',
    'D-02': '| D-02 | 规则表格 | 同上 | 排序/类型/细节/结果/动作/备注列 | MUST_MATCH | DONE | COMPLETE | 原版紧凑表格和所有列名直接三语渲染；组件、永久守卫与 Chromium 覆盖 | 浏览器视觉巡查 |',
    'D-03': '| D-03 | 拖动排序 | 同上 | drag handle 排序 | MUST_MATCH | DONE | COMPLETE | 原生拖放与键盘后备保持；拖动、上移、下移的动态 ARIA 已三语化并通过真实 Chromium 回归 | 保持回归测试 |',
    'D-04': '| D-04 | 条件类型下拉 | 同上 | 原版类型和分组 | MUST_MATCH | PARTIAL | COMPLETE | 基础/Host/URL/Special 分组与条件名称/帮助均三语化；现有扩展条件兼容边界仍需最终巡查 | 原版命名与视觉巡查 |',
    'D-05': '| D-05 | 条件专属字段 | `profile_switch.jade`、`switch_profile.coffee` | 专属控件允许编辑中暂时无效；Apply 严格校验 | MUST_MATCH | PARTIAL | COMPLETE | 动态字段 ARIA、范围文本及源代码错误均按稳定 error code/行号三语渲染；Draft/Apply 严格边界保持 | 最终条件矩阵巡查 |',
    'D-06': '| D-06 | 结果情景模式列 | 同上 | 每规则 profile selector | MUST_MATCH | DONE | COMPLETE | 每行结果选择器及动态 ARIA 已三语化 | 浏览器视觉巡查 |',
    'D-07': '| D-07 | 删除规则 | 同上 | 行内删除按钮 | MUST_MATCH | DONE | COMPLETE | 行内删除 title 与动态 ARIA 已三语化 | 保持回归 |',
    'D-08': '| D-08 | 复制规则 | 同上 | 行内 clone；备注原样复制 | MUST_MATCH | DONE | COMPLETE | clone 保持备注原样；title 与动态 ARIA 已三语化 | 保持回归 |',
    'D-09': '| D-09 | 备注列 | 同上 | 可按需显示/添加备注 | MUST_MATCH | DONE | COMPLETE | Note 列、动作、placeholder 与动态 ARIA 已三语化 | 交互巡查 |',
    'D-10': '| D-10 | 添加条件位置 | `switch_profile.coffee`、`options.coffee` | 编辑器固定追加；Popup 插入位置由设置决定 | MUST_MATCH | DONE | COMPLETE | Options 固定追加与 Popup 偏好保持；添加动作及表格空状态已三语化 | 保持回归 |',
    'D-11': '| D-11 | 默认情景模式行 | `profile_switch.jade`、`switch_profile.coffee` | 表格尾部独立默认行；首条规则使用默认结果 | MUST_MATCH | DONE | COMPLETE | 表格尾部默认行、路由选项与 ARIA 均三语化 | 视觉巡查 |',
    'D-12': '| D-12 | 图形/源码切换 | 同上 | Edit Source，错误显示 | MUST_MATCH | DONE | COMPLETE | source 模式、帮助、ARIA 与稳定 `SwitchSourceError.code`/行号消息均三语化；Apply/导航守卫保持 | 保持回归 |',
    'D-13': '| D-13 | URL 条件限制警告 | `profile_switch.jade` | 明确浏览器完整 URL 限制 | MUST_MATCH | DONE | COMPLETE | 完整 URL 能力警告直接三语渲染 | 保持 |',
    'D-14': '| D-14 | 附加 RuleList | 同上 | Attach Profile 区块 | MUST_MATCH | DONE | COMPLETE | 在线规则列表标题、帮助和添加动作三语化；隐藏 ownership 与备份重建保持 | 视觉巡查 |',
    'D-15': '| D-15 | 附属启用开关 | 同上 | 规则表中启用/禁用 | MUST_MATCH | DONE | COMPLETE | 启用开关及启用/停用说明三语化；单测与 Chromium 覆盖 | 保持回归 |',
    'D-16': '| D-16 | 附属匹配结果 | 同上 | profile selector | MUST_MATCH | DONE | COMPLETE | match-route selector、Direct/System 与 ARIA 均三语化 | 保持回归 |',
    'D-17': '| D-17 | 附属格式/URL | 同上 | 格式、URL、帮助 | MUST_MATCH | DONE | COMPLETE | Switchy/AutoProxy、来源类型、URL、帮助和 placeholder 均三语化 | 保持回归 |',
    'D-18': '| D-18 | 附属请求头 | 同上 | 空白可增删 header 行 | MUST_MATCH | DONE | COMPLETE | 请求头标题、帮助、类型、动作和动态名称/值 ARIA 全部三语化；秘密仍后台持有 | 后台秘密编辑 UX |',
    'D-19': '| D-19 | 附属立即下载 | 同上 | 下载状态/更新时间/错误 | MUST_MATCH | DONE | PARTIAL | 下载动作、时间、字节、过期与失败保留缓存摘要已三语化；底层 downloader 尚缺稳定错误码 | 错误码化与长期运行巡查 |',
    'D-20': '| D-20 | 附属规则文本 | 同上 | URL 时只读，否则可编辑 | MUST_MATCH | DONE | COMPLETE | inline/下载缓存正文、只读语义及 ARIA 三语化；解释器/PAC compiler 继续消费缓存 | 保持下载联动回归 |',
    'D-21': '| D-21 | 删除附属确认 | `delete_attached.jade` | 恢复默认引用后删除 | MUST_MATCH | DONE | COMPLETE | 确认文案和移除动作三语化；原子恢复默认路由及资源删除保持 | 保持回归 |',
    'E-02': '| E-02 | 独立编辑页 | `profile_rule_list.jade` | 导入/附属后可见 | MUST_MATCH | DONE | COMPLETE | Config / URL / Text 三段原版结构及全部标题直接三语渲染；附属类型仍由父 Switch 管理 | Firefox 与视觉巡查 |',
    'E-03': '| E-03 | 匹配情景模式 | 同上 | profile selector | MUST_MATCH | DONE | COMPLETE | match selector、路由选项与 ARIA 三语化并排除自身/隐藏附属项 | 保持回归 |',
    'E-04': '| E-04 | 默认情景模式 | 同上 | profile selector | MUST_MATCH | DONE | COMPLETE | default selector、路由选项与 ARIA 三语化；Chromium 已验证 | 保持回归 |',
    'E-05': '| E-05 | 格式单选 | 同上 | 原版格式列表 | MUST_MATCH | DONE | COMPLETE | AutoProxy / Switchy radio 及 legend 三语化 | 保持回归 |',
    'E-06': '| E-06 | URL 与清除 | 同上 | URL input | MUST_MATCH | DONE | COMPLETE | URL、Clear、帮助、placeholder 与 ARIA 三语化；清除保留缓存并返回 inline | 保持回归 |',
    'E-07': '| E-07 | 立即下载 | 同上 | 下载按钮 | MUST_MATCH | DONE | PARTIAL | 下载动作与更新摘要三语化，真实 HTTP 下载已验证；底层 downloader 稳定错误码和 Firefox 交互仍待补 | 错误码化与 Firefox |',
    'E-08': '| E-08 | 规则文本只读语义 | 同上 | 有 URL 只读，无 URL 可编辑 | MUST_MATCH | DONE | COMPLETE | 正文标题/ARIA 三语化；URL 时只读，清除后同一内容恢复可编辑，组件与 Chromium 覆盖 | 保持回归 |',
}
seen = set()
for index, line in enumerate(lines):
    if not line.startswith('| '):
        continue
    parts = line.split('|')
    if len(parts) < 3:
        continue
    row_id = parts[1].strip()
    if row_id in rows:
        lines[index] = rows[row_id]
        seen.add(row_id)
missing = set(rows) - seen
if missing:
    raise SystemExit(f'audit rows not found: {sorted(missing)}')
audit_path.write_text('\n'.join(lines) + '\n')
