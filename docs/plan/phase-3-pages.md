# P3: ページ・レイアウト

全画面を静的に表示できる状態にする。見た目は [ui-design-spec.md](../ui-design/ui-design-spec.md)（確定モック）を正とする。

参照spec: [pages.md](../spec/pages.md) / [theme.md](../spec/theme.md) / 設計: [architecture.md](../architecture.md) 5〜6章・9章

依存: P2完了

## タスク

- [x] **T3-1: BaseLayout + ヘッダー/フッター + テーマ切替**
  カラートークンのCSS変数化・Tailwind設定・BaseLayout（meta類はP6で拡充）・Header/Footer/ThemeToggle・FOUC防止インラインスクリプト。検索ボックスは見た目のみ（機能はP5）。
  完了条件: theme.md AC-1〜AC-4 を満たす（AC-4はShiki/mermaidの切替連動を含む）。
- [x] **T3-2: トップページ**
  新着一覧（3タイプ混在・バッジ・台帳リスト行）+ 各一覧への導線 + SNS/プロフィールリンク。
  完了条件: pages.md AC-2 を満たし、top-b-sharpモックと目視一致。
- [x] **T3-3: 一覧3ページ（辞書・記事・本）**
  辞書カードグリッド / 記事・本の縦カード。絞込UIは静的配置のみ（動作はP5）。
  完了条件: 全件表示され（AC-3）、dict-indexモックと目視一致。
- [x] **T3-4: DetailLayoutと詳細ページ（辞書・記事）**
  3カラムグリッド・タイトル/タグ/更新日/本文・目次（h1〜h4）・モバイルのフローティングボタン+目次ボトムシート。右ペインは枠のみ（動作はP4）。
  完了条件: pages.md AC-7 を満たし、dict-detailモックと目視一致。
- [ ] **T3-5: 本トップ・章詳細・前後章ナビ**
  章目次（連番昇順・非公開スキップ）・章詳細（章目次併記の目次）・前後章ナビ。
  完了条件: pages.md AC-4 / AC-5 を満たす。
- [ ] **T3-6: タグ一覧・タグ詳細・プロフィール・404**
  タグページ（章も対象）・profile.astro直書き（profile.htmlモック準拠）・404。
  完了条件: pages.md AC-1 / AC-6 / AC-8 を満たす。

## 実施履歴

### T3-1

BaseLayout・Header/Footer・ThemeToggle と、カラートークン/フォントのデザインシステム、FOUC 防止のテーマ初期化スクリプトを導入した。

**実装内容（変更・新規ファイル）**

- `src/styles/global.css`: カラートークン（`paper`/`card`/`line`/`strong`/`ink`/`sub`/`accent`）とフォントを `@theme` に登録。ダークは `.dark {}` で同名 CSS 変数の値のみ差し替える方式（architecture.md §9。`dark:` 併記を減らす）。Shiki dual theme の `html.dark` 切替 CSS（`.astro-code` セレクタ、shiki.md のレシピ）も追加し AC-4 を満たす。
- `src/layouts/BaseLayout.astro`: `<head>`（meta・FOUC 防止同期インラインスクリプト・Google Fonts）+ Header + `<slot>` + Footer。コンテンツ幅は画面差（6xl/7xl）があるため `<main>`/コンテナは各ページ側に持たせる。
- `src/components/`: `Header.astro`（ロゴ+検索+テーマ切替の3点）/ `Footer.astro`（copyright + profile/GitHub/X/RSS）/ `SearchBox.astro`（見た目のみ・機能は P5）/ `ThemeToggle.astro`（太陽・月 SVG を `dark:` で出し分け）。
- `src/scripts/theme.ts`: 切替ボタンの click で `html.dark` トグル + `localStorage` 保存（architecture.md §8）。
- `src/lib/site.ts`: サイト共有定数。GitHub/X は暫定URL（ユーザー確認済み、実URLは P6 で確定）。
- `src/pages/index.astro`: 自前 `<html>` から BaseLayout 利用へ移行（本文は暫定。正式なトップは T3-2）。
- `astro.config.mjs`: 「html.dark 切替 CSS は P6」の旧コメントを T3-1 実装済みへ修正。

