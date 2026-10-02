# 参与贡献

感谢你愿意改进 Mihomo Forge！

## 开发

```bash
npm install
npm run dev     # 本地开发
npm test        # 单元测试
npm run build   # 类型检查 + 构建
```

## 原则（请在 PR 中保持）

1. **不上传用户节点**。不要引入任何把 YAML、server、uuid、password 发往网络的代码，包括统计与错误上报。
2. **文件名就是默认供应商名称**，不要改成 A/B/C。
3. **机场 YAML 只提取 `proxies`**，不合并机场原有 rules / proxy-groups / dns。
4. **最终节点保留 `[供应商]` 前缀**。
5. **地区和供应商是并列的两种节点选择逻辑**，业务组必须同时支持两者。
6. **不默认生成供应商 × 地区笛卡尔积**。
7. **导出前必须通过引用完整性验证**，不要为了简化删掉验证。
8. 业务规则和节点分类不要写在同一个函数里；`core/` 保持纯函数、无 DOM 依赖。
9. `core/` 不拼接面向用户的句子：问题与警告只返回 `code` + `params`，由界面按当前语言翻译。

## 常见贡献

### 改进地区识别

编辑 `src/catalog/regions.ts`。短国家代码请用 `code('XX')` 生成，避免 `US01` 识别不到或 `Russia` 被误判为美国。在 `tests/builder/builder.test.ts` 的分类用例里补一条测试。

### 新增业务服务

在 `src/catalog/services/` 对应模块里加一项 `RuleService`：

- `ruleProviders` 使用 `geosite('name')` / `geoip('name')`，名称必须在 [meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat/tree/meta/geo) 中真实存在；
- `category` 决定规则顺序，`priority` 决定同类内的先后；
- 不常用的服务标记 `optional: true`，默认不启用。

### 翻译与新语言

- 界面文字全部在 `src/i18n/messages/`。`zh-CN.ts` 是基准，其他语言的类型是 `MessageTree<SourceMessages>`，缺键或多键会直接类型报错；`tests/i18n` 还会检查每条译文的 `{占位符}` 与基准一致。
- 计数类文字用 `{n}`。英语等有复数的语言可写成 `{ one: '…', other: '…' }`，由 `Intl.PluralRules` 选择。
- 写入 `config.yaml` 的策略组名称（`🇺🇸 美国自动` 等）在 `src/core/naming/index.ts`，与界面语言分开。
- 新增语言：在 `src/i18n/locales.ts` 登记（含 `dir` 与所需字体）、新增消息文件、加入 `src/i18n/index.ts` 的 `CATALOGS` 与 `src/core/naming/index.ts` 的 `NAMING`，再补一份 `README.<lang>.md`。
- 从右到左的语言请用 CSS 逻辑属性（`inset-inline-start`、`padding-inline-end`、`text-align: start`），不要写 `left` / `right`。

### 改进基础模板

编辑 `src/templates/base/index.ts`，在 PR 中说明适用的客户端与网络环境。

## 提交

- 一个 PR 解决一件事；
- 新行为需要测试；
- `npm test` 与 `npm run build` 必须通过。
