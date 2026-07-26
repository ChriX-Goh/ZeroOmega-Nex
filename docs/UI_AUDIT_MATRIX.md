# ZeroOmega UI 大巡查表

> 本表是 Milestone 8 的用户界面与功能验收主表。原版基准固定为 `zero-peak/ZeroOmega v3.5.0`。状态必须基于源码、真实浏览器或真实备份，不得凭“看起来类似”判定。

## 状态定义

- 分类：`MUST_MATCH`、`REFERENCE`、`UNCERTAIN`、`INTENTIONAL_DIVERGENCE`、`NOT_PORTING`。
- Nex 状态：`DONE`、`PARTIAL`、`MISSING`、`BROKEN`、`UNVERIFIED`。
- 翻译：`COMPLETE`、`PARTIAL`、`MISSING`、`N/A`。
- 只有 `DONE` 且有自动或人工证据的行才算完成。

## A. 全局结构与新建流程

| ID   | 界面/功能                | 原版源码                            | 原版布局与行为                                                 | 分类        | Nex 状态 | 翻译     | 证据/问题                                       | 下一步                     |
| ---- | ------------------------ | ----------------------------------- | -------------------------------------------------------------- | ----------- | -------- | -------- | ----------------------------------------------- | -------------------------- |
| A-01 | Options 三组导航         | `options.jade`                      | Settings / Profiles / Actions，Apply 与 Discard 固定在 Actions | MUST_MATCH  | DONE     | PARTIAL  | 结构已有；仍有动态英文                          | 完成逐键翻译巡查           |
| A-02 | 情景模式独立页面         | `profile.jade`                      | 统一页头 + 类型专属模板                                        | MUST_MATCH  | PARTIAL  | PARTIAL  | 当前有独立页面，但类型内容被简化/合并           | 按 B–F 重构                |
| A-03 | 新建入口                 | `options.jade`                      | 左侧单一“New profile…”入口                                     | MUST_MATCH  | DONE     | COMPLETE | 已有入口                                        | 保持                       |
| A-04 | 新建模态框               | `new_profile.jade`                  | 模态框；名称在前，类型单选在后，Cancel/Create                  | MUST_MATCH  | BROKEN   | PARTIAL  | 当前是右侧五张卡片                              | 重建原版结构               |
| A-05 | 名称必填校验             | `new_profile.jade`                  | 空名称即时错误                                                 | MUST_MATCH  | MISSING  | MISSING  | 当前创建后才使用自动名称                        | 添加表单校验               |
| A-06 | 保留名称校验             | `new_profile.jade`、`master.coffee` | direct/system 等保留名不可用                                   | MUST_MATCH  | MISSING  | MISSING  | 未在 UI 呈现                                    | 增加 typed validator       |
| A-07 | 重名校验                 | 同上                                | 已有情景模式名称冲突提示                                       | MUST_MATCH  | MISSING  | MISSING  | 未在 UI 呈现                                    | 增加校验与测试             |
| A-08 | 隐藏名称提示             | 同上                                | 合法但隐藏名称显示信息提示                                     | MUST_MATCH  | MISSING  | MISSING  | 未实现                                          | 核对隐藏名规则             |
| A-09 | 新建类型分类             | `new_profile.jade`                  | Fixed / Switch / PAC / Virtual 共 4 类                         | MUST_MATCH  | BROKEN   | PARTIAL  | 当前错误为 Fixed/Switch/RuleList/PAC/AutoDetect | 移除错误入口，增加 Virtual |
| A-10 | Fixed 默认选中           | `new_profile.jade`                  | 打开模态框默认 Fixed                                           | MUST_MATCH  | MISSING  | N/A      | 当前无单选模态框                                | 随 A-04 实现               |
| A-11 | 类型图标和说明           | `new_profile.jade`、locale          | 每类图标、名称、帮助说明                                       | MUST_MATCH  | PARTIAL  | PARTIAL  | 图标已有，说明/布局不完整                       | 直接映射原版 locale        |
| A-12 | PAC 不支持提示           | `new_profile.jade`                  | 目标不支持时禁用并解释                                         | MUST_MATCH  | PARTIAL  | PARTIAL  | 有零散 target-dependent 说明                    | 放回类型选择流程           |
| A-13 | AngularJS/Bootstrap 技术 | 原版实现                            | 实现技术，不是产品契约                                         | NOT_PORTING | DONE     | N/A      | Nex 使用 Svelte/TypeScript                      | 不搬技术栈                 |
| A-14 | 原版像素级皮肤           | `options.less`                      | 视觉参考，不要求完整复制                                       | REFERENCE   | PARTIAL  | N/A      | 用户认可当前主题                                | 保留主题，匹配信息结构     |

