from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '''**Current product implementation head:** `29db0982ea57a230861c095968794d9363bf0261` — Original-compatible profile-level PAC and Rule List exports  
**Latest integration verification:** run `30328853989` validates current-Draft generated/raw PAC, modern/legacy Rule List formats, advanced-condition fallback, original filename/MIME, and real Chromium downloads with full `pnpm verify`  
**Last completed exact-Head verification:** `e0870bad4d90d11ad606dc7a5592203536653e49`; CI `30329080792`, Browser E2E `30329080770`, Parity Documentation `30329080845` passed  
''',
    '''**Current product implementation head:** `f6ed558ad14e5be6a5a2565f236fc278817ab1b7` — Zero-warning accessible Options dialogs and deterministic initial focus  
**Latest integration verification:** run `30330515929` validates all seven former Svelte warnings are removed, warning-fatal checks, 414 core tests, 14 component tests, dual-target builds, and real Chromium dialog focus  
**Last completed exact-Head verification:** `65b8fe0741178c1053f9ff1680e7487dbf647dc5`; CI `30330704000`, Browser E2E `30330703868`, Parity Documentation `30330703871` passed  
''',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '- Integration run `30330515929`; product commit containing this document.\n',
    '- Integration run `30330515929`; product commit `f6ed558ad14e5be6a5a2565f236fc278817ab1b7`; clean exact Head `65b8fe0741178c1053f9ff1680e7487dbf647dc5` passed CI `30330704000`, Browser E2E `30330703868`, and Parity Documentation `30330703871`.\n',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    'Four pre-existing Svelte accessibility warnings remain tracked; no new Svelte error was introduced.\n',
    '`svelte-check --fail-on-warnings` reports 0 errors and 0 warnings; future Svelte compiler or accessibility warnings fail CI.\n',
)

replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| A-04 | 新建模态框               | `new_profile.jade`                  | 模态框；名称在前，类型单选在后，Cancel/Create                  | MUST_MATCH  | DONE     | COMPLETE | 已改为原版结构的模态框                                 | 增加双浏览器视觉 E2E   |',
    '| A-04 | 新建模态框               | `new_profile.jade`                  | 模态框；名称在前，类型单选在后，Cancel/Create                  | MUST_MATCH  | DONE     | COMPLETE | 原版结构；中性 `div role=dialog`，名称输入程序化初始焦点；0-warning 与 Chromium 焦点回归已验证 | 增加双浏览器视觉 E2E   |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| B-04 | 删除按钮/确认     | `profile.jade`、`delete_profile.jade`          | 页头删除，按设置确认                                          | MUST_MATCH | DONE     | PARTIAL  | 页头删除按 `confirmDeletion` 使用显式可访问对话框；未确认只改 Draft，Chromium 验证确认→Apply 全链                          | 补完整 locale              |',
    '| B-04 | 删除按钮/确认     | `profile.jade`、`delete_profile.jade`          | 页头删除，按设置确认                                          | MUST_MATCH | DONE     | PARTIAL  | 页头删除按 `confirmDeletion` 使用中性可访问对话框；Cancel 初始焦点、Draft→Apply 全链及 0-warning 均验证                   | 补完整 locale              |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| B-05 | 被引用时禁止删除  | `cannot_delete_profile.jade`、`profile.coffee` | 列出引用者，不允许损坏引用                                    | MUST_MATCH | DONE     | PARTIAL  | typed blocker 覆盖所有 Profile route 面；隐藏附属 Rule List 折叠为父 Switch；UI `alertdialog` 与 Chromium 原版备份回归验证 | 补 locale                  |',
    '| B-05 | 被引用时禁止删除  | `cannot_delete_profile.jade`、`profile.coffee` | 列出引用者，不允许损坏引用                                    | MUST_MATCH | DONE     | PARTIAL  | typed blocker 覆盖所有 route；附属 Rule List 折叠为父 Switch；中性 `alertdialog`、Close 初始焦点与 Chromium 回归均验证     | 补 locale                  |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| C-08 | 每 scheme 认证     | `fixed_auth_edit.jade`   | 锁形按钮打开认证编辑                        | MUST_MATCH | PARTIAL  | COMPLETE | 对话框、密码读取/显示、秘密存储及 Chromium E2E；SOCKS 受目标限制 | Firefox/SOCKS 能力测试 |',
    '| C-08 | 每 scheme 认证     | `fixed_auth_edit.jade`   | 锁形按钮打开认证编辑                        | MUST_MATCH | PARTIAL  | COMPLETE | 对话框、秘密存储、用户名初始焦点、0-warning 及 Chromium E2E 已验证；SOCKS 受目标限制 | Firefox/SOCKS 能力测试 |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| G-11 | 单 Profile PAC 导出        | `profile.jade`                | 页头动作                          | MUST_MATCH | MISSING    | MISSING | 无                                                                                                                   | 见 B-07                  |',
    '| G-11 | 单 Profile PAC 导出        | `profile.jade`                | 页头动作                          | MUST_MATCH | DONE       | COMPLETE | Fixed/Switch/Rule List/Virtual 生成 PAC；PAC raw 结构验证；Chromium 真实下载                                          | 保持 B-07 回归           |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| G-12 | 单 Profile RuleList 导出   | `profile.jade`                | 页头动作                          | MUST_MATCH | MISSING    | MISSING | 无                                                                                                                   | 见 B-08                  |',
    '| G-12 | 单 Profile RuleList 导出   | `profile.jade`                | 页头动作                          | MUST_MATCH | DONE       | COMPLETE | Switch 页头现代 `.sorl`、eligible legacy `.ssrl`、高级条件 warning fallback 与 Chromium 下载均验证                  | 保持 B-08 回归           |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| G-16 | 导出 legacy rule list 选项 | `io.jade`                     | 可选 legacy 格式                  | MUST_MATCH | PARTIAL    | PARTIAL | 设置旗标存在但无真实导出                                                                                             | 完成导出后验证           |',
    '| G-16 | 导出 legacy rule list 选项 | `io.jade`                     | 可选 legacy 格式                  | MUST_MATCH | DONE       | COMPLETE | 基础条件导出 `.ssrl`；高级条件显示警告并安全回退 `.sorl`；真实下载已验证                                             | 保持回归                 |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| J-05 | Scheme/auth Fixed E2E              | MUST_MATCH | MISSING  | 无                                                                                                                                         | 重构后增加                       |',
    '| J-05 | Scheme/auth Fixed E2E              | MUST_MATCH | DONE     | Chromium 覆盖 fallback 配置、继承 placeholder、展开 scheme、认证秘密保存及用户名初始焦点；0-warning 门禁已固定       | 补 Firefox/SOCKS 能力测试         |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| J-06 | Switch 表格/附属 RuleList E2E      | MUST_MATCH | PARTIAL  | Chromium 覆盖附属创建、隐藏、启停、路由、文本/header 与解除；拖序仍缺                                                                      | 增加拖放与 Firefox 附属 E2E      |',
    '| J-06 | Switch 表格/附属 RuleList E2E      | MUST_MATCH | PARTIAL  | Chromium 覆盖附属创建/更新/解除、source-mode 重载，以及真实拖放后的 DOM、Draft 与重载顺序                              | 补 Firefox 附属交互 E2E           |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| J-08 | Virtual 引用 E2E                   | MUST_MATCH | PARTIAL  | ProfileSpec、解释器、PAC、迁移、引用替换已有单元/组件覆盖                                                                                  | 增加真实浏览器 E2E               |',
    '| J-08 | Virtual 引用 E2E                   | MUST_MATCH | DONE     | Chromium 真实创建 Virtual，并验证 Startup/Quick Switch/Switch/Rule List/PAC/Auto Detect/Virtual 全引用迁移与最终 Apply | 保持跨类型回归                    |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| J-10 | 每次 parity-sensitive 提交同步文档 | MUST_MATCH | PARTIAL  | 将由永久 workflow 执行                                                                                                                     | 启用后观察                       |',
    '| J-10 | 每次 parity-sensitive 提交同步文档 | MUST_MATCH | DONE     | Parity Documentation workflow 已持续阻断缺失/未同步文档提交，并在 Exact Head 重复验证                                 | 保持 workflow                    |',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '- **明确 BROKEN**：编辑器翻译仍不完整；Fixed 主编辑器与 Switch 规则表结构、完整 Options 导出和基础本地恢复已恢复。',
    '- **明确 BROKEN**：编辑器翻译仍不完整；Fixed/Switch/PAC/Rule List 核心结构、Profile 导出、完整 Options 导出和基础本地恢复已恢复。',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '- **明确 MISSING**：在线恢复、单 Profile 导出；完整 Options `.bak` 与原版默认备份 round-trip 已自动验收；Virtual 浏览器创建 E2E 仍不完整。',
    '- **明确 MISSING**：在线 URL 恢复与逐屏 light/dark/zh-CN/zh-TW 截图巡查；Profile 导出、Options round-trip 与 Virtual 浏览器迁移 E2E 已自动验收。',
)

audit = Path('docs/UI_AUDIT_MATRIX.md')
audit.write_text(
    audit.read_text().rstrip()
    + '\n| 2026-07-28 | Profile PAC/Rule List 导出、Virtual/Fixed E2E 与 parity workflow 状态纠偏；清除全部 7 个 Svelte 警告并固定 warning-fatal 门禁 |\n'
)
