# 実装ルール（Implementation Rules）

コードを書く際の横断ルール（ツールチェーン・言語ポリシー・コーディング規約・テストの書き方・Git運用・完了チェックリスト）を定める実装者向け文書。**実装セッションの開始時に必ず読み、コードを書く前に適用すること**。セッション間で実装スタイルがぶれないようにするのが目的。

- 何を作るか（振る舞い・受入基準）→ [`spec/`](spec/README.md)
- どういう構造で作るか（配置・モジュール分割・テスト対象）→ [`architecture.md`](architecture.md)
- 本書は「どう書くか」のみを扱う

**優先順位**: 個別文書が本書と矛盾する場合は `spec/` > `architecture.md` > `markdown-pipeline/` > 本書 の順で個別文書を正とする（機能固有の決定は常に機能側の文書が勝つ）。矛盾に気づいたら本書を修正する。

## 1. ツールチェーン

ツール選定と設定方針のSSoTは本章。設定ファイルの中身は実装の成果物であり、本書には複製しない。**scripts名・プリセット構成を変えるときは本書を先に更新する**。

| 役割 | ツール | 方針 |
| --- | --- | --- |
| フォーマッタ | Prettier + prettier-plugin-astro | 設定はデフォルトを基本とし、オーバーライドは `.prettierrc` に列挙したもののみ（増やす場合は理由をコミットメッセージに書く）。**整形対象はプロジェクトが所有するコード（`src/` `plugins/` `tests/` `astro.config.mjs` 等）に限定し、執筆済みプローズ（`content/` `docs/` `CLAUDE.md` `.claude/`）は `.prettierignore` で対象外とする**（`npm run check` の `format:check` が既存ドキュメントを不整合扱いしないため） |
| リンタ | ESLint（flat config: `eslint.config.js`）+ eslint-plugin-astro + typescript-eslint | 各 recommended 構成を採用。`plugins/*.mjs` も lint 対象に含める |
| 型チェック | `astro check` | `tsconfig.json` は `astro/tsconfigs/strict` を extends し、追加の緩和オプションは入れない |
| テスト | vitest | 対象範囲は [architecture.md 10章](architecture.md) を正とする |

npm scripts は以下に固定する（セッション間で呼び方を変えない）:

| script | 内容 |
| --- | --- |
| `format` / `format:check` | prettier --write / --check |
| `lint` | eslint . |
| `typecheck` | astro check |
| `test` | vitest run |
| `check` | format:check + lint + typecheck + test を一括実行（タスク完了時のゲート。7章） |

実行タイミング: コミット前に必ず `npm run check`。実装中は随時 `npm run test`。

## 2. 言語ポリシー

- **識別子（変数・関数・型・ファイル名）は英語**
- **コメント・JSDoc・テスト名（describe/it）・ビルドエラーメッセージは日本語**
- コミットメッセージは Conventional Commits + 日本語サブジェクト（6章）
- ドキュメント（`docs/`）は日本語

## 3. コーディング規約（TypeScript / JavaScript）

- ファイル名: `src/lib/`・`src/scripts/`・`plugins/` は **kebab-case**（例: `wikilink-graph.ts`、`dict-pane.ts`。[architecture.md](architecture.md) の既定名と一致させる）
- 命名: 変数・関数は camelCase、型・インターフェースは PascalCase、真の定数のみ UPPER_SNAKE_CASE
- export: **named export のみ**（default export 禁止。Astroコンポーネントを除く）
- import: 順序は「外部パッケージ → 内部モジュール」。パスは相対パスで書く（パスエイリアスは導入しない）
- zod の `z` は **`astro/zod`** から import する（`astro:content` の `z` 再エクスポートは `@deprecated`・Astro 7で削除予定。`astro/zod` を使うと `astro check` の deprecation hint も消える。`astro:schema` エイリアスは使わない）
- `any` 禁止（strict準拠）。やむを得ない場合は `unknown` + 型の絞り込み
- コメントは「なぜ」を書く（「何を」はコードで表現する）。`src/lib/` の export 関数には日本語1行JSDocを付ける
- コメント・JSDocでspecのR/AC番号を参照するときは**必ずspec文書名を付ける**（`content-model R-10`・`wikilink-ui R-17` 形式）。R/AC番号はspec文書ごとの独立採番で衝突するため、無修飾の `R-17` は禁止
- `plugins/*.mjs` は先頭に `// @ts-check` を付け、JSDoc型注釈で型を効かせる
- ビルド時検証のエラーはthrow方式・メッセージ形式（絶対パス:行:列）を含め [markdown-pipeline/satteri-plugin-api.md](markdown-pipeline/satteri-plugin-api.md) を正とする（本書では再掲しない）

