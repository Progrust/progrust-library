# 全体設計（Architecture）

コードの構造（ディレクトリ・コレクション定義・モジュール分割・データフロー）を定義する実装者向け文書。

- 機能の振る舞い仕様と受入基準 → [`spec/`](spec/README.md)
- Sätteriプラグインの実装方式・雛形コード → [`markdown-pipeline/`](markdown-pipeline/README.md)
- 見た目 → [`ui-design/ui-design-spec.md`](ui-design/ui-design-spec.md)

実装が進んで構造が変わったら本書を更新する（本書と実装がズレたら実装を正とせず、どちらが正か判断して揃える）。

## 1. プロジェクト構成

```
/
├ astro.config.mjs        … Sätteriパイプライン設定（markdown-pipeline/README.md の骨格に従う）
├ package.json / tsconfig.json / tailwind設定
├ content/                … mdコンテンツ（構成は spec/content-model.md R-3）
├ public/                 … OGP画像・favicon・_headers等（最適化不要な静的ファイルのみ）
├ plugins/                … Sätteri用自作プラグイン（.mjs、astro.config.mjsから参照）
│   ├ dict-index.mjs      … 辞書一覧のconfig時直読み + ファイル名一意性検証
│   ├ wikilink.mjs / directives.mjs / link-card.mjs / code-filename.mjs / mermaid.mjs
├ src/
│   ├ content.config.ts   … 4コレクション定義（下記2章）
│   ├ pages/              … ルーティング（下記5章）
│   ├ layouts/            … BaseLayout / DetailLayout
│   ├ components/         … Astroコンポーネント（下記6章）
│   ├ lib/                … ビルド時ロジック（TS。コレクション横断ユーティリティ・wikilinkグラフ・検索インデックス）
│   ├ scripts/            … クライアントJS（下記8章）
│   ├ styles/             … global.css（Tailwind・コードブロック/diff等のグローバルCSS）
│   └ assets/             … 画像（構成は spec/content-model.md R-17）
└ tests/                  … vitest（下記10章）
```

- `plugins/` はSätteriパイプライン（mdast/hast段階）で動くもの。`src/lib/` はページ生成段階（getStaticPaths・コンポーネント）から使うもの、と分ける。

## 2. コンテンツコレクション定義（src/content.config.ts）

Content Layer APIのglobローダーで4コレクションを定義する。

| コレクション | loader | generateId |
| --- | --- | --- |
| `dict` | `glob({ pattern: '**/*.md', base: './content/dict' })` | ファイル名のみ（フォルダ階層を捨てる） |
| `articles` | 同上（base: articles） | 同上 |
| `books` | `glob({ pattern: '*/index.md', base: './content/books' })` | 本のディレクトリ名 |
| `chapters` | `glob({ pattern: '*/*.md', base: './content/books' })` + index.md除外 | `[本のslug]/[連番除去後のファイル名]` |

- zodスキーマは [`frontmatter.md`](markdown-notation/frontmatter.md) を型に落とす: `title: z.string()` / `description: z.string()` / `created_at`・`updated_at: z.coerce.date()` / `tags: z.array(z.string())` / `public: z.boolean()`、記事・本のみ `image: z.object({ url, alt })`（画像最適化を通す場合はスキーマ側で`image()`ヘルパーを検討）
- 章エントリは元ファイル名の連番をメタとして保持する（章順ソートに使用）。本slugはentry idの前半から導出する
- **章連番の検証**（[spec/content-model.md](spec/content-model.md) R-9）は`generateId`内または`content.config.ts`のロード後チェックで行い、違反はthrowでビルドエラー化する

### 公開フィルタの一元化（src/lib/content.ts）

`public: false`の除外判定はここに集約し、各ページ・インデックス生成から必ずこれを通す:

- `isPreview()`: `import.meta.env.DEV` で開発サーバ判定（[spec/content-model.md](spec/content-model.md) R-10）
- `getPublicDict()` / `getPublicArticles()` / `getPublicBooks()` / `getPublicChapters()`: devでは全件（`isPublic`フラグ付き）、本番では公開のみ。章は「本index非公開→章も除外」の伝播（R-12）をここで適用する
- 新着・並び順ユーティリティ（`created_at`降順・タイトル昇順タイブレーク。[spec/pages.md](spec/pages.md) R-4）

## 3. ビルド時検証の実装配置

