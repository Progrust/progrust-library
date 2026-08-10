# Playgroundプロジェクト連携（`:::project`） 実装計画

仕様 [`../spec/playground-project.md`](../spec/playground-project.md)（作成済み）に基づく、UIデザイン検討から実装完了までのタスク分割。運用ルールは [`../implementation-rules.md`](../implementation-rules.md) 8章（1タスク=1セッション・`/impl <タスクID>`・レビューは `/task-review <タスクID>`）。

依存の流れ: PG-1（デザイン確定）→ PG-2 / PG-3（並行可）→ PG-4（統合・スタイル）→ PG-5（追従文書と実地確認）

## タスク

- [x] **PG-1: ファイルツリーUIデザインの検討・確定** 〔Fable 5〕
  `:::project` の表示（ファイルツリー・タイトル・「Playgroundで開く」ボタン配置・コードブロック群の囲い方）のデザインを検討し確定する。既存のコードブロック系デザイン（[`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「コードブロック」「ファイル名タブ」）との整合をとる。確定内容を ui-design-spec の「コンポーネント仕様」へ追記し、[`../spec/playground-project.md`](../spec/playground-project.md) §5 の未確定事項を解消する（必要ならAC-2の構造詳細を具体化）。
  完了条件: ui-design-spec に `:::project` のコンポーネント仕様が追記され、playground-project.md §5 が空になっている。
- [ ] **PG-2: ハッシュ共有モジュール + 同期スクリプト**
  プロジェクトハッシュ計算（playground-project §3）をビルド側と共有できる形（`plugins/` 配下の共有関数。`code-notation.mjs` と同パターン）で実装し、`scripts/sync-playground-gists.mjs`（走査→未登録のみ `POST /meta/gist` → `playground-gists.json` 追記・`--verify`）を作る。npm script `sync:playground` の追加は [`../implementation-rules.md`](../implementation-rules.md) 1章の表を**先に更新**してから行う。fetchは `vi.stubGlobal` でスタブしてテストする。
  完了条件: playground-project AC-5・AC-8・AC-9 のテストが通る。`npm run check` green。
- [ ] **PG-3: `:::project` mdastプラグイン + markdown-pipeline文書** 〔Fable 5〕
  `:::project` の変換プラグインを実装する（containerDirective の捕捉方式・`codeFilename` 変換後の子ノード走査・`directives.mjs` の未知名throwとの順序関係、という一次検証を含むため技術検証込み）。ビルドエラー5系統（playground-project R-7）、ボタン（R-2）、ファイルツリー生成とアンカーid付与（R-3）、マッピング参照（R-7e）を実装。`tests/helpers/pipeline.ts` への登録と `tests/plugins/directives.test.ts` の「未知のディレクティブ」テスト更新を含む。検証済みの実装方式・雛形・落とし穴を `../markdown-pipeline/project.md` として新規作成し、README対応表・全体像スニペットも更新する。
  完了条件: playground-project AC-1〜AC-4・AC-6・AC-7・AC-10 のテストが通る。`npm run check` green・`astro build` 成功。
- [ ] **PG-4: スタイル適用と表示統合**
  PG-1で確定したデザインを `src/styles/global.css` に実装する（`.code-project` 等の新セレクタ + 既存のフルブリード/幅制御系セレクタ列への追加）。実記事（`content/articles/rust-playground-multifile-release.md` の検証コード等）に `:::project` を適用し、`npm run sync:playground` を実運用して初回マッピングをコミットする。
  完了条件: 実記事のプロジェクトがビルドされ、ボタン押下でPlaygroundが複数ファイルモードで開く（playground-project AC-11 目視）。ライト/ダーク両テーマで表示崩れがない（目視）。
- [ ] **PG-5: 追従文書の更新とクローズ**
  実装を反映して [`../architecture.md`](../architecture.md)（1章プロジェクト構成ツリー・3章ビルド時検証テーブル・4章プラグイン順序）を更新する。実装中に得た知見を `../markdown-pipeline/project.md` へ還流し、残課題を整理する。全タスクのレビュー完了を確認し、本計画をクローズして [`../archive/`](../archive/plan/README.md) へ凍結・移動する（README一覧の更新含む）。
  完了条件: architecture.md が実装と一致し、[`../implementation-rules.md`](../implementation-rules.md) 7章のDefinition of Doneを全タスクが満たし、本計画がアーカイブされている。
