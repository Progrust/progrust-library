# P6: 周辺機能とリリース

フィード・メタ情報・残デザイン課題を仕上げ、CI/CDを構築して本番公開する。

参照spec: [feeds-meta.md](../spec/feeds-meta.md) / [deploy.md](../spec/deploy.md)

依存: P4・P5完了

## タスク

- [x] **T6-1: RSS・sitemap**
  `@astrojs/rss`（全タイプ混在・直近20件・概要のみ）と`@astrojs/sitemap`。フッターからRSSへリンク。
  完了条件: feeds-meta AC-1 / AC-2 を満たす。
- [x] **T6-2: OGP・meta・favicon・Analytics**
  BaseLayoutのmeta/OGP出力（タイトル形式・共通OGP画像・canonical）・favicon・Cloudflare Web Analyticsタグ。OGP画像とfaviconの素材を用意する。
  完了条件: feeds-meta AC-3 / AC-4 を満たす。
- [x] **T6-3: コードフォント・Shikiテーマ確定（デザイン残課題）**
  全角対応等幅フォント（UDEV Gothic / Moralerspace等）を実表示で比較して選定・差し替える（基本3フォントはP5でAstro Fonts APIによるセルフホスト済み。ui-design-spec「タイポグラフィ」参照）。Shiki dual themeを確定配色（[ui-design-spec.md](../ui-design/ui-design-spec.md)のコードブロック配色）に合わせる（既成テーマ選定 or カスタム）。
  完了条件: 決定内容がui-design-spec.mdの「未確定・本実装時の課題」から本文へ反映され、実表示で確認済み。
- [x] **T6-4: Cloudflareセットアップ + GitHub Actions**
  Pagesプロジェクト作成・APIトークン発行・Secrets登録・カスタムドメイン割当（[deploy.md](../spec/deploy.md) R-1）。`.github/workflows/deploy.yml`（test → build → wrangler-action、Playwright/依存キャッシュ、OGPキャッシュのコミット運用）。
  完了条件: deploy.md AC-1〜AC-4 を満たす。
- [x] **T6-6: Rust Playgroundリンクボタン**
  ` ```rust playground `メタ付きコードブロックに「Playgroundで開く」ボタンを付与するmdastプラグイン`playgroundLink`と右上オーバーレイのCSSを実装する（[playground.md](../markdown-pipeline/playground.md)）。
  完了条件: pages.md AC-11 / AC-12 を満たし、プラグインの単体テストがgreen。
- [x] **T6-5: リリース前総点検** 〔Fable 5〕
  全specの受入基準を通しで確認し、ダミーコンテンツを実コンテンツ運用に切り替える方針（削除 or 非公開化）を決めて適用する。Lighthouse等でパフォーマンス・アクセシビリティの大きな問題がないか確認する。
  完了条件: 全spec受入基準のチェックリストが埋まり、`https://blog.progrust.com` で公開されている。

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

`BaseLayout.astro` の `<head>` にメタ情報群を集約実装し、feeds-meta AC-3 / AC-4（および AC-5 を確定）を満たした。全ページ共通の一元出力なので詳細ページ側の個別対応は最小。

