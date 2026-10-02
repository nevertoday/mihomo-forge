# Mihomo Forge

[简体中文](README.md) · **繁體中文** · [English](README.en.md) · [日本語](README.ja.md) · [العربية](README.ar.md)

**隱私優先、在瀏覽器本機執行的 Mihomo / OpenClash 設定工作台。**
它把多個短期有效的訂閱 YAML 快照整理成可長期管理的節點資產，並依「地區」「供應商」「服務規則」三個維度，產生一份完整、可直接匯入的 `config.yaml`。

🔒 所有節點設定只在目前的瀏覽器中解析與產生，不會上傳到伺服器。沒有後端、沒有統計、不需要帳號。

---

## 為什麼需要它

許多機場改用**短期有效的訂閱網址**：網址帶有臨時 Token，過一段時間就必須重新產生。Sub-Store、`proxy-provider` 這類依賴「長期有效網址」的方案因此經常失效。

真正可靠的資產是：**在訂閱有效期間下載下來的 YAML 快照**。

```text
奶昔.yaml  機場A.yaml  機場B.yaml  …
        ↓  拖進 Mihomo Forge
來源層 → 地區層 → 節點策略層 → 服務策略層 → 規則層
        ↓
     config.yaml → OpenClash / Mihomo
```

日常流程只有一步：下載新的機場 YAML，拖進來，確認取代，重新產生。規則、地區與服務策略全部保留。

## 功能

- **多檔匯入**：一次拖入多個 `.yaml/.yml`，檔名自動成為來源（供應商）名稱
- **只取 `proxies`**：機場自帶的 `proxy-groups` / `rules` / `dns` / `rule-providers` 一律略過
- **來源前綴**：節點統一命名為 `[來源名稱] 原節點名稱`，同名節點自動編號 `#2`、`#3`
- **指紋去重**：依 type / server / port / uuid / password / 傳輸參數計算 SHA-256，支援全域、同來源、不去重
- **地區辨識**：資料驅動的正規表示式表（20 個地區），可編輯，也可逐一手動指定
- **兩種並列的節點選擇方式**
  - 全域：`🌍 全部手動` · `⚡ 全部自動` · `🛡 故障轉移`
  - 依地區：`🇺🇸 美國手動` · `🇺🇸 美國自動` …（沒有節點的地區不產生空群組）
  - 依供應商：`📦 奶昔` · `📦 機場A` …
  - 供應商 × 地區組合：按需建立，不產生笛卡兒積
- **服務策略**：ChatGPT、Claude、Gemini、GitHub、YouTube、Netflix、Telegram 等各自是獨立的 `select` 群組，**可以選地區，也可以選供應商**
- **模組化規則預設**：Lite / Standard / Full / Custom + AI、Developer、Streaming、Social、Gaming、Crypto、Ads 模組
- **嚴格的規則順序**：區域網路 → 廣告 → AI → 開發 → 串流 → 社群 → 其他服務 → 中國大陸 → 海外 → MATCH（Gemini 一定先於 Google）
- **引用完整性驗證**：群組名稱唯一、所有引用存在、RULE-SET 存在、MATCH 位於最後；有錯誤時禁止匯出
- **更新差異**：取代來源時顯示 `+新增 / -刪除 / ~改名`
- **基礎範本**：OpenClash 標準 / Mihomo 通用 / 自訂 `base.yaml`
- **專案儲存**：設定與節點存放在瀏覽器 IndexedDB；可匯出 `mihomo-forge-project.json`（預設不含節點憑證）
- **多語言**：介面支援简体中文、繁體中文、English、日本語、العربية（含由右至左版面）；產生的策略群組名稱可另外選擇語言，例如 `🇺🇸 美國自動` / `🇺🇸 United States Auto`

規則集採用 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) 的 `.mrs` 檔，可選 jsDelivr 或 GitHub 下載來源。

## 快速開始

```bash
git clone https://github.com/nevertoday/mihomo-forge.git
cd mihomo-forge
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # 核心編譯器與多語言測試（Vitest）
npm run build      # 型別檢查 + 在 dist/ 產生靜態檔案
```

`dist/` 是純靜態檔案，可部署到 GitHub Pages、Cloudflare Pages 或任何靜態網站。儲存庫已附 GitHub Pages 工作流程（`.github/workflows/pages.yml`）。

可在頂部列切換語言，或直接以 `?lang=zh-TW` 開啟。

## 匯入 OpenClash

1. OpenClash →「設定檔管理」→ 上傳產生的 `config.yaml` 並啟用；核心需為 **Meta（Mihomo）核心**（`.mrs` 規則集需要它）。
2. 首次啟動會下載約 20–45 個規則集，預設經「🌐 海外」策略群組下載；節點尚未測速時個別下載可能失敗，Mihomo 會自動重試，通常一分鐘內全部就緒，之後從 `./ruleset/` 快取立即載入。
3. 產生的設定都以真實 Mihomo 核心驗證：先經 Ruby YAML 讀寫（模擬 OpenClash 的處理），再執行 `mihomo -t`。`off`、`yes`、`0755` 這類 YAML 1.1 會誤判的值一律加上引號。

## 專案結構

```text
src/
├── core/            純函式編譯器（不依賴 DOM，皆有單元測試）
├── catalog/         資料驅動的地區、規則集、服務與預設
├── templates/base/  基礎範本（DNS / TUN / sniffer / 連接埠）
├── i18n/            介面語言包（以 zh-CN 為基準，其餘語言由型別檢查確保鍵一致）
├── stores/          Pinia 狀態與 IndexedDB 儲存
├── components/ pages/ app/   Vue 介面
tests/               fixtures + parser / builder / validator / i18n 測試
docs/                架構說明
```

詳見 [docs/architecture.md](docs/architecture.md)。

## 隱私與安全

- 透過瀏覽器 File API 讀取檔案，解析與產生全部在本機完成
- 不呼叫任何第三方 API、不做統計；唯一的外部請求是網頁字型
- 節點資料只存 IndexedDB，從不寫入 localStorage
- 匯出的專案檔預設不含 server / uuid / password

安全問題請見 [SECURITY.md](SECURITY.md)。

## 不做的事

機場登入、繞過短期 Token、自動更新訂閱、雲端節點資料庫、強制帳號、瀏覽器內測速、重新實作 Mihomo 核心。

## 參與貢獻

歡迎 Issue 與 PR，尤其是：地區辨識規則、新服務、基礎範本、翻譯校對與新語言。請先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權

[MIT](LICENSE) © 2026 小小东
