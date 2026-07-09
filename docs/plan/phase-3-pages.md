# P3: ページ・レイアウト

全画面を静的に表示できる状態にする。見た目は [ui-design-spec.md](../ui-design/ui-design-spec.md)（確定モック）を正とする。

参照spec: [pages.md](../spec/pages.md) / [theme.md](../spec/theme.md) / 設計: [architecture.md](../architecture.md) 5〜6章・9章

依存: P2完了

## タスク

- [x] **T3-1: BaseLayout + ヘッダー/フッター + テーマ切替**
  カラートークンのCSS変数化・Tailwind設定・BaseLayout（meta類はP6で拡充）・Header/Footer/ThemeToggle・FOUC防止インラインスクリプト。検索ボックスは見た目のみ（機能はP5）。
  完了条件: theme.md AC-1〜AC-4 を満たす（AC-4はShiki/mermaidの切替連動を含む）。
- [ ] **T3-2: トップページ**
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

BaseLayout・Header/Footer・ThemeToggle と、カラートークン/フォントのデザインシステム、FOUC 防止のテーマ初期化スクリプトを導入した。設計方針の詳細は [`.claude/plans/t3-1-pure-mccarthy.md`] を参照（要点のみ以下に記す）。

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

### T3-3

### T3-4

### T3-5

### T3-6

## フェーズ完了条件

pages.md・theme.mdの全受入基準を満たし、全URLがビルドされui-design-specと目視一致する。
