# P2: Markdownパイプライン統合

wikilink以外の自作プラグインを本組込みし、全記法（[markdown-notation/rule.md](../markdown-notation/rule.md)）がコレクション経由の実ビルドで動く状態にする。各実装は [markdown-pipeline/](../markdown-pipeline/README.md) の各文書（雛形コード・落とし穴）に従う。

依存: P1完了

## タスク

- [x] **T2-1: directives + textDirective復元**
  `:::message` / `:::details` / `:::figure` のHTML変換と、directive有効化の副作用（`x:y`消失）を復元するプラグインを組み込む（[directives.md](../markdown-pipeline/directives.md)）。
  完了条件: rule.mdの全directive記法がダミーコンテンツ上で正しいHTML（aside/details/figure）に変換され、本文中の`x:y`が消えない。vitestが通る。
- [x] **T2-2: shiki（diff・ファイル名・dual theme）**
  `shikiConfig`（markdown直下）+ transformerNotationDiff + codeFilename前処理を組み込む（[shiki.md](../markdown-pipeline/shiki.md)）。テーマは暫定の既成dual themeでよい（確定配色対応はP6のフォント/テーマタスクで）。
  完了条件: ` ```rust:main.rs `のファイル名タブ、`[!code ++/--]`のdiffクラス付与、light/dark両テーマのハイライトがビルド結果に含まれる。
- [x] **T2-3: link-card**
  単独ベアURLのOGPカード化+ビルド跨ぎキャッシュ+失敗時フォールバックを組み込む（[link-card.md](../markdown-pipeline/link-card.md)）。内部リンク除外ガードを入れる。
  完了条件: ダミーコンテンツのベアURLがカード化され、キャッシュファイルが生成され、fetch失敗時もビルドが成功して簡易カードになる。
- [ ] **T2-4: mermaid**
  mermaid-isomorphicによるビルド時SVG化（ライト/ダーク2枚・id名前空間化）を組み込む（[mermaid.md](../markdown-pipeline/mermaid.md)）。
  完了条件: mermaidコードブロックが2枚のSVGに変換され、id重複がなく、クライアントにmermaid.jsが配布されない。
- [ ] **T2-5: 全プラグイン同時動作確認** 〔Fable 5〕
  全プラグインを同一パイプラインに登録し（順序: [markdown-pipeline/README.md](../markdown-pipeline/README.md)）、未検証だったwikilink×linkCard併存を含めて確認する。結果をmarkdown-pipeline/README.mdの残課題へ反映する。
  完了条件: rule.mdの全記法を含むテスト用mdが1ページで正しくレンダリングされる。wikilinkがカード化されないことを確認済み。

## 実施履歴

### T2-1

`:::message` / `:::details` / `:::figure` を `<aside>` / `<details><summary>` / `<figure><figcaption>` へ変換するmdastプラグイン `plugins/directives.mjs` を追加し、`astro.config.mjs` で `features: { directive: true }` と共に登録した（順序: wikilink → directives）。実装方式・落とし穴は [directives.md](../markdown-pipeline/directives.md) に従い、検証済み雛形を本番化（message種別を rule.md の info/tip/question/success/warning/danger + `[タイトル]` 対応へ拡張、雛形の `alert` 分岐は不採用）。detailsはlabel（タイトル）必須でlabelが無ければthrow、figureのlabel（キャプション）は省略可でlabelが無ければfigcaptionなしの`<figure>`（rule.md準拠、下記要注意点参照）。未知のディレクティブ名はthrow。`directive: true` の副作用で本文中の `x:y`・`12:30`・`キー:値` 等がtextDirective化して消えるため、`ctx.source` をUTF-8バイトオフセットでスライスして原文復元する textDirective/leafDirective visitor を同梱した。

- 変更ファイル: `plugins/directives.mjs`（新規）/ `astro.config.mjs`（feature有効化 + plugin登録）/ `tests/plugins/directives.test.ts`・`tests/helpers/directives.ts`（新規）/ `docs/markdown-pipeline/directives.md`（未実測だった `:::message[タイトル]{info}` のダンプ確認結果、およびfigureキャプション省略可の本番挙動を反映）。
- 実装前の早期検証で `markdownToHtml` が `features` オプションを受けること・`ctx.source` が埋まることをダンプで確認（これが無いと `x:y` テストが誤ってgreenになる）。未実測だったmessageのlabel+属性併用パターンも実測し directives.md へ反映済み。
- rule.md準拠の要注意点: **figureのキャプションは省略可**（rule.md「画像サイズやキャプションは省略可能」）。雛形はキャプション無しでthrowしていたが、本番実装ではlabelが無ければfigcaptionを付けず`<figure>`のみにする（widthはlabel有無に関わらず適用）。**detailsのタイトルは必須**（rule.mdでlabel記法必須）のためlabelが無ければthrow、という非対称。directives.mdの雛形注記も更新済み。
- 完了条件充足: rule.mdの全directive記法が正しいHTML（aside/details/figure）に変換され、`x:y` 等が消えないことをvitest 12ケースで確認。加えて実 `astro build` の `dist/`（debug-renderページ）で message/details/figure の出力と、プロース中の `12:30`/`x:y`/`キー:値` が消えないことを実ビルド経路で確認（一時的にダミー本文を投入→dist確認→revert）。
- 補足: throwによる不正directive検出は **dev/テスト時のセーフティネット**。architecture §3 のとおりコレクション経由のvisitor throwはglob loaderに握り潰され実 `astro build` を失敗させない（テストは直接 `markdownToHtml` を呼ぶため検出できる）。T2-1は別途の検証パスを要求しないため追加していない。CSS（`message-*` 等の見た目）は本タスク対象外（後続のページ/UIフェーズ）。
- 検証結果: `npm run check`（format:check + lint + typecheck + test 36件）green / `npx astro build` 成功。
- コミットは `Task: T2-1` トレーラーで収集可能（`git log --grep 'Task: T2-1'`）。

### T2-2

Shikiの3要件（ファイル名・diff・dual theme）を[shiki.md](../markdown-pipeline/shiki.md)の検証済み方式で本番化した。`shikiConfig`（`markdown`直下）に dual theme（`github-light`/`github-dark` + `defaultColor: false`）と `transformerNotationDiff()` を設定し、` ```lang:file ` のファイル名を分離する `plugins/code-filename.mjs`（export `codeFilename`）を追加して `mdastPlugins` の先頭に登録した。`@shikijs/transformers@^4.3.1`（同梱shiki 4.3.1に一致）を dependencies に追加。