**満たした受入基準**: theme.md AC-1〜AC-4。

**テスト方針**: architecture.md §10 に従い、ページ/UI は自動テスト対象外（build 成功 + 目視で確認、E2E 非導入）。theme.md の AC はいずれもブラウザ挙動（prefers-color-scheme / localStorage 永続 / FOUC / レンダ済み要素の切替）で `theme.ts` も §8 の vitest 対象（純関数の `search.ts` のみ）に該当しないため、**新規 vitest は追加していない**。検証は build 成功 + Playwright での挙動確認で代替した。

**検証結果**:

- `npm run check`（format:check / lint / typecheck / vitest 66 tests）: PASS
- `npx astro build`: 成功（config 評価時の検証3種も通過、全 URL 生成）
- Playwright による theme.md AC の挙動確認（`astro preview` に対して実施）: AC-1（OS ダーク+未保存でダーク／OS ライトでライト）・AC-2（トグルでライト→リロード維持）・AC-3（commit 直後に既に dark = FOUC 無し）・AC-4（Shiki span 配色 #24292e→#e1e4e8 切替・mermaid light/dark div の display 入替）すべて PASS

### T3-2

暫定プレースホルダだった `src/pages/index.astro` を、確定モック `top-b-sharp` 準拠の正式トップページへ差し替えた。ヘッダー/フッターは `BaseLayout` が供給するため `<main>` のみ実装。

**実装内容（変更・新規ファイル）**

- `src/lib/content.ts`: 新着一覧のマージ純関数を追加。`ContentKind`（`"dict"|"article"|"book"`）型・`withKind()`（種別ラベル付与）・`mergeRecent()`（辞書/記事/本を結合→既存 `sortByNewest` で新着順→上限件数）。**章を引数に取らない設計**で新着からの章除外を保証（R-5/AC-2）。
- `src/components/KindBadge.astro`（新規）: コンテンツ種別バッジ。記事は `accent` トークンで自動ダーク追従、辞書・本はトークン外の生カラーのため `dark:` を併記。タグ詳細（R-19・T3-6）でも再利用予定のため部品化。
- `src/pages/index.astro`（全面差し替え）: ①ヒーロー（eyebrow・大見出し・紹介文・GitHub/X/RSS アイコン + プロフィールボタン。R-7）②コレクション導線（辞書/記事/本/タグ 一覧への件数付き4リンク。R-6。タグ件数は本・章も含めて集計）③新着台帳リスト（`mergeRecent` の結果を種別分岐URLでリンク・降順10件・バッジ・タグ。R-5/AC-2）。配色はT3-1で確立した**トークンCSS変数方式**（モックの `dark:` 併記は写さない）。
- `tests/lib/content.test.ts`: `mergeRecent` の AC-2 由来テストを追加（混在降順・章非混入・同日タイトル昇順タイブレーク・上限10件）。

**満たした受入基準**: pages.md AC-2（新着に辞書・記事・本が混在・created_at 降順・最大10件・章が現れない）。R-5〜R-7 を実装。

**テスト方針**: architecture.md §10 に従い、ページ/UI は自動テスト対象外。ただし新着の並び替え・マージ・上限・章除外は純データロジックのため `mergeRecent` を vitest 対象とした（`[AC-2]` 命名）。

**検証結果**:

- `npm run check`（format:check / lint / typecheck / vitest 70 tests）: PASS
- `npx astro build`: 成功（`/index.html` 生成）。生成物確認で新着 `<li>` 10件・バッジ 本1/記事6/辞書3・本リンクは本トップ（`/books/[slug]`、章URLの混入 0件）・コレクション件数（辞書23/記事6/本1/タグ52）を確認（AC-2）。

**コミット**:

- `0aeed51` feat: 新着一覧のマージ純関数 mergeRecent/withKind を追加
- `01bc084` feat: トップページを実装（新着台帳・一覧導線・SNS/プロフィール）
- （本履歴・チェックボックス更新の docs コミットを別途作成）

### T3-3

