# 辞書ペインの拡大表示 実装計画

GitHub issue #1 への対応。辞書サイドペインは幅が狭く（320〜384px）、長い文章やコードブロックが見にくいため、ペインの内容を拡大表示できるようにする。運用ルールは [`../implementation-rules.md`](../implementation-rules.md) 8章（1タスク=1セッション・`/impl <タスクID>`・レビューは `/task-review <タスクID>`）。

要求仕様・受入基準は [`../spec/wikilink-ui.md`](../spec/wikilink-ui.md)（サイドペインの拡大表示: R-21〜R-26 / AC-10〜AC-13）、見た目の具体値は [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「辞書ペインの拡大表示」が持つ（確定モック: `dict-modal-compare.html` 案D）。

issue原要件（モーダル・枠外クリックで終了・拡大中は背景操作不可）からの変更: モック比較の結果、本文と辞書を同時に参照・操作できる**非モーダル右ドロワー+デュアルカラム（案D）**を採用した（ui-design-spec「意思決定の履歴」17。issue #1 コメントで記録）。

## 設計方針（確定）

- ドロワーは `DictDrawer.astro`（新規）として `DetailLayout` / `ChapterLayout` に配置。fixed・ヘッダー下〜画面下・右端・幅 `--dict-drawer-w: min(42rem, 45vw)`・z-20
- 開状態フラグは `html[data-dict-drawer-open]`。レイアウト切替（右レール `display: none`・グリッド列切替・本文の押し出し）は `global.css` の属性起点ルールで行い、サーバ確定のTailwindグリッドクラスは触らない
- ドロワー本文は `data-dict-drawer-content` / `data-dict-drawer-default`（ペインのコンパクト13px規則を継がない別フック）。`dict-pane.ts` の一括更新セレクタに追加して内容・履歴をペインと共有し、戻る/進むは既存 `data-dict-pane-prev` / `-next` フックの複製で同期する
- 開閉は新モジュール `src/scripts/dict-drawer.ts`（開閉・レイアウト切替・スクロール比率同期。`dict-pane.ts` への変更はセレクタ拡張のみに抑える）
- 閉状態は `visibility` 系で保持（`display: none` にしない。スクロール量測定のため）。スクロール同期は「開: ペイン読取→レール非表示→ドロワー設定」「閉: ドロワー読取→レール再表示→ペイン設定」の順序を厳守
- スコープ外: モバイルボトムシートの拡大対応 / 枠外クリックでのクローズ（非モーダルの意図） / 本文スクロールとペインのスクロール連動 / lg〜xl帯で目次フローティングボタン（z-30）がドロワー（z-20）に重なる件（機能は維持されるため許容）

## タスク

- [x] **DP1-1: spec・デザイン文書の改訂と issue #1 への設計コメント** 〔Fable 5〕
  wikilink-ui.md（R-21〜R-26 / AC-10〜AC-13）、ui-design-spec.md（確定モック一覧・レイアウト・辞書サイドペイン節・新節「辞書ペインの拡大表示」・意思決定の履歴17）、本計画の登録（plan/README.md の DP1 行）。issue #1 に採用デザインの説明コメントを投稿し、原要件（モーダル・枠外クリックで終了・操作不可）からの変更と理由を明記する。
  完了条件: R/AC採番の整合（重複なし・相互参照が解決する）。issueコメント投稿済み。`npm run check` green。
- [ ] **DP1-2: ドロワー本体と開閉・レイアウト切替** 〔Fable 5〕
  `DictPane.astro` に `expandable` prop と拡大トリガー（eyebrowボタン+常設拡大ボタン。右レールのみ有効化）、`DictDrawer.astro` 新設と両レイアウトへの配線（`data-dict-rail` / `data-detail-grid` フック追加）、`global.css`（レイアウト切替ルール・面落とし3ルールへのドロワー追加）、`dict-drawer.ts` の開閉（Esc・トランジション・lg未満縮小時クローズ・フォーカス移動）、`dict-pane.ts` のセレクタ定数化+ドロワー追加、`architecture.md` §6/§8 への追記。スクロール同期はDP1-3。
  完了条件: AC-10〜AC-12 を目視で満たす（辞書詳細・記事・章詳細、ライト/ダーク、xl / lg〜xl帯）。`npm run check` green・`npx astro build` 成功。
- [ ] **DP1-3: スクロール比率同期と横断検証** 〔Fable 5〕
  `dict-drawer.ts` に `mapScrollTop` 純関数を追加して開閉フローに配線し、`tests/scripts/dict-drawer.test.ts` に `[AC-13]` テストを書く。回帰目視（ホバープレビューがドロワー内でも動作・モバイルシート無変更・R-20のレール挙動・reduced-motion）。
  完了条件: `[AC-13]` テスト green + AC-13 目視。`npm run check` green・`npx astro build` 成功。完了後に issue #1 へ完了報告コメントを添えてクローズする。

## 実施履歴

### DP1-1

仕様駆動の先行ドキュメント改訂。実装は含まない。

- [`../spec/wikilink-ui.md`](../spec/wikilink-ui.md): §2 に「サイドペインの拡大表示（デスクトップ・GitHub issue #1）」節（R-21〜R-26）、§4 に AC-10〜AC-13 を追加
- [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md): 確定モック一覧に `dict-modal-compare.html` を追加、「レイアウト」にドロワー表示中の切替を追記、「辞書サイドペイン」に拡大トリガーを追記、新節「辞書ペインの拡大表示（右ドロワー）」（枠・レイアウト切替・トランジション・スクロール同期順序・`data-*` コントラクト表）を追加、意思決定の履歴に 17 を追加
- 本計画を新規作成し `README.md` の一覧に DP1 行を追加
- issue #1 に採用デザイン（案D）と原要件からの変更（非モーダル化・枠外クリックで閉じない）の理由をコメントで記録

**検証結果**: `npm run check` green（vitest 255 passed）。R-21〜R-26 / AC-10〜AC-13 は既存採番と重複なし。
