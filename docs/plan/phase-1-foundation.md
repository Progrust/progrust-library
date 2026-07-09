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
- [x] **T1-3: ★ctx.fileURL実ビルド検証（最優先リスク）** 〔Fable 5〕
  wikilinkプラグイン（[markdown-pipeline/wikilink.md](../markdown-pipeline/wikilink.md)の雛形）をContent Layer API経由の実ビルドに載せ、`ctx.fileURL`が実ファイルを指すかを確認する。NGの場合は代替案（公開状態の受け渡し方法の変更等）を検討・実装し、結果を`markdown-pipeline/wikilink.md`へ反映する。
  完了条件: コレクション経由のビルドでwikilinkがタイトル付き`<a href="/dict/[slug]">`に変換される。検証結果（OK/NGと対処）がwikilink.mdに追記されている。
- [x] **T1-4: ビルド時検証3種**
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

- **zodの`z`は`astro/zod`からimportする**（本タスクで確立）: `astro:content`の`z`再エクスポートは`@deprecated`（`node_modules/astro/types/content.d.ts`）で、`astro/zod`にすると`astro check`のdeprecation hintも消える。全タスク共通のコーディング規約なので正は [implementation-rules.md §3](../implementation-rules.md) に置いた。T1-3/T1-4のスキーマも同様。
- **章順の並びは本単位で`sortChapters`を通す前提**（グローバルソートは複数本で混在するため、P3の本ページで本ごとにグルーピングして適用する）。
- `getCollection`エントリは`filePath`を保持しており、これが章連番ソートのソース（`sortChapters`）。

### T1-3

対応概要:

- **wikilinkプラグインを本実装**: `plugins/dict-index.mjs`（再帰探索版`loadDictIndex`。一意性検証はT1-4）・`plugins/wikilink.mjs`（公開判定を文書単位でメモ化する二段ファクトリ）を作成し、`astro.config.mjs`にSätteri processorとして登録。`js-yaml`を依存に追加（v5はnamed importが必要）。確認用の仮ページ`src/pages/debug-render.astro`（P3で撤去）で代表4エントリを`render()`。
- **検証結果（完了条件のコア）**: コレクション経由の実ビルドで wikilink が `<a href="/dict/[slug]" class="wikilink" data-dict-link=…>タイトル</a>` に変換されることを`dist/`で確認。**`ctx.fileURL`は実ファイルを指しOK**（全31文書で実測）。一方、**visitor内throwはコレクション経由ではビルドを失敗させない**（glob loaderが握りつぶしexit 0・本文空出力・キャッシュで恒久不可視化）というNGを発見し、対処方式（`markdownToHtml`直呼びの検証パス）をPoCで実証して決定。検証結果・対処の詳細は [markdown-pipeline/wikilink.md](../markdown-pipeline/wikilink.md)「コンテンツコレクション実ビルド検証の結果」を正とする（[satteri-plugin-api.md](../markdown-pipeline/satteri-plugin-api.md)・[architecture.md 3章](../architecture.md)にも還流済み）。
- 非対称ルールの実ビルド確認は一時的なコンテンツ改変で実施（公開→非公開`[[mutex]]`がrenderエラーになること、エラーメッセージにリンク元実ファイルパスが入ることを確認後に復元）。

検証結果: `npm run check`（format:check / lint / typecheck / test 14件）green・`npx astro build` 成功（キャッシュ削除後のクリーンビルドでも確認）。テスト追加なし: 完了条件にAC参照がなく、プラグインのvitest整備はT1-4の完了条件のため（AC-9/AC-10のエラー系テスト含む）。

T1-4向けの申し送り（特記事項）:

- **★wikilinkリンク切れ/公開非対称のビルドエラー化は「config評価時の検証パス」で実装する**（visitor throwは不成立）。方式・PoC結果・`markdownToHtml`のAPI注意（frontmatterを剥がして渡す等）は [wikilink.md](../markdown-pipeline/wikilink.md) と [satteri-plugin-api.md](../markdown-pipeline/satteri-plugin-api.md) を参照
- **意図的な違反ファイルでの確認時はContent Layerキャッシュに注意**: プラグイン変更はキャッシュを破棄しないため、挙動確認は `.astro/`・`node_modules/.astro/` を削除してから行う
- `@types/node`をdevDependenciesに追加済み（`// @ts-check`付き.mjsを`astro check`が検査するため）。`eslint.config.js`のNode globals対象に`astro.config.mjs`を追加済み
- 新規生成mdastノード配列には `/** @type {import('satteri').MdastContent[]} */` 注釈が必要（typecheckで型が合わない）

