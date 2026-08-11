# サイドペインの縦スクロール対応 実装計画

GitHub issue #2 への対応。目次や辞書コンテンツ、使用辞書一覧が多いページで、左右のサイドペインが画面の縦幅を超えて見切れ、末尾に到達できない問題を解消する。運用ルールは [`../implementation-rules.md`](../implementation-rules.md) 8章（1タスク=1セッション・`/impl <タスクID>`・レビューは `/task-review <タスクID>`）。

要求仕様・受入基準は [`../spec/wikilink-ui.md`](../spec/wikilink-ui.md)（右カラム: R-20 / AC-9）と [`../spec/pages.md`](../spec/pages.md)（左目次: R-13 / AC-7）、見た目の具体値は [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「レイアウト」が持つ。

## 設計方針（確定）

- 上限は左右とも `max-h-[calc(100vh-8rem)]`（8rem = sticky top 6rem + 下余白 2rem）。ラッパ div はレイアウト側に置く
- **左（目次カラム）**: ラッパ div `sticky top-24 max-h-… overflow-y-auto` + `data-side-rail` でカラム全体をスクロールコンテナにする
- **右（辞書ペイン+使用辞書一覧）**: SP1-1 の「レール全体1コンテナ」はペイン本文の内部スクロールと二重になるため SP1-2 で改訂。ラッパ div は `sticky top-24 flex max-h-… flex-col`（スクロールさせない）とし、ペインは `shrink-0` ラッパで位置固定、**使用辞書一覧のラッパ（`mt-8 min-h-0 overflow-y-auto` + `data-side-rail`）のみ**が残り縦幅でスクロールする
- 左ペイン（`Toc` / `ChapterToc`）は class prop で `sticky top-24` を渡す現行方式をやめ、ラッパ div 方式に統一する（「sticky 等はレイアウト側で付与」の規約は維持）
- `DictPane` 内部の `max-h-[60vh]` は維持。ペインのスクロールはこの内部スクロールのみ
- スクロールバーは既存の狭幅カラム用 4px 上書き（`global.css` の `:is()` リスト）に `[data-side-rail]` を追加
- スコープ外: 目次スクロール時のアクティブ項目自動追従（`toc.ts` への scrollIntoView 相当）。見切れ解消とは別工数のためフォローアップ issue として扱う

## タスク

- [x] **SP1-1: サイドレールの縦スクロール対応** 〔Fable 5〕
  spec 3文書（wikilink-ui / pages / ui-design-spec）へ縦スクロール要件を追記したうえで、`DetailLayout.astro` / `ChapterLayout.astro` / `books/[slug].astro` の左右レールをスクロールコンテナ化し、`global.css` のスクロールバー4px対象へ `[data-side-rail]` を追加する。
  完了条件: wikilink-ui AC-9 / pages AC-7（追記分）を目視で満たす。`npm run check` green・`npx astro build` 成功。ライト/ダーク両テーマで表示崩れなし（目視）。完了後に issue #2 をクローズする。
- [x] **SP1-2: 右レールのスクロールを使用辞書一覧のみに限定** 〔Fable 5〕
  SP1-1 のレール全体スクロールがペイン本文の内部スクロールと重なるとのフィードバックを受けた改訂。spec（wikilink-ui R-20 / AC-9・ui-design-spec）を先に改訂し、`DetailLayout.astro` / `ChapterLayout.astro` の右レールを flex 構成（ペイン固定 + 一覧のみスクロール）へ変更する。左（目次カラム）は変更しない。
  完了条件: 改訂後の wikilink-ui AC-9 を目視で満たす（一覧スクロールでペインが動かない・二重スクロールが生じない）。`npm run check` green・`npx astro build` 成功。
- [ ] **SP1-3: サイドレールのスクロールバーをホバー時のみ表示** 〔Fable 5〕
  左右サイドレール（`data-side-rail`）のスクロールバーのサムをデフォルト透明にし、レールにホバーしている間のみ表示する（WebKit はサム背景の切替、Firefox は `scrollbar-color` の切替）。辞書ペイン内部・ホバープレビューのスクロールバーは対象外（常時表示のまま）。
  完了条件: 非ホバー時にサムが不可視・ホバー中に表示されることを両エンジンで目視確認。`npm run check` green・`npx astro build` 成功。

## 実施履歴

### SP1-3（実装済み・Chrome実機確認待ち）

左右サイドレール（`data-side-rail`）のスクロールバーのサムをホバー中のみ表示にした。

**実装**（`src/styles/global.css`）:

- WebKit: `[data-side-rail]::-webkit-scrollbar-thumb` をデフォルト `background: transparent` にし、`[data-side-rail]:hover` 配下でサム色（`line`、サム自体のhoverで `sub`）を復元
- Firefox: `@supports not selector(::-webkit-scrollbar)` ガード内（Chrome 121+ が `scrollbar-color` 指定時にWebKit疑似要素を無視する既存対策と同じ理由）で `scrollbar-color: transparent transparent` ⇔ ホバー時 `var(--color-line) transparent` を切替
- 辞書ペイン内部・ホバープレビューのスクロールバーは対象外（常時表示のまま）

**検証結果**: `npm run check` green・`npx astro build` 成功（167ページ）。Firefox は Playwright で computed `scrollbar-color` が非ホバー時 transparent / ホバー時 line 色に切り替わることを確認。**Chrome はヘッドレス/CDP撮影でスクロールバー自体が描画されない**（`--hide-scrollbars` 無効化・headed・常時着色サムのいずれでも写らない）ため自動目視ができず、実ブラウザでの確認は利用者に依頼中。確認が取れたらチェックを付けてクローズする。

**知見**: Playwright/CDP のスクリーンショットは要素内スクロールバーの描画を含まないことがあり、スクロールバーの見た目検証には使えない。Firefox側は computed style（`scrollbar-color`）で代替検証できる。

### SP1-2

SP1-1 の右レール全体スクロールを「使用辞書一覧のみスクロール」へ改訂した（ペイン本文の内部スクロールとレールのスクロールが重なるとのフィードバック対応）。

**先行したドキュメント更新**（仕様駆動）:

- [`../spec/wikilink-ui.md`](../spec/wikilink-ui.md): R-20 / AC-9 を「ペインは位置固定・超過分は使用辞書一覧のみスクロール」へ改訂
- [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md): 「レイアウト」を左右で分けて記述し直し、「辞書サイドペイン」の本文注記を更新、意思決定の履歴に 16 を追加

**実装**:

- `DetailLayout.astro` / `ChapterLayout.astro`: 右レールのラッパを `sticky top-24 flex max-h-[calc(100vh-8rem)] flex-col`（非スクロール）にし、`DictPane` は `shrink-0` ラッパで位置固定、`LinkedDictList` は `mt-8 min-h-0 overflow-y-auto` + `data-side-rail` のラッパ内でのみスクロールする構成へ変更。左（目次カラム）は変更なし
- `DictPane.astro`: `relative` の理由コメントを一般化（右レールが非スクロールになったため。positioned なスクロール祖先＝モバイルのボトムシート等への言及に変更。`relative` 自体は維持）

**検証結果**: `npm run check` green（vitest 255 passed）、`npx astro build` 成功（167ページ）。Playwright（1440×620）で目視確認:

- 右レールのラッパは overflow visible・スクロール不可。一覧のスクロールで末尾まで到達でき、その間ペインの位置（top 96px）は不動（改訂後 AC-9）
- 長い辞書（Option型）を表示した状態でも、ペイン本文の内部スクロールと一覧のスクロールが独立して動作し、ラッパ下端はビューポート内（588px < 620px）に収まる
- 縦620pxで長い辞書を開くと一覧の表示高は約37pxまで縮む（ペイン位置固定を優先する本方式の織り込み済みトレードオフ。スクロールで全項目に到達可能）

**追補（Firefoxの偽スクロールバー修正）**: 一覧が縦幅内に収まっていてもFirefoxだけスクロールバーが表示される事象を修正した。丸ゴの字面（約1.6em）が `text-sm` の行ボックス（20px）を上下にはみ出し、Firefoxは末行のインラインはみ出し分（1px）を scrollHeight に算入するため（Chromeは算入しない）、一覧ラッパに `pb-1` を追加して吸収した。左レール（目次）はリンクが `display: block` のため発生しない。Playwright Firefox 151 で scrollHeight == clientHeight（超過なし時）と、Chromium側の無回帰を確認済み。

### SP1-1

左右サイドレールをスクロールコンテナ化した。見た目の仕様は [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「レイアウト」を正とする。

**先行したドキュメント更新**（仕様駆動）:

- [`../spec/wikilink-ui.md`](../spec/wikilink-ui.md): §2 に「右カラムのスクロール」節（R-20）、§4 に AC-9 を追加
- [`../spec/pages.md`](../spec/pages.md): R-13 と AC-7 に目次カラム内の縦スクロールを追記
- [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md): 「レイアウト」「共通ルール・スクロールバー」「辞書サイドペイン」「目次」「本トップ」「章詳細」を更新し、意思決定の履歴に 15 を追加

**実装**:

- `DetailLayout.astro` / `ChapterLayout.astro` / `books/[slug].astro`: 左右レールをラッパ div（`sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto` + `data-side-rail`）に統一。左ペインで `Toc` / `ChapterToc` の class prop に `sticky top-24` を渡す旧方式は廃止し、両コンポーネントから未使用となった class prop を削除
- `global.css`: スクロールバー 4px 上書きの `:is()` リスト2箇所へ `[data-side-rail]` を追加
- `DictPane.astro`: 選択状態コンテナに `relative` を追加。**検証中に発見した落とし穴**: ペイン内容中の positioned 要素（脚注 `sup`・`.code-playground` 等）のオーバーフローは最近接の positioned 祖先に算入されるため、無指定だと sticky なレールの scrollHeight が膨張し、レール下部に空白のスクロール領域が生まれる（コメントとして DictPane に恒久記録）

**検証結果**: `npm run check` green（format:check / lint / typecheck 0 errors・既存1 hint / vitest 255 passed）、`npx astro build` 成功（167ページ）。目視は Playwright（chromium headless）で dev サーバを撮影して実施:

- 章詳細（`option-and-result`・1440×620）: 左複合目次・右レールともカラム内スクロールで末尾まで到達（AC-7 / AC-9）。ライト/ダーク両テーマで崩れなし。sticky（top 96px）・max-height 492px（= 100vh−8rem）を computed style で確認
- 長い辞書（Option型）をペインに表示した状態で、ペイン内部スクロール（60vh）とレールのスクロールが独立して動作し、レール側スクロールで使用辞書一覧の末尾に到達（AC-9）
- lg〜xl帯（1100px）: 左カラム非表示・右レールのスクロール動作を確認
- 本トップ（1280×480）: 章目次サイドバーがカラム内スクロールで末尾まで到達
- 記事詳細・縦幅十分（1200px）の章詳細: 超過なしのときはスクロール不可（スクロールバー非表示）を確認
