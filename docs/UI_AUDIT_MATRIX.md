# ZeroOmega UI 大巡查表

> 本表是 Milestone 8 的用户界面与功能验收主表。原版基准固定为 `zero-peak/ZeroOmega v3.5.0`。状态必须基于源码、真实浏览器或真实备份，不得凭“看起来类似”判定。

## 状态定义

- 分类：`MUST_MATCH`、`REFERENCE`、`UNCERTAIN`、`INTENTIONAL_DIVERGENCE`、`NOT_PORTING`。
- Nex 状态：`DONE`、`PARTIAL`、`MISSING`、`BROKEN`、`UNVERIFIED`。
- 翻译：`COMPLETE`、`PARTIAL`、`MISSING`、`N/A`。
- 只有 `DONE` 且有自动或人工证据的行才算完成。

## A. 全局结构与新建流程

| ID   | 界面/功能                | 原版源码                            | 原版布局与行为                                                 | 分类        | Nex 状态 | 翻译     | 证据/问题                                              | 下一步                 |
| ---- | ------------------------ | ----------------------------------- | -------------------------------------------------------------- | ----------- | -------- | -------- | ------------------------------------------------------ | ---------------------- |
| A-01 | Options 三组导航         | `options.jade`                      | Settings / Profiles / Actions，Apply 与 Discard 固定在 Actions | MUST_MATCH  | DONE     | PARTIAL  | 结构已有；仍有动态英文                                 | 完成逐键翻译巡查       |
| A-02 | 情景模式独立页面         | `profile.jade`                      | 统一页头 + 类型专属模板                                        | MUST_MATCH  | PARTIAL  | PARTIAL  | 当前有独立页面，但类型内容被简化/合并                  | 按 B–F 重构            |
| A-03 | 新建入口                 | `options.jade`                      | 左侧单一“New profile…”入口                                     | MUST_MATCH  | DONE     | COMPLETE | 已有入口                                               | 保持                   |
| A-04 | 新建模态框               | `new_profile.jade`                  | 模态框；名称在前，类型单选在后，Cancel/Create                  | MUST_MATCH  | DONE     | COMPLETE | 已改为原版结构的模态框                                 | 增加双浏览器视觉 E2E   |
| A-05 | 名称必填校验             | `new_profile.jade`                  | 空名称即时错误                                                 | MUST_MATCH  | DONE     | COMPLETE | 模态框即时阻止空名称                                   | 保持组件与浏览器测试   |
| A-06 | 保留名称校验             | `new_profile.jade`、`master.coffee` | 双下划线及内置名称不可用                                       | MUST_MATCH  | DONE     | COMPLETE | 已阻止 `__*`、direct、system                           | 补原版边界 fixture     |
| A-07 | 重名校验                 | 同上                                | 已有情景模式名称冲突提示                                       | MUST_MATCH  | DONE     | COMPLETE | 已做不区分大小写的现有名称检查                         | 保持测试               |
| A-08 | 隐藏名称提示             | 同上                                | 合法但隐藏名称显示信息提示                                     | MUST_MATCH  | DONE     | COMPLETE | 单下划线名称显示提示但允许创建                         | 保持测试               |
| A-09 | 新建类型分类             | `new_profile.jade`                  | Fixed / Switch / PAC / Virtual 共 4 类                         | MUST_MATCH  | DONE     | COMPLETE | Rule List/Auto Detect 已从普通新建移除，Virtual 已补齐 | 保持类型守卫           |
| A-10 | Fixed 默认选中           | `new_profile.jade`                  | 打开模态框默认 Fixed                                           | MUST_MATCH  | DONE     | N/A      | 默认 radio 为 Fixed                                    | 保持组件测试           |
| A-11 | 类型图标和说明           | `new_profile.jade`、locale          | 每类图标、名称、帮助说明                                       | MUST_MATCH  | DONE     | COMPLETE | 四类均有图标、名称和说明                               | 做视觉复核             |
| A-12 | PAC 不支持提示           | `new_profile.jade`                  | 目标不支持时禁用并解释                                         | MUST_MATCH  | PARTIAL  | PARTIAL  | 有零散 target-dependent 说明                           | 放回类型选择流程       |
| A-13 | AngularJS/Bootstrap 技术 | 原版实现                            | 实现技术，不是产品契约                                         | NOT_PORTING | DONE     | N/A      | Nex 使用 Svelte/TypeScript                             | 不搬技术栈             |
| A-14 | 原版像素级皮肤           | `options.less`                      | 视觉参考，不要求完整复制                                       | REFERENCE   | PARTIAL  | N/A      | 用户认可当前主题                                       | 保留主题，匹配信息结构 |

