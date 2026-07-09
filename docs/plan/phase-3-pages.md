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
- [ ] **T3-3: 一覧3ページ（辞書・記事・本）**
  辞書カードグリッド / 記事・本の縦カード。絞込UIは静的配置のみ（動作はP5）。
  完了条件: 全件表示され（AC-3）、dict-indexモックと目視一致。
- [ ] **T3-4: DetailLayoutと詳細ページ（辞書・記事）**
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

### T3-4

### T3-5

### T3-6

## フェーズ完了条件

pages.md・theme.mdの全受入基準を満たし、全URLがビルドされui-design-specと目視一致する。
