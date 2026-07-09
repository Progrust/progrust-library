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
- `any` 禁止（strict準拠）。やむを得ない場合は `unknown` + 型の絞り込み
- コメントは「なぜ」を書く（「何を」はコードで表現する）。`src/lib/` の export 関数には日本語1行JSDocを付ける
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
- **構造**: AAA（Arrange-Act-Assert）で書く。1つの `it` は1つの振る舞いのみ検証する
- **プラグインテストのフィクスチャ**: markdown文字列 → mdast/hast を得る共通ヘルパーを `tests/helpers/` に置き、各テストはインラインのmarkdown断片を入力にする
- **アサーション**: `toMatchObject` による部分一致で行う（木全体の完全一致・スナップショットテストは使わない — 変更に脆くレビューノイズになるため）
- **エラー系**: `expect(() => …).toThrow(/日本語メッセージの断片/)` でメッセージ内容まで検証する（エラーメッセージ形式も仕様の一部のため）
- **モック**: 純関数はモックなし。ネットワーク（link-cardのOGP fetch等）は `vi.stubGlobal('fetch', …)` でスタブし、実ネットワークに出ない

## 6. Git運用

- コミットメッセージ: **Conventional Commits + 日本語サブジェクト**（例: `feat: wikilinkプラグインを追加`、`test: 公開フィルタのAC-6〜AC-8テストを追加`）
- type は `feat` / `fix` / `docs` / `test` / `refactor` / `chore` を使う。scope は任意
- タスクに紐づくコミットには、メッセージ末尾にトレーラー **`Task: <タスクID>`**（例: `Task: T1-3`）を必ず付与する。レビュー時に `git log --grep` でタスク単位の差分を収集するために使う（レビュー運用は [plan/README.md](plan/README.md)）
- 個人開発のため main へ直接コミットする（ブランチ運用なし）
- 1タスク（[plan/README.md](plan/README.md) の1タスク=1セッション）内で、意味のある単位ごとにコミットする
- コミット前に `npm run check` を通す（7章）

## 7. タスク完了チェックリスト（Definition of Done）

タスクを「完了」とする前に以下をすべて満たすこと（[plan/README.md](plan/README.md) の運用ルール・品質ゲートを機械的手順に落としたもの）:

1. 該当specの受入基準（AC）を満たしている（完了条件はplan文書を参照）
2. AC由来のテストが書かれている（5章の `[AC-n]` 規約）
3. `npm run check` が通る（format / lint / typecheck / vitest）
4. `astro build` が成功する
5. 実装中に得た知見・仕様変更が該当文書に反映されている（spec先行更新・知見の還流。ルール本体は [plan/README.md](plan/README.md)）
6. コードレビューを受けている（レビュー運用は [plan/README.md](plan/README.md) を正とする）

## 8. 本書が扱わないこと（参照リンク集）

| 知りたいこと | 参照先 |
| --- | --- |
| 何をテストするか（対象・粒度・E2Eなし） | [architecture.md 10章](architecture.md) |
| Sätteriプラグインの実装方式・throw規約・ファクトリ形式・落とし穴 | [markdown-pipeline/](markdown-pipeline/README.md) |
| スタイリング規則（darkMode・global.cssの使い分け） | [architecture.md 9章](architecture.md) |
| カラートークン・コンポーネントの見た目・data属性コントラクト | [ui-design/ui-design-spec.md](ui-design/ui-design-spec.md) |
| ワークフロー（1タスク=1セッション・spec先行・モデル運用・レビュー） | [plan/README.md](plan/README.md) |
| 機能の振る舞い・受入基準 | [spec/](spec/README.md) |