辞書・記事・本の一覧3ページを追加した。トップ（T3-2）で確立したトークンCSS変数方式・BaseLayout利用・公開フィルタ経由のパターンを踏襲し、全件を静的表示する（ページ送りなし）。絞込UIはタグチップ+キーワードの**静的シェルのみ**で、動作の実装はP5（search.md）に委ねる。

**実装内容（変更・新規ファイル）**

- `src/pages/dict/index.astro`（新規）: 辞書一覧。カードグリッド `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`（[ui-design-spec.md](../ui-design/ui-design-spec.md) レイアウト節）。`getPublicDict()` は未ソートのため `sortByNewest()` で created_at 降順化（R-8/R-4）。
- `src/pages/articles/index.astro`・`src/pages/books/index.astro`（新規）: 記事・本一覧。ヘッダ画像+概要の横並びカードを縦スタック（R-9/R-10）。`getPublicArticles()`/`getPublicBooks()`（ソート済み）を使用。
- `src/components/DictCard.astro`（新規）: 辞書グリッドカード（タイトル+タグのみ・概要なし。ui-design-spec「辞書カード（一覧）」準拠）。`data-title`/`data-tags`（`|`区切り）はP5絞込JS用の予約属性。
- `src/components/EntryCard.astro`（新規）: 記事・本の横並びカード（**画像左・横並び**、ユーザー確定）。日付/タイトル/概要（`description`）/タグ。画像はremote URLを文字列で受ける（画像最適化は後続）。
- `src/components/ListFilter.astro`（新規）: 絞込UIの静的シェル（キーワード入力`disabled`+件数`N/総数`+タグチップ）。タグは出現件数降順で上位12個、超過分は静的な `+ N tags`。**動作はP5**。
- `src/lib/content.ts`: タグ出現件数を集計する純関数 `tagCounts()` を追加（件数降順・同数はタグ名昇順）。ListFilterのチップ件数算出に使用。
- `tests/lib/content.test.ts`: `tagCounts` のvitestを追加（集計・降順・タイブレーク・空配列）。AC由来ではないため `[AC-n]` 接頭辞なし。

**満たした受入基準**: pages.md AC-3（全一覧が全件表示・ページ送りUIなし）。R-8〜R-11 を実装。AC-1の当該分（`/dict/`・`/articles/`・`/books/` の生成）。

**特記事項（申し送り）**:

- **絞込UIの動作はP5**（[search.md](../spec/search.md) R-9〜R-11）。`data-title`/`data-tags`/`data-list-filter`/`data-filter-*` 属性を予約済み。絞込ロジックは `src/scripts/list-filter.ts`（未作成）に実装する想定（architecture §8）。
- **dev用の非公開識別バッジは未実装**。content-model.md §5 でデザイン未確定のため本タスクでは付けず、ゲッターの返り値をそのまま描画する。AC-3（全件表示）は本番ビルドのセマンティクスで満たす。T3-6以降で非公開バッジのデザインが確定したら一覧にも適用する。
- 記事・本の横並びカードは確定モックに明示マークアップがないため、デザインシステムのトークン/共通ルールから構成した（画像左・横並びはユーザー確認済み）。
- **0件時メッセージ（search R-10）は未実装**。動作がP5スコープのためマークアップも含めP5で追加する。文言がコンテンツ種別で異なる（「条件に一致する辞書/記事/本はありません。」）ため、置き場は各一覧ページ側（ListFilterではなくグリッド直後の `hidden` 要素）を想定。
- **P5の絞込実装時に対応する軽微事項**（[再レビュー](../archive/review/T3-3.md) M-1/M-2/M-4）: ①チップ内の件数spanは明示的な `text-sub` を持つが、選択時に件数もアクセント色で減光させるためモック同様の `opacity-60`（親色継承）へ寄せる。②チップ・`+ N tags` ボタンの `disabled` を外す際、静的シェル用に残した hover スタイルの見え方を確認する。③`data-tags` の `|` 区切りはタグ名に `|` を含むと破綻するため、絞込JS側で考慮するか content-model にタグ名の文字制約を追記する。

