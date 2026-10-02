# Mihomo Forge

[简体中文](README.md) · [繁體中文](README.zh-TW.md) · **English** · [日本語](README.ja.md) · [العربية](README.ar.md)

**A privacy-first, browser-based Mihomo / OpenClash configuration studio.**
It turns several short-lived subscription YAML snapshots into long-term, manageable node assets and generates one complete, ready-to-import `config.yaml` along three dimensions: region, provider and service rules.

🔒 Your node configs are parsed and generated only in this browser. Nothing is uploaded. No backend, no analytics, no account.

---

## Why

Many providers now hand out **short-lived subscription URLs**: the link carries a temporary token and must be regenerated after a while. Tools that assume a long-lived URL — Sub-Store, `proxy-provider` — keep breaking.

The asset that actually lasts is **the YAML snapshot you downloaded while the link was valid**.

```text
provider-a.yaml  provider-b.yaml  provider-c.yaml  …
        ↓  drop into Mihomo Forge
sources → regions → node strategies → service strategies → rules
        ↓
     config.yaml → OpenClash / Mihomo
```

The everyday workflow is one step: download the new YAML, drop it in, confirm the replacement, regenerate. Rules, regions and service strategies are all kept.

## Features

- **Multi-file import**: drop several `.yaml/.yml` files at once; each file name becomes a source (provider) name
- **`proxies` only**: the provider's own `proxy-groups` / `rules` / `dns` / `rule-providers` are ignored
- **Source prefix**: nodes are named `[source] original name`; repeated names get `#2`, `#3`
- **Fingerprint deduplication**: SHA-256 over type / server / port / uuid / password / transport options; global, per-source or off
- **Region detection**: a data-driven regex table (20 regions), editable, with per-node manual overrides
- **Two parallel ways to pick nodes**
  - Global: `🌍 All Manual` · `⚡ All Auto` · `🛡 Failover`
  - By region: `🇺🇸 United States Manual` · `🇺🇸 United States Auto` … (no empty groups)
  - By provider: `📦 provider-a` · `📦 provider-b` …
  - Provider × region combinations: on demand only — never a Cartesian product
- **Service strategies**: ChatGPT, Claude, Gemini, GitHub, YouTube, Netflix, Telegram… each is its own `select` group that can **use regions and providers alike**
- **Modular rule presets**: Lite / Standard / Full / Custom + AI, Developer, Streaming, Social, Gaming, Crypto, Ads modules
- **Strict rule order**: LAN → ads → AI → developer → streaming → social → other services → mainland China → overseas → MATCH (Gemini always before Google)
- **Reference validation**: unique group names, every reference exists, every RULE-SET exists, MATCH last; export is blocked on errors
- **Update diff**: replacing a source shows `+added / -removed / ~renamed`
- **Base templates**: OpenClash standard / Mihomo generic / your own `base.yaml`
- **Projects**: settings and nodes saved in IndexedDB; export `mihomo-forge-project.json` (credentials excluded by default)
- **Multilingual**: 简体中文, 繁體中文, English, 日本語 and العربية (with right-to-left layout). Group names in the generated config have their own language setting, e.g. `🇺🇸 美国自动` or `🇺🇸 United States Auto`

Rule sets are the `.mrs` files from [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat), served from jsDelivr or GitHub.

## Quick start

```bash
git clone https://github.com/nevertoday/mihomo-forge.git
cd mihomo-forge
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # core compiler and i18n tests (Vitest)
npm run build      # type-check + static build in dist/
```

`dist/` is plain static files: deploy to GitHub Pages, Cloudflare Pages or any static host. A GitHub Pages workflow is included (`.github/workflows/pages.yml`).

Pick a language with the switcher in the top bar, or link directly with `?lang=en` / `zh-CN` / `zh-TW` / `ja` / `ar`.

## Importing into OpenClash

1. OpenClash → Config Manage → upload the generated `config.yaml` and enable it. Use the **Meta (Mihomo) core** — `.mrs` rule sets require it.
2. The first start downloads about 20–45 rule sets, through the `🌐 Overseas` group by default. Before nodes are tested a few downloads may fail; Mihomo retries automatically and everything is usually ready within a minute. Later starts load instantly from `./ruleset/`.
3. Every build is checked against the real Mihomo core: the config is first loaded and rewritten by Ruby's YAML (as OpenClash does), then run through `mihomo -t`. Values such as `off`, `yes` or `0755`, which YAML 1.1 would misread, are always quoted.

## Example output

After importing `provider-a.yaml`, `provider-b.yaml`, `provider-c.yaml` with English group names:

```yaml
proxy-groups:
  - name: 🤖 ChatGPT
    type: select
    proxies: [🇺🇸 United States Auto, 🇺🇸 United States Manual, 🇯🇵 Japan Auto, 🇸🇬 Singapore Auto, 📦 provider-a, 📦 provider-b, 📦 provider-c, ⚡ All Auto, 🌍 All Manual]
  - name: 🇺🇸 United States Auto
    type: url-test
    proxies: ["[provider-a] US 01", "[provider-b] US LA"]

rules:
  - RULE-SET,openai,🤖 ChatGPT
  - RULE-SET,google-gemini,✨ Gemini
  - RULE-SET,github,🐙 GitHub
  - RULE-SET,google,🔍 Google
  - RULE-SET,cn,🇨🇳 Mainland China
  - RULE-SET,geolocation-not-cn,🌐 Overseas
  - MATCH,🌐 Overseas
```

## Project layout

```text
src/
├── core/            pure-function compiler (no DOM), fully unit-tested
├── catalog/         data-driven regions, rule sets, services, presets
├── templates/base/  base templates (DNS / TUN / sniffer / ports)
├── i18n/            UI catalogs (zh-CN is the source; the type checker keeps the others in sync)
├── stores/          Pinia state and IndexedDB persistence
├── components/ pages/ app/   Vue UI
tests/               fixtures + parser / builder / validator / i18n tests
docs/                architecture notes
```

See [docs/architecture.md](docs/architecture.md).

## Privacy and security

- Files are read with the browser File API; parsing and generation happen locally
- No third-party APIs, no analytics; the only external requests are web fonts
- Node data lives in IndexedDB only, never in localStorage
- Exported project files exclude server / uuid / password by default

Security issues: see [SECURITY.md](SECURITY.md).

## Non-goals

Provider login, bypassing short-lived tokens, auto-refreshing subscriptions, a cloud node database, mandatory accounts, in-browser speed tests, reimplementing the Mihomo core.

## Contributing

Issues and PRs are welcome — especially region patterns, new services, base templates, translation fixes and new languages. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 小小东
