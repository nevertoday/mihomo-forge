# Mihomo Forge

[简体中文](README.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · **日本語** · [العربية](README.ar.md)

**プライバシー重視・ブラウザ完結型の Mihomo / OpenClash 設定ワークベンチ。**
有効期限の短いサブスクリプション YAML のスナップショットを複数まとめて、長期的に管理できるノード資産に整理し、「地域」「プロバイダー」「サービスルール」の 3 軸で、そのまま読み込める完全な `config.yaml` を生成します。

🔒 ノード設定はこのブラウザ内でのみ解析・生成され、サーバーには一切送信されません。バックエンドなし・解析ツールなし・アカウント不要。

**オンラインで使う：<https://nevertoday.github.io/mihomo-forge/>**（静的ページのみ。ノードはブラウザの外に出ません）

---

## なぜ必要か

最近は**有効期限の短いサブスクリプション URL** を発行するプロバイダーが増えています。URL には一時トークンが含まれ、しばらくすると再発行が必要です。Sub-Store や `proxy-provider` のように「長期間有効な URL」を前提とする方法は、すぐに使えなくなります。

本当に残る資産は、**URL が有効なうちにダウンロードした YAML スナップショット**です。

```text
provider-a.yaml  provider-b.yaml  provider-c.yaml  …
        ↓  Mihomo Forge にドロップ
ソース → 地域 → ノード戦略 → サービス戦略 → ルール
        ↓
     config.yaml → OpenClash / Mihomo
```

日常の作業は 1 ステップだけ。新しい YAML をダウンロードしてドロップし、置き換えを確認して再生成するだけです。ルール・地域・サービス戦略はすべて保持されます。

## 機能

- **複数ファイルの読み込み**：`.yaml/.yml` をまとめてドロップ。ファイル名がソース（プロバイダー）名になります
- **`proxies` のみ使用**：プロバイダー独自の `proxy-groups` / `rules` / `dns` / `rule-providers` は無視します
- **ソース接頭辞**：ノード名は `[ソース名] 元のノード名`。同名ノードには `#2`、`#3` を付けます
- **フィンガープリントによる重複排除**：type / server / port / uuid / password / トランスポート設定から SHA-256 を計算。全体・ソース内・なしを選択可能
- **地域判定**：データ駆動の正規表現テーブル（20 地域）。編集でき、ノードごとの手動指定も可能
- **並列する 2 つのノード選択方法**
  - 全体：`🌍 すべて手動` · `⚡ すべて自動` · `🛡 フェイルオーバー`
  - 地域別：`🇺🇸 アメリカ・手動` · `🇺🇸 アメリカ・自動` …（ノードのない地域は空グループを作りません）
  - プロバイダー別：`📦 provider-a` · `📦 provider-b` …
  - プロバイダー × 地域：必要なときだけ作成し、全組み合わせは生成しません
  - ノード名のキーワード：たとえば名前に「IEPL」を含むノード。ソースや地域でも絞り込め、作成前に一致結果をプレビューできます
- **サービス戦略**：ChatGPT、Claude、Gemini、GitHub、YouTube、Netflix、Telegram などは、それぞれ独立した `select` グループで、**地域もプロバイダーも選べます**
- **モジュール式のルールプリセット**：Lite / Standard / Full / Custom ＋ AI、Developer、Streaming、Social、Gaming、Crypto、Ads
- **厳密なルール順序**：LAN → 広告 → AI → 開発 → ストリーミング → SNS → その他 → 中国本土 → 海外 → MATCH（Gemini は必ず Google より前）
- **参照の検証**：グループ名の一意性、すべての参照・RULE-SET の存在、MATCH が最後であることを確認。エラーがあれば書き出しを止めます
- **更新時の差分**：ソースを置き換えると `+追加 / -削除 / ~名前変更` を表示
- **基本テンプレート**：OpenClash 標準 / Mihomo 汎用 / 独自の `base.yaml`
- **プロジェクト保存**：設定とノードは IndexedDB に保存。`mihomo-forge-project.json` を書き出し可能（認証情報はデフォルトで除外）
- **多言語対応**：简体中文・繁體中文・English・日本語・العربية（右から左のレイアウト対応）。生成する設定内のグループ名の言語は別途選べます（例：`🇺🇸 アメリカ・自動`）

ルールセットは [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) の `.mrs` ファイルを jsDelivr または GitHub から取得します。

## クイックスタート

```bash
git clone https://github.com/nevertoday/mihomo-forge.git
cd mihomo-forge
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # コアコンパイラと多言語のテスト（Vitest）
npm run build      # 型チェック + dist/ に静的ファイルを生成
```

`dist/` は静的ファイルだけなので、GitHub Pages、Cloudflare Pages など任意の静的ホスティングに配置できます。GitHub Pages 用のワークフロー（`.github/workflows/pages.yml`）も同梱しています。

言語は上部バーで切り替えるか、`?lang=ja` 付きの URL で直接開けます。

## OpenClash への読み込み

1. OpenClash →「設定ファイル管理」→ 生成した `config.yaml` をアップロードして有効化します。**Meta（Mihomo）コア**が必要です（`.mrs` ルールセットのため）。
2. 初回起動時に約 20〜45 個のルールセットを、デフォルトでは「🌐 海外」グループ経由でダウンロードします。ノードの測定前は一部が失敗することがありますが、Mihomo が自動で再試行し、通常 1 分以内にそろいます。以降は `./ruleset/` のキャッシュから即座に読み込みます。
3. 生成した設定は実際の Mihomo コアで検証しています。まず Ruby の YAML で読み書きし（OpenClash の処理を再現）、続けて `mihomo -t` を実行します。`off`・`yes`・`0755` など YAML 1.1 で誤解釈される値は必ず引用符で囲みます。

## ディレクトリ構成

```text
src/
├── core/            純粋関数のコンパイラ（DOM 非依存、すべてテスト済み）
├── catalog/         データ駆動の地域・ルールセット・サービス・プリセット
├── templates/base/  基本テンプレート（DNS / TUN / sniffer / ポート）
├── i18n/            UI の言語ファイル（zh-CN が基準。他言語のキーは型チェックで一致を保証）
├── stores/          Pinia の状態と IndexedDB への保存
├── components/ pages/ app/   Vue UI
tests/               fixtures + parser / builder / validator / i18n のテスト
docs/                アーキテクチャ解説
```

詳しくは [docs/architecture.md](docs/architecture.md) を参照してください。

## プライバシーとセキュリティ

- ファイルはブラウザの File API で読み込み、解析と生成はすべてローカルで実行
- 外部 API や解析ツールは使いません。外部への通信は Web フォントのみ
- ノードデータは IndexedDB にのみ保存し、localStorage には書き込みません
- 書き出すプロジェクトファイルには、デフォルトで server / uuid / password を含めません

セキュリティの問題は [SECURITY.md](SECURITY.md) をご覧ください。

## 対象外

プロバイダーへのログイン、短期トークンの回避、サブスクリプションの自動更新、クラウドのノードデータベース、アカウント必須化、ブラウザ内での速度測定、Mihomo コアの再実装。

## コントリビュート

Issue と PR を歓迎します。特に地域判定ルール、新しいサービス、基本テンプレート、翻訳の改善や新しい言語の追加をお待ちしています。[CONTRIBUTING.md](CONTRIBUTING.md) をお読みください。

## ライセンス

[MIT](LICENSE) © 2026 小小东
