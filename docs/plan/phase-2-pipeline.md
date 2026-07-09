# P2: Markdownパイプライン統合

wikilink以外の自作プラグインを本組込みし、全記法（[markdown-notation/rule.md](../markdown-notation/rule.md)）がコレクション経由の実ビルドで動く状態にする。各実装は [markdown-pipeline/](../markdown-pipeline/README.md) の各文書（雛形コード・落とし穴）に従う。

依存: P1完了

## タスク

- [x] **T2-1: directives + textDirective復元**
  `:::message` / `:::details` / `:::figure` のHTML変換と、directive有効化の副作用（`x:y`消失）を復元するプラグインを組み込む（[directives.md](../markdown-pipeline/directives.md)）。
  完了条件: rule.mdの全directive記法がダミーコンテンツ上で正しいHTML（aside/details/figure）に変換され、本文中の`x:y`が消えない。vitestが通る。
- [ ] **T2-2: shiki（diff・ファイル名・dual theme）**
  `shikiConfig`（markdown直下）+ transformerNotationDiff + codeFilename前処理を組み込む（[shiki.md](../markdown-pipeline/shiki.md)）。テーマは暫定の既成dual themeでよい（確定配色対応はP6のフォント/テーマタスクで）。
  完了条件: ` ```rust:main.rs `のファイル名タブ、`[!code ++/--]`のdiffクラス付与、light/dark両テーマのハイライトがビルド結果に含まれる。
- [ ] **T2-3: link-card**
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

`:::message` / `:::details` / `:::figure` を `<aside>` / `<details><summary>` / `<figure><figcaption>` へ変換するmdastプラグイン `plugins/directives.mjs` を追加し、`astro.config.mjs` で `features: { directive: true }` と共に登録した（順序: wikilink → directives）。実装方式・落とし穴は [directives.md](../markdown-pipeline/directives.md) に従い、検証済み雛形を本番化（message種別を rule.md の info/tip/question/success/warning/danger + `[タイトル]` 対応へ拡張、雛形の `alert` 分岐は不採用）。details/figure はlabel必須とし、labelが無ければthrow。未知のディレクティブ名もthrow。`directive: true` の副作用で本文中の `x:y`・`12:30`・`キー:値` 等がtextDirective化して消えるため、`ctx.source` をUTF-8バイトオフセットでスライスして原文復元する textDirective/leafDirective visitor を同梱した。

- 変更ファイル: `plugins/directives.mjs`（新規）/ `astro.config.mjs`（feature有効化 + plugin登録）/ `tests/plugins/directives.test.ts`・`tests/helpers/directives.ts`（新規）/ `docs/markdown-pipeline/directives.md`（未実測だった `:::message[タイトル]{info}` のダンプ確認結果を反映）。
- 実装前の早期検証で `markdownToHtml` が `features` オプションを受けること・`ctx.source` が埋まることをダンプで確認（これが無いと `x:y` テストが誤ってgreenになる）。未実測だったmessageのlabel+属性併用パターンも実測し directives.md へ反映済み。
- 完了条件充足: rule.mdの全directive記法が正しいHTML（aside/details/figure）に変換され、`x:y` 等が消えないことをvitest 10ケースで確認。実 `astro build` の `dist/` にも message/details/figure が出力されることを確認。
- 補足: throwによる不正directive検出は **dev/テスト時のセーフティネット**。architecture §3 のとおりコレクション経由のvisitor throwはglob loaderに握り潰され実 `astro build` を失敗させない（テストは直接 `markdownToHtml` を呼ぶため検出できる）。T2-1は別途の検証パスを要求しないため追加していない。CSS（`message-*` 等の見た目）は本タスク対象外（後続のページ/UIフェーズ）。
- 検証結果: `npm run check`（format:check + lint + typecheck + test 34件）green / `npx astro build` 成功。
- コミットは `Task: T2-1` トレーラーで収集可能（`git log --grep 'Task: T2-1'`）。

### T2-2

### T2-3

### T2-4

### T2-5

## フェーズ完了条件

rule.mdの全記法がダミーコンテンツ上で正しくレンダリングされ、プラグインのvitestが全て通る。
