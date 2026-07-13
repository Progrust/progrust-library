# P6: 周辺機能とリリース

フィード・メタ情報・残デザイン課題を仕上げ、CI/CDを構築して本番公開する。

参照spec: [feeds-meta.md](../spec/feeds-meta.md) / [deploy.md](../spec/deploy.md)

依存: P4・P5完了

## タスク

- [x] **T6-1: RSS・sitemap**
  `@astrojs/rss`（全タイプ混在・直近20件・概要のみ）と`@astrojs/sitemap`。フッターからRSSへリンク。
  完了条件: feeds-meta AC-1 / AC-2 を満たす。
- [ ] **T6-2: OGP・meta・favicon・Analytics**
  BaseLayoutのmeta/OGP出力（タイトル形式・共通OGP画像・canonical）・favicon・Cloudflare Web Analyticsタグ。OGP画像とfaviconの素材を用意する。
  完了条件: feeds-meta AC-3 / AC-4 を満たす。
- [ ] **T6-3: コードフォント・Shikiテーマ確定（デザイン残課題）**
  全角対応等幅フォント（UDEV Gothic / Moralerspace等）を実表示で比較して選定・差し替える（基本3フォントはP5でAstro Fonts APIによるセルフホスト済み。ui-design-spec「タイポグラフィ」参照）。Shiki dual themeを確定配色（[ui-design-spec.md](../ui-design/ui-design-spec.md)のコードブロック配色）に合わせる（既成テーマ選定 or カスタム）。
  完了条件: 決定内容がui-design-spec.mdの「未確定・本実装時の課題」から本文へ反映され、実表示で確認済み。
- [ ] **T6-4: Cloudflareセットアップ + GitHub Actions**
  Pagesプロジェクト作成・APIトークン発行・Secrets登録・カスタムドメイン割当（[deploy.md](../spec/deploy.md) R-1）。`.github/workflows/deploy.yml`（test → build → wrangler-action、Playwright/依存キャッシュ、OGPキャッシュのコミット運用）。
  完了条件: deploy.md AC-1〜AC-4 を満たす。
- [x] **T6-6: Rust Playgroundリンクボタン**
  ` ```rust playground `メタ付きコードブロックに「Playgroundで開く」ボタンを付与するmdastプラグイン`playgroundLink`と右上オーバーレイのCSSを実装する（[playground.md](../markdown-pipeline/playground.md)）。
  完了条件: pages.md AC-11 / AC-12 を満たし、プラグインの単体テストがgreen。
- [ ] **T6-5: リリース前総点検** 〔Fable 5〕
  全specの受入基準を通しで確認し、ダミーコンテンツを実コンテンツ運用に切り替える方針（削除 or 非公開化）を決めて適用する。Lighthouse等でパフォーマンス・アクセシビリティの大きな問題がないか確認する。
  完了条件: 全spec受入基準のチェックリストが埋まり、`https://progrust.com` で公開されている。

## 実施履歴

### T6-1

`@astrojs/rss`（`/rss.xml`）と`@astrojs/sitemap`を導入し、feeds-meta AC-1 / AC-2 を満たした。既存の検索インデックス（`search-index.ts` → `search-index.json.js`）と同じ「純関数＋`getPublic*`集約ラッパ＋薄いエンドポイント」パターンを踏襲。