## B. 共用情景模式页头与生命周期

| ID   | 界面/功能         | 原版源码                              | 原版布局与行为                   | 分类       | Nex 状态 | 翻译    | 证据/问题                             | 下一步                        |
| ---- | ----------------- | ------------------------------------- | -------------------------------- | ---------- | -------- | ------- | ------------------------------------- | ----------------------------- |
| B-01 | 情景模式颜色      | `profile.jade`                        | 标题旁可调色；全 UI 图标同步     | MUST_MATCH | DONE     | PARTIAL | 已支持普通类型颜色                    | 补齐标签翻译                  |
| B-02 | Virtual 继承颜色  | `profile.jade`                        | Virtual 不直接选色，显示目标颜色 | MUST_MATCH | MISSING  | MISSING | Virtual 整体缺失                      | 随 F 实现                     |
| B-03 | 重命名按钮/对话框 | `profile.jade`、`rename_profile.jade` | 页头按钮，校验同新建             | MUST_MATCH | PARTIAL  | PARTIAL | 当前直接编辑名称字段                  | 改为原版动作或明确差异决策    |
| B-04 | 删除按钮/确认     | `profile.jade`、`delete_profile.jade` | 页头删除，按设置确认             | MUST_MATCH | PARTIAL  | PARTIAL | 有删除和 confirm，但文案/引用处理不全 | 补引用保护                    |
| B-05 | 被引用时禁止删除  | `cannot_delete_profile.jade`          | 列出引用者，不允许损坏引用       | MUST_MATCH | MISSING  | MISSING | 当前 delete mutation 需核验引用完整性 | 增加引用图和 UI               |
| B-06 | 替换情景模式引用  | `replace_profile.jade`                | 批量把 from 引用替换为 to        | MUST_MATCH | MISSING  | MISSING | 未实现                                | typed replace-ref transaction |
| B-07 | 导出 PAC          | `profile.jade`                        | scriptable 类型页头导出          | MUST_MATCH | MISSING  | MISSING | 无入口                                | 实现并验证文件                |
| B-08 | 导出规则列表      | `profile.jade`                        | 支持类型页头导出，含 legacy 警告 | MUST_MATCH | MISSING  | MISSING | 无入口                                | 实现格式选择与下载            |
| B-09 | 修改 revision     | `profile.coffee`                      | 深层编辑更新 revision            | MUST_MATCH | DONE     | N/A     | Nex 有 immutable revision             | 保持自动测试                  |

## C. FixedProfile

