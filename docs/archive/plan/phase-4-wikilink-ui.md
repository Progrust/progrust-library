# P4: wikilink UI

> [!warning] 凍結済みアーカイブ
> 本計画は2026-07-17に全フェーズ完了でクローズ済み。本書は歴史的記録であり**更新しない**。
> ワークフロー運用の現行参照先は [`../../implementation-rules.md`](../../implementation-rules.md) 8章。

辞書リンクのクライアント側拡張（プレビュー・サイドペイン）と、wikilinkグラフに基づく表示（逆リンク・使用辞書一覧）を実装する。

参照spec: [wikilink-ui.md](../../spec/wikilink-ui.md) / 設計: [architecture.md](../../architecture.md) 5章（embed・グラフ）・8章（dict-pane / dict-preview）

依存: P3完了（P5と並行可）

## タスク

- [x] **T4-1: embedパーシャル**
  `dict/[slug]/embed.astro`（`export const partial = true`）で本文断片+メタ情報を静的生成する。
  完了条件: wikilink-ui AC-6 を満たす。
- [x] **T4-2: サイドペイン（dict-pane.ts）**
  embedフェッチ・デフォルト/選択の2状態・ペイン内履歴（進む/戻る・ページ遷移でリセット）・ペイン内wikilinkの差し替え・モバイルボトムシート。
  完了条件: wikilink-ui AC-2 / AC-4 / AC-5 を満たす（AC-2はJS無効での通常遷移）。
- [x] **T4-3: ホバープレビュー（dict-preview.ts）**
  小窓表示（下端反転）・全文表示・小窓内リンクはプレビューなし・タッチ環境無効・フェッチキャッシュのペインとの共有。
  完了条件: wikilink-ui AC-3 を満たす。
  申し送り（T4-2レビュー推奨1）: `dict-pane.ts` の `navigateTo` は、辞書Aのfetch中に辞書BをクリックするとBの描画後にAの解決で上書きされ、履歴もクリック順と逆になる競合がある。T4-3で同じクリック委譲・`fetchDictEmbed` 共有を触る際、世代トークン（クリックごとに採番し解決時に最新のみ描画）で併せて対処する。
- [x] **T4-4: wikilinkグラフ（逆リンク・使用辞書一覧）**
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

辞書サイドペインのクライアント動作を実装（完了条件 wikilink-ui AC-2 / AC-4 / AC-5）。

- **変更ファイル**
  - 新規 `src/scripts/dict-pane.ts`: embedフェッチ（共有キャッシュ）・履歴（配列+カーソル）・デフォルト/選択2状態描画・辞書リンククリックの単一委譲・モバイルボトムシート開閉。履歴操作は DOM 非依存の純関数（`createHistory`/`pushEntry`/`goBack`/`goForward`/`canGoBack`/`canGoForward`/`currentSlug`）として分離し export。`fetchDictEmbed` も export しプレビュー（T4-3）とキャッシュ共有する。
  - 新規 `tests/scripts/dict-pane.test.ts`: 履歴純ロジックの `[AC-5]` テスト6件（往復・境界・分岐時の前方切り捨て・同一slug無視・リセット）。
  - `src/components/DictPane.astro`: 選択状態コンテナ `data-dict-pane-content` と `data-dict-pane-default`・戻る/進むボタンの `data-dict-pane-prev`/`-next` フックを付与。
  - `src/components/MobileNav.astro`: 辞書ボタンの `disabled` を解除し、辞書ボトムシート（`data-dict-sheet`/`-backdrop`/`-close` に `DictPane` を再掲）を追加。
  - `src/layouts/DetailLayout.astro` / `src/layouts/ChapterLayout.astro`: `initDictPane()` を配線。
  - `docs/architecture.md` §8: embedフェッチ共有・単一委譲・複数DOM同期の方式を追記（[architecture.md §8](../../architecture.md)）。
