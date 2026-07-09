# P5: 検索

検索インデックス生成・クエリパーサ・ヘッダー検索UI・一覧絞込を実装する。

参照spec: [search.md](../spec/search.md) / 設計: [architecture.md](../architecture.md) 7章・8章（search / search-box / list-filter）

依存: P3完了（P4と並行可）

## タスク

- [ ] **T5-1: 検索インデックス生成**
  `search-index.json.js` + `src/lib/search-index.ts`（エントリ変換・公開フィルタ・章含む）。
  完了条件: search.md AC-1 を満たし、変換ロジックのvitestが通る。
- [ ] **T5-2: クエリパーサ+フィルタ（純関数）**
  `src/scripts/search.ts`: クエリ文字列 →（キーワード群・タグ群）のパース、部分一致/完全一致/ANDのフィルタ。
  完了条件: search.md AC-3 / AC-4 / AC-5 相当のvitestが通る。
- [ ] **T5-3: ヘッダー検索ボックスUI**
  初回フォーカスでの遅延ロード・ドロップダウン表示（種別バッジ・遷移先規則）。
  完了条件: search.md AC-2 / AC-6 を満たす。
- [ ] **T5-4: 一覧ページ絞込**
  タグチップ（AND・件数表示・上位12+展開）+ キーワード入力。辞書・記事・本の3一覧に適用。
  完了条件: search.md AC-7 を満たす。

## 実施履歴

### T5-1

### T5-2

### T5-3

### T5-4

## フェーズ完了条件

search.mdの全受入基準（AC-1〜AC-7）を満たす。
