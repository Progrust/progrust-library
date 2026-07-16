# Progrust Library（Programming in Rust）

## アプリ概要

Rustプログラミング言語関連の内容を中心とした個人の技術ブログサイト（公開URL: `blog.progrust.com`。独自ドメイン `progrust.com` のサブドメイン）。
コンテンツは3タイプ: **辞書**(短い単一トピック)/ **記事**(技術ブログ的な1ページ)/ **本**(複数ページ構成、Zennの本相当)。
辞書ページへのリンク（wikilink）は、ホバーでプレビュー表示・クリックで右サイドペインに表示される。
記事の編集は私のみが行い、ローカルでmarkdownを編集しgithubへプッシュして自動でデプロイ。

## 技術スタック概要

| 項目             | 内容                                    |
| ---------------- | --------------------------------------- |
| フレームワーク   | Astro(コンテンツコレクションを利用する) |
| ホスティング     | Cloudflare Pages                        |
| 辞書リンク記法   | `[[wikilink]]`                          |
| スタイリング     | Tailwind css（ダークモード対応）        |
| コードハイライト | Shiki                                   |
| Markdownパーサー | Sätteri                                 |

Astro v7（2026-06-22リリース）でMarkdownパイプラインが`unified`から**Sätteri**に置き換わったため、本アプリはSätteriを使う。カスタム処理（wikilink・ディレクティブ・リンクカード・mermaid等）はすべてSätteri用のmdast/hastプラグインとして自作する（remark/rehype用の既存プラグインは流用不可）。技術検証は完了済み（全機能PASS）。

## 開発の進め方

本プロジェクトは**仕様駆動開発**で進める。

- 実装は必ず [`docs/spec/`](docs/spec/README.md) の仕様（要求仕様・受入基準）に基づいて行う。仕様にない振る舞いを実装しない
- 仕様の変更・詳細化が必要になったら、**先に該当specを更新**してから実装する
- 各ドキュメントは **SSoT（Single Source of Truth）の原則**に則る: 1つの事実は1つの文書にのみ書き、他からは参照リンクで辿る。同じ情報を複数の文書に重複して書かない（本ファイルも地図に徹し、詳細仕様は持たない）

## ドキュメント地図

詳細仕様・設計・計画はすべて `docs/` 配下に置く。構成と作成ルールは [`docs/README.md`](docs/README.md) に従うこと。

| 知りたいこと | 文書 |
| --- | --- |
| 機能別の詳細仕様と受入基準（コンテンツモデル・ページ・wikilink UI・検索・テーマ・フィード・デプロイ） | [`docs/spec/`](docs/spec/README.md) |
| 全体設計（プロジェクト構成・コレクション定義・データフロー・テスト構成） | [`docs/architecture.md`](docs/architecture.md) |
| 実装ルール（ツールチェーン・コーディング規約・テストの書き方・完了チェックリスト） | [`docs/implementation-rules.md`](docs/implementation-rules.md) |
| 実装計画（フェーズ・タスク・進行状況） | [`docs/plan/`](docs/plan/README.md) |
| 執筆者向けMarkdown記法一覧 | [`docs/markdown-notation/rule.md`](docs/markdown-notation/rule.md) |
| コンテンツのfrontmatter定義 | [`docs/markdown-notation/frontmatter.md`](docs/markdown-notation/frontmatter.md) |
| Sätteriプラグインの実装方式・雛形コード・落とし穴 | [`docs/markdown-pipeline/`](docs/markdown-pipeline/README.md) |
| UIデザインの確定仕様（カラートークン・コンポーネント） | [`docs/ui-design/ui-design-spec.md`](docs/ui-design/ui-design-spec.md) |
| クローズ済み文書の凍結アーカイブ | `docs/archive/` |
