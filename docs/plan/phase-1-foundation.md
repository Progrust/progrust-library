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

## 実施メモ

### T1-1（完了）

対応概要:

- ツールチェーンを整備: Astro + Tailwind v4 + TypeScript(strict) + vitest、Prettier / ESLint(flat config) と固定 npm scripts（[implementation-rules.md](../implementation-rules.md) 1章）。`astro.config.mjs` は Tailwind + `site` のみの最小構成（Sätteri processor は P2 で追加）。
- ダミーコンテンツ（dict/articles/books 計34md）を `content/` の R-3 正規構成へ移植。frontmatter・記法とも仕様準拠だったため無修正。
- git 管理を開始。検証（`astro build` / `astro dev` / `npm run check`）はすべて成功。

後続タスク向けの申し送り（特記事項）:

- **インストール版**: `astro@7.0.7` / `typescript@5.9.3`。※npm の `typescript` 最新は 7.x 系だが、`typescript-eslint` / `@astrojs/check` との互換のため `^5.9` に固定している。バージョン更新時は要再確認。
- **Prettier のスコープ**: `.prettierignore` で既存の執筆済みプローズ（`content/` `docs/` `CLAUDE.md` `.claude/`）を対象外にしている。`npm run check` の `format:check` は**プロジェクトが所有するコード（`src/` `plugins/` `tests/` `astro.config.mjs` 等）のみ**を整形対象とする。既存ドキュメントを Prettier で書き換えないこと。
- **ESLint の `.mjs` 対応済み**: `plugins/**/*.mjs` に `globals.node` を付与済み。T1-3 以降で `plugins/*.mjs` を追加しても Node global（`URL`/`process` 等）が `no-undef` にならない。
- **★ wikilink 検証はコードフェンスを除外すること（T1-3 / T1-4 で重要）**: `content/articles/rust-performance-tuning.md` の ```` ```toml ```` ブロックに Cargo 設定の `[[bench]]`（array-of-tables）がある。これは wikilink **ではない**。リンク切れ検証（[content-model AC-9](../spec/content-model.md)）や逆リンクグラフ（[architecture.md 5章](../architecture.md)）を raw 正規表現で走査すると誤検出するため、**mdast の text ノードのみを対象にする**（code ノードは対象外）。この前提が崩れると `[[bench]]` が偽のリンク切れとしてビルドを落とす。コードフェンス外の `[[...]]` は全て dict エントリに解決済み（リンク切れ0件）。
- **移植は「コピー」**: 原本は `docs/ui-design/dummy-contents/` に残置（デザイン参照用）。将来 `content/` を正とする場合は原本の扱いを別途決める。

## フェーズ完了条件

ダミーコンテンツ全件がコレクション経由でビルドされ、wikilinkが解決し、検証3種が意図的な違反でエラーになる。ctx.fileURLリスクの検証結果がドキュメントに反映されている。