## B. 共用情景模式页头与生命周期

| ID   | 界面/功能         | 原版源码                              | 原版布局与行为                   | 分类       | Nex 状态 | 翻译    | 证据/问题                                                 | 下一步                        |
| ---- | ----------------- | ------------------------------------- | -------------------------------- | ---------- | -------- | ------- | --------------------------------------------------------- | ----------------------------- |
| B-01 | 情景模式颜色      | `profile.jade`                        | 标题旁可调色；全 UI 图标同步     | MUST_MATCH | DONE     | PARTIAL | 已支持普通类型颜色                                        | 补齐标签翻译                  |
| B-02 | Virtual 继承颜色  | `profile.jade`                        | Virtual 不直接选色，显示目标颜色 | MUST_MATCH | DONE     | PARTIAL | 已继承目标 Profile 颜色并禁用直接选色；内置目标使用中性色 | 补内置颜色映射                |
| B-03 | 重命名按钮/对话框 | `profile.jade`、`rename_profile.jade` | 页头按钮，校验同新建             | MUST_MATCH | PARTIAL  | PARTIAL | 当前直接编辑名称字段                                      | 改为原版动作或明确差异决策    |
| B-04 | 删除按钮/确认     | `profile.jade`、`delete_profile.jade` | 页头删除，按设置确认             | MUST_MATCH | PARTIAL  | PARTIAL | 有删除和 confirm，但文案/引用处理不全                     | 补引用保护                    |
| B-05 | 被引用时禁止删除  | `cannot_delete_profile.jade`          | 列出引用者，不允许损坏引用       | MUST_MATCH | MISSING  | MISSING | 当前 delete mutation 需核验引用完整性                     | 增加引用图和 UI               |
| B-06 | 替换情景模式引用  | `replace_profile.jade`                | 批量把 from 引用替换为 to        | MUST_MATCH | MISSING  | MISSING | 未实现                                                    | typed replace-ref transaction |
| B-07 | 导出 PAC          | `profile.jade`                        | scriptable 类型页头导出          | MUST_MATCH | MISSING  | MISSING | 无入口                                                    | 实现并验证文件                |
| B-08 | 导出规则列表      | `profile.jade`                        | 支持类型页头导出，含 legacy 警告 | MUST_MATCH | MISSING  | MISSING | 无入口                                                    | 实现格式选择与下载            |
| B-09 | 修改 revision     | `profile.coffee`                      | 深层编辑更新 revision            | MUST_MATCH | DONE     | N/A     | Nex 有 immutable revision                                 | 保持自动测试                  |

## C. FixedProfile