- 変更ファイル: `src/layouts/BaseLayout.astro`（OGP `og:*`・Twitter Card・canonical・`meta description` 常時出力・RSS自動検出 `<link rel="alternate">`・Cloudflare Web Analytics beacon。`ogType` Props 追加・`canonicalURL`/`metaDescription`/`ogImage`/`beaconToken` 導出）/ `src/layouts/DetailLayout.astro`・`ChapterLayout.astro`・`src/pages/books/[slug].astro`（`ogType="article"` を伝播）/ 一覧・トップ・タグ・404 各ページ（`src/pages/{index,articles/index,books/index,dict/index,tags/index,tags/[tag],404}.astro` にページ固有の固定 `description`）/ spec・plan（[spec/feeds-meta.md](../spec/feeds-meta.md) §5・R-8 の決定反映）。
- 決定事項（[spec/feeds-meta.md](../spec/feeds-meta.md) に反映）: ①Analytics トークンは環境変数 `PUBLIC_CF_BEACON_TOKEN` の条件レンダリング（未設定ビルドは beacon 非出力・実トークンは T6-4 で Cloudflare Secrets 登録）。②favicon は SVG のみ（PNGフォールバック・`apple-touch-icon` は不要と決定）。
- T6-1 が委譲した head の RSS 自動検出 `<link rel="alternate" type="application/rss+xml">` を本タスクで実装（[spec/feeds-meta.md](../spec/feeds-meta.md) R-1〜R-3）。
- `og:image`/canonical は `astro.config.mjs` の `site`（`Astro.site`）で絶対URL化。素材 `public/ogp.png`（1200×630）・`public/favicon.svg` は用意済みで流用。
- 完了条件充足: architecture §10 によりページ/レイアウトは vitest 非対象のため、実 `astro build` の dist 実測で確認。**AC-3**（記事詳細に `og:title`/`og:description`/`og:image`=`https://progrust.com/ogp.png`/canonical 出力）・**AC-4**（`PUBLIC_CF_BEACON_TOKEN=dummy` ビルドで全92ページに `beacon.min.js` タグ＋`data-cf-beacon` token・未設定ビルドで 0 件）・**AC-5**（全92ページに `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`）＋ RSS alternate 全ページ出力を確認（embed断片23件は `<head>` を持たない部分HTMLのため対象外）。
- 検証結果: `npm run check`（format:check + lint + typecheck〔hint1件は既存〕 + vitest 166件）green / `NODE_OPTIONS=--dns-result-order=ipv4first npx astro build` 成功（トークン有/無の2通り）。
- コミット:
  - `bc30f56` feat: OGP・meta・canonical・RSS自動検出・Cloudflare Web Analyticsを追加
  - （本履歴を含む docs コミットは後続）

### T6-3

デザイン残課題2件を確定し実装した。決定内容は [ui-design-spec.md](../ui-design/ui-design-spec.md)（「タイポグラフィ > monoの日本語」「コードブロック」）へ反映済みで「未確定・本実装時の課題」は解消。

**① Shikiカスタムテーマ（single theme化）**

- 確定4色に一致する既成テーマはないため自作。配色が両テーマ共通（E案）のためdual themeを廃止しsingle themeへ（全spanの`--shiki-light/dark`重複変数によるHTML肥大を回避）。preに焼き込まれるインライン背景・前景は自作transformer`transformerCodeBg`で除去（`html.dark`切替CSSが負けるため）。実装方式・スコープ設計の実測知見（bare `keyword`不可・ライフタイムの実スコープ・alpha hex可）は [markdown-pipeline/shiki.md](../markdown-pipeline/shiki.md) 参照
- spec先行更新: [spec/theme.md](../spec/theme.md) R-5/AC-4を「切替対象=背景・枠線とmermaidのみ、シンタックス配色は両テーマ共通」に改訂
- 変更ファイル: `plugins/shiki-theme.mjs`（新規）/ `astro.config.mjs` / `src/styles/global.css` / `tests/plugins/shiki-theme.test.ts`・`tests/helpers/shiki-theme.ts`（新規、`shiki`をdevDepに明示追加）/ spec・設計文書

**② コードフォント（ハイブリッド: JetBrains Mono + UDEV Gothic和文サブセット）**

