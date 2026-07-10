# P4: wikilink UI

辞書リンクのクライアント側拡張（プレビュー・サイドペイン）と、wikilinkグラフに基づく表示（逆リンク・使用辞書一覧）を実装する。

参照spec: [wikilink-ui.md](../spec/wikilink-ui.md) / 設計: [architecture.md](../architecture.md) 5章（embed・グラフ）・8章（dict-pane / dict-preview）

依存: P3完了（P5と並行可）

## タスク

- [x] **T4-1: embedパーシャル**
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

## 実施履歴

### T4-1

辞書embedパーシャルを実装（完了条件 wikilink-ui AC-6）。

- **変更ファイル**
  - 新規 `src/pages/dict/[slug]/embed.astro`: `export const partial = true` の断片ページ。`getPublicDict()`（`src/lib/content.ts`）で `getStaticPaths` を構築し、`render()` の本文を出力。
  - `docs/architecture.md` §5: spec §3 が委譲していたembed断片の構造コントラクトを追記（ルート `[data-dict-embed]` + `data-slug`/`data-title`/`data-tags`、メタはdata属性・可視ヘッダーなし・`.prose` 本文・パイプ区切りtags）。断片構造の詳細は同節を正とする。
- **満たしたAC**: AC-6（`/dict/[slug]/embed/` がビルド生成・本文のみの断片・非公開辞書は本番ビルドで未生成）。
- **設計判断**: メタは可視ヘッダーではなく data 属性で持たせ、プレビュー（本文のみ・R-7）とサイドペイン（メタ+本文・R-11）が同一断片をDOM手術なしで再利用できるようにした。種別ラベルは辞書固定のため断片に含めずconsumer側で付与。`global.css` は断片に読み込まず、挿入先ホストページのスタイルに委ねる。
- **検証**: `npm run check`（format/lint/typecheck/vitest 89 tests）・`npx astro build` ともに成功。生成物確認で公開辞書23件の `dist/dict/<slug>/embed/index.html` が生成され、非公開 `error-handling`/`mutex` は未生成、断片に `<html>`/`<head>`/ヘッダーを含まないことを確認（architecture §10 に従いページUIのvitestは追加せずビルド生成物で検証）。
- **コミット**: 下記「作成したコミット」を参照。

### T4-2

### T4-3

### T4-4

## フェーズ完了条件

wikilink-ui.mdの全受入基準（AC-1〜AC-8）を満たす。