| ID   | 界面/功能          | 原版源码                 | 原版布局与行为                              | 分类       | Nex 状态 | 翻译     | 证据/问题                                                        | 下一步                 |
| ---- | ------------------ | ------------------------ | ------------------------------------------- | ---------- | -------- | -------- | ---------------------------------------------------------------- | ---------------------- |
| C-01 | 代理服务器表格     | `profile_fixed.jade`     | 表格而非单行表单                            | MUST_MATCH | DONE     | COMPLETE | 已恢复默认/HTTP/HTTPS/FTP 表格；Chromium E2E 验证结构            | 保持                   |
| C-02 | 默认/后备代理行    | 同上                     | 第一行覆盖未独立设置的 scheme               | MUST_MATCH | DONE     | COMPLETE | fallback 为第一行；DIRECT 表示不使用代理                         | 保持                   |
| C-03 | HTTP 行            | 同上                     | 可独立协议/host/port/auth                   | MUST_MATCH | DONE     | COMPLETE | 独立映射、端口默认、认证入口；Chromium E2E 已覆盖                | 保持                   |
| C-04 | HTTPS 行           | 同上                     | 可独立协议/host/port/auth                   | MUST_MATCH | DONE     | COMPLETE | 独立映射、端口默认、认证入口                                     | 浏览器巡查             |
| C-05 | FTP 行/目标差异    | 同上                     | 原版包含 scheme 行；现代支持需核对          | UNCERTAIN  | PARTIAL  | COMPLETE | UI 已恢复；Chromium/Firefox 应用能力仍需实测                     | 双浏览器能力测试       |
| C-06 | 高级行折叠         | 同上                     | 默认隐藏，展开后显示                        | MUST_MATCH | DONE     | COMPLETE | 无高级映射时默认折叠；已有映射自动展开                           | 保持                   |
| C-07 | 继承值 placeholder | 同上                     | 未设置行显示 fallback host/port placeholder | MUST_MATCH | DONE     | COMPLETE | 未单独设置时禁用输入并显示 fallback 值                           | 保持                   |
| C-08 | 每 scheme 认证     | `fixed_auth_edit.jade`   | 锁形按钮打开认证编辑                        | MUST_MATCH | PARTIAL  | COMPLETE | 对话框、密码读取/显示、秘密存储及 Chromium E2E；SOCKS 受目标限制 | Firefox/SOCKS 能力测试 |
| C-09 | 协议选项限制       | `fixed_profile.coffee`   | 按 scheme/target 提供允许协议               | MUST_MATCH | PARTIAL  | COMPLETE | 原版协议项已恢复；认证支持按现代目标显式限制                     | 能力矩阵验证           |
| C-10 | Bypass 独立区块    | `profile_fixed.jade`     | 帮助、链接、多行输入                        | MUST_MATCH | DONE     | COMPLETE | 原版标题、帮助、链接与多行输入已恢复                             | 保持                   |
| C-11 | 默认 bypass        | `default_options.coffee` | 127.0.0.1 / [::1] / localhost               | MUST_MATCH | DONE     | N/A      | 新建 Fixed 显式测试三条原版默认值                                | 保持                   |
| C-12 | 初始示例 proxy     | `default_options.coffee` | 示例只能是示例，不能冒充用户配置            | MUST_MATCH | DONE     | N/A      | 新建及首次运行均为空代理；Chromium E2E 验证示例只为 placeholder  | 保持                   |

## D. SwitchProfile 与附属 RuleList