- **満たしたAC**: AC-2（JS無効時は素の `<a href="/dict/[slug]">` 遷移。R-3）・AC-4（クリックでURL不変・ペイン表示。R-11/R-13）・AC-5（進む/戻る往復・リロードでリセット。R-12/R-13）。
- **設計判断**: 辞書リンク（本文・ペイン内）は `data-dict-link` を共有するため `document` への単一 click 委譲で R-11/R-12 を一括処理。デスクトップ右ペインとモバイルシート内の `DictPane` は同一フックの複製とし `querySelectorAll` でまとめて同期（`toc.ts` 同方式）。種別ラベルは辞書固定のため `KindBadge` の辞書クラスを JS 側で複製。fetch失敗は `location.assign('/dict/[slug]')` で通常遷移にフォールバック（R-16）。DOM配線は architecture §10 の方針によりビルド生成物+目視で確認し、テストは純ロジックのみ。
- **検証**: `npm run check`（format/lint/typecheck/vitest 95 tests）・`npx astro build`（115ページ）ともに成功。生成物確認で詳細ページに `data-dict-pane-*`（デスクトップ+モバイルシートで各2）・`data-dict-sheet`・`data-dict-open` を確認、`dict-pane` スクリプトのバンドル生成、embed断片が `<html>` を含まないことを確認。
- **コミット**: 下記「作成したコミット」を参照。

### T4-3

辞書リンクのホバープレビューを実装（完了条件 wikilink-ui AC-3）。あわせてT4-2レビューの申し送り（fetch競合）を対処。

- **変更ファイル**
  - 新規 `src/scripts/dict-preview.ts`: `dict-pane.ts` の `fetchDictEmbed` を import してフェッチ結果を共有し、`a.wikilink[data-dict-link]` へのホバーで本文全文（`.prose`）を `fixed` 小窓に表示。`document` への `pointerover`/`pointerout` 単一委譲で本文・ペイン内リンクを対象化し（R-6）、小窓内リンク（`[data-dict-preview]` 配下）は除外（R-8）。hover非対応環境（`(hover: hover) and (pointer: fine)` 不一致）は初期化時に何もせずタッチ端末を無効化（R-9）。位置決めは純関数 `resolvePreviewPlacement`（リンク下・下端で上反転・左右クランプ）へ分離。表示/非表示ディレイの既定値を実装で確定（show 220ms / hide 150ms、小窓 `pointerenter`/`leave` で非表示を保留し小窓内スクロール・クリックを可能に）。
  - 新規 `tests/scripts/dict-preview.test.ts`: `resolvePreviewPlacement` の `[AC-3]` テスト3件（下配置・下端反転・右端クランプ）。
  - `src/scripts/dict-pane.ts`: 世代トークン `renderGeneration` を導入し `navigateTo`（クリック）・`showCurrent`（戻る/進む）の fetch 後描画をガード。辞書Aのfetch中にBを操作するとAの解決を破棄し、後勝ち・履歴逆順を解消（申し送り対処）。純ロジック・exportシグネチャは不変。
  - `src/layouts/DetailLayout.astro` / `src/layouts/ChapterLayout.astro`: `initDictPreview()` を配線。
  - `docs/architecture.md` §8: 世代トークンで後勝ちを保証する方式（プレビュー・ペイン共通の競合対処）を追記し申し送りをクローズ（[architecture.md §8](../../architecture.md)）。
- **満たしたAC**: AC-3（ホバーで本文全文の小窓表示・小窓内リンクはプレビューなし。R-7/R-8）。R-6（ペイン内リンクも対象）・R-9（タッチ無効）・R-16（fetch失敗時は小窓を出さずリンクは素で機能）も併せて満たす。
- **設計判断**: 位置決め純関数のみ vitest 対象とし、ホバー発火・小窓内除外・タッチ無効はビルド生成物+目視で確認（architecture §10。`dict-pane.ts` が純ロジックのみをテストする前例に合わせる）。小窓は単一 `[data-dict-preview]` を `body` に一度だけ生成し `innerHTML` を差し替え。`.prose` はホスト詳細ページの global.css でスタイルが適用される（T4-1 断片コントラクトの前提）。
- **検証**: `npm run check`（format/lint/typecheck/vitest 98 tests）・`npx astro build`（115ページ）ともに成功。生成物確認で `DetailLayout`/`ChapterLayout` の script チャンクが `dict-preview.*.js` を import すること、embed断片が `<html>` を含まないことを確認。
- **レビュー対応**: [レビュー結果](../../archive/review/T4-3.md)（承認・要修正なし）の推奨1・軽微2をすべて修正。(1) A→B直接ホバー移動でBのfetch失敗時にAの小窓が残留する問題を `requestPreview` で `hidePreview()` により解消、(2) ホバー保持スクロールで小窓がリンクから乖離する問題を `scroll` での `hideOnScroll` で解消、(3) showTimer発火時にリンクがDOMから外れていると座標が全0になる問題を `link.isConnected` ガードで防止。
- **コミット**: 下記「作成したコミット」を参照。