- 変更ファイル: `plugins/code-filename.mjs`（新規）/ `astro.config.mjs`（shikiConfig追加 + codeFilename登録）/ `package.json`・`package-lock.json`（依存追加）/ `tests/plugins/code-filename.test.ts`・`tests/helpers/code-filename.ts`（新規）/ `docs/markdown-pipeline/shiki.md`（雛形名を本番名 `codeFilename`/`code-filename.mjs` に更新、コレクション経由実ビルド未検証の残課題を検証済みへ更新）。
- 命名: 雛形の `f3CodeFilename`/`f3-codefilename.mjs` は既存プラグインの descriptive-name 規約（directives/wikilink/dict-index）に合わせ `codeFilename`/`code-filename.mjs` に変更した。
- 型対応: `data.hName` で任意要素へ化かす方式・paragraphにcodeを子として持たせる構造は実行時には成立するが、satteriのノード別Data型は `hName`/ブロック子を許容しないため、`ctx.replaceNode` へ渡す直前に `unknown` 経由で `MdastContent` へ橋渡しした（`any`は使わない、implementation-rules §3）。
- **スコープ外（P6へ繰り延べ）**: dual themeの `html.dark` 切替CSS（`.astro-code`）は入れていない。`defaultColor: false` によりビルド出力には `--shiki-light`/`--shiki-dark` 変数が両方含まれ完了条件「両テーマのハイライトがビルド結果に含まれる」を満たすが、実際の色付け・見た目切替は theme.md AC-4 = P6の範疇。**そのためP6まではコードが無彩色（色が付かない）**（記録済みの判断であり隠れた欠落ではない）。
- 完了条件充足: ユニットテスト（ファイル名分離・パス区切り・コロン無し素通り・空ファイル名の4ケース）で mdast前処理を検証。ただしShikiは `markdownToHtml`（satteri直接）では走らないため、**3要件の核心は実 `astro build` の dist で確認**した（debug-render の `targetIds` を一時的に `axum-web-api-intro` 込みへ広げ→build→`dist/debug-render/index.html` を grep→revert）: ファイル名ブロックが `class="code-filename"` かつ `data-language="rust"`（plaintextフォールバックしていない）／diff の `has-diff`・`diff add`・`diff remove`／dual theme の `--shiki-light`・`--shiki-dark` 両方の出力を確認。これにより shiki.md の「コレクション経由実ビルドで `shikiConfig` が効くか未検証」の残課題も解消した（shiki.md反映済み）。
- 補足: ` ```mermaid ` は未知langのため `data-language="plaintext"` にフォールバックする（除外は[mermaid.md](../markdown-pipeline/mermaid.md)のT2-4で対応）。CSS（コードブロックの見た目）はP6対象。
- 検証結果: `npm run check`（format:check + lint + typecheck + test 41件）green / `npx astro build` 成功。
- レビュー反映（[T2-2.md](../archive/review/T2-2.md)）: 軽微R-2（言語部分が空 ` ```:main.rs ` のエッジケースが未処理・空ファイル名ガードと非対称）に対応し、`!realLang` の素通りガードとテストを追加した（言語必須はrule.md準拠）。軽微R-1（ファイル名記法が既定ビルドで継続検証されない）は後続T2-5（全記法テスト用mdに ` ```rust:main.rs ` を含める）で恒常カバーするため本タスクでは変更なし。
- コミットは `Task: T2-2` トレーラーで収集可能（`git log --grep 'Task: T2-2'`）。

### T2-3

段落に単独で置かれたベアURLをビルド時にOGP取得してリンクカード化するmdastプラグイン `plugins/link-card.mjs`（export `linkCard`）を[link-card.md](../markdown-pipeline/link-card.md)の検証済み雛形をベースに本番化し、`astro.config.mjs` の `mdastPlugins` 末尾に `linkCard()` を登録した（順序: codeFilename → wikilink → directives → linkCard。[architecture.md](../architecture.md) §4）。fetch失敗/非200はthrowせず簡易カード（`link-card--fallback`）へフォールバックしビルドを落とさない。カードHTMLはblock要素 `<div>` 開始（mdastの`{rawHtml}`再パース対策・落とし穴1）。

- 変更ファイル: `plugins/link-card.mjs`（新規）/ `astro.config.mjs`（import + `linkCard()` 登録・冒頭コメント更新）/ `.prettierignore`（生成物 `.cache` を対象外に追加）/ `tests/plugins/link-card.test.ts`・`tests/helpers/link-card.ts`（新規）/ `docs/markdown-pipeline/link-card.md`（下記逸脱3点と実ビルド検証結果を反映）/ `.cache/link-card/ogp.json`（生成・コミット）。
- **雛形からの逸脱3点**（優先順位 spec > markdown-pipeline に基づき先にlink-card.md更新）:
  1. 命名 `dLinkCard`/`d-linkcard.mjs` → `linkCard`/`link-card.mjs`（[architecture.md](../architecture.md) §1既定名 + T2-2 code-filename前例のdescriptive-name規約）
  2. キャッシュ先 `node_modules/.cache/`（非コミット）→ `.cache/link-card/ogp.json`（gitignore対象外＝コミット可）。spec [deploy.md](../spec/deploy.md) R-4「キャッシュはリポジトリにコミットしてビルド間で再利用」に対応。CIの`actions/cache`配管はP6/deployの範疇で本タスク対象外
  3. 失敗結果を保存しない（**成功のみキャッシュ**）。コミット運用で失敗が永続化＝恒久フォールバック化するのを回避（[link-card.md](../markdown-pipeline/link-card.md) 落とし穴3を解消）。ユーザー確認済みの決定
- **内部リンク除外ガード**（完了条件の必須要件）: fetch直前に `/^https?:\/\//` を満たさないURLは素通り。wikilink出力（text≠url）は `soleBareUrl` 時点で既に除外されるため、`[/about](/about)` のような text===url かつ内部パスを塞ぐdefense-in-depth（テストで fetch非呼び出しを検証）。
- 設計: キャッシュを**ファクトリ閉包**に持たせ（`plugins/wikilink.mjs` の状態保持パターン）、`linkCard({ cacheDir })` で差し替え可能に。テストは scratch dir を渡し実キャッシュ汚染・実ディスク書き込み・テスト間Map共有を回避。fetchは `vi.stubGlobal` でスタブ（[implementation-rules.md](../implementation-rules.md) §5）。
- 型対応: `plugins/*.mjs` の `@ts-check` で `escapeHtml`/`nonEmpty` の引数に JSDoc 型注釈を付与（`any`禁止・§3）。
- 完了条件充足: ユニット8ケース（検出・文中/通常/内部リンク除外・fetch失敗/非200フォールバック・キャッシュHIT・失敗非保存）green。**実 `astro build` の dist（debug-render）で核心を確認**: 到達可能URLが `class="link-card"`（実OGP title/host付き）にカード化され `.cache/link-card/ogp.json` が生成／到達不能URL（一時投入→revert）が `link-card--fallback` かつ build exit 0／失敗URLが未キャッシュ。これにより link-card.md の「コレクション経由実ビルド未検証」残課題も解消（反映済み）。
- スコープ外: カードのCSS（見た目）はP6/UIフェーズ。URL正規化・失敗TTLは引き続き将来課題（link-card.md 制約参照）。wikilink×linkCard同時動作はT2-5で確認。
- 検証結果: `npm run check`（format:check + lint + typecheck + test 49件）green / `npx astro build` 成功。
- レビュー反映（[T2-3.md](../archive/review/T2-3.md)。要修正なし・承認）: 推奨R-1（fetchタイムアウト欠如でハングしうる）を `AbortSignal.timeout(10s)` で、軽微R-3（スキーム判定が小文字限定）を `i` フラグで、軽微R-4（OGP値の連続改行がrawHtmlブロックを分断しうる）を取得値の空白正規化で対応（テスト計10件に増）。軽微R-2（実体参照の二重エスケープ）はOGPパーサ強化の残課題として link-card.md に追記（本タスクでは変更なし）。修正後 `npm run check`（test 51件）green / `astro build` 成功。
- コミットは `Task: T2-3` トレーラーで収集可能（`git log --grep 'Task: T2-3'`）。

### T2-4

### T2-5

## フェーズ完了条件

rule.mdの全記法がダミーコンテンツ上で正しくレンダリングされ、プラグインのvitestが全て通る。
