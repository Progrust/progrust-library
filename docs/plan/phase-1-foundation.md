# P1: 基盤構築とリスク検証

Astroプロジェクトを初期化し、コンテンツコレクションとビルド時検証を動かす。**最優先はmarkdown-pipelineの既知リスク（Content Layer API実ビルドでの`ctx.fileURL`挙動）の検証**（[architecture.md 3章](../architecture.md)）。

参照spec: [content-model.md](../spec/content-model.md) / 設計: [architecture.md](../architecture.md)

## タスク

- [x] **T1-1: プロジェクト初期化**
  Astro（検証済みバージョン系: [markdown-pipeline/README.md](../markdown-pipeline/README.md)参照）+ Tailwind + TypeScript + vitest をセットアップし、git管理を開始する。Prettier・ESLint・`astro/tsconfigs/strict` のセットアップと npm scripts（`check` 含む）の整備を含む（[implementation-rules.md](../implementation-rules.md) 1章）。`docs/ui-design/dummy-contents/` のダミーコンテンツを `content/` の正規構成（[content-model R-3](../spec/content-model.md)）へ移植する（記法・frontmatterが仕様と異なる箇所は仕様に合わせて修正）。
  完了条件: `astro dev` / `astro build` が成功し、`npm run check` が通る（vitestは空テストで可）。
- [ ] **T1-2: 4コレクション定義と公開フィルタ**
  `src/content.config.ts`（4コレクション・zodスキーマ・generateIdカスタマイズ）と `src/lib/content.ts`（公開フィルタ・dev判定・並び順）を実装する。確認用の仮ページで全エントリを列挙する。
  完了条件: content-model AC-1 / AC-3 / AC-4（ID・URL規則）を満たし、公開フィルタのvitestが通る（AC-6〜AC-8相当のロジックテスト）。
- [ ] **T1-3: ★ctx.fileURL実ビルド検証（最優先リスク）** 〔Fable 5〕
  wikilinkプラグイン（[markdown-pipeline/wikilink.md](../markdown-pipeline/wikilink.md)の雛形）をContent Layer API経由の実ビルドに載せ、`ctx.fileURL`が実ファイルを指すかを確認する。NGの場合は代替案（公開状態の受け渡し方法の変更等）を検討・実装し、結果を`markdown-pipeline/wikilink.md`へ反映する。
  完了条件: コレクション経由のビルドでwikilinkがタイトル付き`<a href="/dict/[slug]">`に変換される。検証結果（OK/NGと対処）がwikilink.mdに追記されている。
- [ ] **T1-4: ビルド時検証3種**
  辞書ファイル名一意性（dict-index.mjs）・章連番形式/重複・wikilinkリンク切れ/公開非対称を実装する。
  完了条件: content-model AC-2 / AC-5 / AC-9 / AC-10 を満たす（意図的な違反ファイルで各エラーを確認し、削除してビルド成功に戻す）。プラグインのvitestが通る。

## フェーズ完了条件

ダミーコンテンツ全件がコレクション経由でビルドされ、wikilinkが解決し、検証3種が意図的な違反でエラーになる。ctx.fileURLリスクの検証結果がドキュメントに反映されている。