**再レビュー対応（[T3-3レビュー](../archive/review/T3-3.md) F-1/F-2/F-3・R-1/R-2 反映）**: 確定モック `dict-index.html` との目視一致のため、一覧タイトル節（大見出し `text-4xl sm:text-5xl` + アクセントドット + 件数併記 `N entries / created_at desc` + リード文、3ページ共通化）と ListFilter（チップの `#`接頭辞・`bg-card`、件数 `N / 総数 entries`（ヒット数強調）、区切り罫線 `pb-8 border-b`、`+ N tags` のアクセント色ボタン化、入力 `h-10 sm:max-w-xs`）をモックに揃えた。DictCard はタグ行を `mt-auto` で下端揃え（R-2）。予約 `data-*` 属性コントラクトを [ui-design-spec.md](../ui-design/ui-design-spec.md) タグチップ節へ SSoT として反映（R-1）。architecture.md §6 のコンポーネント名を実装（`EntryCard`/`ListFilter`）に更新（F-3）。

**テスト方針**: architecture.md §10 に従い、ページ/UIは自動テスト対象外（build成功 + 目視）。純データロジックの `tagCounts` のみvitest対象とした。

**検証結果**:

- `npm run check`（format:check / lint / typecheck / vitest 73 tests）: PASS
- `npx astro build`: 成功。`/dict/index.html`・`/articles/index.html`・`/books/index.html` 生成。生成物で辞書カード23件・記事6件・本1件が全件表示、ページ送りUIなし（`pagination`等マーカー0件）を確認（AC-3）。タグチップ上位12件表示も確認。

### T3-4

辞書詳細（`/dict/[slug]`）・記事詳細（`/articles/[slug]`）を初めて静的表示できる状態にし、詳細ページ本文（prose）のスタイルを一括で入れた。撤去予定だったデバッグ仮ページ（`debug-render`/`debug-entries`）を削除した。

**実装内容（変更・新規ファイル）**

- `src/layouts/DetailLayout.astro`（新規）: 詳細3カラムグリッド（`lg:grid-cols-[200px_minmax(0,1fr)_320px]`、左=目次sticky / 中央=タイトル・タグ・更新日・本文 / 右=辞書ペイン枠）。`BaseLayout` を内側で使用。タイトルは frontmatter を正とする（[rule.md](../markdown-notation/rule.md): 本文で h1 は基本使わない）。逆リンク（R-15）・前後章ナビ（R-16）用に `slot name="below"` を用意（本タスクでは未使用）。
- `src/components/Toc.astro`（新規）: `render()` が返す `headings`（Sätteri が github-slugger で採番、slug は本文見出しの id と一致）から **h2〜h4** を階層表示（AC-7・R-13。body 先頭 h1=タイトル重複は除外）。h3/h4 をインデント。
- `src/scripts/toc.ts`（新規）: IntersectionObserver で現在地見出しを目次にハイライト（`toc-active` 付替。**現在地追従を実装**＝ユーザー確定）＋ モバイル目次ボトムシートの開閉。JS 無効でもアンカーは静的動作。
- `src/components/MobileNav.astro`（新規）: `lg:hidden` の右下フローティングボタン（目次=機能・辞書=静的プレースホルダ）＋目次ボトムシート。
- `src/components/DictPane.astro`（新規）: 辞書サイドペインの**デフォルト状態の静的枠のみ**（fetch・履歴・選択時表示は P4）。
- `src/pages/dict/[slug].astro`・`src/pages/articles/[slug].astro`（新規）: 公開フィルタ（`getPublicDict`/`getPublicArticles`）で `getStaticPaths` を列挙し、`render()` の `Content`/`headings` を `DetailLayout` へ渡す。**記事のヘッダ画像は詳細に表示しない**（R-12準拠＝ユーザー確定）。
- `src/styles/global.css`（大幅追加）: architecture.md §9 の方針でパイプライン出力の素クラスへ prose スタイルを翻訳。見出し（`scroll-margin-top` でアンカーオフセット）・段落・リスト・チェックリスト・引用・脚注・figure・テーブル、インラインコード（明面 + accent）、辞書リンク`.wikilink`（本アイコン mask・点線下線）、コードブロック**E案**（両テーマ暗面・前景は常に `--shiki-dark`）・diff・ファイル名タブ、`.message` 7種別、`<details>`、`.link-card*`、目次 `.toc-active` を追加。既存の `.astro-code` 明暗切替は E案へ差し替え。
- `src/pages/debug-render.astro`・`src/pages/debug-entries.astro`（削除）: 「P3で本番ルーティングを入れる際に撤去」と明記の仮ページ。本タスクが辞書・記事の本番ルーティングを追加したため削除。