### T4-4

wikilinkグラフを構築し逆リンク・使用辞書一覧を実装（完了条件 wikilink-ui AC-7 / AC-8）。

- **変更ファイル**
  - 新規 `src/lib/wikilink-graph.ts`: 純関数 `extractWikilinkSlugs`（生本文から `[[slug]]` 抽出・trim・初出順で重複除去）・`buildWikilinkGraph`（forward=使用辞書一覧 / backward=逆リンク の2マップ構築）＋ 薄いラッパ `buildContentWikilinkGraph`（`getPublic*` 集約）。辞書slug解決で誤検出を除去、自己リンク除外、本トップは逆リンク源から除外（forwardには含む）、逆リンクは kind→title→href で決定的ソート。方式の詳細は [architecture.md §5](../../architecture.md)。
  - 新規 `src/components/LinkedDictList.astro`: 使用辞書一覧（R-17）。空なら非表示。リンクは `class="wikilink" data-dict-link` で本文 wikilink と同一挙動（ペイン＋プレビュー）。
  - 新規 `src/components/Backlinks.astro`: 逆リンク（R-18）。`KindBadge` で種別バッジ付き、章は「本 › 章」併記。`slot="below"` 用の上罫線セクション。
  - 新規 `tests/lib/wikilink-graph.test.ts`: `extractWikilinkSlugs` 5件＋ `buildWikilinkGraph` の `[AC-7]`（逆リンク・バッジ・順序・非公開除外）・`[AC-8]`（使用辞書一覧・誤検出除去・初出順）・`[R-18]`（本トップ除外）・自己リンク除外。
  - `src/layouts/DetailLayout.astro` / `ChapterLayout.astro`: `linkedDicts` prop 追加、右ペイン上（デスクトップ）＋本文下部（モバイル `lg:hidden`）に `LinkedDictList` を配置。
  - `src/pages/dict/[slug].astro`: グラフ構築し `linkedDicts` ＋ `<Backlinks slot="below">`。`articles/[slug].astro`・`books/[book]/[chapter].astro`・`books/[slug].astro`: `linkedDicts` を配線（本トップは右レール無しのため本文下部）。
  - `docs/architecture.md` §5: 実装確定事項（純関数分離・getStaticPaths構築・自己リンク/本トップ除外・ソート順・使用辞書一覧の挙動）を追記。
- **満たしたAC**: AC-7（逆リンクに公開記事・公開章がバッジ付きで表示・非公開ソース除外。R-18/R-19）・AC-8（使用辞書一覧が本文の wikilink 先と一致。R-17）。
- **設計判断**: グラフは生bodyの正規表現走査（architecture §5）。使用辞書一覧のクリック挙動（spec §5 未確定）は「本文 wikilink と同じ（ペイン＋プレビュー）」に確定（ユーザー選択）。DOM配線はビルド生成物で検証し、テストは純ロジックのみ（architecture §10。`content.ts` の前例に合わせる）。
- **検証**: `npm run check`（format/lint/typecheck/vitest 110 tests）・`npx astro build`（115ページ）ともに成功。生成物確認で `dist/dict/ownership/index.html` の逆リンクが辞書×2→記事×2→本×2 の決定的順・章は「本 › 章」表示、使用辞書一覧 `[borrowing, lifetime]` が本文 wikilink と一致、`rust-performance-tuning` の TOML `[[bench]]` 誤検出が使用辞書一覧に出ないこと（`iterator` のみ）、逆リンクに非公開ソース由来のリンク切れが無いことを確認。
- **レビュー対応**: [レビュー結果](../../archive/review/T4-4.md)（承認・要修正なし）の推奨1・軽微2をすべて対応。(1) forward マップのキーをコレクション横断で衝突しうる素の slug から `forwardKey(sourceKind, id)`（`sourceKind:` 接頭辞）に変更し、同名 slug の後勝ち上書きを防止（呼び出し側4ページも追随・衝突回避テスト追加）、(2) spec §5 の未確定2項目（プレビュー遅延・使用辞書一覧クリック挙動）を確定済みに更新、(3) R-17 に右レール無しページ（本トップ）は本文下部配置の一文を追記。
- **コミット**: 下記「作成したコミット」を参照。

## フェーズ完了条件

wikilink-ui.mdの全受入基準（AC-1〜AC-8）を満たす。