| ID   | 界面/功能        | 原版源码                                       | 原版布局与行为                             | 分类       | Nex 状态 | 翻译    | 证据/问题                                                                                                                                                                                                                               | 下一步                 |
| ---- | ---------------- | ---------------------------------------------- | ------------------------------------------ | ---------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| D-01 | 条件帮助区       | `profile_switch.jade`                          | 基础/高级分组，可展开关闭                  | MUST_MATCH | PARTIAL  | MISSING | 已恢复可展开关闭的分组帮助区；文本仍待 locale 化                                                                                                                                                                                        | 接入原版 locale        |
| D-02 | 规则表格         | 同上                                           | 排序/类型/细节/结果/动作/备注列            | MUST_MATCH | DONE     | PARTIAL | 已恢复单一紧凑表格及原版列结构；组件测试与永久守卫覆盖                                                                                                                                                                                  | 浏览器视觉巡查         |
| D-03 | 拖动排序         | 同上                                           | drag handle 排序                           | MUST_MATCH | PARTIAL  | N/A     | 已有原生 drag handle 与键盘 Up/Down 后备；尚缺浏览器拖放 E2E                                                                                                                                                                            | 加 Chromium 拖放测试   |
| D-04 | 条件类型下拉     | 同上                                           | 原版类型和分组                             | MUST_MATCH | PARTIAL  | MISSING | 已恢复基础/Host/URL/Special optgroup，并兼容现有扩展条件                                                                                                                                                                                | locale 与原版命名巡查  |
| D-05 | 条件专属字段     | `profile_switch.jade`、`switch_profile.coffee` | 专属控件允许编辑中暂时无效；Apply 严格校验 | MUST_MATCH | PARTIAL  | MISSING | 空 pattern/错误正则可作为 Draft warning 保存；移除非原版 flags 普通输入；Apply 与 Applied 仍严格                                                                                                                                        | 补 locale 与内联错误   |
| D-06 | 结果情景模式列   | 同上                                           | 每规则 profile selector                    | MUST_MATCH | DONE     | PARTIAL | 每行 result profile selector 已回到表格列                                                                                                                                                                                               | locale 与浏览器巡查    |
| D-07 | 删除规则         | 同上                                           | 行内删除按钮                               | MUST_MATCH | DONE     | PARTIAL | 行内删除已回到 Actions 列                                                                                                                                                                                                               | 补确认对话框巡查       |
| D-08 | 复制规则         | 同上                                           | 行内 clone；备注原样复制                   | MUST_MATCH | DONE     | PARTIAL | 行内 clone 已回到 Actions 列；不再给备注添加 Nex-only `copy` 后缀                                                                                                                                                                       | 浏览器巡查             |
| D-09 | 备注列           | 同上                                           | 可按需显示/添加备注                        | MUST_MATCH | DONE     | PARTIAL | 点击备注动作展开可选 Note 列；已有备注自动显示                                                                                                                                                                                          | locale 与交互巡查      |
| D-10 | 添加条件位置     | `switch_profile.coffee`、`options.coffee`      | 编辑器固定追加；Popup 插入位置由设置决定   | MUST_MATCH | PARTIAL  | PARTIAL | 编辑器现固定 push 并复制最后一条；Popup 当前站点注入尚未实现                                                                                                                                                                            | 实现 Popup 条件注入    |
| D-11 | 默认情景模式行   | `profile_switch.jade`、`switch_profile.coffee` | 表格尾部独立默认行；首条规则使用默认结果   | MUST_MATCH | DONE     | PARTIAL | Default profile 已恢复；首条规则使用默认路由，后续复制上一条结果                                                                                                                                                                        | locale 与视觉巡查      |
| D-12 | 图形/源码切换    | 同上                                           | Edit Source，错误显示                      | MUST_MATCH | DONE     | PARTIAL | 已实现原版 result-enabled 双向 compose/parse、行级错误及 Apply/导航守卫                                                                                                                                                                 | locale、重载持久化 E2E |
| D-13 | URL 条件限制警告 | `profile_switch.jade`                          | 明确浏览器完整 URL 限制                    | MUST_MATCH | DONE     | MISSING | URL wildcard/regex 存在时已显示能力警告                                                                                                                                                                                                 | 接入原版 locale        |
| D-14 | 附加 RuleList    | 同上                                           | Attach Profile 区块                        | MUST_MATCH | DONE     | PARTIAL | 已恢复父 Switch 内创建隐藏 `__ruleListOf_<name>`、隐藏导航及原版备份关系重建                                                                                                                                                            | 视觉与 locale 巡查     |
| D-15 | 附属启用开关     | 同上                                           | 规则表中启用/禁用                          | MUST_MATCH | DONE     | PARTIAL | 启用时父默认路由指向附属项，禁用时恢复可见默认路由；单测与 Chromium E2E 覆盖                                                                                                                                                            | locale                 |
| D-16 | 附属匹配结果     | 同上                                           | profile selector                           | MUST_MATCH | DONE     | PARTIAL | 附属表格行已恢复 match-route selector，并排除隐藏附属项作为普通候选                                                                                                                                                                     | locale                 |
| D-17 | 附属格式/URL     | 同上                                           | 格式、URL、帮助                            | MUST_MATCH | DONE     | PARTIAL | 已恢复 Switchy/AutoProxy、inline/URL；URL 下载缓存保留并可离线编译                                                                                                                                                                      | 下载按钮状态见 D-19    |
| D-18 | 附属请求头       | 同上                                           | 空白可增删 header 行                       | MUST_MATCH | DONE     | PARTIAL | 已恢复空白增删行；Draft 允许空名称 warning，Apply 严格；后台响应后由显式 `headerItems` 立即刷新；Chromium E2E 验证新增、编辑与删除                                                                                                      | 后台秘密编辑 UX        |
| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | DONE     | PARTIAL | 已有手动与自动更新：单一 alarms 扫描器启动即扫、每分钟检查、按源 interval/lastAttempt 判定到期；只使用已授权 origin；安全 header/secret、10 秒/4 MiB、原子缓存、状态、Options generation 同步及 Chromium alarm 后继续编辑/删除 E2E 完整 | locale 与长期运行巡查  |
| D-20 | 附属规则文本     | 同上                                           | URL 时只读，否则可编辑                     | MUST_MATCH | DONE     | PARTIAL | inline 可编辑；URL 显示保留的下载缓存且只读；解释器/PAC compiler 均消费缓存                                                                                                                                                             | locale 与下载联动      |
| D-21 | 删除附属确认     | `delete_attached.jade`                         | 恢复默认引用后删除                         | MUST_MATCH | DONE     | PARTIAL | 明确确认后原子恢复默认路由并删除隐藏 profile/source；父删除级联、复制独立资源均有测试                                                                                                                                                   | 专用对话框 locale      |

## E. RuleListProfile