| 検証 | 仕様 | 実装場所 | 方式 |
| --- | --- | --- | --- |
| frontmatterスキーマ | content-model R-2 | zodスキーマ | Astro標準 |
| 辞書ファイル名一意性 | content-model R-6 | `plugins/dict-index.mjs`（config時にcontent/dict/を直読みして索引構築。[wikilink.md](markdown-pipeline/wikilink.md)） | 重複検出でthrow |
| 章連番形式・重複 | content-model R-9 | `content.config.ts`（ローダー/generateId） | throw |
| wikilinkリンク切れ・公開非対称 | content-model R-13〜R-15 | config評価時の検証パス（`markdownToHtml`直呼びで全コンテンツを`plugins/wikilink.mjs`に通す。T1-4で実装） | 検証パス内でthrow（visitor内throwはコレクション経由ではビルドを失敗させないため。[wikilink.md](markdown-pipeline/wikilink.md)） |

> [!note] 既知リスクの検証結果（T1-3で解消）
> `ctx.fileURL`はContent Layer API経由の実ビルドでも実ファイルを指す（OK・公開非対称判定の前提成立）。一方、**visitor内throwによるビルドエラー化はコレクション経由では不成立**（glob loaderが握りつぶしexit 0・本文空出力・キャッシュで不可視化）と判明したため、ビルド時検証は上表のとおり「レンダリング外の検証パス」方式に変更した。詳細: [markdown-pipeline/wikilink.md](markdown-pipeline/wikilink.md)。

## 4. Markdownパイプライン構成

`astro.config.mjs`は [`markdown-pipeline/README.md`](markdown-pipeline/README.md) の「astro.config.mjs の全体像」に従う（Shiki設定は`markdown`直下、`features: { directive: true }`+textDirective復元、プラグイン順序: codeFilename → wikilink → directives → linkCard（mdast）/ mermaid（hast））。詳細・落とし穴は同文書と各機能文書を正とする。

## 5. ルーティングとページ生成（src/pages/）

| ファイル | 生成ページ | 仕様 |
| --- | --- | --- |
| `index.astro` | トップ | [spec/pages.md](spec/pages.md) R-5〜R-7 |
| `dict/index.astro` / `dict/[slug].astro` | 辞書一覧・詳細 | R-8ほか |
| `dict/[slug]/embed.astro` | embedパーシャル（`export const partial = true`） | [spec/wikilink-ui.md](spec/wikilink-ui.md) R-15 |
| `articles/index.astro` / `articles/[slug].astro` | 記事一覧・詳細 | R-9 |
| `books/index.astro` / `books/[book].astro` / `books/[book]/[slug].astro` | 本一覧・本トップ・章詳細 | R-10, R-16, R-17 |
| `tags/index.astro` / `tags/[tag].astro` | タグ一覧・詳細 | R-18, R-19 |
| `profile.astro` | プロフィール（直書き） | R-20 |
| `404.astro` | 404 | R-21 |
| `rss.xml.js` | RSS | [spec/feeds-meta.md](spec/feeds-meta.md) |
| `search-index.json.js` | 検索インデックス | [spec/search.md](spec/search.md) |

- 各`getStaticPaths`は`src/lib/content.ts`の公開フィルタを必ず通す
- embedパーシャルは辞書本文の`render()`結果+メタ情報のみを出力する（レイアウトなし）

#### embed断片の構造コントラクト（T4-1で確定。wikilink-ui §3が委譲した詳細）

`dict/[slug]/embed.astro`（`export const partial = true`）は、`getPublicDict()`で非公開を除外しつつ次の断片のみを出力する（`<html>`/`<head>`・ヘッダー・ナビを含まない）:

```html
<div data-dict-embed data-slug="[slug]" data-title="タイトル" data-tags="タグA|タグB">
  <div class="prose"><!-- render() の本文HTML --></div>
</div>
```

- **メタは data 属性で持ち、可視ヘッダーは描画しない**。用途別の見た目はconsumer（`dict-pane.ts`/`dict-preview.ts`）が組み立てる:
  - プレビュー（R-7・本文全文のみ）は `.prose` をそのまま挿入する
  - サイドペイン（R-11）は data属性から種別ラベル/タイトル/タグ/辞書リンクのヘッダーを組み立て、`.prose` を本文として挿入する
