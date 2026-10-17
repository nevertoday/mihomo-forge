# 架构

## 分层

```text
UI（Vue 3 + Pinia）
  └─ stores/project.ts      状态、导入、替换、保存（IndexedDB）
       └─ core/builder       buildConfig(sources, settings) → BuildResult
            ├─ core/nodes        去重、命名
            ├─ core/regions      地区分类
            ├─ core/purposes     线路（全部 / 地区 / 文件 / 节点）+ 用途组
            ├─ core/strategies   关键词组、来源 × 地区组合
            ├─ core/rules        rule-providers + 规则
            ├─ templates/base    基础模板
            └─ core/validator    最终验证
catalog/  地区、规则集、服务、默认用途 —— 纯数据
```

`core/` 与 `catalog/` 不依赖 DOM 或 Vue，全部可以在 Node 中测试。

## 构建流水线

| # | 阶段 | 位置 | 何时运行 |
|---|------|------|---------|
| 1 | loadSources | `core/parser/loadSource.ts` | 导入文件时 |
| 2 | parseYaml | `core/parser` | 导入文件时 |
| 3 | extractProxies | `core/parser` | 导入文件时 |
| 4 | normalizeProxyNodes | `core/parser` | 导入文件时 |
| 5 | createFingerprints | `core/nodes` | 导入文件时 |
| 6 | deduplicate | `core/nodes` | 每次构建 |
| 7 | assignDisplayNames | `core/nodes` | 每次构建 |
| 8 | classifyRegions | `core/regions` | 每次构建 |
| 9–12 | 线路：全部节点、地区（跨文件合并）、文件、关键词组、组合、单个节点 | `core/purposes` · `core/strategies` | 每次构建 |
| 13 | 用途组（每个用途一个组，线路按顺序） | `core/purposes` | 每次构建 |
| 14–15 | buildRuleProviders / buildRules | `core/rules` | 每次构建 |
| 16 | mergeBaseTemplate | `core/builder` | 每次构建 |
| 17 | validateFinalConfig | `core/validator` | 每次构建 |
| 18 | serializeYaml | `core/builder/serialize.ts` | 每次构建 |

1–5 步只在导入时运行一次并缓存；修改任何设置只会重跑 6–18 步（同步、纯函数）。6 个文件约 1000 个节点的完整构建在几十毫秒内完成。

## 用途与线路（LineRef）

每个用途（`settings.purposes`）= 名称 + 它负责的网站（目录里的服务 + 自己填的域名）+ 按顺序的线路 + 选择方式（`fallback` 坏了换下一条 / `url-test` 用最快的 / `select` 手动）。
线路保存稳定引用，避免来源改名后失效：

| 引用 | 生成的组 / 目标 |
|------|---------|
| `all` | ⚡ 全部自动（url-test） |
| `region:us` | 🇺🇸 美国自动：所有文件里的美国节点合在一起（url-test） |
| `source:<sourceId>` | 📦 来源名 自动（url-test） |
| `node:<fingerprint>` | 单个节点 |
| `filter:<id>` / `composite:<id>` | 高级：关键词组 / 来源 × 地区组合 |
| `DIRECT` / `REJECT` | 内置策略 |

构建时，当前文件里没有的线路会被跳过（INFO）；一条都没有时改走全部节点（WARNING）。导入文件后，还停在出厂设置的默认用途只保留文件里实际存在的线路（`tidyDefaultLines`）。
没改过名字的内置用途跟随 `outputLocale` 输出名称；改过名的保留用户写的名字。

## 规则顺序

`core/rules` 先按类别排序，再按 `priority` 降序：

```text
自己填的网站 → lan → block → ai → developer → streaming → social → other → china → foreign → MATCH
```

自己填的网站（`DOMAIN-SUFFIX` / 不带点的词用 `DOMAIN-KEYWORD`）排在所有规则集前面。只有被某个用途认领的服务才会生成规则，其余国外流量由 `foreign` 规则集和 MATCH 交给「其它国外」。Gemini（ai）总在 Google（other）之前；同一个规则集只会被引用一次。

## 持久化

- 项目设置 + 已解析的来源 → IndexedDB `mihomo-forge/kv/project`
- 主题与界面语言偏好 → localStorage（只有这两项使用 localStorage，不含节点数据）
- 项目文件 `mihomo-forge-project.json`：`version`、`sources`（id / name / expectedFileName）、`settings`；可选包含节点

## 多语言

界面语言与配置命名语言是两件事：

| | 位置 | 由谁决定 |
|---|---|---|
| 界面文字 | `src/i18n/messages/*.ts` | 顶栏语言切换 / `?lang=` / 浏览器语言（保存在 localStorage） |
| 写入 config.yaml 的策略组名 | `src/core/naming/index.ts` | 项目设置 `outputLocale`（基础配置页），新项目默认跟随界面语言 |

这样切换界面语言不会改动已经导入到客户端的策略组名称。

- `core/` 不产生面向用户的句子：`BuildIssue`、节点警告、拒绝原因、解析错误都只有 `code` 与 `params`，界面通过 `issueText()` 等函数翻译。
- `zh-CN` 是基准语言包；其余语言的类型由它推导，`tests/i18n` 校验键与占位符完全一致。
- 复数用 `Intl.PluralRules` 按 `{n}` 选择；阿拉伯语采用「标签：数字」的中性写法，避免六种复数形式带来的语法问题。
- 阿拉伯语设置 `<html dir="rtl">`，布局全部使用 CSS 逻辑属性，方向性图标通过 `.dir-icon` 镜像。
- 只用系统里已有的无衬线字体，不加载网络字体；日文、阿拉伯文的字体栈在 `src/styles/main.css` 里补充。

## 界面样式

界面用 [小小东 UI Kit](https://github.com/nevertoday/xxd-ui-kit)（MIT）：

- 颜色、字号、间距、圆角都取令牌（`var(--…)`），组件用 `xxd-*` 类（按钮、输入框、对话框、横幅、表格等）。
- `public/vendor/xxd/` 和 `src/vendor/xxd-icon-nodes.js` 由 `xxd-ui sync` 生成，不手改；`xxd.config.json` 记着路径。
- `public/vendor/xxd/boot.js` 在首帧之前应用主题（亮 / 暗 / 跟随系统），选择存在 localStorage 的 `mihomo-forge-ui`。
- `src/styles/main.css` 只负责应用外壳和页面布局；改完跑 `xxd-ui doctor .` 检查写死的颜色、字重、圆角。
