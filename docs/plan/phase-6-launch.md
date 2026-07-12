# P6: 周辺機能とリリース

フィード・メタ情報・残デザイン課題を仕上げ、CI/CDを構築して本番公開する。

参照spec: [feeds-meta.md](../spec/feeds-meta.md) / [deploy.md](../spec/deploy.md)

依存: P4・P5完了

## タスク

- [ ] **T6-1: RSS・sitemap**
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
