# P5: 検索

検索インデックス生成・クエリパーサ・ヘッダー検索UI・一覧絞込を実装する。

参照spec: [search.md](../spec/search.md) / 設計: [architecture.md](../architecture.md) 7章・8章（search / search-box / list-filter）

依存: P3完了（P4と並行可）

## タスク

- [x] **T5-1: 検索インデックス生成**
  `search-index.json.js` + `src/lib/search-index.ts`（エントリ変換・公開フィルタ・章含む）。
  完了条件: search.md AC-1 を満たし、変換ロジックのvitestが通る。
- [x] **T5-2: クエリパーサ+フィルタ（純関数）**
  `src/scripts/search.ts`: クエリ文字列 →（キーワード群・タグ群）のパース、部分一致/完全一致/ANDのフィルタ。
  完了条件: search.md AC-3 / AC-4 / AC-5 相当のvitestが通る。
- [x] **T5-3: ヘッダー検索ボックスUI**
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

- **実装**: `src/scripts/search.ts` を新規追加。UI/DOM を含まないパース + フィルタの純関数のみを切り出し vitest 対象とする（architecture §8・§10）。`SearchEntry` 型は T5-1 の `src/lib/search-index.ts` から import して再利用（重複定義しない）。
  - `parseQuery(query)`: 空白区切りでトークン化し `#`始まりをタグ・その他をキーワードに分解（[search.md](../spec/search.md) R-3）。`#`除去後に空のタグは捨てる。分割正規表現は `/\s+/`（JS の `\s` は全角空白 U+3000 も含むため全角区切りに対応。`no-irregular-whitespace` 回避のため正規表現内に生の全角空白は置かない）。
  - `filterEntries(entries, parsed)`: 全キーワード（title/description/tag名に部分一致・大文字小文字非区別＝R-4）**かつ** 全タグ（`Array.includes` の完全一致＝R-5）を満たす AND 検索（R-6）。空条件は真＝空クエリで全件・入力順保持。
  - 未確定事項（全角半角・かなカナ同一視）は初期実装対象外＝仕様どおり大文字小文字の同一視のみ（[search.md §5](../spec/search.md)）。
- **テスト**: `tests/scripts/search.test.ts`。AC-3/4/5 由来テストに `[AC-n]` 命名。`parseQuery`（分解・空白/全角空白・`#`のみ・複数併記）と `filterEntries`（AC-3 部分一致3対象と大小非区別・AC-4 タグ完全一致で部分一致除外・AC-5 AND と片側のみ除外・空クエリ全件）を最小フィクスチャで検証（純関数のためモックなし）。
- **検証**: `npm run check`（format/lint/typecheck/test 124件）・`npx astro build`（115ページ）ともに成功。
- **コミット**:
  - `fae44ba` feat: 検索クエリパーサとフィルタ純関数を追加

### T5-3

- **実装**: ヘッダー検索ボックスを配線して機能させた（architecture §8 が規定する `src/scripts/search-box.ts`）。
  - `src/scripts/search-box.ts` を新規追加。純ロジック（vitest 対象）と DOM 配線（architecture §10 によりビルド + 目視）を分離。
    - 純関数: `SEARCH_TYPE_LABEL`（dict/article/book/chapter → 辞書/記事/本/章。`KindBadge.astro` は3種のみで章を持たないため検索用に "章" を新設）と `buildDropdownItems(entries, limit)`（フィルタ済みエントリを先頭 `limit` 件に絞り種別バッジ付き view model に写す。`url` は `SearchEntry.url` を素通し＝章クリックの遷移先）。
    - パース/フィルタは T5-2 の `search.ts`（`parseQuery`/`filterEntries`）を import 再利用（重複実装なし）。
    - 遅延ロード: module-level の `indexPromise` で `/search-index.json` を**初回フォーカスで1回だけ** fetch（AC-2/R-2。`dict-pane.ts` の embed キャッシュと同方式）。fetch 失敗時はドロップダウンを出さない。
    - `input` イベントで再描画、結果は `<a href={url}>`（バッジ + タイトル）で通常遷移（AC-6）。Escape・ボックス外クリックで閉じる。`initSearchBox` が `disabled` を除去して有効化（JS 無効時は disabled 表示のまま＝PE。architecture §8）。
  - `src/components/SearchBox.astro`: input に `data-search-input`/`autocomplete=off` を付与し `aria-label` の「（準備中）」を除去（markup では `disabled` のまま＝JS 無効フォールバック）。`data-search-results` のドロップダウンコンテナ（既存トークン構成）と `initSearchBox()` 呼び出しの `<script>` を追加。
- **未確定事項の決定**（[search.md §5](../spec/search.md)。T5-2 同様 spec §5 は据え置き、決定を本履歴に記録）: ドロップダウン最大表示件数 = **8**（`MAX_RESULTS`）。矢印キー選択は**初期実装では入れない**（クリック + Escape/外クリックで閉じるのみ）。キーワード正規化は T5-2 の大文字小文字同一視を継承。
- **テスト**: `tests/scripts/search-box.test.ts`。`SEARCH_TYPE_LABEL`（4種別）と `buildDropdownItems`（章の url/label・全項目の充足・limit 切り捨て）を `[AC-6]` 命名で検証（純関数・モックなし）。
- **検証**: `npm run check`（format/lint/typecheck/test 128件）・`npx astro build`（115ページ）ともに成功。ビルド成果物で `dist/search-index.json` の生成・input の `disabled` フォールバック・`data-search-results` コンテナ・バンドル済み `initSearchBox` の inline を確認。
- **レビュー対応**（[review/T5-3.md](../archive/review/T5-3.md) の推奨指摘）: 推奨1（0件ヒット時に空のドロップダウン枠が出る）を修正＝0件時は隠す。推奨2（`KindBadge.astro` の複製注記に `search-box.ts` の `BADGE_CLASS` を追記）を修正。軽微1・2（Tab blur で閉じない・Escape 後の再フォーカス再表示なし）はいずれも spec §5 でキーボード操作を初期実装対象外と決定済みのため現状維持（T5-4 以降の改善候補）。
- **申し送り**: 推奨3（AC-2/AC-6 のブラウザ目視）。実行環境にブラウザがなく、検証はビルド成果物の静的確認（fetch を `focus` ハンドラ内のみに配線／結果は素の `<a href>` 遷移）に留まる。`npm run dev` での DevTools Network による fetch タイミング（初期ロードで出ない・初回フォーカスで1回）と章クリック遷移（`/books/[本]/[章]`）の目視は未実施＝実機での最終確認が残る。
- **コミット**:
  - `8aa9bf5` feat: ヘッダー検索ボックスUIを追加
  - レビュー対応（0件時の空枠・複製注記の修正）

### T5-4

## フェーズ完了条件

search.mdの全受入基準（AC-1〜AC-7）を満たす。
