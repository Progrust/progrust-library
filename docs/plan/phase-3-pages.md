# P3: ページ・レイアウト

全画面を静的に表示できる状態にする。見た目は [ui-design-spec.md](../ui-design/ui-design-spec.md)（確定モック）を正とする。

参照spec: [pages.md](../spec/pages.md) / [theme.md](../spec/theme.md) / 設計: [architecture.md](../architecture.md) 5〜6章・9章

依存: P2完了

## タスク

- [ ] **T3-1: BaseLayout + ヘッダー/フッター + テーマ切替**
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

## フェーズ完了条件

pages.md・theme.mdの全受入基準を満たし、全URLがビルドされui-design-specと目視一致する。
