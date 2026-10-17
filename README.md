# Mihomo Forge

**简体中文** · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [العربية](README.ar.md)

**隐私优先、浏览器本地运行的 Mihomo / OpenClash 配置工作台。**
把手上多个机场的 YAML 拖进来，给每种用途（ChatGPT、AI 工具、影音、电报……）排好走哪几条线路，下载一份 OpenClash 直接能用的 `config.yaml`。同一地区的节点不管来自哪个文件，都会合成一条地区线路，自动用最快的。

> A privacy-first, browser-based Mihomo/OpenClash config builder: drop in YAML files from several providers, give each purpose (ChatGPT, AI tools, streaming…) its lines in order, and download one config. Nodes of the same region merge into one line across files.

🔒 所有节点配置仅在当前浏览器中解析和生成，不上传服务器。没有后端，没有统计，没有账号。

**在线使用：<https://nevertoday.github.io/mihomo-forge/>**（纯静态页面，节点不会离开你的浏览器）

---

## 为什么需要它

很多机场改用**短期有效的订阅地址**：URL 带临时 Token，过一段时间就必须重新生成。Sub-Store、`proxy-provider` 这类依赖“长期有效 URL”的方案因此经常失效。

更可靠的资产其实是：**在订阅有效期间下载下来的 YAML 快照**。

```text
奶昔.yaml  机场A.yaml  机场B.yaml  …
        ↓  拖进 Mihomo Forge
① 导入文件 → ② 每种用途走哪条线路 → ③ 下载
        ↓
     config.yaml → OpenClash / Mihomo
```

日常流程只有一步：下载新的机场 YAML，拖进来，确认替换，重新下载。用途和线路全部保留。

## 功能

- **多文件导入**：一次拖入多个 `.yaml/.yml`，文件名自动成为来源（供应商）名称
- **只取 `proxies`**：机场自带的 `proxy-groups` / `rules` / `dns` / `rule-providers` 全部忽略
- **来源前缀**：节点统一命名为 `[来源名] 原节点名`，同名节点自动编号 `#2`、`#3`
- **指纹去重**：按 type / server / port / uuid / password / 传输参数等计算 SHA-256，支持全局、同来源、不去重三种模式
- **地区识别**：数据驱动的正则表（美国、日本、新加坡、香港、台湾、韩国、英国等 20 个地区），可编辑、可手动覆盖
- **按用途排线路**：默认有 ChatGPT、AI 工具、谷歌、电报、影音、奈飞、苹果、微软、其它国外；每个用途是一个组，线路按顺序使用（坏了换下一条），也可以改成“用最快的”或“在 OpenClash 里手动选”
- **线路**：地区（同一地区跨文件合并，自动选最快）、某个文件的全部节点、单个节点、全部节点、直连、拦截
- **自定义用途**：起个名字（例如「🎨 ChatGPT 作图」），填网站（`chatgpt.com`、`openai`）或勾选常用网站；自己填的网站排在所有规则集前面
- **国内与局域网固定直连**；没有被任何用途认领的国外网站走「其它国外」
- **高级（可选）**：按节点名关键词建组（例如名字含「IEPL」）、来源 × 地区组合，建好后可作为线路使用
- **严格规则顺序**：自定义网站 → 局域网 → 广告 → AI → 开发 → 流媒体 → 社交 → 其他 → 国内 → 国外 → MATCH（Gemini 永远先于 Google）
- **引用完整性验证**：策略组名唯一、所有引用存在、RULE-SET 存在、MATCH 位于最后；存在错误时禁止导出
- **更新 Diff**：替换来源时显示 `+新增 / -删除 / ~改名`
- **基础模板**：OpenClash 标准 / Mihomo 通用 / 自定义 `base.yaml`
- **项目保存**：设置与节点保存在浏览器 IndexedDB；可导出 `mihomo-forge-project.json`（默认不含节点凭证）
- **多语言**：界面支持简体中文、繁體中文、English、日本語、العربية（含从右到左布局）；生成的策略组名称可单独选择语言，例如 `🇺🇸 美国自动` / `🇺🇸 United States Auto`

规则集来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) 的 `.mrs` 文件，可选 jsDelivr / GitHub 下载源。

## 快速开始

```bash
git clone https://github.com/nevertoday/mihomo-forge.git
cd mihomo-forge
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # 核心编译器单元测试（Vitest）
npm run build      # 类型检查 + 生成 dist/ 静态文件
```