- `data-tags` は `DictCard` と同じ**パイプ区切り**規約。`data-slug` は「辞書ページを開く →」リンク（`/dict/[slug]`）用の自己記述。
- 種別ラベルは辞書embedでは常に辞書固定のため断片には持たせない（consumerが`KindBadge`相当で付与）
- 断片自身は `global.css` を読み込まない。挿入先のホスト詳細ページのスタイルで `.prose`・`.wikilink` 等が適用される（§9の部品クラスをグローバル定義する方針の前提）

### wikilinkグラフ（逆リンク・使用辞書一覧）の構築（src/lib/wikilink-graph.ts）

- ビルド時に全公開コンテンツのmd本文から`[[slug]]`出現を抽出し、「ページ → リンクしている辞書slug群」の対応表を構築する（レンダリングとは独立にraw bodyの正規表現走査で行う。コードブロック内の`[[...]]`誤検出はエッジケースとして許容し、問題になればmdast走査に切り替える）
- 逆引き（辞書slug → リンク元ページ群）が逆リンク一覧（wikilink-ui R-18）、正引きが使用辞書一覧（R-17）のデータソース
- グラフ構築も公開フィルタを通す（非公開ページからのリンクは本番で載せない）

## 6. レイアウト・コンポーネント構成

- `layouts/BaseLayout.astro`: `<head>`（meta/OGP/テーマ初期化スクリプト/Analytics）+ ヘッダー + フッター。全ページで使用
- `layouts/DetailLayout.astro`: 詳細ページ3カラムグリッド（左目次/中央本文/右ペイン。[ui-design-spec.md](ui-design/ui-design-spec.md)「レイアウト」）。辞書・記事で共用
- `layouts/ChapterLayout.astro`: 章詳細の3カラム（DetailLayout を踏襲。左=複合目次 `ChapterToc` / 中央=章ヘッダー+本文+`ChapterNav` / 右=`DictPane`。ui-design-spec §309〜314）。本トップ（`pages/books/[slug].astro`）は2カラムのため `BaseLayout` 直接利用

主要コンポーネント（ui-design-spec.mdのコンポーネント仕様と1:1対応）:

`Header` / `Footer` / `ThemeToggle` / `SearchBox` / `TypeBadge` / `LedgerRow`（台帳リスト行）/ `DictCard` / `EntryCard`（記事・本一覧で共用）/ `ListFilter`（絞込UI・タグチップを内包）/ `Toc` / `ChapterToc`（本トップ・章詳細の章目次／複合目次で共用）/ `ChapterNav`（前後章ナビ）/ `DictPane`（サイドペイン）/ `LinkedDictList`（使用辞書一覧）/ `Backlinks`（逆リンク）/ `MobileNav`（モバイルの目次・辞書フローティングボタン + 目次ボトムシート。既定は `Toc`、slot 差し替えで章詳細は複合目次を表示）

## 7. 検索インデックス生成

- `src/pages/search-index.json.js`で全公開コレクション（章含む）からJSON配列を生成（スキーマは [spec/search.md](spec/search.md) 3章）
- 生成ロジック（エントリ変換）は`src/lib/search-index.ts`に置き、vitest対象とする

## 8. クライアントJS構成（src/scripts/）

バニラTSのモジュール分割。状態管理ライブラリは使わずDOMベース。

| モジュール | 責務 | 仕様 |
| --- | --- | --- |
| `theme.ts` | 切替ボタン（初期化はBaseLayoutのインラインスクリプト） | [spec/theme.md](spec/theme.md) |
| `search.ts` | クエリパース+フィルタ（**純関数として分離しvitest対象**） | [spec/search.md](spec/search.md) |
| `search-box.ts` | ヘッダー検索UI（遅延ロード・ドロップダウン） | 同上 R-2, R-7 |
| `list-filter.ts` | 一覧絞込（タグチップ+キーワード、`data-title`/`data-tags`参照） | 同上 R-9〜R-11 |
| `dict-pane.ts` | サイドペイン（embedフェッチ・履歴配列・ボトムシート） | [spec/wikilink-ui.md](spec/wikilink-ui.md) R-10〜R-14 |
| `dict-preview.ts` | ホバープレビュー（フェッチ結果はペインと共有キャッシュ） | 同上 R-7〜R-9 |
| `toc.ts` | モバイル目次ボトムシート（+現在地追従を入れる場合） | [spec/pages.md](spec/pages.md) R-13 |

