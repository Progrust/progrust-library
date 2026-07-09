# 実装計画（plan）

仕様（[`../spec/`](../spec/README.md)）と全体設計（[`../architecture.md`](../architecture.md)）に基づく、フェーズ分割した実装計画。

## フェーズ一覧

| フェーズ | 内容 | 依存 | 状態 |
| --- | --- | --- | --- |
| [P1 基盤構築とリスク検証](phase-1-foundation.md) | Astro初期化・4コレクション・★ctx.fileURL実ビルド検証・ビルド時検証 | — | 完了 |
| [P2 Markdownパイプライン統合](phase-2-pipeline.md) | 残りプラグイン統合（directives / link-card / mermaid / shiki） | P1 | 未着手 |
| [P3 ページ・レイアウト](phase-3-pages.md) | 全画面の静的表示 + テーマ切替 | P2 | 未着手 |
| [P4 wikilink UI](phase-4-wikilink-ui.md) | embedパーシャル・プレビュー・サイドペイン・逆リンク | P3 | 未着手 |
| [P5 検索](phase-5-search.md) | インデックス生成・クエリパーサ・検索UI・一覧絞込 | P3（P4と並行可） | 未着手 |
| [P6 周辺機能とリリース](phase-6-launch.md) | RSS/sitemap/OGP・フォント決定・CFセットアップ・Actions・公開 | P4, P5 | 未着手 |

## 運用ルール

1. **1タスク = 1セッション**で実装できる粒度に分割する。大きすぎるタスクは着手時に分割してよい（phase文書を更新する）
2. 各タスクは**完了条件**（検証可能な文。多くはspecの受入基準への参照）を必ず持つ
3. 進行状態は各phase文書のチェックボックスを直接更新して記録する
4. フェーズの完了条件は「フェーズ内全タスクの完了条件を満たす」こと。完了したら上の表の状態を更新する
5. 実装中に仕様の変更・詳細化が必要になったら、**先に該当specを更新**してから実装する（仕様駆動）
6. 実装中に得た知見（落とし穴・制約）は`docs/`の該当リファレンス文書（architecture / markdown-pipeline）へ反映する
7. 全フェーズ完了後、本ディレクトリは [`../README.md`](../README.md) のルール4に従い凍結して`docs/archive/`へ移動する（生きた知識は事前にリファレンスへ抽出）

## 実装モデルの運用

Claude Codeで実装する際のモデル選択ルール。

- **デフォルトはOpusで実装する**（1タスク=1セッションの開始時に`/model`で選択）。定型的な作業（設定ファイルの雛形・スキャフォールド等）はそれ以下のモデルでもよい
- 各phase文書で **`〔Fable 5〕`** を付したタスクは、新規性（Sätteri等の学習データがない領域の一次検証）・設計判断・横断的な検証/とりまとめを含むため、**Fable 5で実施する**
- **エスカレーション**: マークのないタスクでも、(a) 同じ問題でOpusが2回解決に失敗した、(b) 解決にspec/architectureの変更判断が必要になった、のいずれかに該当したらFable 5に切り替える
- モデルに関わらず品質ゲートは共通: 受入基準のテスト化 + タスク完了ごとのコードレビュー（レビューはFable 5で行う）

## スラッシュコマンドによる運用

実装とレビューは専用のスラッシュコマンド（`.claude/commands/`）で定型化している。

- **`/impl <タスクID>`**: タスクの実装〜検証〜チェックボックス更新〜コミットまでを本文書と [implementation-rules.md](../implementation-rules.md) のルールに従って行う。実装コミットには `Task: <タスクID>` トレーラーを必ず付与する（[implementation-rules.md 6章](../implementation-rules.md)）
- **`/task-review <タスクID>`**: トレーラーで該当コミット群を収集し、その差分を Definition of Done（[implementation-rules.md 7章](../implementation-rules.md)）に照らしてレビューする。結果は `docs/archive/review/<タスクID>.md` に記録する（報告のみで修正は行わない）