**満たした受入基準**: pages.md **AC-7**（目次に h2〜h4 が階層表示・クリックで該当見出しへ移動）。AC-1 の当該分（`/dict/[slug]`・`/articles/[slug]` の全公開エントリ生成）。R-12〜R-14 のうち本タスクスコープ（タイトル/タグ/更新日/本文・目次・右ペイン枠）を実装。

**特記事項（申し送り）**:

- **右ペインの動作・使用辞書一覧・逆リンク（R-15）は P4**（wikilink-ui）。`DictPane` は静的枠、モバイルの辞書ボタンも静的プレースホルダ。
- **Shikiトークンのカスタムパレット**（keyword色等）は ui-design-spec「未確定」項のため保留。E案の暗面には既存 `github-dark` トークンを流用（判断は [architecture.md §9](../architecture.md) に反映）。
- **messageのアイコン・タイトル省略時のデフォルトeyebrow**（`// info` 等）はパイプライン出力に該当要素が無く未対応。styleは border/bg/種別色 + `.message-title` の eyebrow 化まで。完全一致にはプラグイン側の対応が必要（[directives.md](../markdown-pipeline/directives.md) の該当項に集約）。
- **タイトルは frontmatter 由来**。ダミーコンテンツは本文先頭に h1 を持つ（rule.md の推奨に反する検証データ）ため詳細ページで見出しが重複表示されるが、実コンテンツ（h1 なし）では発生しない。目次は body h1 を除外済み。
- architecture.md §6 のコンポーネント名 `MobileFloatingButtons` を実装名 `MobileNav` に更新。

**レビュー対応（[T3-4レビュー](../archive/review/T3-4.md) F-1/R-1/M-1〜M-3 反映）**: ①脚注セクションの `sr-only` 見出し「Footnotes」が可視表示され目次にも混入していた問題（F-1）を、`global.css` の `.sr-only` 定義追加（Tailwind スキャン対象外のため明示）と、目次フィルタの純関数 `tocHeadings`（h2〜h4・h1/`footnote-label` 除外）への集約で解消。`Toc`/`MobileNav` の二重フィルタも解消（M-1）。②`tocHeadings` の vitest を追加（`[AC-7]`。テスト76件へ）。③pages.md R-13 を実装（h2〜h4 + 現在地追従）に合わせ更新し §5 の未確定項を削除（R-1/M-3）、architecture.md §9 にスタイルのスコープ方針を明記（M-2）。M-4（日本語タグ名の percent-encoding 整合）は T3-6 のタグページ実装時に確認する申し送り。

**テスト方針**: architecture.md §10 に従い、ページ/UI は自動テスト対象外（build 成功 + 目視/挙動確認）。目次対象の絞り込み `tocHeadings` は純データロジックのため vitest 対象とした（レビュー対応で追加。76件）。

**検証結果**:

- `npm run check`（format:check / lint / typecheck / vitest 73 tests）: PASS
- `npx astro build`: 成功（33ページ）。dist で `/dict/[slug]`・`/articles/[slug]` の全公開エントリ生成、目次 `data-toc-link` が本文見出し `id` と一致（AC-7）、`debug-*` が消えていることを確認。
- `astro preview` + Playwright（architecture §10 の UI 手動確認の代替）: 3カラム表示・目次クリックでアンカー遷移（長文でオフセット top=80px）・スクロール現在地ハイライト・モバイル目次ボトムシート開閉・記事詳細にヘッダ画像なし・コードE案（light `#2A241F`/dark `#171411`）・インラインコード明面・辞書リンクaccent・message種別色・details/link-card/ファイル名タブ/diff/テーブルすべて PASS。

### T3-5

### T3-6

## フェーズ完了条件

pages.md・theme.mdの全受入基準を満たし、全URLがビルドされui-design-specと目視一致する。
