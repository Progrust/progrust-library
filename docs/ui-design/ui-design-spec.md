# UIデザイン確定仕様書

claude designでのモック検討で確定したデザイン仕様。本実装（Astro + Tailwind）時はこの資料とモック本体を参照する。

**モックHTML本体はリポジトリに含まれない**。以下の claude design プロジェクト上にあり、他文書（spec等）が参照するモックファイル名もすべてここを指す。

- claude designプロジェクト: [Progrust Library UI](https://claude.ai/design/p/2c5de680-9b98-45ee-a6ab-39dfc30a2230)
- 確定モック
  - トップページ: `top-b-sharp.html`
  - 辞書一覧: `dict-index.html`
  - 辞書詳細: `dict-detail.html`（コードブロック・辞書リンク・サイドペインの確定仕様を含む）
  - `:::message`種別: `message-variants.html`（通常+6種別・タイトル指定の確定仕様。タイトル表示の不採用案（案2: eyebrow維持+タイトル行）も比較用に残置）
  - diff表示: `code-diff-compare.html`（案B: 背景tint+マーカー、削除行の文字薄めで確定。不採用の案A/Cも比較用に残置）
  - 本トップ: `book-top-sidebar.html`（章目次サイドバー型。ヒーロー・章目次の確定仕様を含む）
  - 章詳細: `book-chapter.html`（複合目次サイドバー・前後章ナビの確定仕様を含む）
  - タグ一覧: `tags-index.html`（件数順チップクラウド）
  - タグ詳細: `tags-detail.html`（種別混在の台帳リスト・戻るボタン。一覧データはバッジ全種を見せるための架空混じり）
  - テーブル: `table-compare.html`（案C: カード面フレーム・ゼブラなしで確定。不採用の比較案（現状 / 案A / 案B / 案D / ゼブラ）も残置）
  - 参考資料: `code-bg-compare.html`（コードブロック背景色の比較検討）
- 不採用の比較案（参考として残置）: `top-a-warm.html` / `top-c-balance.html` / `top-b2-sidebar.html` / `top-b3-catalog.html` / `book-top.html`（本トップの縦積み1カラム案）

## デザインの方向性

**「top-b-sharp」= 直線的・ウォームグレー・台帳風。** 色とフォントで暖かみを出しつつ、レイアウトは直線とmono書体で技術ブログらしく引き締める。

- 真っ白・真っ黒は使わない（紙色系のオフホワイト / 焦げ茶系のダーク）
- 装飾は細い薄罫線が基本。影はモバイルのフローティング要素などに限定
- セクションラベルは `// dictionary` のようなコードコメント風のeyebrow（mono・アクセント色）

## カラートークン

Tailwind configに登録するトークン。ライト用とダーク用（`n`接頭辞）をペアで持ち、`class` 方式のダークモードで切り替える。

| 役割 | light | dark |
| --- | --- | --- |
| ページ背景 | `paper` #F2F0EC | `npaper` #1E1B18 |
| カード面 | `card` #FBF9F6 | `ncard` #26221E |
| 罫線 | `line` #D9D3CA | `nline` #3E3831 |
| 見出し | `strong` #29241F | `nstrong` #F1EAE1 |
| 本文文字 | `ink` #3A342D | `nink` #E4DCD1 |
| 補助文字 | `sub` #847A6E | `nsub` #9C9186 |
| アクセント・インライン強調文字 | `accent` #C63D22 | `naccent` #F0684A |

```js
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#F2F0EC', card: '#FBF9F6', line: '#D9D3CA',
        strong: '#29241F', ink: '#3A342D', sub: '#847A6E', accent: '#C63D22',
        npaper: '#1E1B18', ncard: '#26221E', nline: '#3E3831',
        nstrong: '#F1EAE1', nink: '#E4DCD1', nsub: '#9C9186', naccent: '#F0684A'
      },
      fontFamily: {
        display: ['"Zen Kaku Gothic New"', 'sans-serif'],
        maru: ['"Zen Maru Gothic"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Zen Kaku Gothic New"', 'monospace']
      }
    }
  }
};
```

> [!info]
> モックは全クラスに `dark:` variantを併記する方式。本実装ではCSS変数化（`--color-paper` をテーマで切替）してクラスを半減させる選択肢もあるが、色の値はこの表に従う。

## タイポグラフィ

| 役割 | フォント | ウェイト | 用途 |
| --- | --- | --- | --- |
| `font-display` | Zen Kaku Gothic New | 500/700/900 | 見出し、タイトル、ボタン、バッジ |
| `font-maru`（本文デフォルト） | Zen Maru Gothic | 400/500/700 | 本文（bodyに指定） |
| `font-mono` | JetBrains Mono + Progrust Code JP（★T6-3確定・下記） | 400/600（JPは400のみ） | 日付、タグ、eyebrow、件数、コード |

フォント読込は **Astro Fonts API によるセルフホスト**（設定は `astro.config.mjs` の `fonts`。ビルド時にGoogleから取得して自オリジンから配信する。Firefoxのフォントスワップ時全画面再レイアウトによる点滅の緩和・表示速度・プライバシーが目的）。CSS変数のマッピング:

| Astro側変数（`cssVariable`） | Tailwind `@theme` トークン |
| --- | --- |
| `--font-zen-kaku` | `--font-display` |
| `--font-zen-maru` | `--font-maru` |
| `--font-code-jp`, `--font-jetbrains` | `--font-mono`（この順の変数合成） |

`<Font />` コンポーネントは `BaseLayout.astro` の `<head>` に置く。

- サイトロゴは `Progrust Library` + アクセント色のピリオド（`<span class="text-accent dark:text-naccent">.</span>`）。大見出しの末尾ピリオドも同じ文法

### mono の日本語（★T6-3確定・ハイブリッド方式）

実表示比較（UDEV Gothic / Moralerspace / 現状、フル差し替え案・size-adjust 1:2案を含む6案）の結果、**欧文=JetBrains Mono続投 + 和文=UDEV Gothic和文グリフの差し込み（半角:全角=3:5）**で確定。

- **Progrust Code JP** = UDEV Gothic v2.2.0 Regular の日本語グリフのみサブセット（約1.4MB woff2）。OFLのRFN回避のためリネーム済み（`src/assets/fonts/README.md`）
- localプロバイダ + `unicodeRange` により、mono指定箇所に日本語を含むページでのみダウンロードされる（ハッシュ付き静的資産のため取得は初回のみ）
- 半角:全角=3:5 は UDEV Gothic 35 と同じ公式比率（5半角=3全角で整列）。厳密1:2（size-adjust 120%拡大・フル差し替え）は和文の拡大・欧文幅の変化を嫌って不採用
- モックの `"Zen Kaku Gothic New"` monoフォールバックは廃止（Fonts APIの `fallbacks` に他エントリ名を書いてもハッシュ付きファミリ名と一致せず機能しないことが判明。連鎖は `--font-mono: var(--font-code-jp), var(--font-jetbrains)` の変数合成で行う）

## 共通ルール

- **角丸**: 面のある要素（カード・ボタン・入力・バッジ・チップ・コードブロック・ペイン・ポップアップ）に4px（Tailwind `rounded`）。モバイルのボトムシートは上側のみ `rounded-t-md`。**罫線（ヘッダー/フッターの境界・リスト行区切り・ナビの仕切り）は直線のまま**
- **罫線**: 構造の境界は `border-line/70 dark:border-nline/70`（薄め）、コンテンツの枠は `border-line dark:border-nline`
- **ホバー**: リンク文字・枠が `accent`/`naccent` に変わる。リスト行は `hover:bg-card dark:hover:bg-ncard`。`transition-colors motion-reduce:transition-none` を併記
- **eyebrow**: `<p class="font-mono text-xs text-accent dark:text-naccent">// dictionary</p>` の形式で統一（`// toc`、`// dictionary pane`、`// linked dictionaries` など）
- **スクロールバー**: 全域で細幅（WebKit 6px / Firefox `thin`）・トラック透明。サムは `line`（hover で `sub`）・角丸は幅の半分。コードブロックはダーク面のためサムをライト `#4a4238` / ダーク `line` に切替（枠線色と同じペア。hover は共通どおり `sub` で明るくなる）。辞書サイドペイン・ホバープレビューは表示幅が狭いため WebKit 4px に上書き

## テーマ切替

- 初期値は `prefers-color-scheme`、ユーザー選択は `localStorage.theme` に保存
- FOUC防止のため `<head>` 先頭で同期実行:

```html
<script>
(function () {
  var saved = localStorage.getItem('theme');
  var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.classList.add('dark');
})();
</script>
```

- 切替ボタンは `html.classList.toggle('dark')` + localStorage保存。アイコンは太陽/月のSVGを `dark:hidden` / `hidden dark:block` で切替

## レイアウト

| 画面 | コンテナ | 構成 |
| --- | --- | --- |
| トップ / 辞書一覧 / タグ一覧 / タグ詳細 | `max-w-6xl px-4 sm:px-8` | 1カラム |
| 辞書詳細（記事も同様の想定） | `max-w-[96rem] px-4 sm:px-8` | 段階的レスポンシブ: `xl` 以上は3カラム `xl:grid-cols-[clamp(200px,15.625vw,240px)_minmax(0,1fr)_clamp(320px,25vw,384px)]`（左=目次 / 中央=本文 / 右=サイドペイン+使用辞書）、`lg`〜`xl` 未満は目次カラムを省略した2カラム `lg:grid-cols-[minmax(0,1fr)_clamp(320px,25vw,384px)]`（目次はフローティングボタンに切替）、`lg` 未満は1カラム。gapは `lg:gap-10`。左右カラム幅は `clamp()` で画面幅に連続追従し（1536px=コンテナ最大幅で最大値、1280pxで最小値に到達）、中央本文が過剰に狭くならないようにする。目次対象見出し（h2〜h4）が無いページでは `lg` 以上で常に2カラム |
| 章詳細 | `max-w-[96rem] px-4 sm:px-8` | 辞書詳細と同じ段階的レスポンシブ。ただし左カラムは `clamp(220px,17.1875vw,264px)` で**複合目次**（章リスト+現在章の本文見出し）に差し替え |
| 本トップ | `max-w-5xl px-4 sm:px-8` | `lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12`（左=章目次サイドバー / 右=ヒーロー+本文、本文列は `max-w-3xl`） |

- ヘッダー/フッターの内側コンテナ幅はページの `<main>` 幅に追従する（既定 `max-w-6xl`。辞書/記事/章詳細では `max-w-[96rem]`。本トップは `max-w-6xl` のまま）
- 辞書一覧のカードグリッド: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- 両サイドバーは `sticky top-24`。目次は `xl` 未満・辞書ペインは `lg` 未満で非表示にしてフローティングボタン（後述）に切替
- 中央本文は `min-w-0`（truncate用）+ モバイル時 `max-w-2xl mx-auto`

## コンポーネント仕様

### ヘッダー（全ページ共通・スクロール固定）

ロゴ + 検索ボックス + テーマ切替の3点のみ。ナビリンクは置かない。内側コンテナの `max-w-6xl` は既定値で、ページの `<main>` 幅に追従する（「レイアウト」参照）。

```html
<header class="sticky top-0 z-30 bg-paper/95 dark:bg-npaper/95 backdrop-blur border-b border-line/70 dark:border-nline/70">
  <div class="mx-auto max-w-6xl px-4 sm:px-8 h-14 flex items-center gap-6">
    <!-- ロゴ / 検索(input h-9 rounded border bg-card) / テーマ切替(w-9 h-9 rounded border bg-card) -->
```

### フッター

コピーライト（mono）+ GitHub/X/RSSのテキストリンク。`border-t border-line/70`。

### コンテンツ種別バッジ

角型アウトライン + 4px角丸 + `font-display font-bold text-[11px] px-2 py-0.5`。一覧で並ぶ場合は `w-[4.5rem] text-center` で幅を揃える。

| 種別 | light | dark |
| --- | --- | --- |
| 本 | border/text #7A3B2E | #D08A72 |
| 記事 | `accent` | `naccent` |
| 辞書 | border #A87B1C / text #8F6812 | #D9B25E |

### 台帳リスト行（新着・逆リンク）

`border-t` で始めて各行 `border-b`。グリッドで日付(mono)・バッジ・タイトル(display太字・truncate)・タグ(mono)を並べる。行ホバーで `bg-card` + タイトルがアクセント色。

```html
<a class="group grid grid-cols-[auto_auto_1fr] sm:grid-cols-[7rem_4.5rem_1fr_auto] items-center gap-x-4 py-4 border-b border-line dark:border-nline hover:bg-card dark:hover:bg-ncard transition motion-reduce:transition-none">
```

逆リンクセクション（辞書詳細の本文下・★dict-detail.htmlで確定）は、`mt-12 pt-8 border-t` のセクション内に見出し行 + 台帳リストで構成する:

- 見出し行: `flex items-baseline justify-between mb-5` で、h2「この辞書が使われているページ」（`font-display font-black text-xl tracking-tight text-strong`）+ 件数 `backlinks N`（`font-mono text-[11px] text-sub`）
- 行は日付・タグ列なしの `grid grid-cols-[auto_1fr] gap-x-4 py-3.5`（バッジ `w-[4.5rem] text-center` + タイトル `font-display font-bold text-sm text-strong group-hover:text-accent truncate`）。章は「本タイトル › 章タイトル」で併記

### 辞書カード（一覧）

タイトル + タグのみ（概要なし）。`data-title` / `data-tags`（`|` 区切り）を持たせ、絞込JSで参照する。

```html
<a class="dict-card group flex flex-col gap-3 p-5 bg-card dark:bg-ncard rounded border border-line dark:border-nline hover:border-accent dark:hover:border-naccent transition-colors motion-reduce:transition-none" data-title="..." data-tags="タグA|タグB">
```

### タグチップ（絞込UI）

`font-mono text-[11px] px-2.5 py-1 rounded border bg-card` + `#タグ名` + 出現件数。選択時は `border-accent dark:border-naccent text-accent dark:text-naccent` をclassList.toggleで付与し `aria-pressed` を更新（トークン定義順でaccentがline/subより後のため上書きが効く）。タグはAND、キーワードはタイトル+タグの部分一致。件数表示は `N / 総数 entries`（ヒット数 N を `text-strong font-semibold` で強調）、0件時はメッセージ表示。タグが多い場合は上位12個 + 「+ N tags」（アクセント色テキストのボタン）で展開。

**詳細ページヘッダーのタグ**（★dict-detail.htmlで確定）も同型のチップ（`font-mono text-[11px] px-2.5 py-1 rounded border border-line bg-card text-sub`）を `<a>`（タグ詳細ページへのリンク）で使う。件数・選択状態はなし、ホバーで文字・枠がアクセント色。

絞込JS（P5・`list-filter.ts`）が参照する `data-*` 属性コントラクト（SSoT。カード側 `data-title` / `data-tags`（`|`区切り）と対で使う）:

| 属性 | 付与先 | 用途 |
| --- | --- | --- |
| `data-list-filter` / `data-total` | 絞込UIのルート | 絞込対象ブロックの目印 / 総件数 |
| `data-filter-keyword` | キーワード入力 | キーワード取得元 |
| `data-filter-count` / `data-filter-hits` | 件数表示 `<p>` / ヒット数 `<span>` | ヒット数の更新先 |
| `data-filter-tag`（値=タグ名） | タグチップ | AND絞込の選択状態管理 |
| `data-filter-more` | 「+ N tags」ボタン | 残りタグの展開トリガ |

### 本文タイポグラフィ（prose・★dict-detail.htmlで確定）

モックの本文コンテナ `space-y-6 leading-relaxed text-[15px]` に合わせる。

- 基本: font-size 15px（0.9375rem）/ line-height 1.625（`leading-relaxed`）/ ブロック間 margin-top 1.5rem（`space-y-6`）
- h2: `text-2xl`（1.5rem）。セクション区切りは**見出しの下**に薄罫線（`pb-2 border-b border-line/70` 相当）。セクション間隔を保つため margin-top はブロック間より広い 3rem（`mt-12` 相当）。見出し上罫線（border-top）は使わない
- h3: `text-lg`（1.125rem）、罫線なし。margin-top は汎用の 1.5rem
- h4 以下・リスト・blockquote 等はモックに対応要素がないため実装値（`global.css`）に従う

### コードブロック（★E案・ダーク反転で確定）

**ライトモードでもコードブロックだけダーク面にする**（Zenn等と同方式）。コードが際立ち、テーマ間の差が最小になる。

| 部位 | light | dark |
| --- | --- | --- |
| 背景 | #2A241F | #171411 |
| 文字 | #E4DCD1 | `nink` #E4DCD1 |
| 枠線 | #4A4238 | `nline` |
| ファイル名タブ背景/文字 | #332C25 / #9C9186 | `ncard` / `nsub` |

シンタックスハイライトは**両テーマ共通**（★確定: 既成テーマではなく**自作カスタムテーマ（single theme）**で実装する。配色が両テーマ共通のためdual themeは使わない。スコープ割当・実装方式は [`../markdown-pipeline/shiki.md`](../markdown-pipeline/shiki.md)）:

- キーワード（+ HTMLタグ名）: `#F0684A`
- 関数・メソッド・マクロ・シェルコマンド・TOMLキー: `#A9B665`（グレイッシュグリーン）
- 型・名前空間・enum バリアント（`Some`/`Ok` 等）・環境変数: `#7FB5A3`（グレイッシュティール）
- ライフタイム・数値系・`self`/`this`・エスケープ・文字列補間・シェルフラグ・属性名: `#D9B25E`
- 文字列: `#D08A72`
- コメント: 地の文字色 + opacity 60%（実装はalpha付きhex `#E4DCD199`）

> [!info] 6色への拡張（T6-3後の追加確定）
> 当初の確定4色では色数が少なくコードが読みにくいというフィードバックにより、
> 新規2色（グリーン/ティール。暖色背景に馴染むグレイッシュトーン）を追加し金色の適用範囲を拡大した。
> 既存4色の値と割当は不変。実出力比較で承認済み。

```html
<pre class="rounded overflow-x-auto p-4 font-mono text-[13px] leading-relaxed bg-[#2A241F] dark:bg-[#171411] text-[#E4DCD1] dark:text-nink border border-[#4A4238] dark:border-nline"><code>...</code></pre>
```

> [!info] 検討の経緯
> ライト背景 #EBE7DF（紙より濃いベージュ）はくすんで見えるため不採用。5案比較（`code-bg-compare.html`）の結果、E案（ダーク反転）を採用。

### ファイル名タブ（`:main.rs` 記法の変換先）

全幅バーではなく**ファイル名の幅だけのタブ**をコードブロック左上に載せる。

```html
<div>
  <p class="inline-block rounded-t font-mono text-[11px] text-[#9C9186] dark:text-nsub px-3 py-1.5 border border-b-0 border-[#4A4238] dark:border-nline bg-[#332C25] dark:bg-ncard">main.rs</p>
  <pre class="rounded rounded-tl-none ...">（タブと接する左上のみ角丸なし）
</div>
```

### diff表示（★案B・背景tint+マーカー+削除行薄めで確定）

`// [!code ++]` / `// [!code --]` 記法の変換後スタイル。Shikiの`transformerNotationDiff()`が行スパンに`class="line diff add / remove"`、`<pre>`に`has-diff`を付与する（`docs/markdown-pipeline/shiki.md`参照）。コードブロックはE案（両テーマともダーク面）のため、**diffの配色も両テーマ共通**。

| 部位 | 値（light / dark 共通） |
| --- | --- |
| 追加行 背景 | `rgba(155, 184, 110, 0.15)`（success緑 #9BB86E ベース） |
| 追加行 マーカー `+` | `#9BB86E` |
| 削除行 背景 | `rgba(240, 104, 74, 0.13)`（accent赤 #F0684A ベース） |
| 削除行 マーカー `-` | `#F0684A` |
| 削除行 コード文字 | opacity 55%（マーカーは薄くしない） |

- 行のtintを`<pre>`の端まで伸ばすため、**左右paddingは`<pre>`ではなく行スパン側に持たせる**（`pre`は上下のみ、`.line`を`display: inline-block; width: 100%`にして左右paddingを持つ）
- マーカーはCSS疑似要素（`::before`）で表示するため、コピー時に混入しない
- ガター（マーカー用の左padding拡張）は`pre.has-diff`のみに適用し、diffのないコードブロックの字下げは変えない

```css
/* 全コードブロック共通: 左右paddingは行側に持つ */
.astro-code { padding: 1rem 0; }
.astro-code .line { display: inline-block; width: 100%; padding: 0 1rem; }

/* diffブロックのみガターを確保 */
.has-diff .line { padding-left: 2.25rem; position: relative; }
.has-diff .line.diff::before { position: absolute; left: 0.9rem; font-weight: 600; }
.line.diff.add    { background: rgba(155, 184, 110, 0.15); }
.line.diff.add::before    { content: '+'; color: #9BB86E; }
.line.diff.remove { background: rgba(240, 104, 74, 0.13); }
.line.diff.remove::before { content: '-'; color: #F0684A; }
/* 削除行の文字を薄くする（Shikiは全トークンをspanで包むため、直下spanへの指定でOK） */
.line.diff.remove > span { opacity: 0.55; }
```

> [!info] 補足
> コメントのopacity 60%と重なる削除行内コメントは約33%まで薄くなるが、削除行として許容する。モック（`code-diff-compare.html`）では素のテキストノードがあるため`.lc`ラッパーで代用しているが、実装ではShikiのトークンspanをそのまま使う。ファイル名タブとの併用表示もモックで確認済み。

### インラインコード

ブロックとは異なり**ライトでは明るい面**。文字色はアクセント連動。

```html
<code class="font-mono text-[13px] px-1.5 py-0.5 bg-[#EBE7DF] dark:bg-[#171411] text-accent dark:text-naccent rounded border border-line/70 dark:border-nline/70">&mut</code>
```

> [!info] 検討の経緯
> ダーク面（E案準拠）→ 文中で主張が強い。文字 #F0684A 固定 → ライトでコントラスト不足（約3:1）。最終的に bg=旧A案の #EBE7DF、文字=`text-accent dark:text-naccent`（ライト #C63D22 / ダーク #F0684A）で確定。

### テーブル（★案C・カード面フレームで確定）

本文のGFMテーブルは、rounded 4px + line枠 + card面のラッパ `<div class="table-wrap">` に載せる。ラッパは `overflow-x: auto` の横スクロールコンテナを兼ねる（[`../spec/pages.md`](../spec/pages.md) R-22。ラッパは `plugins/table-wrap.mjs` が付与し、実装方式は [`../markdown-pipeline/table-wrap.md`](../markdown-pipeline/table-wrap.md)）。**縦罫線なし・水平罫線のみ**で、ヘッダー行だけ一段濃い面にする。

| 部位 | light | dark |
| --- | --- | --- |
| ラッパ枠線 | `line` | `nline` |
| ラッパ背景 | `card` | `ncard` |
| ヘッダー背景 | `head` #EBE7DF（インラインコードbgと同色） | `nhead` #1E1B18（= npaper） |
| ヘッダー下罫線 | `line` | `nline` |
| 行区切り | `line` 70% | `nline` 70% |

実装（`global.css`。ヘッダー背景はトークン `--color-head` を新設）:

```css
.prose .table-wrap {
  border: 1px solid var(--color-line);
  border-radius: 4px;
  background: var(--color-card);
  overflow: hidden;
  overflow-x: auto;
}
.prose table { width: 100%; border-collapse: collapse; font-size: 0.9rem; line-height: 1.6; }
.prose :is(th, td) { padding: 0.6rem 1rem; text-align: left; vertical-align: top; white-space: nowrap; /* セルは自動折り返ししない（改行は執筆者が <br> で明示）。幅超過はラッパの横スクロールで吸収 */ }
.prose th { font-family: var(--font-display); font-weight: 700; font-size: 0.85rem; color: var(--color-strong); }
.prose thead th { background: var(--color-head); border-bottom: 1px solid var(--color-line); }
.prose tbody td { border-bottom: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent); }
.prose tbody tr:last-child td { border-bottom: none; }
```

> [!info] 検討の経緯
> 旧実装（全セル1px罫線グリッド + th にcard面）は表計算ソフト的で台帳風の文法から浮いていた。`table-compare.html` で「台帳ミニマル（案A）/ monoヘッダー（案B）/ カード面フレーム（案C）/ ヘッダー帯・ダーク反転（案D）+ ゼブラオプション」を比較し、**案C・ゼブラなし**で確定（2026-07）。

### 辞書リンク（wikilink変換後の `<a>`）

通常リンクと区別する特別デザイン。本アイコン（CSS mask）+ アクセント色 + 点線下線、ホバーで実線。

```css
.dict-link {
  color: #C63D22;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  font-weight: 500;
}
.dict-link::before {
  content: '';
  display: inline-block;
  width: 0.75em; height: 0.75em;
  margin-right: 0.25em; vertical-align: -0.05em;
  background-color: currentColor;
  mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22H20v-2.5H6.5a1 1 0 0 1 0-2H20"/></svg>') center / contain no-repeat;
}
.dict-link:hover { text-decoration-style: solid; }
html.dark .dict-link { color: #F0684A; }
```

挙動（デスクトップ）:

- ホバー: プレビュー小窓（`w-96 max-h-72 overflow-y-auto rounded border bg-card shadow-xl p-4`、fixed配置。幅は右カラムの最大幅=384pxに揃える）に辞書の内容（後述の「ペイン/プレビューの内容表示」の compact 形）を表示。リンク下に出し、画面下端にかかる場合は上に反転。プレビュー内の辞書リンクはさらにプレビューしない
- クリック: 画面遷移せず右のサイドペインに表示（モバイルは辞書ボトムシートを開く）

### 辞書サイドペイン（詳細ページ右）

- 枠: `rounded border bg-card`、ヘッダー行に `// dictionary pane` + 戻る/進むボタン（`w-7 h-7 rounded border`、`disabled:opacity-40`）
- 本文: `p-5 max-h-[60vh] overflow-y-auto`
- 2状態: デフォルト（本アイコン + 「辞書リンクを押すと、ここに内容が表示されます。」）/ 選択時（後述の「ペイン/プレビューの内容表示」）
- 履歴はペイン単体でJS配列管理（ページ遷移でリセット）。ペイン内の辞書リンククリックで内容を差し替え

### ペイン/プレビューの内容表示（★dict-detail.htmlベース・種別ラベルのみ実装判断で変更）

サイドペイン（選択時）とホバープレビューは同一構成。プレビューは compact 形（タイトル小さめ・フッターリンクなし）。

- 種別ラベル: **KindBadge の辞書バリアント（金色の角型バッジ）**。モックのプレーンな mono「辞書」表記は不採用（一覧・逆リンクのバッジと表記を揃える）
- タイトル: `font-display font-bold text-strong mb-2`。ペイン `text-base` / プレビュー `text-sm`
- タグ: 小チップ `font-mono text-[10px] px-1.5 py-0.5 rounded border border-line text-sub`、コンテナ `mb-3 flex flex-wrap gap-1.5`
- 本文: embed 断片の `.prose` をコンパクト表示（13px / line-height 1.625 / ブロック間 0.75rem。モックの `space-y-3 text-[13px] leading-relaxed` 相当）
- フッターリンク（ペインのみ）: `inline-flex items-center gap-1.5 mt-4 font-display font-bold text-xs text-accent hover:underline` +「辞書ページを開く」+ 右矢印SVG（11x11・stroke-width 2.5）

### 目次（詳細ページ左）

`// toc` + 縦罫線リスト。現在地は `border-l-2 border-accent` + `text-strong`、それ以外は `text-sub` + ホバーでアクセント。h3はインデント（`pl-6`）。

### モバイル・中間幅（目次: xl未満 / 辞書: lg未満）

- 右下に固定フローティングボタン「目次」「辞書」（`w-12 h-12 rounded border bg-card shadow-lg`、辞書はアクセント色）。ボタンコンテナは `xl:hidden`、辞書ボタンはさらに `lg:hidden` — つまり `lg`〜`xl` 未満（2カラム帯）では目次ボタンのみ表示される
- 押下で下からボトムシート（`fixed inset-0` の半透明バックドロップ + `rounded-t-md` のシート）。目次シートは `xl:hidden`、辞書シートは `lg:hidden`（開いたまま画面を広げても自動で隠れる）。`lg` 未満では辞書リンククリック時も辞書シートが開く（`lg` 以上ではサイドペインに表示）
- 「使用されている辞書一覧」は `lg` 未満で本文下部に移動（`lg:hidden` セクション）

### 本トップ（★book-top-sidebar.htmlで確定）

種別バッジは表示しない（eyebrow `// book` が種別を示す）。

- **ヒーロー**: eyebrow `// book` → `grid gap-6 sm:gap-8 sm:grid-cols-[11rem_1fr]` で左=縦長の書影（`aspect-[600/850] object-cover rounded border border-line`、モバイルは `w-40` で縦積み）、右=タイトル（h1）・description（sub色）・タグチップ・`created / updated` 日付（mono）。下端 `border-b` で本文と区切る
- **章目次サイドバー（lg以上）**: `sticky top-24`。eyebrow `// chapters` → 本タイトル（`font-display font-bold text-sm`、本トップへのリンク、ホバーでアクセント色）→ 台帳リスト（`border-t` 起点、各行 = mono連番 `01` + 章タイトル `text-[13px]`、行ホバーで `bg-card` + タイトルがアクセント色）。「目次」の見出し文字は置かない（eyebrowと重複するため）
- **モバイル（lg未満）**: サイドバーは非表示にし、本文の後ろに章目次セクション（`// chapters` + 見出し「目次」+ `N chapters` 件数 + 台帳リスト行）を表示

### 章詳細（★book-chapter.htmlで確定）

- **左サイドバー＝複合目次**（`sticky top-24`）: 本トップのサイドバーと同じ「`// chapters` eyebrow → 本タイトルリンク → 章の台帳リスト」に、**現在章だけアクセント色（連番・タイトルとも）で強調しリンクなし（`aria-current="page"`）、その直下に章本文の見出し目次をネスト**する。ネスト部は辞書詳細の目次と同じ文法（`ml-[1.75rem] border-l` の縦罫線リスト、現在位置 `border-l-2 border-accent` + `text-strong`、h3は `pl-6` インデント）
- **本文ヘッダー**: eyebrow `// book chapter` → mono補助行「`NN / 本タイトル`」→ 章タイトル（h1）→ `created / updated` 日付。章frontmatterに画像はないためヒーロー画像なし、タグも表示しない
- **前後章ナビ**（本文末尾、pages R-16）: `grid sm:grid-cols-2 gap-3` のカード型リンク（`rounded border bg-card px-4 py-3`、ホバーで枠アクセント色）。mono補助行 `← prev / NN` / `next / NN →` + 章タイトル。先頭章はprev側・最終章はnext側を空にする
- **右カラム・モバイル**: 辞書詳細と同一（辞書ペイン+使用辞書一覧 / フローティングボタン+ボトムシート）。モバイルの目次ボトムシートには複合目次をそのまま表示する

### タグ一覧（★tags-index.htmlで確定）

並び順・表示対象は [`../spec/pages.md`](../spec/pages.md) R-18 に従う。

- **ページヘッダー**: 辞書一覧と同じ文法。eyebrow `// tags` → 見出し「タグ.」+ mono補助行「`N tags / count desc`」→ 説明文（sub色・`max-w-lg`）。下端 `border-b` でチップ群と区切る
- **タグチップ（ナビゲーション用）**: `flex flex-wrap gap-2.5` で全タグを省略なしに敷き詰める。チップは `<a>` で `font-mono text-xs px-3 py-1.5 rounded border bg-card` + `#タグ名` + 件数（`<span class="opacity-60">N</span>`）、ホバーで文字・枠がアクセント色。**絞込UIのタグチップ（`text-[11px] px-2.5 py-1`・上位12個+展開）とは別物**: ページ遷移用のためひと回り大きく、展開ボタンなし・選択状態なし

### タグ詳細（★tags-detail.htmlで確定）

並び順・表示対象・章の扱いは [`../spec/pages.md`](../spec/pages.md) R-19 に従う。

- **戻るボタン**: ページ先頭（eyebrowの上）に「← タグ一覧」。ボタン型（`inline-flex items-center gap-2 h-9 px-3.5 rounded border bg-card font-display font-bold text-xs`、左矢印SVG付き、ホバーで文字・枠がアクセント色）
- **ページヘッダー**: eyebrow `// tag` → 見出し `#タグ名`（h1。`#` のみ `text-accent` + `mr-1.5` で少し間隔を空ける）+ mono補助行「`N entries / created_at desc`」→ 説明文
- **ページ一覧**: トップ新着と同じ台帳リスト行（日付mono + 種別バッジ + タイトルdisplay太字truncate + 右端にそのページの他タグ）。バッジは `w-[4.5rem] text-center` で幅を揃える。右端のタグは**当該タグを除いた**ものを2個程度、`sm` 未満では非表示
- **章の行**: タイトルを「本タイトル `›` 章タイトル」で併記し、区切りの `›` のみ `text-sub` に落とす。バッジは「本」

基本構造は全種別共通。左ボーダー・eyebrow・アイコンの色だけを種別で変え、背景は全種別 card 面で統一する。

```html
<div class="rounded border-l-2 border-{種別色} bg-card dark:bg-ncard px-5 py-4 text-sm space-y-1">
  <p class="flex items-center gap-1.5 font-mono text-[11px] text-{種別色}">
    //
    <svg width="13" height="13">（種別アイコン、stroke系・currentColor。通常のみアイコンなし）</svg>
    message（種別名 or タイトル）
  </p>
  <p>本文...</p>
</div>
```

種別カラー（light / dark）とアイコン:

| 種別 | light | dark | アイコン |
| --- | --- | --- | --- |
| message（通常） | `sub` #847A6E | `nsub` #9C9186 | なし |
| info | #3E6B8C | #86ABC9 | ℹ丸 |
| tip | #8F6812 | #D9B25E | 電球 |
| question | #7A5A8C | #B99BD1 | ？丸 |
| success | #5C7A3B | #9BB86E | チェック丸 |
| warning | #B45A1C | #E09A5A | 三角！ |
| danger | `accent` #C63D22 | `naccent` #F0684A | 八角形！ |

- **通常メッセージはニュートラル（sub色）**。dict-detail.html時点のaccent色案は、dangerとの衝突を避けるため不採用
- **アイコンSVGのパスデータ（確定）**: lucide系のstrokeアイコン。`viewBox="0 0 24 24"` / `fill="none"` / `stroke-width="2"` / `stroke-linecap="round"` / `stroke-linejoin="round"`、13x13表示。実装はwikilinkアイコンと同じCSS mask方式（`background-color: currentColor` で種別色に自動追従）
  - info: `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`
  - tip: `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>`
  - question: `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>`
  - success: `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`
  - warning: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>`
  - danger: `<path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/>`
- **タイトル指定（`:::message[タイトル]{type}`）はeyebrow置換方式**: eyebrowの種別名をタイトルに差し替えて `// タイトルテキスト` と表示する。行数は増やさず、種別はアイコンと色で判別する。タイトルなしの場合はeyebrow = 種別名（`// info` 等）のデフォルト表示
- **card面の上に置かれる場合**（`::::details`内・辞書サイドペイン/モバイルシート内・ホバープレビュー内）は面の重なりを避けるため、メッセージ背景を `bg-paper dark:bg-npaper` に落とす
  - このときインラインコードの背景（`head` 系）が paper と近接して埋没するため、paper面上のmessage内に限りインラインコード背景を一段深い light `#E2DCD1` / dark `#110E0B` に調整する（文字色・枠線は通常のインラインコードと共通）

### `:::details` の変換後スタイル

実際の出力はコンテンツのラッパ`<div>`を持たず、`<summary>`の後に本文ブロックが直接並ぶ（パイプラインの制約。`docs/markdown-pipeline/directives.md`「入出力例」参照）。コンテンツの余白はラッパではなく**`summary`以外の直下子要素それぞれへのpadding**で表現する（枠・背景を持つボックス要素は例外的にmarginを使う。後述）。

```html
<details><!-- rounded / border line / bg-card 相当。シェブロンはsummaryの::beforeで描画 -->
  <summary>タイトル</summary><!-- cursor-pointer / px-4 py-2.5 / font-display bold sm。open時に下罫線 -->
  <p>本文...</p><!-- 直下子要素に padding-inline:1rem、先頭に padding-top、末尾に padding-bottom -->
</details>
```

```css
details > summary { list-style: none; }
details > summary::-webkit-details-marker { display: none; }
details[open] > summary::before { transform: rotate(45deg); } /* シェブロン回転 */
```

- **枠・背景を持つボックス直下子**（ネストしたdetails / message / コードブロック（ファイル名付きのラッパー含む） / リンクカード / blockquote / テーブル（`.table-wrap` ラッパ））: 直下子要素へのpaddingはボックスの内部パディングになるだけで周囲に余白を作らないため、**paddingではなくmarginで余白を表現する**（margin-inline: 1rem、先頭margin-top / 末尾margin-bottomも同様）。ボックス自身の内部パディング（messageの1.25rem等）は単体配置時と同じまま保つ。`figure`は`width: fit-content; margin-inline: auto`の中央寄せがpadding方式で成立しているため対象外
- **直下子のリスト（`ul` / `ol`）**は padding-inline: 1rem の対象から除外し、`padding-left: 2.5rem`（内側余白1rem + リストインデント1.5rem）+ `padding-right: 1rem` とする（一律の padding-inline: 1rem ではリスト本来のインデントが上書きされて消えるため）。チェックリスト（`ul.contains-task-list`）はインデントが0.25remなので `padding-left: 1.25rem`
- **ネストしたdetailsの背景**はネスト時のメッセージと同じく `bg-paper dark:bg-npaper` に落とす（card面の重なり回避）

### `:::figure` の変換後スタイル

- `<figure>`は`width: fit-content; max-width: 100%`で**画像幅に収縮**させ、`margin-inline: auto`で本文幅の中央に置く。これによりキャプションの中央寄せも**本文全幅ではなく画像幅が基準**になる
- `<figcaption>`は`width: 0; min-width: 100%`で、長いキャプションがfigureのintrinsic幅（=画像幅）を広げずに画像幅で折り返すようにする。sub色・0.8rem・中央寄せ

### リンクカード（ベアURLのOGPカード）

変換の仕組みは [`docs/markdown-pipeline/link-card.md`](../markdown-pipeline/link-card.md) 参照。ここでは見た目の確定仕様のみ。

- **カード高さは可変・最大 8.75rem**: テキスト量（タイトル最大2行・説明文最大2行のクランプ）に応じて縮む。ホスト名は下端寄せ
- **画像はOGP標準比率 1.91:1 固定**: カード右端に上下・右フラッシュの**絶対配置**（`position: absolute; height: 100%; aspect-ratio: 1.91 / 1`）で、カード高さに追従してサイズが変わっても比率は常に正確。フロー内に置くと画像の固有サイズがカード高さを max-height まで押し上げてしまうため絶対配置とし、本文側は `:has(.link-card__image)` で `margin-right: 45%` を予約して重なりを防ぐ（画像なしカードは全幅を本文に使う）
- **狭幅時**は画像に `max-width: 45%` を適用し、本文の可読性を比率維持より優先（はみ出す分は `object-fit: cover` でトリミング）
- **フォールバックカード**（OGP取得失敗時のURLのみ表示）は padding のみの自然な高さ

### mermaid図（★枠なしで確定）

ビルド時SVG化の仕組みは [`docs/markdown-pipeline/mermaid.md`](../markdown-pipeline/mermaid.md) 参照。ここでは見た目の確定仕様のみ。

- **外枠なし**: カード枠（border・背景・padding）は付けず、紙背景（paper）の上に図を直接置く。横幅超過時は `figure.mermaid-diagram` 自体が横スクロールコンテナになる（`overflow-x: auto`）
- **横幅は「自然幅を上限にコンテナ幅までフィット」**: figureは全幅（`.prose figure` の fit-content を打ち消す。SVGは `width="100%"` で固有幅を持たず、fit-content 下では置換要素デフォルトの300pxに潰れるため）。SVGは `width: 100%` + ビルド時に焼き込まれるインライン `max-width`（自然幅）により、自然幅が狭い図（小さなflowchart等）はそのまま・広い図（sequence等）は本文カラム幅に収まるよう縮小される
- **フォント**: 本文と同じ **Zen Maru Gothic / 15px**。ビルド用ChromiumにGoogle FontsのCSSを注入し、テキスト幅の計測もこのフォントで行う（ノード箱がラベル幅に正しく追従する）
- **配色**: mermaid `theme: "base"` + `themeVariables` でサイトトークンにマッピングし、light/darkの2回レンダにそれぞれのhex値を焼き込む

| 図中の役割 | トークン（light / dark） |
| --- | --- |
| 図の背景・エッジラベルの抜き | paper |
| ノード / actor の塗り | card |
| テキスト | ink |
| ノード枠線・note枠線 | line |
| エッジ・矢印・ライフライン | sub |
| subgraph・副次塗り・note背景 | head（light）/ card（dark） |
| タイトル | strong |

## 意思決定の履歴（要約）

1. トップページを3案（warm / sharp / balance）で比較 → **sharp系を採用**。sharp派生2案（サイドバー型・カタログ型）も比較したが元のtop-b-sharpで確定
2. ヘッダーは「ロゴ・検索・テーマ切替」の3点のみに簡素化。ボーダーは細い薄罫線に
3. プロフィールはトップから削除し、SNS/GitHubアイコンのみに（プロフィールページ自体も後日廃止）
4. 全体に4pxの角丸を追加（罫線は直線のまま）
5. コードブロックのファイル名は全幅バー → ファイル名幅のタブ型に変更
6. ライトモードのコード背景を5案比較 → **E案（ダーク反転）を採用**。インラインコードのみ明るい面 + アクセント色文字の折衷に
7. `:::message`の6種別カラーは慣例色ではなく**暖色パレットに寄せた配色**、ラベルはeyebrow + アイコンで確定。通常メッセージはaccent色 → ニュートラル（sub色）に変更（dangerに赤を譲る）。タイトル指定はeyebrow置換方式を採用（タイトル行追加案は不採用）
8. diff表示は3案比較（A: tintのみ / B: tint+マーカー / C: tint+左ボーダー）→ **案B（背景tint + `+`/`-`マーカー）+ 削除行の文字をopacity 55%に薄める**で確定。配色は追加=success緑・削除=accent赤の両テーマ共通
9. 本トップは縦積み1カラム案（`book-top.html`）と章目次サイドバー案を比較 → **サイドバー案（Zennの本風）を採用**。書影は縦長（実際の本の比率）、タイトル上の種別バッジは削除、サイドバー最上部は「目次」見出しではなく本タイトルのリンクに
10. 章詳細の左目次は、本トップのサイドバーに章本文の見出し目次を組み合わせた**複合目次**を採用（現在章をアクセント色で強調し、配下に見出しをネスト。本全体の位置と章内の位置を1つの目次で示す）
11. タグ一覧は**件数順チップクラウド**、タグ詳細は**種別混在・`created_at` 降順の台帳リスト**を採用（名前順台帳案・種別ごとのセクション分け案は不採用）。章は「本タイトル › 章タイトル」の併記で表示。タグ詳細の戻る導線はテキストリンク → ボタン型に変更して確定
12. テーブルは旧実装（全セル罫線グリッド）が淡白との判断から4案 + ゼブラオプションを比較（`table-compare.html`）→ **案C（カード面フレーム）・ゼブラなし**を採用。縦罫線を消して水平罫線のみとし、ヘッダー背景はインラインコードbg（light）/ npaper（dark）の一段濃い面に

## 未確定・本実装時の課題

なし（P6 T6-3ですべて確定済み。コードフォントは「タイポグラフィ」、Shikiテーマは「コードブロック」参照）。