作成コミット: `636a666` feat: wikilinkプラグインを実装しコレクション実ビルドへ統合 / `a06269f` docs: ctx.fileURL実ビルド検証の結果を文書へ反映

レビュー対応（[レビュー結果](../archive/review/T1-3.md)・軽微3件にすべて対応）:

- frontmatter抽出の改行を`\r?\n`で許容（CRLF mdの`public: false`見逃し防止。dict-index / wikilink両方）
- `title`フォールバックを拡張子除去済みslugに変更
- devサーバ実行中の辞書追加が再起動まで反映されない既知挙動を [markdown-notation/rule.md](../markdown-notation/rule.md) の辞書リンク節に注記

### T1-4

対応概要:

- **ビルド時検証3種をconfig評価時に実装**（`astro.config.mjs` トップレベルでthrow）。コレクション経由のvisitor throwはglob loaderに握り潰されexit 0になるため、レンダリング外の検証パスで確実にexit 1化する（方式の正は [markdown-pipeline/wikilink.md](../markdown-pipeline/wikilink.md) と [satteri-plugin-api.md](../markdown-pipeline/satteri-plugin-api.md)）。
  - **辞書ファイル名一意性**（R-6 / **AC-2**）: `plugins/dict-index.mjs` に純関数 `assertUniqueDictSlugs` を追加し `loadDictIndex` 索引構築時に呼ぶ。重複時は衝突した全絶対パスをメッセージに含める。
  - **章連番形式・重複**（R-9 / **AC-5**）: 新規 `plugins/chapter-order.mjs`。純関数 `findChapterOrderViolations`（連番なし／連番除去後重複を検出）+ fsラッパ `validateChapters`（`index.md`除外）。
  - **wikilinkリンク切れ・公開非対称**（R-13/R-14 / **AC-9/AC-10**）: 新規 `plugins/validate-wikilinks.mjs`。全コンテンツmdを既存 `wikilink.mjs` で `markdownToHtml` 単体コンパイルし、既存throwをそのまま伝播させる（検証ロジック・エラーメッセージをDRYに再利用）。
- **frontmatter扱いを実測で確定**: `markdownToHtml` は結果に `frontmatter` を返す＝自前抽出するため剥がさず全文を渡す（T1-3の「剥がせ」ノートは陳腐化）。全文渡しでエラー行番号が実ファイルと一致する。詳細は [wikilink.md](../markdown-pipeline/wikilink.md)。
- **テスト**（`tests/plugins/` 3ファイル・計10件）: 純ロジックはinlineデータ、wikilink非対称は `tests/fixtures/public-*.md` を `fileURL` に渡して公開/非公開を出し分け（`ctx.fileURL` のディスク上frontmatterで判定されるため）。コンパイルヘルパは `tests/helpers/wikilink.ts`。

検証結果:

- `npm run check`（format:check / lint / typecheck / test **24件**）green・`npx astro build` 成功。
- **意図的な違反で各AC確認 → 削除して復旧**（すべて実測）: AC-2=別フォルダ同名dict（両パス入りエラー）、AC-5=連番なし章/連番除去後重複、AC-9=存在しないslug（`astro build` exit 1・リンク元+slug入り）、AC-10=公開記事→非公開辞書でexit 1・非公開記事→非公開辞書はexit 0（非対称）。R-12過検出ケースは現ダミーに無くクリーンビルドが通ることも確認。

特記事項（後続向け申し送り）:

- config評価は dev/check/build すべてで走るため、壊れたwikilink等は `astro dev` 起動も落とす（ソロ執筆運用では許容）。将来重ければwikilink検証だけ `astro:build:start` へ寄せる余地あり。
- **R-12伝播とwikilink非対称判定は未対応**（過検出側の既知制限）。詳細は [wikilink.md 制約・残課題](../markdown-pipeline/wikilink.md)。

作成コミット: `737abec` feat: ビルド時検証3種を実装しconfig評価時に統合 / `7b2506b` test: ビルド時検証のAC-2/5/9/10テストを追加 / `36cc986` docs: T1-4のビルド時検証実装をwikilink.mdへ反映

## フェーズ完了条件

ダミーコンテンツ全件がコレクション経由でビルドされ、wikilinkが解決し、検証3種が意図的な違反でエラーになる。ctx.fileURLリスクの検証結果がドキュメントに反映されている。