- 変更ファイル: `src/lib/feed.ts`（新規・純関数`buildFeedItems`＋ラッパ`buildContentFeed`）/ `src/pages/rss.xml.js`（新規・`rss()`エンドポイント）/ `tests/lib/feed.test.ts`（新規）/ `astro.config.mjs`（`integrations: [sitemap()]`追加）/ `src/lib/site.ts`（`SITE.description`追加）/ `package.json`・`package-lock.json`（`@astrojs/rss` 4.0.19・`@astrojs/sitemap` 3.7.3）/ spec・設計文書（[spec/feeds-meta.md](../spec/feeds-meta.md) §5のURL確定、[architecture.md](../architecture.md) §7に生成方式を追記）。
- RSSの非公開除外は`content.ts`の`getPublic*`（本番のみ公開分・章はR-12伝播込み）に委譲。並び順は`compareNewest`を共有（SSoT）。全タイプ混在（辞書・記事・本・章）・`created_at`降順・最大20件・本文なし（feeds-meta R-2/R-3）。
- フッターのRSSリンク（`Footer.astro`の`SITE_LINKS.rss = "/rss.xml"`）は配線済みのため変更なし。
- head の RSS自動検出リンク（`<link rel="alternate">`）は feeds-meta R-5（head meta）の領分として T6-2 に委ねた（仕様駆動でスコープ外）。
- 副次対応: HEAD時点で`format:check`が失敗していた`src/styles/global.css`の既存未整形行を先行修正（`chore`コミット。T6-1の変更とは無関係だがゲート通過のため）。
- 完了条件充足: `feed.test.ts`の`[AC-1]`群5件（混在link・降順+タイブレーク・20件上限・章包含・素通し/本文なし）green。実`astro build`のdistで **AC-1**（`rss.xml`＝item 20件・辞書/記事/本/章混在・`pubDate`降順・非公開dict `error-handling`/`mutex` 不在・`description`あり本文なし）と **AC-2**（`sitemap-index.xml`＋`sitemap-0.xml`生成・公開URL 115件・非公開dict 2件不在）を確認。
- 検証結果: `npm run check`（format:check + lint + typecheck + vitest 166件）green / `NODE_OPTIONS=--dns-result-order=ipv4first npx astro build` 成功。
- コミット:
  - `510e5bf` chore: global.cssの未整形箇所をprettierで整形
  - `8aa7b75` feat: RSS(全タイプ混在・直近20件)とsitemapを追加
  - （本履歴を含むdocsコミットは後続）

### T6-2

### T6-3

### T6-4

### T6-6

` ```rust playground ` メタ付きコードブロックに「Playgroundで開く」ボタンを付与するmdastプラグイン `plugins/playground-link.mjs`（export `playgroundLink`）を新設し、`mdastPlugins` の `codeFilename` 直後に登録した（lang補正後のmetaを読むため後置必須。[playground.md](../markdown-pipeline/playground.md)）。リンクURL（`https://play.rust-lang.org/?version=stable&edition=2024&code=<encodeURIComponent(コード全文)>`）はビルド時に静的生成し、クライアントJSなし。ボタンは `<pre>` の外側の `.code-playground`（`position: relative`）直下に置き、右上に半透明（opacity 0.55 / hover・focus-visibleで1.0）で絶対配置して横スクロールに追従させない。

- 変更ファイル: `plugins/playground-link.mjs`（新規）/ `astro.config.mjs`（登録）/ `src/styles/global.css`（`.code-playground`・`.playground-open` 追加、`.prose details` のボックス系子要素列挙6箇所へ `.code-playground` 追加、`.prose a` の下線除外に `:not(.playground-open)` 追加）/ `tests/plugins/playground-link.test.ts`・`tests/helpers/playground-link.ts`（新規）/ `content/articles/markdown-notation-test.md`（恒常テスト記事に単独・ファイル名併用の2ブロック追加）/ spec・記法・パイプライン文書（`spec/pages.md` R-23/AC-11/AC-12、`markdown-notation/rule.md`、`markdown-pipeline/playground.md` 新規 + README、`architecture.md` §4 順序）。
- ` ```rust:main.rs playground `（ファイル名併用）は「前段が生成したノードを後段は訪問できる」仕様により成立（`.code-block > [.code-filename, .code-playground]` のネスト構造をdistで確認）。
- hrefの `&` はシリアライズ時に `&amp;` エスケープされる（テストはエスケープ後文字列で検証）。
- 計画時に想定した `@media print` での非表示は、printブロック自体が存在しないため見送り（print対応が入る際に合わせて対応）。
- 完了条件充足: ユニットテスト7件（[AC-11] 構造・URL・非対象素通り・併用・meta温存）green。実 `astro build` のdistで2ブロックのアンカー構造・エンコード済みURL・`data-language="rust"` を確認。AC-12はプレビュー + Playwright目視相当で確認（light/dark両テーマの右上半透明表示・hoverで濃色化・クリックでPlaygroundが新規タブで開きコードが渡ること＝popup URL一致）。
- 検証結果: `npm run check`（format:check + lint + typecheck + vitest 149件）green / `npx astro build` 成功。
- コミットは `Task: T6-6` トレーラーで収集可能。

### T6-5

## フェーズ完了条件

progrust.comで本番公開され、mainへのpushで自動デプロイされる。全specの受入基準を満たす。

完了後: [plan運用ルール7](README.md) に従い、planディレクトリを凍結して`docs/archive/`へ移動する。