`dist/` 是纯静态文件，可部署到 GitHub Pages、Cloudflare Pages 或任意静态站点。仓库自带 GitHub Pages 工作流（`.github/workflows/pages.yml`）。

## 导入 OpenClash

1. OpenClash →「配置文件管理」→ 上传生成的 `config.yaml` 并启用；内核需为 **Meta（Mihomo）内核**（`.mrs` 规则集需要它）。
2. 首次启动会下载约 20–45 个规则集，默认经「🌐 其它国外」下载；节点尚未测速时个别下载可能失败，Mihomo 会自动重试，通常一分钟内全部就绪。之后从 `./ruleset/` 缓存秒开。
3. 每次发布前都会用真实 Mihomo 内核校验：生成的配置先经 Ruby YAML 读写（模拟 OpenClash 的处理），再执行 `mihomo -t`。`off`、`yes`、`0755` 这类在 YAML 1.1 中会被误读的值都会加引号。

## 生成结果示例

输入 `奶昔.yaml`、`机场A.yaml`、`机场B.yaml` 后：

```yaml
proxies:
  - name: "[奶昔] 美国01"
  - name: "[奶昔] 日本01"
  - name: "[机场A] 美国LA"
  - name: "[机场A] 新加坡01"
  - name: "[机场B] 日本东京"

proxy-groups:
  - name: 🤖 ChatGPT            # 用途：按顺序用这几条线路，坏了换下一条
    type: fallback
    proxies: [🇺🇸 美国自动, 🇯🇵 日本自动, 🇸🇬 新加坡自动, ⚡ 全部自动]
  - name: 🍎 苹果
    type: fallback
    proxies: [DIRECT, ⚡ 全部自动]
  - name: 🇯🇵 日本自动           # 线路：同一地区、不同文件的节点合在一起，自动用最快的
    type: url-test
    proxies: ["[奶昔] 日本01", "[机场B] 日本东京"]
  - name: 📦 奶昔 自动
    type: url-test
    proxies: ["[奶昔] 美国01", "[奶昔] 日本01"]

rules:
  - RULE-SET,private,DIRECT
  - RULE-SET,openai,🤖 ChatGPT
  - RULE-SET,anthropic,🧠 AI 工具
  - RULE-SET,cn,DIRECT
  - RULE-SET,geolocation-not-cn,🌐 其它国外
  - MATCH,🌐 其它国外
```

## 项目结构

```text
src/
├── core/            纯函数编译器（无 DOM 依赖，全部有单元测试）
│   ├── parser/      YAML 解析、proxies 提取、来源加载与 Diff
│   ├── nodes/       指纹、去重、命名
│   ├── regions/     地区分类
│   ├── purposes/    线路（全部 / 地区 / 文件 / 节点）与用途组
│   ├── strategies/  关键词组、来源 × 地区组合
│   ├── rules/       rule-providers 与规则排序
│   ├── builder/     构建流水线与 YAML 序列化
│   ├── validator/   最终配置验证
│   └── project/     默认设置与项目文件导入导出
├── catalog/         数据驱动的地区、规则集、服务与默认用途
├── templates/base/  基础模板（DNS / TUN / sniffer / 端口）
├── i18n/            界面语言包（zh-CN 为基准，其余语言由类型检查保证键一致）
├── stores/          Pinia 状态与 IndexedDB 持久化
├── components/ pages/ app/   Vue 界面
tests/               fixtures + parser / builder / validator 测试
docs/                架构说明
```

更多细节见 [docs/architecture.md](docs/architecture.md)。

## 隐私与安全

- 文件通过浏览器 File API 读取，解析与生成全部在本地完成
- 不调用任何第三方 API，不做统计；页面本身不发出任何外部请求（规则集由你的 Mihomo 下载）
- 节点数据只存 IndexedDB，从不写入 localStorage
- 导出项目文件默认不含 server / uuid / password

发现安全问题请看 [SECURITY.md](SECURITY.md)。

## 不做什么

机场登录、绕过短期 Token、自动刷新订阅、云端节点库、强制账号、浏览器内测速、实现 Mihomo 内核。

## 参与贡献

欢迎 Issue 和 PR，尤其是：地区识别正则、新的网站规则、基础模板改进、翻译校对与新语言。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可

[MIT](LICENSE) © 2026 小小东