## 4. Astroコンポーネント規約

- ファイル名: **PascalCase**（`Header.astro`。[architecture.md 6章](architecture.md) のコンポーネント名と1:1）
- Props は frontmatter 内で `interface Props { … }` として定義し、`const { … } = Astro.props;` で分割代入する
- frontmatter の記述順: import → `interface Props` → props 取得 → ロジック
- クライアントJSはコンポーネント内に書かず `src/scripts/` に置く（例外はテーマ初期化のインラインスクリプトのみ。[architecture.md 8章](architecture.md)）
- `<style>` ブロックは原則使わない。スタイリングはTailwindクラスで行い、Markdown変換結果へのCSSは `global.css` に置く（規則は [architecture.md 9章](architecture.md)、トークン・見た目・`data-*` 属性コントラクトは [ui-design-spec.md](ui-design/ui-design-spec.md) を正とする）

## 5. テストの書き方

何をテストするか（対象・粒度・E2Eなし）は [architecture.md 10章](architecture.md) が正。本章は**書き方**のみを定める。

- **配置**: トップレベル `tests/` にソースをミラーする構成。テストファイルは常に `.test.ts`（`.mjs` 対象でもテストはTS）

  | ソース | テスト |
  | --- | --- |
  | `plugins/wikilink.mjs` | `tests/plugins/wikilink.test.ts` |
  | `src/lib/content.ts` | `tests/lib/content.test.ts` |
  | `src/scripts/search.ts` | `tests/scripts/search.test.ts` |

- **describe/it**: `describe` は対象モジュール・機能名、`it` は日本語の振る舞い文（例: `it('リンク切れのwikilinkがあるとビルドエラーになる')`）
- **AC対応付け**: specの受入基準に由来するテストは it名の先頭に AC番号を付ける — `it('[AC-9] 存在しないslugへのwikilinkでビルドが失敗する')`。specとテストの対応をgrepで追跡できるようにする
  - describe名またはファイル冒頭コメントで**対象spec文書名を明示**する（`[AC-n]` がどの文書の番号か一意になるように）
  - it名の `[AC-n]` は、describe（またはファイル全体）が単一specに閉じていれば裸番号のままでよい。describe名からspecが特定できない場合は `[pages AC-9]` 形式で文書名を含める（`AC-9` でのgrep追跡は維持される）
- **構造**: AAA（Arrange-Act-Assert）で書く。1つの `it` は1つの振る舞いのみ検証する
- **プラグインテストのフィクスチャ**: markdown文字列 → mdast/hast を得る共通ヘルパーを `tests/helpers/` に置き、各テストはインラインのmarkdown断片を入力にする
- **アサーション**: `toMatchObject` による部分一致で行う（木全体の完全一致・スナップショットテストは使わない — 変更に脆くレビューノイズになるため）
- **エラー系**: `expect(() => …).toThrow(/日本語メッセージの断片/)` でメッセージ内容まで検証する（エラーメッセージ形式も仕様の一部のため）
- **モック**: 純関数はモックなし。ネットワーク（link-cardのOGP fetch等）は `vi.stubGlobal('fetch', …)` でスタブし、実ネットワークに出ない

## 6. Git運用