| ID   | 界面/功能        | 原版源码                 | 原版布局与行为             | 分类       | Nex 状态 | 翻译     | 证据/问题                                                  | 下一步          |
| ---- | ---------------- | ------------------------ | -------------------------- | ---------- | -------- | -------- | ---------------------------------------------------------- | --------------- |
| E-01 | 普通新建入口     | `new_profile.jade`       | 不在普通新建四类中         | MUST_MATCH | DONE     | COMPLETE | 已从新建模态框移除，导入数据仍兼容                         | 保持回归测试    |
| E-02 | 独立编辑页       | `profile_rule_list.jade` | 导入/附属后可见            | MUST_MATCH | PARTIAL  | MISSING  | 有 Advanced editor，但结构不同                             | 重建专属模板    |
| E-03 | 匹配情景模式     | 同上                     | profile selector           | MUST_MATCH | PARTIAL  | MISSING  | 有 matchRoute                                              | 对齐名称和布局  |
| E-04 | 默认情景模式     | 同上                     | profile selector           | MUST_MATCH | PARTIAL  | MISSING  | 有 defaultRoute                                            | 对齐            |
| E-05 | 格式单选         | 同上                     | 原版格式列表               | MUST_MATCH | PARTIAL  | PARTIAL  | 只有 AutoProxy/Switchy                                     | 核对全部 format |
| E-06 | URL 与清除       | 同上                     | URL input                  | MUST_MATCH | PARTIAL  | MISSING  | URL 模式已从空值开始，不再写入 invalid URL；专属布局仍不同 | 重建专属模板    |
| E-07 | 立即下载         | 同上                     | 下载按钮                   | MUST_MATCH | MISSING  | MISSING  | 无                                                         | 实现            |
| E-08 | 规则文本只读语义 | 同上                     | 有 URL 只读，无 URL 可编辑 | MUST_MATCH | PARTIAL  | MISSING  | 切换位置不再写示例正文；URL 只读与下载状态仍待重构         | 完成状态关系    |

## F. PacProfile 与 VirtualProfile

| ID   | 界面/功能              | 原版源码                                 | 原版布局与行为                     | 分类       | Nex 状态 | 翻译     | 证据/问题                                               | 下一步                       |
| ---- | ---------------------- | ---------------------------------------- | ---------------------------------- | ---------- | -------- | -------- | ------------------------------------------------------- | ---------------------------- |
| F-01 | PAC URL                | `profile_pac.jade`                       | 单独 URL 输入/清除                 | MUST_MATCH | PARTIAL  | MISSING  | 有 URL/inline selector，模式不同                        | 对齐原版                     |
| F-02 | file URL 警告          | 同上                                     | 按引用和 target 显示               | MUST_MATCH | MISSING  | MISSING  | 无                                                      | 实现 capability 提示         |
| F-03 | PAC 请求头             | 同上                                     | 远程 URL 时可展开                  | MUST_MATCH | PARTIAL  | MISSING  | 新增 header 已为空白；展示条件、布局和翻译仍不等价      | 对齐原版区块                 |
| F-04 | PAC 立即下载           | 同上                                     | 更新远程脚本                       | MUST_MATCH | MISSING  | MISSING  | 无                                                      | 实现                         |
| F-05 | PAC Script             | 同上                                     | URL 时下载结果/只读；无 URL 可编辑 | MUST_MATCH | PARTIAL  | MISSING  | 有 inline textarea                                      | 重构状态关系                 |
| F-06 | PAC 认证全部代理       | 同上                                     | 入口和浏览器警告                   | MUST_MATCH | MISSING  | MISSING  | 后端局部认证存在但无等价 UI                             | 研究实现                     |
| F-07 | 不支持目标提示         | 同上                                     | 明确错误                           | MUST_MATCH | PARTIAL  | PARTIAL  | 有泛化说明                                              | 对齐 target 能力             |
| F-08 | invalid PAC URL 默认值 | 原版无此强制默认                         | 示例只能是 placeholder             | MUST_MATCH | DONE     | N/A      | URL 模式以空值初始化；永久守卫拒绝 example.invalid 回归 | 保持测试                     |
| F-09 | Virtual 编辑页         | `profile_virtual.jade`                   | 目标 selector + 帮助               | MUST_MATCH | DONE     | COMPLETE | 新增真实 Virtual 类型、目标选择器和帮助                 | 增加浏览器 E2E               |
| F-10 | Virtual 引用替换       | `profile_virtual.jade`、`profile.coffee` | 用目标替换所有 Virtual 引用        | MUST_MATCH | DONE     | PARTIAL  | 已有排除目标/Virtual 本身的 typed 引用替换和去重        | 补确认文案翻译与复杂引用测试 |
| F-11 | Auto Detect 普通新建   | `options.coffee` upgrade                 | 原版不是独立普通类型               | MUST_MATCH | DONE     | COMPLETE | 已从普通新建移除；旧导入类型暂保留兼容                  | 后续迁移为 WPAD PAC          |

