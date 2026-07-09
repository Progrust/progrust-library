# P2: Markdownパイプライン統合

wikilink以外の自作プラグインを本組込みし、全記法（[markdown-notation/rule.md](../markdown-notation/rule.md)）がコレクション経由の実ビルドで動く状態にする。各実装は [markdown-pipeline/](../markdown-pipeline/README.md) の各文書（雛形コード・落とし穴）に従う。

依存: P1完了

## タスク

- [ ] **T2-1: directives + textDirective復元**
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

## フェーズ完了条件

rule.mdの全記法がダミーコンテンツ上で正しくレンダリングされ、プラグインのvitestが全て通る。
