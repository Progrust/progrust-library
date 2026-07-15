# spec ディレクトリ（機能別詳細仕様書）

サイトの各機能の**振る舞いの詳細仕様と受入基準**を置くディレクトリ。仕様駆動開発の起点となる文書群。

- ここに書くこと: 機能の振る舞い・エッジケース・データ定義（インターフェース）・受入基準
- ここに書かないこと:
  - 実装方式・コード構造 → [`../architecture.md`](../architecture.md)
  - 見た目（色・レイアウト・コンポーネントデザイン） → [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)
  - Sätteriプラグインの実装詳細 → [`../markdown-pipeline/`](../markdown-pipeline/README.md)
  - 実装タスク・進行状況 → [`../plan/`](../plan/README.md)

## 文書一覧

| 文書 | 対象機能 |
| --- | --- |
| [content-model.md](content-model.md) | コンテンツモデル（コレクション・ID/URL規則・公開制御・ビルド時検証・画像・タグ） |
| [pages.md](pages.md) | 全画面のページ仕様（トップ・一覧・詳細・タグ・404） |
| [wikilink-ui.md](wikilink-ui.md) | 辞書リンクのUI（ホバープレビュー・サイドペイン・embedパーシャル・逆リンク） |
| [search.md](search.md) | 検索（インデックス・クエリ構文・検索ボックス・一覧絞込） |
| [theme.md](theme.md) | ライト/ダークテーマ切替 |
| [feeds-meta.md](feeds-meta.md) | RSS・sitemap・OGP/meta・アクセス解析 |
| [deploy.md](deploy.md) | GitHub Actions → Cloudflare Pages デプロイ |

## 章構成テンプレート

各仕様書は以下の構成で書く。

```
# [機能名] 仕様

## 1. 概要
目的・スコープ・関連文書へのリンク

## 2. 要求仕様
振る舞いの詳細。エッジケース含む。R-1, R-2… の番号付き（受入基準から参照する）

## 3. データ定義（必要な場合のみ）
JSONスキーマ・data属性・URL形式などのインターフェース定義

## 4. 受入基準
AC-1, AC-2… のチェックリスト形式。「〜するとビルドエラーになる」「〜が表示される」など検証可能な文で書く

## 5. 未確定事項
実装時に決める項目。決定したら本文へ反映し、この節から消す
```

## 更新ルール

- [`../README.md`](../README.md) のドキュメント管理ルール（1事実1文書・読者別分離）に従う
- 仕様変更時はまず該当specを更新し、実装をそれに合わせる（仕様駆動）
- 受入基準は実装フェーズの完了条件（[`../plan/`](../plan/README.md)）から参照される