- 実表示比較6案（現状 / UDEV和文3:5 / UDEV和文size-adjust1:2 / Moralerspace和文 / UDEV・Moralerspaceフル差し替え）をスクリーンショット提示し、ユーザー選定で**B案: 欧文=JetBrains Mono続投+和文=UDEV Gothic和文グリフ（半角:全角=3:5、UDEV Gothic 35と同比率）**に確定
- 実測知見: UDEV Gothic無印は欧文（JBM派生）を0.5emに縮小して1:2を実現しており、JBM(0.6em)続投のハイブリッドでは3:5になる。また**Fonts APIの`fallbacks`に他fontsエントリ名を書いても生成ファミリ名がハッシュ付きのため一致せず機能しない**（従来のmono用Zen Kakuフォールバックもこの理由で不動作だった）→ 連鎖は`global.css`の`--font-mono: var(--font-code-jp), var(--font-jetbrains)`変数合成で実現
- サブセット生成の再現手順（fonttools 4.x）: UDEVGothic-Regular.ttf v2.2.0 から `U+3000-303F,U+3041-309F,U+30A0-30FF,U+4E00-9FFF,U+FF01-FF60,U+FFE0-FFE6` をsubset+woff2化し、OFLのRFN（"UDEV Gothic"）回避のためname table（ID 1/3/4/6/16）を「Progrust Code JP」へ変更（`fontTools.subset`＋name書き換えのPythonスクリプト。約1.4MB。詳細は `src/assets/fonts/README.md`）
- 変更ファイル: `src/assets/fonts/`（woff2・LICENSE・README新規）/ `astro.config.mjs`（localプロバイダ+unicodeRange追加・JBMのfallbacks修正）/ `src/layouts/BaseLayout.astro`（`<Font cssVariable="--font-code-jp">`）/ `src/styles/global.css` / ui-design-spec

**検証結果**

- `npm run check`（format:check + lint + typecheck + vitest 173件〔テーマテスト7件含む〕）green / `NODE_OPTIONS=--dns-result-order=ipv4first npx astro build` 成功
- dist実測: 全span実color4色・`--shiki-light/dark`消滅・preインライン背景なし・`has-diff`/`diff add|remove`維持・mermaid SVG従来どおり・unicodeRange付き@font-face出力・`--font-mono`合成
- 実ブラウザ（Playwright・preview）: 日本語コメントがUDEV Gothic（かな1.0em/欧文0.6em）で表示・`html.dark`トグルで背景#2A241F↔#171411と枠線のみ切替（シンタックス4色固定）・diff/ファイル名タブ無傷・JPフォントはmono日本語を含むページでのみDL（完了条件の「実表示で確認済み」を充足）

**コミット**

- `c347588` docs: コードブロックのシンタックス配色を両テーマ共通に確定
- `b5ce253` feat: Shikiをカスタムsingle theme化（確定4色パレット）
- `abbfaba` feat: コード用日本語等幅フォント（UDEV Gothicサブセット）をハイブリッド配信
- （本履歴を含むdocsコミットは後続）

**追記: パレットを6色へ拡張（T6-3完了後のフィードバック対応）**

- 「4色では色数が少なくコードが読みにくい」とのフィードバックにより、既存4色は不変のまま関数系 `#A9B665`・型系 `#7FB5A3` の2色を追加し、金色 `#D9B25E` の適用範囲を`self`/エスケープ/文字列補間/シェルフラグ等へ拡大（確定値と割当は [ui-design-spec「コードブロック」](../ui-design/ui-design-spec.md)、スコープ実測の知見は [markdown-pipeline/shiki.md](../markdown-pipeline/shiki.md)）。Rust/TS/bash/TOMLの実出力比較をArtifactで提示しユーザー承認済み
- 変更ファイル: `plugins/shiki-theme.mjs` / `tests/plugins/shiki-theme.test.ts`（+4件で計11件）/ ui-design-spec・shiki.md・architecture.md・global.css/astro.config.mjsのコメント
- 検証: `npm run check`（vitest 177件）green / build成功・distに新2色の実colorを確認

### T6-4

デプロイパイプラインを構築し、deploy.md AC-1〜AC-4をすべて実挙動で確認した（AC-4のみ構造確認）。`https://blog.progrust.com` で公開開始。