## G. 导入 / 导出 / 同步

| ID   | 界面/功能                  | 原版源码                      | 原版布局与行为                    | 分类       | Nex 状态   | 翻译    | 证据/问题                      | 下一步                            |
| ---- | -------------------------- | ----------------------------- | --------------------------------- | ---------- | ---------- | ------- | ------------------------------ | --------------------------------- |
| G-01 | 完整 Options 导出          | `io.jade`、`io.coffee`        | plain JSON `.bak`，ISO 时间文件名 | MUST_MATCH | MISSING    | MISSING | 当前完全没有导出               | 实现下载与 round-trip             |
| G-02 | 本地备份恢复               | 同上                          | 文件选择后完整 reset              | MUST_MATCH | BROKEN     | PARTIAL | UI 有导入，但用户真实备份失败  | 用真实 v3.5.0 export fixture 修复 |
| G-03 | 在线 URL 恢复              | 同上                          | URL、10 秒 timeout、错误提示      | MUST_MATCH | MISSING    | MISSING | 无                             | 实现或明确现代安全限制            |
| G-04 | JSON 对象/字符串           | `options.coffee#parseOptions` | 均接受                            | MUST_MATCH | UNVERIFIED | N/A     | 当前 importer 仅部分格式       | 增加 fixtures                     |
| G-05 | Base64 JSON                | 同上                          | 非 `{` 字符串先 base64 decode     | MUST_MATCH | UNVERIFIED | N/A     | 有声称支持，真实覆盖不足       | 添加原版生成 fixture              |
| G-06 | schemaVersion 2            | `options.coffee#upgrade`      | 直接接受                          | MUST_MATCH | BROKEN     | N/A     | 用户实际 v2 导入不可用         | 差异报告到字段级                  |
| G-07 | schemaVersion 1            | 同上                          | 升级至 2                          | MUST_MATCH | UNVERIFIED | N/A     | 当前 fixture 不足              | 加 v1 fixture                     |
| G-08 | v1 auto_detect 升级        | 同上                          | PacProfile + WPAD URL             | MUST_MATCH | MISSING    | N/A     | 当前独立 AutoDetect 模型不等价 | 实现迁移映射                      |
| G-09 | 恢复后 startup 应用        | `options.coffee#reset`        | init 后应用 startupProfile        | MUST_MATCH | UNVERIFIED | N/A     | 当前“导入并使用”路径不同       | 做 round-trip E2E                 |
| G-10 | 导入错误分类               | `io.coffee`                   | 格式错误/下载错误分开             | MUST_MATCH | PARTIAL    | PARTIAL | 有技术报告但不等价             | 本地化和明确错误                  |
| G-11 | 单 Profile PAC 导出        | `profile.jade`                | 页头动作                          | MUST_MATCH | MISSING    | MISSING | 无                             | 见 B-07                           |
| G-12 | 单 Profile RuleList 导出   | `profile.jade`                | 页头动作                          | MUST_MATCH | MISSING    | MISSING | 无                             | 见 B-08                           |
| G-13 | Gist 同步                  | `io.jade`、`io.coffee`        | 私有 Gist、token、冲突处理        | UNCERTAIN  | MISSING    | MISSING | 安全/范围未决定                | 形成 ADR 后决定                   |
| G-14 | WebDAV 同步                | 同上                          | URL/用户/密码、冲突处理           | UNCERTAIN  | MISSING    | MISSING | 同上                           | 形成 ADR 后决定                   |
| G-15 | Built-in browser sync      | 同上                          | 可选增强同步                      | UNCERTAIN  | MISSING    | MISSING | 浏览器 MV3/配额需研究          | 形成 ADR                          |
| G-16 | 导出 legacy rule list 选项 | `io.jade`                     | 可选 legacy 格式                  | MUST_MATCH | PARTIAL    | PARTIAL | 设置旗标存在但无真实导出       | 完成导出后验证                    |

## H. 本地化、默认值与示例

