# Playgroundプロジェクト連携（`:::project`） 実装計画

仕様 [`../spec/playground-project.md`](../spec/playground-project.md)（作成済み）に基づく、UIデザイン検討から実装完了までのタスク分割。運用ルールは [`../implementation-rules.md`](../implementation-rules.md) 8章（1タスク=1セッション・`/impl <タスクID>`・レビューは `/task-review <タスクID>`）。

依存の流れ: PG1-1（デザイン確定）→ PG1-2 / PG1-3（並行可）→ PG1-4（統合・スタイル）→ PG1-5（追従文書と実地確認）

## タスク

- [x] **PG1-1: ファイルツリーUIデザインの検討・確定** 〔Fable 5〕
  `:::project` の表示（ファイルツリー・タイトル・「Playgroundで開く」ボタン配置・コードブロック群の囲い方）のデザインを検討し確定する。既存のコードブロック系デザイン（[`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「コードブロック」「ファイル名タブ」）との整合をとる。確定内容を ui-design-spec の「コンポーネント仕様」へ追記し、[`../spec/playground-project.md`](../spec/playground-project.md) §5 の未確定事項を解消する（必要ならAC-2の構造詳細を具体化）。
  完了条件: ui-design-spec に `:::project` のコンポーネント仕様が追記され、playground-project.md §5 が空になっている。
- [x] **PG1-2: ハッシュ共有モジュール + 同期スクリプト**
  プロジェクトハッシュ計算（playground-project §3）をビルド側と共有できる形（`plugins/` 配下の共有関数。`code-notation.mjs` と同パターン）で実装し、`scripts/sync-playground-gists.mjs`（走査→未登録のみ `POST /meta/gist` → `playground-gists.json` 追記・`--verify`）を作る。npm script `sync:playground` の追加は [`../implementation-rules.md`](../implementation-rules.md) 1章の表を**先に更新**してから行う。fetchは `vi.stubGlobal` でスタブしてテストする。
  完了条件: playground-project AC-5・AC-8・AC-9 のテストが通る。`npm run check` green。
- [x] **PG1-3: `:::project` mdastプラグイン + markdown-pipeline文書** 〔Fable 5〕
  `:::project` の変換プラグインを実装する（containerDirective の捕捉方式・`codeFilename` 変換後の子ノード走査・`directives.mjs` の未知名throwとの順序関係、という一次検証を含むため技術検証込み）。ビルドエラー5系統（playground-project R-7）、ボタン（R-2）、ファイルツリー生成とアンカーid付与（R-3）、マッピング参照（R-7e）を実装。`tests/helpers/pipeline.ts` への登録と `tests/plugins/directives.test.ts` の「未知のディレクティブ」テスト更新を含む。検証済みの実装方式・雛形・落とし穴を `../markdown-pipeline/project.md` として新規作成し、README対応表・全体像スニペットも更新する。
  完了条件: playground-project AC-1〜AC-4・AC-6・AC-7・AC-10 のテストが通る。`npm run check` green・`astro build` 成功。
- [ ] **PG1-4: スタイル適用と表示統合**
  PG1-1で確定したデザインを `src/styles/global.css` に実装する（`.code-project` 等の新セレクタ + 既存のフルブリード/幅制御系セレクタ列への追加）。実記事（`content/articles/rust-playground-multifile-release.md` の検証コード等）に `:::project` を適用し、`npm run sync:playground` を実運用して初回マッピングをコミットする。
  完了条件: 実記事のプロジェクトがビルドされ、ボタン押下でPlaygroundが複数ファイルモードで開く（playground-project AC-11 目視）。ライト/ダーク両テーマで表示崩れがない（目視）。
- [ ] **PG1-5: 追従文書の更新とクローズ**
  実装を反映して [`../architecture.md`](../architecture.md)（1章プロジェクト構成ツリー・3章ビルド時検証テーブル・4章プラグイン順序）を更新する。実装中に得た知見を `../markdown-pipeline/project.md` へ還流し、残課題を整理する。全タスクのレビュー完了を確認し、本計画をクローズして [`../archive/`](../archive/plan/README.md) へ凍結・移動する（README一覧の更新含む）。
  完了条件: architecture.md が実装と一致し、[`../implementation-rules.md`](../implementation-rules.md) 7章のDefinition of Doneを全タスクが満たし、本計画がアーカイブされている。

## 申し送り事項

- ~~**PG1-3へ**: `:::project` のファイルとして扱うのは**直下のコードブロックのみ**（入れ子ディレクティブ内は対象外）と [`../spec/playground-project.md`](../spec/playground-project.md) R-1 に明記した。R-7 (a)〜(d) の判定は同期スクリプト側にも別実装があり（走査対象のmdastが `codeFilename` 変換前後で異なるため）、条件を変えるときは `scripts/sync-playground-gists.mjs` の `readProject` と同時に直す（spec R-8 の但し書き）。ハッシュ計算とマッピング読み込みは `plugins/project-gist.mjs`（`projectHash` / `readGistMap` / `GIST_MAP_PATH`）をそのまま使うこと（R-12）~~（PG1-3で対応済み。二重実装の同期義務は [`../markdown-pipeline/project.md`](../markdown-pipeline/project.md) に恒久記載）
- ~~**PG1-3へ**: AC-5 の「表示側の `<pre>` にはマーカー付きコードが渡る」半分は未検証（PG1-2ではGistへ送る側のみ検証した）。PG1-3のプラグインテストで担保する~~（PG1-3のプラグインテストで担保済み）
- **PG1-4へ**: `playground-gists.json` はルート直下のJSONで `prettier --check .` の対象。`writeGistMap` はPrettier既定（2スペース + 末尾改行）で書くため、生成物をそのままコミットしてよい
- **PG1-4へ**: CSS実装の前提（id契約 `project-{n}-{slug}`・ツリーのHTML構造 `.tree-row`/`.tree-branch`/`.tree-dir` と `white-space: pre` の必要性・eyebrow `// project` はmarkupリテラルのため `::before` で二重付与しない・ファイル数の単数形 `1 file`・ルート行なし）は [`../markdown-pipeline/project.md`](../markdown-pipeline/project.md)「制約・残課題」を参照。ツリー見た目の最終確認はPG1-4の目視で行う
- **PG1-4へ**: gistMapはconfig評価時に1回読むため、devサーバー起動中に `npm run sync:playground` を実行したら再起動が必要

## 実施履歴

### PG1-3

`:::project` のビルド側変換プラグインとconfig評価時検証、リファレンス文書を実装した。実装方式・設計判断・落とし穴の詳細は [`../markdown-pipeline/project.md`](../markdown-pipeline/project.md)（新設）を正とする。

**先行したドキュメント更新**（仕様駆動）:

- [`../spec/playground-project.md`](../spec/playground-project.md): R-1 に「他のディレクティブ内の `:::project` も通常どおりプロジェクトとして扱う」を追記（PG1-2レビュー軽微4の解消。両実装の挙動が一致していることをテストで確認）

**実装**:

- `plugins/project.mjs`（新規）: `containerDirective` visitorで `.code-project` 構造へ変換。登録順は `codeFilename → project → playgroundLink → … → directives`（3制約）。R-7 (a)〜(e) をthrow検証し、ハッシュは `plugins/project-gist.mjs` を共有（R-12）
- `plugins/validate-projects.mjs`（新規）: コレクション経由のvisitor throwは握り潰されるため、`validateWikilinks` と同型のconfig評価時検証パスでAC-6/AC-7を実ビルドのexit 1にする
- `plugins/code-filename.mjs`: 元codeノードの位置を `data.sourcePosition` へ退避（新規リテラルのトップレベル `position` は後段パスへ引き継がれないことが実測で判明したため。R-7(c)/(d) の行:列報告に使用）
- `plugins/project-gist.mjs`: `readGistMap` に形状ガードを追加（PG1-2レビュー軽微2の解消）
- `astro.config.mjs`: gistMapのconfig評価時読み込み・`validateProjects` 配線・`project(gistMap)` 登録
- テスト: `tests/plugins/project.test.ts`（21件）・`tests/plugins/validate-projects.test.ts`・`tests/helpers/project.ts` を新設。`tests/helpers/pipeline.ts` に project / playgroundLink を追加（playgroundLinkは従来から欠落していたため同時に整合）、`tests/plugins/directives.test.ts` に登録順契約の回帰ガードを追加

**満たした完了条件 / AC**: AC-1〜AC-4・AC-6・AC-7・AC-10 + AC-5の表示側（`<pre>` にマーカー付きコードが渡る）。AC-11（実Playgroundの目視）とCSS適用はPG1-4の担当。

**実装中に得た知見**（詳細は [`../markdown-pipeline/project.md`](../markdown-pipeline/project.md)「落とし穴と回避策」と [`../markdown-pipeline/satteri-plugin-api.md`](../markdown-pipeline/satteri-plugin-api.md) へ反映済み）:

- 新規リテラルのトップレベル `position` はarenaへ引き継がれないが、`data` の任意キーは後段パスから読める
- 前段パス生成ノードへの `setProperty` は成立する（arena未登録エラーは同一パス内限定）
- ツリーの改行を `text("\n")` にすると後段 `softBreaks` が `<br>` 化するため、1行 = `.tree-row` div の構造にした

**検証結果**: `npm run check` green（format:check / lint / typecheck 0 errors / vitest 254 passed）、`npx astro build` 成功（143ページ、Content Layerキャッシュ削除後に実施）。加えて一時記事による実ビルドE2Eで、マッピング未登録の `:::project` が exit 1 +「ファイル:行:列 + `npm run sync:playground` 案内」のエラーになることを確認。

**コミット**:

- `5a5158a` docs: 入れ子ディレクティブ内の:::projectの扱いをspec R-1へ明記
- `788a504` feat: :::projectをPlaygroundプロジェクトへ変換するmdastプラグインとビルド時検証を追加
- `961bdd1` test: :::projectのAC-1〜AC-7・AC-10テストとヘルパを追加
- `b08bc25` docs: markdown-pipelineに:::projectの実装リファレンスを追加しREADME・APIを更新

**レビュー指摘対応**（`推奨` 範囲。詳細は [`../archive/review/PG1-3.md`](../archive/review/PG1-3.md) の対応記録）: 要修正0件・推奨1件（入れ子 `:::project` のsync側回帰テスト）に対応した（`5e4ad6e`）。軽微1・2はレビュー判定どおり対応不要として残置。

### PG1-2

`:::project` のハッシュ共有モジュールと同期スクリプトを実装した（ビルド側プラグイン＝PG1-3には未依存）。

**先行したドキュメント更新**（仕様駆動）:

- [`../spec/playground-project.md`](../spec/playground-project.md): R-1 に「ファイルは直下のコードブロックのみ」を追記、R-8 に「R-7 (a)〜(d) 違反はNG報告してGist作成をスキップ・exit 1」「判定はビルド側と別実装になる」を追記
- [`../implementation-rules.md`](../implementation-rules.md): 1章にnpm script `sync:playground`（ネットワークを伴うため `check` には含めない）、3章の `// @ts-check` 対象に `scripts/*.mjs`、5章のテストミラー表にルート `scripts/` の行を追加
- [`../architecture.md`](../architecture.md): 1章のツリーに `plugins/project-gist.mjs`、10章のテスト対象にルート `scripts/` を追加

**実装**:

- `plugins/project-gist.mjs`（新規・プラグインではない共有関数）: `toGistFiles`（ファイル名昇順 + `stripCodeNotation` 適用）・`projectHash`（spec §3のSHA-256）・`readGistMap` / `writeGistMap` / `GIST_MAP_PATH`。ファイル名の昇順は `Buffer.compare` でUTF-8バイト順＝コードポイント順を厳密に取る（JSの `<` はUTF-16コードユニット順）
- `scripts/sync-playground-gists.mjs`（新規）: `markdownToMdast`（`features: { directive: true }`）で素のmdastを得て `:::project` を走査する方式。テキスト走査ではなくパーサを使うため、`::::figure` の入れ子や可変フェンス長を自前で扱わずに済む。未登録ハッシュのみ `POST /meta/gist` → マッピング追記（追記のみ・R-9）、`--verify` は全エントリに `GET /meta/gist/<id>`。`main()` は `import.meta.main` でガードし、`syncPlaygroundGists({ targets, mapPath, verify, log, logError })` をexportしてテスト可能にした

**満たした完了条件 / AC**: AC-5（Gistへ送る側。表示側の `<pre>` はPG1-3で担保）・AC-8・AC-9。テストは `tests/plugins/project-gist.test.ts` / `tests/scripts/sync-playground-gists.test.ts`（fetchは `vi.stubGlobal` でスタブし実ネットワークに出ない）。実データでの `npm run sync:playground` 実行と AC-11 の目視はPG1-4の担当。

**実装中に得た知見**:

- satteriの型エントリは `ContainerDirective` を再エクスポートしていない。`Extract<MdastNode, { type: 'containerDirective' }>` で絞り込む
- Playgroundの `GET /meta/gist/<id>` は**存在しないIDでも404ではなく500**を返す（実測）。生存確認は非2xxを一律で失敗として扱う
- 同APIのレスポンスは `{ id, url, code: [{ name, content }] }`（実測）

**検証結果**: `npm run check` green（format:check / lint / typecheck 0 errors / vitest 225 passed）、`npx astro build` 成功（143ページ）。

**コミット**:

- `c3159d3` docs: :::project同期スクリプトの不正project扱いをspecへ追記しrules/architectureを更新
- `e0f8921` feat: :::projectのハッシュ共有モジュールとGist同期スクリプトを追加
- `6a204c7` test: :::project のハッシュ・Gist同期スクリプトのAC-5/AC-8/AC-9テストを追加

**レビュー指摘対応**（`推奨` 範囲。詳細は [`../archive/review/PG1-2.md`](../archive/review/PG1-2.md) の対応記録）: 要修正0件・推奨1件（`import.meta.main` のNodeバージョン要件）に対応し、`package.json` の `engines.node` と implementation-rules 1章へ実行前提を明記した（`50ec59f`）。軽微2・4はPG1-3実装時の判断事項として残置。