- 変更ファイル: `.github/workflows/deploy.yml`（新規。main pushトリガー → setup-node(npmキャッシュ) → `npm ci` → `npm run test` → Playwrightキャッシュ+Chromium導入 → `npm run build`（`PUBLIC_CF_BEACON_TOKEN`注入）→ `cloudflare/wrangler-action@v3` でDirect Upload）/ spec先行更新（[spec/deploy.md](../spec/deploy.md) §5にOGPキャッシュ運用・Playwrightキャッシュキー設計・トークン注入方式を確定、[spec/feeds-meta.md](../spec/feeds-meta.md) §5のbeacon登録先をGitHub Secretsへ修正）/ [markdown-pipeline/mermaid.md](../markdown-pipeline/mermaid.md)（CI上のPlaywright起動「未検証」を解消）
- Cloudflare側セットアップ（R-1）: Pagesプロジェクト `progrust-library` は一時的な `preCommands: wrangler pages project create` ステップでCIから作成（作成後に除去。**ダッシュボードの「Upload assets」導線はWorkersプロジェクトを作るため使えない**点に注意）。APIトークン（Pages: Edit）はユーザーが発行、GitHub Secretsは `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `PUBLIC_CF_BEACON_TOKEN` の3つを登録。カスタムドメイン `blog.progrust.com` とWeb Analyticsサイトはユーザーがダッシュボードで割当・作成
- AC充足（いずれもGitHub Actionsの実ランで確認）: **AC-1** main pushでtest→build→deployが自動実行され `https://blog.progrust.com` が200・canonical/beacon出力を実測。**AC-2** リンク切れwikilinkのpushでワークフロー失敗・デプロイスキップ（`b163526`→revert `bda3ce0`）。**AC-3** 失敗テストのpushでテストステップ失敗・ビルド/デプロイスキップ（`04e39e8`→revert `28c1cd4`）。**AC-4** トリガーが `push: branches: [main]` のみでPRでは起動しない（構造確認）
- 実測知見: ①wikilinkリンク切れはビルドステップより前の**ユニットテストステップで検出される**（`vitest.config.ts` ロード時にwikilink検証が走るため）。AC-2の「ワークフロー失敗・デプロイされない」要求は満たす。②Astro Fonts APIのGoogle Fontsダウンロードがランナー上で一時的に失敗しビルドが落ちることがある（1回発生・再実行で解消）。頻発するならフォントキャッシュの `actions/cache` 追加を検討
- 検証結果: `npm run check`（vitest 177件）green / ローカル `astro build` 成功 / CI実ラン成功（Playwrightキャッシュのmiss・hit両経路を確認）
- コミット: `4fdd90a` docs（spec確定）/ `80b99de` feat（deploy.yml）/ `f1c682c`・`1bcfb40` chore（プロジェクト初回作成の一時ステップ追加・除去）/ `b163526`・`bda3ce0`（AC-2検証・revert）/ `04e39e8`・`28c1cd4`（AC-3検証・revert）/ 本履歴を含むdocsコミット

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

リリース前総点検を実施した。①全spec受入基準51件の通し確認（下表）、②未実装だった content-model AC-7（dev非公開バッジ）の実装、③Lighthouse実測、④ダミーコンテンツ全削除（ユーザー決定: `content/`配下は全部ダミーのため全削除）、⑤本番公開確認。

**① AC-7 の実装**: 詳細ページ（辞書・記事・本トップ・章）のヘッダーメタ行先頭に「非公開」バッジをdevビルド時のみ描画する `PrivateBadge.astro` を新設し、`DetailLayout`/`ChapterLayout`/`books/[slug].astro` へ配線（`getPublic*` の `isPublic` フラグを伝播）。デザイン確定は [spec/content-model.md](../spec/content-model.md) R-10 へ反映（§5未確定事項を解消）。dev実表示で4ページ種すべて確認（本・章・記事は一時的な `public: false` 化で確認後revert）、本番distへの非出力も確認。

**② ダミーコンテンツ全削除**: 全36ファイル（辞書24・記事7・本1+章3・恒常テスト記事含む）を削除し、空ディレクトリは `.gitkeep` で維持（`validate-wikilinks` がconfig評価時に `content/dict/` をscandirするため必須）。空コレクションでのビルド（一覧0件・RSS 0件・検索インデックス空配列・sitemap一覧5URLのみ・計6ページ）と `npm run check` の健全性を確認。**落とし穴**: 削除がローカルビルドに反映されないデータストア残留を実測（[architecture.md §2](../architecture.md) に対処法を記録）。

**③ Lighthouse 実測**（削除前の本番 `blog.progrust.com`、npx lighthouse + Playwright Chromium）:

| ページ | perf | a11y | bp | seo |
| --- | --- | --- | --- | --- |
| トップ（mobile / desktop） | 96 / 100 | 95 | 100 | 100 |
| 記事詳細（mobile / desktop） | 97 / 99 | 96 | 100 | 100 |
| 辞書詳細（mobile） | 97 | 96 | 100 | 100 |
| 本トップ（mobile） | 74※ | 96 | 100 | 100 |
| 章詳細（mobile） | 97 | 96 | 100 | 100 |

- ※本トップの perf 74 はダミー本の表紙画像（LCP 13.2s）が原因＝コンテンツ起因で削除により解消。実コンテンツ執筆時は content-model R-16 の画像最適化に従うこと
- 唯一の a11y 減点は `--color-sub`（#847a6e、コントラスト比3.69 < 4.5）の `color-contrast` のみ。確定済みUIデザイントークン（ui-design-spec）のためT6-5では変更せず記録のみ（改善するならトークンの明度調整をデザイン判断で行う）
- 「大きな問題」に該当する事項なし

**④ 全spec受入基準チェックリスト**（51件。判定根拠は各タスクの実施履歴・`[AC-n]`テスト・T6-5実測）:

| spec | AC | 判定 | 根拠 |
| --- | --- | --- | --- |
| content-model | AC-1〜6, AC-8〜10 | ✅ | T1-2 / T1-4（テスト+意図違反の実測。AC-9はT6-4のCI実ラン（deploy AC-2）でも再確認） |
| content-model | AC-7 | ✅ | **T6-5で実装**（上記①）。dev実表示4ページ種+本番dist非出力を確認 |
| pages | AC-1〜8 | ✅ | T3-2〜T3-6（`[AC-n]`テスト+dist実測） |
| pages | AC-9 | ✅ | `table-wrap.test.ts` `[AC-9]`（実装コミット `e35d243`。plan記録漏れをT6-5で補完） |
| pages | AC-10 | ✅ | **T6-5でPlaywright実測**: 幅広テーブルを一時追記し、ラッパ内横スクロール・ページ全体は横スクロールなしを確認 |
| pages | AC-11 / AC-12 | ✅ | T6-6（テスト+dist+目視） |
| pages | AC-13 | ✅ | `external-links.test.ts` `[AC-13]`（実装コミット `9a51751`。plan記録漏れをT6-5で補完） |
| wikilink-ui | AC-1 | ✅ | T1-3（変換）+T3-4（デザイン）。T6-5で実HTML出力（`.wikilink` アンカー+辞書タイトル）を再確認 |
| wikilink-ui | AC-2〜8 | ✅ | T4-1〜T4-4（`[AC-n]`テスト+dist+目視） |
| search | AC-1, AC-3〜5 | ✅ | T5-1 / T5-2（`[AC-n]`テスト+dist実測） |
| search | AC-2 | ✅ | T5-3のテスト+**T6-5でPlaywright実機確認**（初期ロード非fetch・初回フォーカスでfetch。T5申し送りの実機目視を解消） |
| search | AC-6 | ✅ | T5-3のテスト+**T6-5でPlaywright実機確認**（種別バッジ表示・章クリックで章詳細へ遷移） |
| search | AC-7 | ✅ | T5-4のテスト+**T6-5でPlaywright実機確認**（タグ2択AND絞り込み・件数23→3更新） |
| theme | AC-1〜4 | ✅ | T3-1（Playwright目視）。AC-4はT6-3のsingle theme化仕様で再確認済み |
| feeds-meta | AC-1〜5 | ✅ | T6-1 / T6-2（テスト+dist実測） |
| deploy | AC-1〜4 | ✅ | T6-4（GitHub Actions実ラン。AC-4は構造確認） |

- 実機確認（pages AC-10 / search AC-2, 6, 7）はコンテンツ削除前の preview + Playwright で実施
- 検証結果: `npm run check`（vitest 177件）green / `astro build` 成功（コンテンツ有・無の両状態）/ CI実ラン成功・`https://blog.progrust.com` 200
- コミットは `Task: T6-5` トレーラーで収集可能

## フェーズ完了条件

blog.progrust.comで本番公開され、mainへのpushで自動デプロイされる。全specの受入基準を満たす。

完了後: [plan運用ルール7](README.md) に従い、planディレクトリを凍結して`docs/archive/`へ移動する。