| ID   | 界面/功能          | 原版源码                 | 原版布局与行为                              | 分类       | Nex 状态   | 翻译    | 证据/问题                           | 下一步             |
| ---- | ------------------ | ------------------------ | ------------------------------------------- | ---------- | ---------- | ------- | ----------------------------------- | ------------------ |
| C-01 | 代理服务器表格     | `profile_fixed.jade`     | 表格而非单行表单                            | MUST_MATCH | BROKEN     | PARTIAL | 当前只显示单 endpoint               | 重建 scheme 表格   |
| C-02 | 默认/后备代理行    | 同上                     | 第一行覆盖未独立设置的 scheme               | MUST_MATCH | PARTIAL    | PARTIAL | schema 有 fallback 概念但 UI 不等价 | 建立映射           |
| C-03 | HTTP 行            | 同上                     | 可独立协议/host/port/auth                   | MUST_MATCH | MISSING    | MISSING | UI 无独立 scheme                    | 实现               |
| C-04 | HTTPS 行           | 同上                     | 可独立协议/host/port/auth                   | MUST_MATCH | MISSING    | MISSING | 同上                                | 实现               |
| C-05 | FTP 行/目标差异    | 同上                     | 原版包含 scheme 行；现代支持需核对          | UNCERTAIN  | MISSING    | MISSING | 浏览器 API 能力可能变化             | 研究后决策         |
| C-06 | 高级行折叠         | 同上                     | 默认隐藏，展开后显示                        | MUST_MATCH | MISSING    | MISSING | 无折叠                              | 实现               |
| C-07 | 继承值 placeholder | 同上                     | 未设置行显示 fallback host/port placeholder | MUST_MATCH | MISSING    | MISSING | 无 scheme 行                        | 实现               |
| C-08 | 每 scheme 认证     | `fixed_auth_edit.jade`   | 锁形按钮打开认证编辑                        | MUST_MATCH | PARTIAL    | PARTIAL | 后端有认证计划，Options UI 不等价   | 重建对话框         |
| C-09 | 协议选项限制       | `fixed_profile.coffee`   | 按 scheme/target 提供允许协议               | MUST_MATCH | PARTIAL    | N/A     | 当前通用 HTTP/HTTPS/SOCKS           | 对照原版与现代 API |
| C-10 | Bypass 独立区块    | `profile_fixed.jade`     | 帮助、链接、多行输入                        | MUST_MATCH | PARTIAL    | PARTIAL | 多行框已有，帮助不全                | 补布局和 locale    |
| C-11 | 默认 bypass        | `default_options.coffee` | 127.0.0.1 / ::1 / localhost                 | MUST_MATCH | DONE       | N/A     | 已映射                              | 增加显式测试       |
| C-12 | 初始示例 proxy     | `default_options.coffee` | proxy.example.com:8080 仅初始示例           | MUST_MATCH | UNVERIFIED | N/A     | 需确认 Nex 新建是否错误复用         | 加创建前后测试     |

## D. SwitchProfile 与附属 RuleList