| ID   | 界面/功能              | 原版源码                 | 原版布局与行为                    | 分类       | Nex 状态   | 翻译     | 证据/问题                                      | 下一步                    |
| ---- | ---------------------- | ------------------------ | --------------------------------- | ---------- | ---------- | -------- | ---------------------------------------------- | ------------------------- |
| H-01 | 英文默认               | locale                   | 其他语言回退英文                  | MUST_MATCH | DONE       | COMPLETE | 已实现                                         | 保持                      |
| H-02 | 简体中文               | `zh_CN`                  | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | 主导航可用，编辑器大量英文                     | 建立键级清单              |
| H-03 | 正體中文               | `zh_TW/zh_Hant`          | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | 同上                                           | 键级清单                  |
| H-04 | 动态文本               | locale/controller        | 状态变化后仍翻译                  | MUST_MATCH | PARTIAL    | PARTIAL  | observer 已修，但词典不全                      | 组件级验证                |
| H-05 | select option          | locale                   | 条件/协议/格式均翻译              | MUST_MATCH | BROKEN     | MISSING  | 大量硬编码英文                                 | 移到 typed locale catalog |
| H-06 | placeholder/title/aria | locale/template          | 一同翻译                          | MUST_MATCH | PARTIAL    | PARTIAL  | 部分已覆盖                                     | 自动 DOM 巡查             |
| H-07 | 错误和确认框           | locale                   | 全部本地化                        | MUST_MATCH | BROKEN     | MISSING  | 端口错误、删除确认等英文                       | 统一错误码翻译            |
| H-08 | 内置名显示翻译         | locale/filter            | 内部 direct/system 与显示名分离   | MUST_MATCH | PARTIAL    | PARTIAL  | Popup 好于 Options select                      | 统一 route label          |
| H-09 | example.invalid URL    | 非原版默认               | 不得写入配置                      | MUST_MATCH | DONE       | N/A      | PAC/Rule List URL 模式均从空值开始，守卫已覆盖 | 保持守卫                  |
| H-10 | `! Add rules here.`    | 非原版默认               | 不得自动保存                      | MUST_MATCH | DONE       | N/A      | 新建及模式切换均为空规则正文，守卫已覆盖       | 保持守卫                  |
| H-11 | 自动填 User-Agent      | 非原版默认               | 新 header 应为空                  | MUST_MATCH | DONE       | N/A      | 新增 header 名称和值均为空，守卫已覆盖         | 保持守卫                  |
| H-12 | 原版初始示例           | `default_options.coffee` | 初始 proxy/auto switch 示例可保留 | MUST_MATCH | UNVERIFIED | PARTIAL  | 需区分首次安装与新建                           | 加生命周期测试            |

## I. Popup 与辅助页面

| ID   | 界面/功能          | 原版源码           | 原版布局与行为               | 分类       | Nex 状态 | 翻译     | 证据/问题       | 下一步                    |
| ---- | ------------------ | ------------------ | ---------------------------- | ---------- | -------- | -------- | --------------- | ------------------------- |
| I-01 | Direct/System 顶部 | `popup*`           | 内置项优先                   | MUST_MATCH | DONE     | COMPLETE | E2E 已有        | 保持                      |
| I-02 | 用户情景模式顺序   | `popup*`           | 按配置顺序                   | MUST_MATCH | DONE     | COMPLETE | E2E 已有        | 保持                      |
| I-03 | 类型图标/颜色      | `popup*`           | 识别类型与颜色               | MUST_MATCH | DONE     | N/A      | 已实现          | 保持                      |
| I-04 | 结果情景模式       | popup controller   | Switch/Virtual 结果显示/选择 | MUST_MATCH | MISSING  | MISSING  | 无              | 实现 runtime result model |
| I-05 | 当前网站添加条件   | popup              | 对当前 tab 快速加规则        | MUST_MATCH | MISSING  | MISSING  | 无              | 权限+typed mutation       |
| I-06 | 临时规则           | `popup/temp_rules` | 非持久临时覆盖               | MUST_MATCH | MISSING  | MISSING  | 无              | 定义生命周期              |
| I-07 | 外部扩展控制状态   | popup/target       | 显示 external profile        | MUST_MATCH | MISSING  | MISSING  | 无              | 读取 proxy ownership      |
| I-08 | 请求错误列表       | popup/network      | 有界错误/请求查看            | MUST_MATCH | MISSING  | MISSING  | 无              | 安全设计后实现            |
| I-09 | Inspect 菜单       | popup/network      | 可配置显示                   | MUST_MATCH | MISSING  | MISSING  | flag 有但功能无 | 实现或明确 capability     |
| I-10 | Popup 主题         | 原版+Nex 决策      | 允许 Nex 现代主题            | REFERENCE  | DONE     | N/A      | 自动/浅/深已有  | 保持                      |
| I-11 | Popup 尺寸/像素    | CSS                | 可参考，非像素复制           | REFERENCE  | PARTIAL  | N/A      | 当前主题认可    | 功能优先                  |

