# 実装計画（plan）

進行中の機能追加の実装計画を置くディレクトリ。運用ルール（1タスク=1セッション・完了条件必須・仕様駆動・モデル選択・`/impl` / `/task-review`）は [`../implementation-rules.md`](../implementation-rules.md) 8章に従う。クローズした計画は [`../README.md`](../README.md) のルール4に従い凍結して `../archive/` へ移動する（初期実装計画のアーカイブは [`../archive/plan/`](../archive/plan/README.md)）。

## 計画一覧

各計画には**プロジェクトID**（英大文字+数字）を割り当てる。計画内のタスクIDは `<プロジェクトID>-<連番>` 形式（例: `PG1-1`）とし、コミットトレーラー `Task: <タスクID>` や `/impl` / `/task-review` の引数にはこのIDを使う。

| プロジェクトID | 計画 | 内容 | 状態 |
| --- | --- | --- | --- |
| PG1 | [playground-project.md](../archive/plan/playground-project.md) | Playgroundプロジェクト連携（`:::project`）のUIデザイン検討〜実装 | 完了（アーカイブ済み） |
| SP1 | [side-pane-scroll.md](side-pane-scroll.md) | サイドペイン（左右レール）の縦スクロール対応（GitHub issue #2） | 進行中 |