- コミットメッセージ: **Conventional Commits + 日本語サブジェクト**（例: `feat: wikilinkプラグインを追加`、`test: 公開フィルタのAC-6〜AC-8テストを追加`）
- type は `feat` / `fix` / `docs` / `test` / `refactor` / `chore` を使う。scope は任意
- タスクに紐づくコミットには、メッセージ末尾にトレーラー **`Task: <タスクID>`**（例: `Task: T1-3`）を必ず付与する。レビュー時に `git log --grep` でタスク単位の差分を収集するために使う（レビュー運用は8章）
- 個人開発のため main へ直接コミットする（ブランチ運用なし）
- 1タスク（8章の1タスク=1セッション）内で、意味のある単位ごとにコミットする
- コミット前に `npm run check` を通す（7章）

## 7. タスク完了チェックリスト（Definition of Done）

タスクを「完了」とする前に以下をすべて満たすこと（8章の運用ルール・品質ゲートを機械的手順に落としたもの）:

1. 該当specの受入基準（AC）を満たしている（完了条件はplan文書を参照）
2. AC由来のテストが書かれている（5章の `[AC-n]` 規約）
3. `npm run check` が通る（format / lint / typecheck / vitest）
4. `astro build` が成功する
5. 実装中に得た知見・仕様変更が該当文書に反映されている（spec先行更新・知見の還流。ルール本体は8章）
6. コードレビューを受けている（レビュー運用は8章を正とする）

## 8. ワークフロー運用（タスク・モデル・レビュー）

初期実装計画（全フェーズ完了・[archive/plan/](archive/plan/README.md) に凍結）から抽出した、以降の開発にも適用する運用ルール。

### タスク運用

- **1タスク = 1セッション**で実装できる粒度に分割し、各タスクは**検証可能な完了条件**（多くはspecの受入基準への参照）を必ず持つ
- 実装中に仕様の変更・詳細化が必要になったら、**先に該当specを更新**してから実装する（仕様駆動）
- 実装中に得た知見（落とし穴・制約）は該当リファレンス文書（architecture / markdown-pipeline）へ反映する
- 検証・計画系の文書はクローズしたら凍結して `docs/archive/` へ移動する（[docs/README.md](README.md) ルール4）

### 実装モデルの運用

- **デフォルトはOpusで実装する**（セッション開始時に`/model`で選択）。定型的な作業（設定ファイルの雛形・スキャフォールド等）はそれ以下のモデルでもよい
- 計画文書で **`〔Fable 5〕`** を付したタスクは、新規性・設計判断・横断的な検証/とりまとめを含むため**Fable 5で実施する**
- **エスカレーション**: (a) 同じ問題でOpusが2回解決に失敗した、(b) 解決にspec/architectureの変更判断が必要になった、のいずれかに該当したらFable 5に切り替える
- モデルに関わらず品質ゲートは共通: 受入基準のテスト化 + タスク完了ごとのコードレビュー（**レビューは常にFable 5で行う**）

### スラッシュコマンドによる運用

実装とレビューは専用のスラッシュコマンド（`.claude/commands/`）で定型化している。

- **`/impl <タスクID>`**: タスクの実装〜検証〜チェックボックス更新〜コミットまでを本書のルールに従って行う。実装コミットには `Task: <タスクID>` トレーラーを必ず付与する（6章）
- **`/task-review <タスクID>`**: トレーラーで該当コミット群を収集し、その差分を Definition of Done（7章）に照らしてレビューする。結果は `docs/archive/review/<タスクID>.md` に記録する（報告のみで修正は行わない）

## 9. 本書が扱わないこと（参照リンク集）

| 知りたいこと | 参照先 |
| --- | --- |
| 何をテストするか（対象・粒度・E2Eなし） | [architecture.md 10章](architecture.md) |
| Sätteriプラグインの実装方式・throw規約・ファクトリ形式・落とし穴 | [markdown-pipeline/](markdown-pipeline/README.md) |
| スタイリング規則（darkMode・global.cssの使い分け） | [architecture.md 9章](architecture.md) |
| カラートークン・コンポーネントの見た目・data属性コントラクト | [ui-design/ui-design-spec.md](ui-design/ui-design-spec.md) |
| 機能の振る舞い・受入基準 | [spec/](spec/README.md) |
