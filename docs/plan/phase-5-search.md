# P5: 検索

検索インデックス生成・クエリパーサ・ヘッダー検索UI・一覧絞込を実装する。

参照spec: [search.md](../spec/search.md) / 設計: [architecture.md](../architecture.md) 7章・8章（search / search-box / list-filter）

依存: P3完了（P4と並行可）

## タスク

- [x] **T5-1: 検索インデックス生成**
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

- **実装**: `src/lib/search-index.ts`（変換ロジック・vitest対象）と `src/pages/search-index.json.js`（エンドポイント）を追加。`wikilink-graph.ts` と同型の「純関数 + `getPublic*` 集約ラッパ」構成（architecture §7）。
  - 純関数 `buildSearchEntries(sources)`: `SearchSource[]` を `SearchEntry[]`（[search.md §3](../spec/search.md) スキーマ）に変換。URL は種別ごとに導出（章 id `[本slug]/[章slug]` を `/books/[本]/[章]` に分解）。入力順を保持。
  - ラッパ `buildContentSearchIndex()`: `getPublicDict/Articles/Books/Chapters` を集約（非公開除外は上流に委譲＝R-1、章含む）。
  - エンドポイント: static 出力のため build 時に `dist/search-index.json` として prerender される。
- **テスト**: `tests/lib/search-index.test.ts`（AC-1由来テストに `[AC-1]` 命名。4種別の type/URL・章分解・章含有・data素通し・入力順）。
- **知見の還流**: `.js` エンドポイントは eslint の globals 設定対象外で `no-undef` が `Response` を誤検出したため、`eslint.config.js` に `src/pages/**/*.js` → `globals.nodeBuiltin` のオーバーライドを追加（後続の RSS 等エンドポイントも同スコープでカバー）。lint 対象の拡張だが implementation-rules §1 は「lint 対象＝プロジェクト所有コード」の方針記述に留まり個別 globals 配線は列挙していないため、同§への追記は不要と判断。
- **検証**: `npm run check`（format/lint/typecheck/test 114件）・`npx astro build`（115ページ）ともに成功。`dist/search-index.json` を実測し AC-1 を確認（全33エントリ: dict 23・article 6・book 1・chapter 3。非公開辞書 `mutex`/`error-handling` は不在。dict総数25−非公開2=23 と一致）。
- **コミット**:
  - `bf054b8` feat: 検索インデックス生成を追加

### T5-2

### T5-3

### T5-4

## フェーズ完了条件

search.mdの全受入基準（AC-1〜AC-7）を満たす。
