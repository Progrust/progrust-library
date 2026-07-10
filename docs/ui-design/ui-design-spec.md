# UIデザイン確定仕様書

claude designでのモック検討で確定したデザイン仕様。本実装（Astro + Tailwind）時はこの資料とモック本体を参照する。

- claude designプロジェクト: [Progrust Library UI](https://claude.ai/design/p/2c5de680-9b98-45ee-a6ab-39dfc30a2230)
- 確定モック
  - トップページ: `top-b-sharp.html`
  - 辞書一覧: `dict-index.html`
  - 辞書詳細: `dict-detail.html`（コードブロック・辞書リンク・サイドペインの確定仕様を含む）
  - `:::message`種別: `message-variants.html`（通常+6種別・タイトル指定の確定仕様。タイトル表示の不採用案（案2: eyebrow維持+タイトル行）も比較用に残置）
  - diff表示: `code-diff-compare.html`（案B: 背景tint+マーカー、削除行の文字薄めで確定。不採用の案A/Cも比較用に残置）
  - プロフィール: `profile.html`（アバター+自己紹介+SNSボタン群、「このサイトについて」の3形式カード）
  - 本トップ: `book-top-sidebar.html`（章目次サイドバー型。ヒーロー・章目次の確定仕様を含む）
  - 章詳細: `book-chapter.html`（複合目次サイドバー・前後章ナビの確定仕様を含む）
  - タグ一覧: `tags-index.html`（件数順チップクラウド）
  - タグ詳細: `tags-detail.html`（種別混在の台帳リスト・戻るボタン。一覧データはバッジ全種を見せるための架空混じり）
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
| 見出し・強調文字 | `strong` #29241F | `nstrong` #F1EAE1 |
| 本文文字 | `ink` #3A342D | `nink` #E4DCD1 |
| 補助文字 | `sub` #847A6E | `nsub` #9C9186 |
| アクセント | `accent` #C63D22 | `naccent` #F0684A |

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
| `font-mono` | JetBrains Mono | 400/600 | 日付、タグ、eyebrow、件数、コード |

Google Fonts読込（モック時点。コード用の全角対応等幅は本実装で別途選定の可能性あり）:

```html
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Zen+Maru+Gothic:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
```

- サイトロゴは `Progrust Library` + アクセント色のピリオド（`<span class="text-accent dark:text-naccent">.</span>`）。大見出しの末尾ピリオドも同じ文法
- 日本語monoのフォールバックとして `"Zen Kaku Gothic New"` をmonoスタックに含める

## 共通ルール

- **角丸**: 面のある要素（カード・ボタン・入力・バッジ・チップ・コードブロック・ペイン・ポップアップ）に4px（Tailwind `rounded`）。モバイルのボトムシートは上側のみ `rounded-t-md`。**罫線（ヘッダー/フッターの境界・リスト行区切り・ナビの仕切り）は直線のまま**
- **罫線**: 構造の境界は `border-line/70 dark:border-nline/70`（薄め）、コンテンツの枠は `border-line dark:border-nline`
- **ホバー**: リンク文字・枠が `accent`/`naccent` に変わる。リスト行は `hover:bg-card dark:hover:bg-ncard`。`transition-colors motion-reduce:transition-none` を併記
- **eyebrow**: `<p class="font-mono text-xs text-accent dark:text-naccent">// dictionary</p>` の形式で統一（`// toc`、`// dictionary pane`、`// linked dictionaries` など）

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
| トップ / 辞書一覧 / タグ一覧 / タグ詳細 / プロフィール | `max-w-6xl px-4 sm:px-8` | 1カラム |
| 辞書詳細（記事も同様の想定） | `max-w-7xl px-4 sm:px-8` | `lg:grid lg:grid-cols-[200px_minmax(0,1fr)_320px] lg:gap-10`（左=目次 / 中央=本文 / 右=使用辞書+サイドペイン） |
| 章詳細 | `max-w-7xl px-4 sm:px-8` | 辞書詳細と同じ3カラム。ただし左カラムは `220px` で**複合目次**（章リスト+現在章の本文見出し）に差し替え |
| 本トップ | `max-w-5xl px-4 sm:px-8` | `lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12`（左=章目次サイドバー / 右=ヒーロー+本文、本文列は `max-w-3xl`） |

- 辞書一覧のカードグリッド: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- 両サイドバーは `sticky top-24`、`lg` 未満では非表示にしてフローティングボタン（後述）に切替
- 中央本文は `min-w-0`（truncate用）+ モバイル時 `max-w-2xl mx-auto`

## コンポーネント仕様

### ヘッダー（全ページ共通・スクロール固定）

ロゴ + 検索ボックス + テーマ切替の3点のみ。ナビリンクは置かない。

```html
<header class="sticky top-0 z-30 bg-paper/95 dark:bg-npaper/95 backdrop-blur border-b border-line/70 dark:border-nline/70">
  <div class="mx-auto max-w-6xl px-4 sm:px-8 h-14 flex items-center gap-6">
    <!-- ロゴ / 検索(input h-9 rounded border bg-card) / テーマ切替(w-9 h-9 rounded border bg-card) -->
```

### フッター

コピーライト（mono）+ プロフィール/GitHub/X/RSSのテキストリンク。`border-t border-line/70`。

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

### 辞書カード（一覧）

タイトル + タグのみ（概要なし）。`data-title` / `data-tags`（`|` 区切り）を持たせ、絞込JSで参照する。

```html
<a class="dict-card group flex flex-col gap-3 p-5 bg-card dark:bg-ncard rounded border border-line dark:border-nline hover:border-accent dark:hover:border-naccent transition-colors motion-reduce:transition-none" data-title="..." data-tags="タグA|タグB">
```

### タグチップ（絞込UI）

`font-mono text-[11px] px-2.5 py-1 rounded border bg-card` + `#タグ名` + 出現件数。選択時は `border-accent dark:border-naccent text-accent dark:text-naccent` をclassList.toggleで付与し `aria-pressed` を更新（トークン定義順でaccentがline/subより後のため上書きが効く）。タグはAND、キーワードはタイトル+タグの部分一致。件数表示は `N / 総数 entries`（ヒット数 N を `text-strong font-semibold` で強調）、0件時はメッセージ表示。タグが多い場合は上位12個 + 「+ N tags」（アクセント色テキストのボタン）で展開。

絞込JS（P5・`list-filter.ts`）が参照する `data-*` 属性コントラクト（SSoT。カード側 `data-title` / `data-tags`（`|`区切り）と対で使う）:

| 属性 | 付与先 | 用途 |
| --- | --- | --- |
| `data-list-filter` / `data-total` | 絞込UIのルート | 絞込対象ブロックの目印 / 総件数 |
| `data-filter-keyword` | キーワード入力 | キーワード取得元 |
| `data-filter-count` / `data-filter-hits` | 件数表示 `<p>` / ヒット数 `<span>` | ヒット数の更新先 |
| `data-filter-tag`（値=タグ名） | タグチップ | AND絞込の選択状態管理 |
| `data-filter-more` | 「+ N tags」ボタン | 残りタグの展開トリガ |

### コードブロック（★E案・ダーク反転で確定）

**ライトモードでもコードブロックだけダーク面にする**（Zenn等と同方式）。コードが際立ち、テーマ間の差が最小になる。

| 部位 | light | dark |
| --- | --- | --- |
| 背景 | #2A241F | #171411 |
| 文字 | #E4DCD1 | `nink` #E4DCD1 |
| 枠線 | #4A4238 | `nline` |
| ファイル名タブ背景/文字 | #332C25 / #9C9186 | `ncard` / `nsub` |

シンタックスハイライトは**両テーマ共通**（Shikiのdual themeでも同系の配色になるテーマを選ぶか、カスタムテーマを作る）:

- キーワード: `#F0684A`
- ライフタイム・数値系: `#D9B25E`
- 文字列: `#D08A72`
- コメント: 地の文字色 + opacity 60%

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

- ホバー: プレビュー小窓（`w-80 max-h-72 overflow-y-auto rounded border bg-card shadow-xl p-4`、fixed配置）に辞書の全文を表示。リンク下に出し、画面下端にかかる場合は上に反転。プレビュー内の辞書リンクはさらにプレビューしない
- クリック: 画面遷移せず右のサイドペインに表示（モバイルは辞書ボトムシートを開く）

### 辞書サイドペイン（詳細ページ右）

- 枠: `rounded border bg-card`、ヘッダー行に `// dictionary pane` + 戻る/進むボタン（`w-7 h-7 rounded border`、`disabled:opacity-40`）
- 本文: `p-5 max-h-[60vh] overflow-y-auto`
- 2状態: デフォルト（本アイコン + 「辞書リンクを押すと、ここに内容が表示されます。」）/ 選択時（種別ラベル・タイトル・タグ・本文・「辞書ページを開く →」リンク）
- 履歴はペイン単体でJS配列管理（ページ遷移でリセット）。ペイン内の辞書リンククリックで内容を差し替え

### 目次（詳細ページ左）

`// toc` + 縦罫線リスト。現在地は `border-l-2 border-accent` + `text-strong`、それ以外は `text-sub` + ホバーでアクセント。h3はインデント（`pl-6`）。

### モバイル（lg未満）

- 右下に固定フローティングボタン「目次」「辞書」（`w-12 h-12 rounded border bg-card shadow-lg`、辞書はアクセント色）
- 押下で下からボトムシート（`fixed inset-0` の半透明バックドロップ + `rounded-t-md` のシート）。辞書リンククリック時も辞書シートが開く
- 「使用されている辞書一覧」は本文下部に移動（`lg:hidden` セクション）

### 本トップ（★book-top-sidebar.htmlで確定）

種別バッジは表示しない（eyebrow `// book` が種別を示す）。

- **ヒーロー**: eyebrow `// book` → `grid gap-6 sm:gap-8 sm:grid-cols-[11rem_1fr]` で左=縦長の書影（`aspect-[600/850] object-cover rounded border border-line`、モバイルは `w-40` で縦積み）、右=タイトル（h1）・description（sub色）・タグチップ・`created / updated` 日付（mono）。下端 `border-b` で本文と区切る
- **章目次サイドバー（lg以上）**: `sticky top-24`。eyebrow `// chapters` → 本タイトル（`font-display font-bold text-sm`、本トップへのリンク、ホバーでアクセント色）→ 台帳リスト（`border-t` 起点、各行 = mono連番 `01` + 章タイトル `text-[13px]`、行ホバーで `bg-card` + タイトルがアクセント色）。「目次」の見出し文字は置かない（eyebrowと重複するため）
- **モバイル（lg未満）**: サイドバーは非表示にし、本文の後ろに章目次セクション（`// chapters` + 見出し「目次」+ `N chapters` 件数 + 台帳リスト行）を表示

### 章詳細（★book-chapter.htmlで確定）

- **左サイドバー＝複合目次**（`sticky top-24`）: 本トップのサイドバーと同じ「`// chapters` eyebrow → 本タイトルリンク → 章の台帳リスト」に、**現在章だけアクセント色（連番・タイトルとも）で強調しリンクなし（`aria-current="page"`）、その直下に章本文の見出し目次をネスト**する。ネスト部は辞書詳細の目次と同じ文法（`ml-[1.75rem] border-l` の縦罫線リスト、現在位置 `border-l-2 border-accent` + `text-strong`、h3は `pl-6` インデント）
- **本文ヘッダー**: eyebrow `// book chapter` → mono補助行「`NN / 本タイトル`」→ 章タイトル（h1）→ `created / updated` 日付。章frontmatterに画像はないためヒーロー画像なし、タグも表示しない
- **前後章ナビ**（本文末尾、R-16）: `grid sm:grid-cols-2 gap-3` のカード型リンク（`rounded border bg-card px-4 py-3`、ホバーで枠アクセント色）。mono補助行 `← prev / NN` / `next / NN →` + 章タイトル。先頭章はprev側・最終章はnext側を空にする
- **右カラム・モバイル**: 辞書詳細と同一（使用辞書一覧+辞書ペイン / フローティングボタン+ボトムシート）。モバイルの目次ボトムシートには複合目次をそのまま表示する

### タグ一覧（★tags-index.htmlで確定）

並び順・表示対象は [`../spec/pages.md`](../spec/pages.md) R-18 に従う。

- **ページヘッダー**: 辞書一覧と同じ文法。eyebrow `// tags` → 見出し「タグ.」+ mono補助行「`N tags / count desc`」→ 説明文（sub色・`max-w-lg`）。下端 `border-b` でチップ群と区切る
- **タグチップ（ナビゲーション用）**: `flex flex-wrap gap-2.5` で全タグを省略なしに敷き詰める。チップは `<a>` で `font-mono text-xs px-3 py-1.5 rounded border bg-card` + `#タグ名` + 件数（`<span class="opacity-60">N</span>`）、ホバーで文字・枠がアクセント色。**絞込UIのタグチップ（`text-[11px] px-2.5 py-1`・上位12個+展開）とは別物**: ページ遷移用のためひと回り大きく、展開ボタンなし・選択状態なし

### タグ詳細（★tags-detail.htmlで確定）

並び順・表示対象・章の扱いは [`../spec/pages.md`](../spec/pages.md) R-19 に従う。

- **戻るボタン**: ページ先頭（eyebrowの上）に「← タグ一覧」。トップのプロフィールボタンと同じボタン型（`inline-flex items-center gap-2 h-9 px-3.5 rounded border bg-card font-display font-bold text-xs`、左矢印SVG付き、ホバーで文字・枠がアクセント色）
- **ページヘッダー**: eyebrow `// tag` → 見出し `#タグ名`（h1。`#` のみ `text-accent` + `mr-1.5` で少し間隔を空ける）+ mono補助行「`N entries / created_at desc`」→ 説明文
- **ページ一覧**: トップ新着と同じ台帳リスト行（日付mono + 種別バッジ + タイトルdisplay太字truncate + 右端にそのページの他タグ）。バッジは `w-[4.5rem] text-center` で幅を揃える。右端のタグは**当該タグを除いた**ものを2個程度、`sm` 未満では非表示
- **章の行**: タイトルを「本タイトル `›` 章タイトル」で併記し、区切りの `›` のみ `text-sub` に落とす。バッジは「本」

基本構造は全種別共通。左ボーダー・eyebrow・アイコンの色だけを種別で変え、背景は全種別 card 面で統一する。

```html
<div class="rounded border-l-2 border-{種別色} bg-card dark:bg-ncard px-5 py-4 text-sm space-y-1">
  <p class="flex items-center gap-1.5 font-mono text-[11px] text-{種別色}">
    <svg width="13" height="13">（種別アイコン、stroke系・currentColor。通常のみアイコンなし）</svg>
    // message（種別名 or タイトル）
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

- **通常メッセージはニュートラル（sub色）**。dict-detail.html時点のaccent色案は、dangerとの衝突を避けるため不採用（アイコンSVGのパスはmessage-variants.html参照）
- **タイトル指定（`:::message[タイトル]{type}`）はeyebrow置換方式**: eyebrowの種別名をタイトルに差し替えて `// タイトルテキスト` と表示する。行数は増やさず、種別はアイコンと色で判別する。タイトルなしの場合はeyebrow = 種別名（`// info` 等）のデフォルト表示
- **ネスト時**（`::::details`内など、card面の上に置かれる場合）は面の重なりを避けるため、メッセージ背景を `bg-paper dark:bg-npaper` に落とす

### `:::details` の変換後スタイル

```html
<details class="rounded border border-line dark:border-nline bg-card dark:bg-ncard">
  <summary class="cursor-pointer px-4 py-3 font-display font-bold text-sm ... flex items-center gap-2">
    <svg class="shrink-0 transition-transform">（シェブロン、open時にCSSで90度回転）</svg> タイトル
  </summary>
  <div class="px-4 pb-4 pt-1 border-t border-line/70">...</div>
</details>
```

```css
details > summary { list-style: none; }
details > summary::-webkit-details-marker { display: none; }
details[open] > summary svg { transform: rotate(90deg); }
```

## 意思決定の履歴（要約）

1. トップページを3案（warm / sharp / balance）で比較 → **sharp系を採用**。sharp派生2案（サイドバー型・カタログ型）も比較したが元のtop-b-sharpで確定
2. ヘッダーは「ロゴ・検索・テーマ切替」の3点のみに簡素化。ボーダーは細い薄罫線に
3. プロフィールはトップから削除し、SNS/GitHubアイコン + 別画面へのリンクボタンのみに（プロフィール画面は別途作成予定）
4. 全体に4pxの角丸を追加（罫線は直線のまま）
5. コードブロックのファイル名は全幅バー → ファイル名幅のタブ型に変更
6. ライトモードのコード背景を5案比較 → **E案（ダーク反転）を採用**。インラインコードのみ明るい面 + アクセント色文字の折衷に
7. `:::message`の6種別カラーは慣例色ではなく**暖色パレットに寄せた配色**、ラベルはeyebrow + アイコンで確定。通常メッセージはaccent色 → ニュートラル（sub色）に変更（dangerに赤を譲る）。タイトル指定はeyebrow置換方式を採用（タイトル行追加案は不採用）
8. diff表示は3案比較（A: tintのみ / B: tint+マーカー / C: tint+左ボーダー）→ **案B（背景tint + `+`/`-`マーカー）+ 削除行の文字をopacity 55%に薄める**で確定。配色は追加=success緑・削除=accent赤の両テーマ共通
9. 本トップは縦積み1カラム案（`book-top.html`）と章目次サイドバー案を比較 → **サイドバー案（Zennの本風）を採用**。書影は縦長（実際の本の比率）、タイトル上の種別バッジは削除、サイドバー最上部は「目次」見出しではなく本タイトルのリンクに
10. 章詳細の左目次は、本トップのサイドバーに章本文の見出し目次を組み合わせた**複合目次**を採用（現在章をアクセント色で強調し、配下に見出しをネスト。本全体の位置と章内の位置を1つの目次で示す）
11. タグ一覧は**件数順チップクラウド**、タグ詳細は**種別混在・`created_at` 降順の台帳リスト**を採用（名前順台帳案・種別ごとのセクション分け案は不採用）。章は「本タイトル › 章タイトル」の併記で表示。タグ詳細の戻る導線はテキストリンク → ボタン型に変更して確定

## 未確定・本実装時の課題

- コード用の全角対応等幅フォント（UDEV Gothic等）の選定（モックはJetBrains Mono + Zen Kaku Gothic Newフォールバック）
- Shikiのdual themeを上記配色に合わせる方法（既成テーマ選定 or カスタムテーマ）