| ID   | 界面/功能        | 原版源码               | 原版布局与行为                  | 分类       | Nex 状态   | 翻译    | 证据/问题                        | 下一步             |
| ---- | ---------------- | ---------------------- | ------------------------------- | ---------- | ---------- | ------- | -------------------------------- | ------------------ |
| D-01 | 条件帮助区       | `profile_switch.jade`  | 基础/高级分组，可展开关闭       | MUST_MATCH | MISSING    | MISSING | 无帮助图谱                       | 从 locale 生成     |
| D-02 | 规则表格         | 同上                   | 排序/类型/细节/结果/动作/备注列 | MUST_MATCH | BROKEN     | PARTIAL | 当前每规则一个 fieldset          | 重建表格           |
| D-03 | 拖动排序         | 同上                   | drag handle 排序                | MUST_MATCH | MISSING    | N/A     | 仅 Up/Down 或按钮逻辑            | 实现键盘+拖动      |
| D-04 | 条件类型下拉     | 同上                   | 原版类型和分组                  | MUST_MATCH | PARTIAL    | MISSING | 类型较多但名称全英文且分类不一致 | 建立映射表         |
| D-05 | 条件专属字段     | 同上                   | 不同条件用专属控件              | MUST_MATCH | PARTIAL    | MISSING | 有部分字段，布局/验证不一致      | 逐条件巡查         |
| D-06 | 结果情景模式列   | 同上                   | 每规则 profile selector         | MUST_MATCH | PARTIAL    | PARTIAL | 有 route select，但布局不一致    | 改表格控件         |
| D-07 | 删除规则         | 同上                   | 行内删除按钮                    | MUST_MATCH | DONE       | PARTIAL | 功能有                           | 放回表格           |
| D-08 | 复制规则         | 同上                   | 行内 clone                      | MUST_MATCH | DONE       | PARTIAL | 功能有                           | 放回表格           |
| D-09 | 备注列           | 同上                   | 可按需显示/添加备注             | MUST_MATCH | PARTIAL    | MISSING | note 字段有，交互不同            | 实现原版交互       |
| D-10 | 添加条件位置     | 同上、UI setting       | 顶部/底部由设置决定             | MUST_MATCH | UNVERIFIED | PARTIAL | 设置存在，编辑器调用需核验       | 加排序测试         |
| D-11 | 默认情景模式行   | 同上                   | 表格尾部独立默认行              | MUST_MATCH | PARTIAL    | PARTIAL | 当前独立 section                 | 调整布局           |
| D-12 | 图形/源码切换    | 同上                   | Edit Source，错误显示           | MUST_MATCH | MISSING    | MISSING | 无源码模式                       | 实现双向解析       |
| D-13 | URL 条件限制警告 | 同上                   | 明确浏览器完整 URL 限制         | MUST_MATCH | MISSING    | MISSING | 无对应警告                       | 按 target 显示     |
| D-14 | 附加 RuleList    | 同上                   | Attach Profile 区块             | MUST_MATCH | MISSING    | MISSING | 当前 RuleList 独立新建           | 重构类型关系       |
| D-15 | 附属启用开关     | 同上                   | 规则表中启用/禁用               | MUST_MATCH | MISSING    | MISSING | 无                               | 实现               |
| D-16 | 附属匹配结果     | 同上                   | profile selector                | MUST_MATCH | MISSING    | MISSING | 无                               | 实现               |
| D-17 | 附属格式/URL     | 同上                   | 格式、URL、帮助                 | MUST_MATCH | PARTIAL    | MISSING | 独立 editor 有近似字段           | 移入附属区         |
| D-18 | 附属请求头       | 同上                   | 空白可增删 header 行            | MUST_MATCH | PARTIAL    | MISSING | 当前新增自动填 User-Agent        | 改空值+placeholder |
| D-19 | 附属立即下载     | 同上                   | 下载状态/更新时间/错误          | MUST_MATCH | MISSING    | MISSING | 无网络更新动作                   | 实现安全下载服务   |
| D-20 | 附属规则文本     | 同上                   | URL 时只读，否则可编辑          | MUST_MATCH | PARTIAL    | MISSING | 当前有通用 inline/url            | 按原版语义重构     |
| D-21 | 删除附属确认     | `delete_attached.jade` | 恢复默认引用后删除              | MUST_MATCH | MISSING    | MISSING | 无                               | 实现事务           |

## E. RuleListProfile

| ID   | 界面/功能        | 原版源码                 | 原版布局与行为             | 分类       | Nex 状态 | 翻译    | 证据/问题                           | 下一步          |
| ---- | ---------------- | ------------------------ | -------------------------- | ---------- | -------- | ------- | ----------------------------------- | --------------- |
| E-01 | 普通新建入口     | `new_profile.jade`       | 不在普通新建四类中         | MUST_MATCH | BROKEN   | PARTIAL | 当前错误暴露                        | 从新建页移除    |
| E-02 | 独立编辑页       | `profile_rule_list.jade` | 导入/附属后可见            | MUST_MATCH | PARTIAL  | MISSING | 有 Advanced editor，但结构不同      | 重建专属模板    |
| E-03 | 匹配情景模式     | 同上                     | profile selector           | MUST_MATCH | PARTIAL  | MISSING | 有 matchRoute                       | 对齐名称和布局  |
| E-04 | 默认情景模式     | 同上                     | profile selector           | MUST_MATCH | PARTIAL  | MISSING | 有 defaultRoute                     | 对齐            |
| E-05 | 格式单选         | 同上                     | 原版格式列表               | MUST_MATCH | PARTIAL  | PARTIAL | 只有 AutoProxy/Switchy              | 核对全部 format |
| E-06 | URL 与清除       | 同上                     | URL input                  | MUST_MATCH | PARTIAL  | MISSING | 有 URL 模式，但默认注入 invalid URL | 改空值          |
| E-07 | 立即下载         | 同上                     | 下载按钮                   | MUST_MATCH | MISSING  | MISSING | 无                                  | 实现            |
| E-08 | 规则文本只读语义 | 同上                     | 有 URL 只读，无 URL 可编辑 | MUST_MATCH | PARTIAL  | MISSING | 当前切换 location 会写示例正文      | 改为空/保留原值 |

