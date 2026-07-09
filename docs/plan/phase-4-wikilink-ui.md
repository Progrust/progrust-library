# P4: wikilink UI

辞書リンクのクライアント側拡張（プレビュー・サイドペイン）と、wikilinkグラフに基づく表示（逆リンク・使用辞書一覧）を実装する。

参照spec: [wikilink-ui.md](../spec/wikilink-ui.md) / 設計: [architecture.md](../architecture.md) 5章（embed・グラフ）・8章（dict-pane / dict-preview）

依存: P3完了（P5と並行可）

## タスク

- [ ] **T4-1: embedパーシャル**
  `dict/[slug]/embed.astro`（`export const partial = true`）で本文断片+メタ情報を静的生成する。
  完了条件: wikilink-ui AC-6 を満たす。
- [ ] **T4-2: サイドペイン（dict-pane.ts）**
  embedフェッチ・デフォルト/選択の2状態・ペイン内履歴（進む/戻る・ページ遷移でリセット）・ペイン内wikilinkの差し替え・モバイルボトムシート。
  完了条件: wikilink-ui AC-2 / AC-4 / AC-5 を満たす（AC-2はJS無効での通常遷移）。
- [ ] **T4-3: ホバープレビュー（dict-preview.ts）**
  小窓表示（下端反転）・全文表示・小窓内リンクはプレビューなし・タッチ環境無効・フェッチキャッシュのペインとの共有。
  完了条件: wikilink-ui AC-3 を満たす。
- [ ] **T4-4: wikilinkグラフ（逆リンク・使用辞書一覧）**
  `src/lib/wikilink-graph.ts`でグラフ構築（公開フィルタ適用）し、Backlinks / LinkedDictList コンポーネントで表示する。
  完了条件: wikilink-ui AC-7 / AC-8 を満たし、グラフ構築のvitestが通る。

## フェーズ完了条件

wikilink-ui.mdの全受入基準（AC-1〜AC-8）を満たす。
