# 架构

## 分层

```text
UI（Vue 3 + Pinia）
  └─ stores/project.ts      状态、导入、替换、保存（IndexedDB）
       └─ core/builder       buildConfig(sources, settings) → BuildResult
            ├─ core/nodes        去重、命名
            ├─ core/regions      地区分类
            ├─ core/strategies   节点策略组 + 业务策略组
            ├─ core/rules        rule-providers + 规则
            ├─ templates/base    基础模板
            └─ core/validator    最终验证
catalog/  地区、规则集、服务、预设 —— 纯数据
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
| 9–12 | 全局 / 地区 / 供应商 / 组合策略 | `core/strategies` | 每次构建 |
| 13 | buildBusinessStrategies | `core/strategies` | 每次构建 |
| 14–15 | buildRuleProviders / buildRules | `core/rules` | 每次构建 |
| 16 | mergeBaseTemplate | `core/builder` | 每次构建 |
| 17 | validateFinalConfig | `core/validator` | 每次构建 |
| 18 | serializeYaml | `core/builder/serialize.ts` | 每次构建 |

1–5 步只在导入时运行一次并缓存；修改任何设置只会重跑 6–18 步（同步、纯函数）。6 个文件约 1000 个节点的完整构建在几十毫秒内完成。

## 策略引用（StrategyRef）

业务策略不直接保存策略组名称，而是保存稳定引用，避免来源改名后失效：

| 引用 | 生成的组 |
|------|---------|
| `global:manual` / `global:auto` / `global:fallback` | 🌍 全部手动 / ⚡ 全部自动 / 🛡 故障转移 |
| `region:us:manual` / `region:us:auto` | 🇺🇸 美国手动 / 🇺🇸 美国自动 |
| `source:<sourceId>` / `source:<sourceId>:auto` | 📦 来源名 / 📦 来源名 自动 |
| `composite:<id>` | 🇺🇸 来源 / 美国 |
| `DIRECT` / `REJECT` | 内置策略 |

服务目录中的默认候选还可以使用展开符：`regions:auto`、`regions:manual`、`sources:all`。

构建时，引用到未生成的组（例如没有美国节点）会被自动移除；默认策略不可用时回退到第一个可用候选并给出警告。

## 规则顺序

`core/rules` 先按类别排序，再按 `priority` 降序：

```text
lan → block → ai → developer → streaming → social → other → china → foreign → MATCH
```

因此 Gemini（ai）总在 Google（other）之前，GitHub（developer）总在国外通用之前。同一个规则集只会被引用一次。

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
- 繁体中文、日文、阿拉伯文的标题字体按需从 Google Fonts 加载。