## F. PacProfile 与 VirtualProfile

| ID   | 界面/功能              | 原版源码                                 | 原版布局与行为                     | 分类       | Nex 状态 | 翻译    | 证据/问题                                    | 下一步                 |
| ---- | ---------------------- | ---------------------------------------- | ---------------------------------- | ---------- | -------- | ------- | -------------------------------------------- | ---------------------- |
| F-01 | PAC URL                | `profile_pac.jade`                       | 单独 URL 输入/清除                 | MUST_MATCH | PARTIAL  | MISSING | 有 URL/inline selector，模式不同             | 对齐原版               |
| F-02 | file URL 警告          | 同上                                     | 按引用和 target 显示               | MUST_MATCH | MISSING  | MISSING | 无                                           | 实现 capability 提示   |
| F-03 | PAC 请求头             | 同上                                     | 远程 URL 时可展开                  | MUST_MATCH | PARTIAL  | MISSING | 有 headers，但新增值错误                     | 空白行+验证            |
| F-04 | PAC 立即下载           | 同上                                     | 更新远程脚本                       | MUST_MATCH | MISSING  | MISSING | 无                                           | 实现                   |
| F-05 | PAC Script             | 同上                                     | URL 时下载结果/只读；无 URL 可编辑 | MUST_MATCH | PARTIAL  | MISSING | 有 inline textarea                           | 重构状态关系           |
| F-06 | PAC 认证全部代理       | 同上                                     | 入口和浏览器警告                   | MUST_MATCH | MISSING  | MISSING | 后端局部认证存在但无等价 UI                  | 研究实现               |
| F-07 | 不支持目标提示         | 同上                                     | 明确错误                           | MUST_MATCH | PARTIAL  | PARTIAL | 有泛化说明                                   | 对齐 target 能力       |
| F-08 | invalid PAC URL 默认值 | 原版无此强制默认                         | 示例只能是 placeholder             | MUST_MATCH | BROKEN   | N/A     | 当前写入 `https://example.invalid/proxy.pac` | 删除数据默认           |
| F-09 | Virtual 编辑页         | `profile_virtual.jade`                   | 目标 selector + 帮助               | MUST_MATCH | MISSING  | MISSING | 整体缺失                                     | 新增 schema/编辑器     |
| F-10 | Virtual 引用替换       | `profile_virtual.jade`、`profile.coffee` | 用目标替换所有 Virtual 引用        | MUST_MATCH | MISSING  | MISSING | 无                                           | typed replace-ref      |
| F-11 | Auto Detect 普通新建   | `options.coffee` upgrade                 | 原版不是独立普通类型               | MUST_MATCH | BROKEN   | PARTIAL | 当前错误暴露                                 | 移除；用 WPAD PAC 迁移 |

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

