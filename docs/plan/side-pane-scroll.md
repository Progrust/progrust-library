# サイドペインの縦スクロール対応 実装計画

GitHub issue #2 への対応。目次や辞書コンテンツ、使用辞書一覧が多いページで、左右のサイドペインが画面の縦幅を超えて見切れ、末尾に到達できない問題を解消する。運用ルールは [`../implementation-rules.md`](../implementation-rules.md) 8章（1タスク=1セッション・`/impl <タスクID>`・レビューは `/task-review <タスクID>`）。

要求仕様・受入基準は [`../spec/wikilink-ui.md`](../spec/wikilink-ui.md)（右カラム: R-20 / AC-9）と [`../spec/pages.md`](../spec/pages.md)（左目次: R-13 / AC-7）、見た目の具体値は [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「レイアウト」が持つ。

## 設計方針（確定）

- 左右とも**レール全体を1つのスクロールコンテナ**とする。レイアウト側のラッパ div に `sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto` + `data-side-rail` を付与（8rem = sticky top 6rem + 下余白 2rem）
- 左ペイン（`Toc` / `ChapterToc`）は class prop で `sticky top-24` を渡す現行方式をやめ、右レールと同じラッパ div 方式に統一する（コンポーネントは無変更。「sticky 等はレイアウト側で付与」の規約は維持）
- `DictPane` 内部の `max-h-[60vh]` は維持（入れ子スクロール）。長い辞書を表示中もレールのスクロールで使用辞書一覧に到達できることを優先する
- スクロールバーは既存の狭幅カラム用 4px 上書き（`global.css` の `:is()` リスト）に `[data-side-rail]` を追加
- スコープ外: 目次スクロール時のアクティブ項目自動追従（`toc.ts` への scrollIntoView 相当）。見切れ解消とは別工数のためフォローアップ issue として扱う

## タスク

- [x] **SP1-1: サイドレールの縦スクロール対応** 〔Fable 5〕
  spec 3文書（wikilink-ui / pages / ui-design-spec）へ縦スクロール要件を追記したうえで、`DetailLayout.astro` / `ChapterLayout.astro` / `books/[slug].astro` の左右レールをスクロールコンテナ化し、`global.css` のスクロールバー4px対象へ `[data-side-rail]` を追加する。
  完了条件: wikilink-ui AC-9 / pages AC-7（追記分）を目視で満たす。`npm run check` green・`npx astro build` 成功。ライト/ダーク両テーマで表示崩れなし（目視）。完了後に issue #2 をクローズする。

## 実施履歴

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
