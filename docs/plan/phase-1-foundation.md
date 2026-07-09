# P1: 基盤構築とリスク検証

Astroプロジェクトを初期化し、コンテンツコレクションとビルド時検証を動かす。**最優先はmarkdown-pipelineの既知リスク（Content Layer API実ビルドでの`ctx.fileURL`挙動）の検証**（[architecture.md 3章](../architecture.md)）。

参照spec: [content-model.md](../spec/content-model.md) / 設計: [architecture.md](../architecture.md)

## タスク

- [x] **T1-1: プロジェクト初期化**
  Astro（検証済みバージョン系: [markdown-pipeline/README.md](../markdown-pipeline/README.md)参照）+ Tailwind + TypeScript + vitest をセットアップし、git管理を開始する。Prettier・ESLint・`astro/tsconfigs/strict` のセットアップと npm scripts（`check` 含む）の整備を含む（[implementation-rules.md](../implementation-rules.md) 1章）。`docs/ui-design/dummy-contents/` のダミーコンテンツを `content/` の正規構成（[content-model R-3](../spec/content-model.md)）へ移植する（記法・frontmatterが仕様と異なる箇所は仕様に合わせて修正）。
  完了条件: `astro dev` / `astro build` が成功し、`npm run check` が通る（vitestは空テストで可）。
- [x] **T1-2: 4コレクション定義と公開フィルタ**
  `src/content.config.ts`（4コレクション・zodスキーマ・generateIdカスタマイズ）と `src/lib/content.ts`（公開フィルタ・dev判定・並び順）を実装する。確認用の仮ページで全エントリを列挙する。
  完了条件: content-model AC-1 / AC-3 / AC-4（ID・URL規則）を満たし、公開フィルタのvitestが通る（AC-6〜AC-8相当のロジックテスト）。
- [ ] **T1-3: ★ctx.fileURL実ビルド検証（最優先リスク）** 〔Fable 5〕
  wikilinkプラグイン（[markdown-pipeline/wikilink.md](../markdown-pipeline/wikilink.md)の雛形）をContent Layer API経由の実ビルドに載せ、`ctx.fileURL`が実ファイルを指すかを確認する。NGの場合は代替案（公開状態の受け渡し方法の変更等）を検討・実装し、結果を`markdown-pipeline/wikilink.md`へ反映する。
  完了条件: コレクション経由のビルドでwikilinkがタイトル付き`<a href="/dict/[slug]">`に変換される。検証結果（OK/NGと対処）がwikilink.mdに追記されている。
- [ ] **T1-4: ビルド時検証3種**
  辞書ファイル名一意性（dict-index.mjs）・章連番形式/重複・wikilinkリンク切れ/公開非対称を実装する。
  完了条件: content-model AC-2 / AC-5 / AC-9 / AC-10 を満たす（意図的な違反ファイルで各エラーを確認し、削除してビルド成功に戻す）。プラグインのvitestが通る。

## 実施履歴

### T1-1

対応概要:

- ツールチェーンを整備: Astro + Tailwind v4 + TypeScript(strict) + vitest、Prettier / ESLint(flat config) と固定 npm scripts（[implementation-rules.md](../implementation-rules.md) 1章）。`astro.config.mjs` は Tailwind + `site` のみの最小構成（Sätteri processor は P2 で追加）。
- ダミーコンテンツ（dict/articles/books 計34md）を `content/` の R-3 正規構成へ移植。frontmatter・記法とも仕様準拠だったため無修正。
- git 管理を開始。検証（`astro build` / `astro dev` / `npm run check`）はすべて成功。

後続タスク向けの申し送り（特記事項）:

- **インストール版**: `astro@7.0.7` / `typescript@5.9.3`。※npm の `typescript` 最新は 7.x 系だが、`typescript-eslint` / `@astrojs/check` との互換のため `^5.9` に固定している。バージョン更新時は要再確認。
- **Prettier のスコープ**: 整形対象をプロジェクト所有コードに限定し、既存プローズ（`content/` `docs/` 等）を `.prettierignore` で除外する方針を [implementation-rules.md](../implementation-rules.md) §1 に反映済み（方針の正は §1）。
- **ESLint の `.mjs` 対応済み**: `plugins/**/*.mjs` に `globals.node` を付与済み。T1-3 以降で `plugins/*.mjs` を追加しても Node global（`URL`/`process` 等）が `no-undef` にならない。
- **★ wikilink 検証はコードフェンスを除外すること（T1-3 / T1-4 で重要）**: `content/articles/rust-performance-tuning.md` の ```` ```toml ```` ブロックに Cargo 設定の `[[bench]]`（array-of-tables）がある。これは wikilink **ではない**。リンク切れ検証（[content-model AC-9](../spec/content-model.md)）や逆リンクグラフ（[architecture.md 5章](../architecture.md)）を raw 正規表現で走査すると誤検出するため、**mdast の text ノードのみを対象にする**（code ノードは対象外）。この前提が崩れると `[[bench]]` が偽のリンク切れとしてビルドを落とす。コードフェンス外の `[[...]]` は全て dict エントリに解決済み（リンク切れ0件）。
- **移植は「コピー」**: 原本は `docs/ui-design/dummy-contents/` に残置（デザイン参照用）。将来 `content/` を正とする場合は原本の扱いを別途決める。

### T1-2

対応概要:

- **4コレクション定義**（`src/content.config.ts`）: dict / articles / books / chapters を glob loader で定義。共通frontmatterを`commonFields`に一元化しzod検証（[content-model R-2](../spec/content-model.md)）。記事・本のみ`image`（remote URL想定で`z.string()`。画像最適化 R-16/R-17 は後続）。`image`・`public`はrequired。
- **ID導出を純モジュール化**（`src/lib/collection-id.ts`）: `dictId`/`articleId`/`bookId`/`chapterId`。`astro:content`非依存にしてconfig評価時のload-orderリスク回避 + vitest直接検証を両立。dict/articlesはファイル名のみ（R-5）、章は連番除去+`本slug/slug`（R-7/R-8）。連番検証(R-9)・辞書名一意性(R-6)のthrowは**T1-4スコープ**として未実装。
- **公開フィルタ一元化**（`src/lib/content.ts`）: `isPreview`/`filterPublic`/`filterPublicChapters`（本index非公開伝播 R-12）/`sortByNewest`（[pages R-4](../spec/pages.md)）/`sortChapters`（連番昇順）の純関数と、`getPublic*`ラッパ（`getCollection`合成）。設計配置は[architecture §2](../architecture.md)に準拠。
- **確認用の仮ページ**（`src/pages/debug-entries.astro`・P3で撤去）: `getPublic*`経由で全エントリ列挙。

検証結果:

- `npm run check`（format:check / lint / typecheck / test 14件）green・`npx astro build` 成功。
- テスト: `tests/lib/collection-id.test.ts`（**[AC-3]/[AC-4]**）・`tests/lib/content.test.ts`（**[AC-6]/[AC-7]/[AC-8]**相当 + 並び順）。
- 目視/ビルド確認: chapters=3件・`.../index`幽霊混入なし（`!*/index.md`除外が有効）、dict IDはフォルダ階層を捨てフラット、章は`01→02→03`順で連番除去済みURL。**AC-1**は`title`を一時削除してビルドがファイル名付き（`dict → borrowing ... title: Required`）で失敗することを確認し復元。本番ビルドで非公開2件（dict）が除外され公開32件になることも確認（AC-6のビルド時裏付け）。

特記事項（後続向け申し送り）:

- **zodの`z`は`astro/zod`からimportする**: `astro:content`の`z`再エクスポートは`@deprecated`（`node_modules/astro/types/content.d.ts`、"will be removed in Astro 7. Use `import { z } from 'astro/zod'` instead."）。案内どおり`astro/zod`から取ると`astro check`の`ts(6385)`hintが完全に消える（0 errors/warnings/hints）。※`astro:schema`エイリアスも`astro/zod`を指すが型解決上hintが残り、かつ`// TODO: remove in Astro 7`付きなので使わない。**T1-3/T1-4で新規にzodスキーマを書く際も`astro/zod`を使うこと**。
- **章順の並びは本単位で`sortChapters`を通す前提**（グローバルソートは複数本で混在するため、P3の本ページで本ごとにグルーピングして適用する）。
- `getCollection`エントリは`filePath`を保持しており、これが章連番ソートのソース（`sortChapters`）。

### T1-3

### T1-4

## フェーズ完了条件

ダミーコンテンツ全件がコレクション経由でビルドされ、wikilinkが解決し、検証3種が意図的な違反でエラーになる。ctx.fileURLリスクの検証結果がドキュメントに反映されている。