## J. 测试与证据门槛

| ID   | 验收项                             | 分类       | Nex 状态 | 证据/问题                                                             | 下一步                           |
| ---- | ---------------------------------- | ---------- | -------- | --------------------------------------------------------------------- | -------------------------------- |
| J-01 | 原版源码固定证据                   | MUST_MATCH | DONE     | Artifact `8625759489`, v3.5.0                                         | 保留来源摘要                     |
| J-02 | 真实原版 `.bak` round-trip         | MUST_MATCH | MISSING  | 当前只有人工简化 fixture                                              | 由原版导出器生成 fixture         |
| J-03 | 五个现有 Nex 编辑页截图巡查        | MUST_MATCH | MISSING  | 无逐屏证据                                                            | 每页 light/dark/zh-CN/zh-TW 截图 |
| J-04 | 四类原版新建流程 E2E               | MUST_MATCH | PARTIAL  | 已有组件渲染与后端类型测试，尚缺真实浏览器创建四类                    | 增加 Chromium/Firefox E2E        |
| J-05 | Scheme/auth Fixed E2E              | MUST_MATCH | MISSING  | 无                                                                    | 重构后增加                       |
| J-06 | Switch 表格/附属 RuleList E2E      | MUST_MATCH | PARTIAL  | Chromium 覆盖附属创建、隐藏、启停、路由、文本/header 与解除；拖序仍缺 | 增加拖放与 Firefox 附属 E2E      |
| J-07 | PAC URL/download/header E2E        | MUST_MATCH | MISSING  | 无                                                                    | 重构后增加                       |
| J-08 | Virtual 引用 E2E                   | MUST_MATCH | PARTIAL  | ProfileSpec、解释器、PAC、迁移、引用替换已有单元/组件覆盖             | 增加真实浏览器 E2E               |
| J-09 | 导出→清空→导入→等价                | MUST_MATCH | MISSING  | 无                                                                    | I/O 完成条件                     |
| J-10 | 每次 parity-sensitive 提交同步文档 | MUST_MATCH | PARTIAL  | 将由永久 workflow 执行                                                | 启用后观察                       |

## 当前结论

- **明确 BROKEN**：真实备份导入、完整导出、编辑器翻译；Fixed 主编辑器与 Switch 规则表结构已恢复。
- **明确 MISSING**：在线恢复、单 Profile 导出、附属 RuleList 后台下载/更新时间/错误状态、Popup 当前站点/临时规则/网络检查；Virtual 已实现但浏览器 E2E 仍不完整。
- **UNCERTAIN**：Gist/WebDAV/浏览器同步、FTP scheme 的现代浏览器能力；未获范围决定前不得标记 `NOT_PORTING`。
- 当前 PR 必须继续保持 Draft，现有安装包不再作为功能完整候选。

## 更新记录

| 日期       | 变更                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-07-26 | 首次从 ZeroOmega v3.5.0 源码建立逐项巡查；诚实标记现有编辑器、翻译和 I/O 缺口                                  |
| 2026-07-26 | 清除 URL、规则正文和请求头的 Nex 假默认值；H-09/H-10/H-11 以代码、单测和永久守卫验证                           |
| 2026-07-26 | Switch 首切片恢复紧凑规则表、条件分组帮助、拖序/键盘排序、备注列、默认路由行与新增位置语义                     |
| 2026-07-26 | 源码复核纠正新增规则语义：编辑器固定追加并复制上一条；顶部/底部设置仅属于 Popup 条件注入                       |
| 2026-07-26 | 拆分 Draft/Applied 校验：文本条件可空或暂时无效，严格 Apply 在浏览器激活前拒绝；新增与复制不再注入示例 pattern |
| 2026-07-27 | 恢复 Switch 附属 Rule List 核心生命周期、隐藏关系、URL 缓存、请求头 Draft 语义、复制/删除事务与原版备份重建    |