| ID   | 界面/功能              | 原版源码                 | 原版布局与行为                    | 分类       | Nex 状态   | 翻译     | 证据/问题                  | 下一步                    |
| ---- | ---------------------- | ------------------------ | --------------------------------- | ---------- | ---------- | -------- | -------------------------- | ------------------------- |
| H-01 | 英文默认               | locale                   | 其他语言回退英文                  | MUST_MATCH | DONE       | COMPLETE | 已实现                     | 保持                      |
| H-02 | 简体中文               | `zh_CN`                  | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | 主导航可用，编辑器大量英文 | 建立键级清单              |
| H-03 | 正體中文               | `zh_TW/zh_Hant`          | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | 同上                       | 键级清单                  |
| H-04 | 动态文本               | locale/controller        | 状态变化后仍翻译                  | MUST_MATCH | PARTIAL    | PARTIAL  | observer 已修，但词典不全  | 组件级验证                |
| H-05 | select option          | locale                   | 条件/协议/格式均翻译              | MUST_MATCH | BROKEN     | MISSING  | 大量硬编码英文             | 移到 typed locale catalog |
| H-06 | placeholder/title/aria | locale/template          | 一同翻译                          | MUST_MATCH | PARTIAL    | PARTIAL  | 部分已覆盖                 | 自动 DOM 巡查             |
| H-07 | 错误和确认框           | locale                   | 全部本地化                        | MUST_MATCH | BROKEN     | MISSING  | 端口错误、删除确认等英文   | 统一错误码翻译            |
| H-08 | 内置名显示翻译         | locale/filter            | 内部 direct/system 与显示名分离   | MUST_MATCH | PARTIAL    | PARTIAL  | Popup 好于 Options select  | 统一 route label          |
| H-09 | example.invalid URL    | 非原版默认               | 不得写入配置                      | MUST_MATCH | BROKEN     | N/A      | Advanced editor 会自动写入 | 改 placeholder/空值       |
| H-10 | `! Add rules here.`    | 非原版默认               | 不得自动保存                      | MUST_MATCH | BROKEN     | N/A      | 当前写入 rule source       | 删除                      |
| H-11 | 自动填 User-Agent      | 非原版默认               | 新 header 应为空                  | MUST_MATCH | BROKEN     | N/A      | 当前自动写 ZeroOmega Nex   | 改为空白行                |
| H-12 | 原版初始示例           | `default_options.coffee` | 初始 proxy/auto switch 示例可保留 | MUST_MATCH | UNVERIFIED | PARTIAL  | 需区分首次安装与新建       | 加生命周期测试            |

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

| ID   | 验收项                             | 分类       | Nex 状态 | 证据/问题                     | 下一步                           |
| ---- | ---------------------------------- | ---------- | -------- | ----------------------------- | -------------------------------- |
| J-01 | 原版源码固定证据                   | MUST_MATCH | DONE     | Artifact `8625759489`, v3.5.0 | 保留来源摘要                     |
| J-02 | 真实原版 `.bak` round-trip         | MUST_MATCH | MISSING  | 当前只有人工简化 fixture      | 由原版导出器生成 fixture         |
| J-03 | 五个现有 Nex 编辑页截图巡查        | MUST_MATCH | MISSING  | 无逐屏证据                    | 每页 light/dark/zh-CN/zh-TW 截图 |
| J-04 | 四类原版新建流程 E2E               | MUST_MATCH | MISSING  | 无                            | 新模态框完成后增加               |
| J-05 | Scheme/auth Fixed E2E              | MUST_MATCH | MISSING  | 无                            | 重构后增加                       |
| J-06 | Switch 表格/附属 RuleList E2E      | MUST_MATCH | MISSING  | 无                            | 重构后增加                       |
| J-07 | PAC URL/download/header E2E        | MUST_MATCH | MISSING  | 无                            | 重构后增加                       |
| J-08 | Virtual 引用 E2E                   | MUST_MATCH | MISSING  | 无                            | 实现后增加                       |
| J-09 | 导出→清空→导入→等价                | MUST_MATCH | MISSING  | 无                            | I/O 完成条件                     |
| J-10 | 每次 parity-sensitive 提交同步文档 | MUST_MATCH | PARTIAL  | 将由永久 workflow 执行        | 启用后观察                       |

## 当前结论

- **明确 BROKEN**：新建类型分类、新建布局、Fixed 布局、Switch 布局、真实备份导入、完整导出、多个示例被写成配置、编辑器翻译。
- **明确 MISSING**：Virtual、在线恢复、单 Profile 导出、附属 RuleList 完整流程、Popup 当前站点/临时规则/网络检查。
- **UNCERTAIN**：Gist/WebDAV/浏览器同步、FTP scheme 的现代浏览器能力；未获范围决定前不得标记 `NOT_PORTING`。
- 当前 PR 必须继续保持 Draft，现有安装包不再作为功能完整候选。

## 更新记录

| 日期       | 变更                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-07-26 | 首次从 ZeroOmega v3.5.0 源码建立逐项巡查；诚实标记现有编辑器、翻译和 I/O 缺口 |