- ロード戦略: テーマ初期化のみ`<head>`同期インライン、他は`<script>`（Astroのバンドル）でdefer相当。検索インデックスとembedはユーザー操作時に遅延fetch
- JS無効時はすべてプログレッシブエンハンスメント（wikilinkは通常`<a>`遷移、検索ボックスは非表示または無効表示、サイドバーは静的表示のまま）

#### embedフェッチの共有（T4-2で確定）

`dict-pane.ts` は `fetchDictEmbed(slug): Promise<DictEmbed | null>` を named export し、slug単位の module-level Map でfetch結果をキャッシュする。`dict-preview.ts`（T4-3）はこの関数を import して**ホバープレビューとサイドペインでフェッチ結果を共有**する（同一辞書を二重fetchしない）。fetch失敗時は `null` を返し、呼び出し側は素の `/dict/[slug]` 遷移にフォールバックする（wikilink-ui R-16）。辞書リンク（本文・ペイン内とも `a.wikilink[data-dict-link]`）のクリックは `document` への単一委譲ハンドラで捕捉し、R-11/R-12 を1経路で処理する。デスクトップ右ペインとモバイルボトムシート内の `DictPane` は同一 `data-dict-pane-*` フックの複製で、`querySelectorAll` でまとめて状態同期する（`toc.ts` の複数DOM同期と同方式）。

非同期fetch後の描画は**世代トークン**で後勝ちを保証する（T4-3で確定）。`dict-pane.ts`（クリック・戻る/進む）と `dict-preview.ts`（ホバー）はそれぞれモジュールスコープのカウンタを持ち、描画要求ごとに採番して解決時に最新要求のみを描画する。これにより「辞書Aのfetch中にBを操作するとAの解決が後勝ちでBを上書きし、ペイン履歴もクリック順と逆になる」競合を防ぐ。

## 9. スタイリング

- Tailwind（`darkMode: 'class'`）。カラートークンは [ui-design-spec.md](ui-design/ui-design-spec.md) の表を正とし、CSS変数化（`--color-paper`等をテーマで切替）してdark:クラスの併記を減らす方式を採用する
- Markdown変換結果（コードブロック・diff・メッセージ・辞書リンク等）へのスタイルは`src/styles/global.css`に置く（変換HTMLにはTailwindクラスを直接付与できないため）
- prose本文（詳細ページ）のセレクタは、パイプラインが出力する**素クラス**を対象にする（T3-4で実装。dist実測で確定）: 辞書リンク=`.wikilink`（ui-design-specの`.dict-link`ではない）/ message=`.message`＋`.message-{type}`＋`.message-title` / details=素の`<details>/<summary>` / コード=`.astro-code`（`.line`・`has-diff`・`diff add|remove`）/ ファイル名=`.code-block > .code-filename` / リンクカード=`.link-card*`
  - スコープ方針: プレーンなmarkdown要素（`h2`〜`h4`・`p`・`ul`/`ol`・`blockquote`・`table`・`details`・脚注等）は`.prose`配下にスコープする。一方、**再利用しうる部品クラス**（`.wikilink`・`.message*`・`.astro-code`・`.code-filename`・`.link-card*`・`.sr-only`）は`.prose`外でも使えるようグローバルに定義する（P4の辞書ペイン内など`.prose`外での辞書リンク/本文表示を見据える）
- コードブロックはE案（ライトでもダーク面）のため、Shiki dual themeの前景トークンは**両テーマとも`--shiki-dark`側**を使い、背景・枠線だけダーク差で切り替える（`.astro-code`）。Shikiトークンのカスタムパレット化（keyword色等）は[ui-design-spec.md](ui-design/ui-design-spec.md)「未確定」項として保留

## 10. テスト構成（vitest）

対象（[spec各文書の受入基準]と対応づける）:

- `plugins/`の自作プラグイン: mdast/hast in/outのユニットテスト（正常系+ビルドエラー系）
- `src/lib/`: wikilinkグラフ構築・検索インデックス変換・並び順/公開フィルタ
- `src/scripts/search.ts`: クエリパース+フィルタの純関数

ページ・UIは自動テストせず、ビルド成功（=全検証パス）と開発サーバでの目視で確認する。E2Eは導入しない。

## 11. ビルド・デプロイ

要件は [spec/deploy.md](spec/deploy.md)。ワークフローは`.github/workflows/deploy.yml`に置く（test → build → wrangler-action の単一ワークフロー）。
