# コンテンツモデル 仕様

## 1. 概要

コンテンツの種別・ディレクトリ構成・ID/URL規則・公開制御（`public`）・ビルド時検証・画像管理・タグ方針を定義する。すべてのページ機能の土台となる仕様。

関連文書:

- frontmatterのフィールド定義と`public: false`の意味論: [`../markdown-notation/frontmatter.md`](../markdown-notation/frontmatter.md)（執筆者向け・正）
- コレクション定義の実装方式: [`../architecture.md`](../architecture.md)
- wikilink検証の実装方式: [`../markdown-pipeline/wikilink.md`](../markdown-pipeline/wikilink.md)

## 2. 要求仕様

### コンテンツ種別とコレクション

- **R-1**: コンテンツは4コレクションで管理する。
  | コレクション | 内容 | ソース |
  | --- | --- | --- |
  | `dict` | 辞書（短い単一トピック） | `content/dict/**/*.md` |
  | `articles` | 記事（技術ブログ的な1ページ） | `content/articles/**/*.md` |
  | `books` | 本のメタ情報 | `content/books/*/index.md` |
  | `chapters` | 本の章 | `content/books/*/*.md`（`index.md`以外） |
- **R-2**: 各コレクションのfrontmatterは [`frontmatter.md`](../markdown-notation/frontmatter.md) の定義に従い、zodスキーマで検証する。スキーマ違反はビルドエラーとする。

### ディレクトリ構成とファイル名

- **R-3**: mdコンテンツのディレクトリ構成は以下とする。
  ```
  content/
    ├ dict/      … 配下のフォルダ構造は任意に整理可能
    ├ articles/  … 配下のフォルダ構造は任意に整理可能
    └ books/
        └ [本のslug]/
            ├ index.md（本のメタ情報・トップページ内容）
            └ [章のslug].md
  ```
- **R-4**: ファイル名はURLになるため、英数字のkebab-case（`ownership.md` 等）で記載必須とする。
- **R-5**: `dict` / `articles` はフォルダ階層に関係なく**ファイル名のみ**をID（=URLのslug）とする（Content Layer APIのglobローダーで`generateId`をカスタマイズ）。
- **R-6**: `dict` 配下でmdファイル名が一意でない場合（別フォルダに同名ファイルが存在する場合）はビルドエラーとする。wikilinkがファイル名でリンク先を特定するため。

### 本と章の順序

- **R-7**: 章の順序はファイル名先頭のゼロ埋め2桁連番の昇順とする（`01-intro.md` → `02-environment.md` → …）。
- **R-8**: URLでは連番を削る（`01-intro.md` → `/books/xxx/intro`）。
- **R-9**: 以下はビルドエラーとする（`index.md`は連番チェックの対象外）。
  - ファイル名の先頭にゼロ埋め2桁の数値+ハイフンがない章ファイル
  - 連番を除去したファイル名が、同じ本の別の章と重複する場合

### 公開制御（`public`）

意味論の正は [`frontmatter.md` の補足](../markdown-notation/frontmatter.md#補足非公開public-falseについて)（本番ビルドから完全除外・404・逆リンク非掲載・本index非公開時の章への伝播・章単独非公開時の目次/ナビからのスキップ）。本specでは環境ごとの扱いを追加定義する。

- **R-10**: `public: false` の除外は**本番ビルド（`astro build`）のみ**適用する。開発サーバ（`astro dev`）では非公開コンテンツも表示し、非公開であることが識別できる表示を付ける。識別表示は各詳細ページ（辞書・記事・本トップ・章）のヘッダーメタ行（タグ・日付と同じ行）の先頭に、等幅小サイズ・アクセント色枠の「非公開」バッジとして表示する（devビルドのみ描画。一覧・embed断片は対象外）。
- **R-11**: 本番ビルドでの除外は次のすべてに及ぶ: ページ生成（URL直アクセスは404）、一覧・新着、検索インデックス、RSS、sitemap、逆リンク一覧、embedパーシャル。
- **R-12**: 本の`index.md`が非公開の場合、配下の章は章側の`public`の値に関わらず丸ごと除外する。

### wikilinkのリンク検証

wikilinkの記法・変換仕様は [`wikilink-ui.md`](wikilink-ui.md) と [`../markdown-pipeline/wikilink.md`](../markdown-pipeline/wikilink.md) を参照。ここではビルド時検証のみ定義する。

- **R-13**: wikilinkのリンク先はdictコレクションのファイル名とする。リンク先が存在しない場合はビルドエラーとする。
- **R-14**: 公開ページ（`public: true`）から非公開の辞書へリンクしている場合、本番でリンク切れ（404）となるためビルドエラーとする。非公開ページから非公開の辞書へのリンクは許可する（公開非対称ルール）。
- **R-15**: R-13/R-14のエラーメッセージには、リンク元ファイルとリンク先slugを含める。

### 画像管理

- **R-16**: 画像は`src/assets/`に配置し、`astro:assets`の画像最適化を通す。`public/`への生置きはOGP画像・faviconなど最適化不要なもののみとする。
- **R-17**: `src/assets/`配下のフォルダ構造はコンテンツのディレクトリ構成をミラーする。
  - 記事: `src/assets/articles/[記事slug]/xxx.png`
  - 本: `src/assets/books/[本slug]/xxx.png`
  - 辞書: 画像が少ない想定のため `src/assets/dict/` に平置き

### タグ

- **R-18**: タグは完全に自由記述とする。マスタ管理・ビルド時の検証は行わない。
- **R-19**: タグ・更新日などのメタ情報は本と章が独立して持つ。タグ検索・一覧では章コンテンツも対象に含める。

## 3. データ定義

URL規則（ID→URLの対応）:

| コンテンツ | URL |
| --- | --- |
| 辞書詳細 | `/dict/[ファイル名]` |
| 記事詳細 | `/articles/[ファイル名]` |
| 本トップ | `/books/[本のディレクトリ名]` |
| 章詳細 | `/books/[本のディレクトリ名]/[連番を除いたファイル名]` |

一覧・トップ等のURLは [`pages.md`](pages.md) を参照。

## 4. 受入基準

- **AC-1**: frontmatterに必須フィールド（例: `title`）が欠けたmdファイルがあると、ビルドが失敗しファイル名がエラーに含まれる。
- **AC-2**: `content/dict/a/foo.md` と `content/dict/b/foo.md` が同時に存在すると、ビルドが失敗し両ファイルパスがエラーに含まれる。（R-6）
- **AC-3**: `content/dict/basics/ownership.md` が `/dict/ownership` として生成される。（R-5）
- **AC-4**: `content/books/rust-book/02-setup.md` が `/books/rust-book/setup` として生成され、章目次で `01-*.md` の次に並ぶ。（R-7, R-8）
- **AC-5**: 連番のない章ファイル（`intro.md`）、または連番除去後に重複する章ファイル（`01-setup.md` と `02-setup.md`）があるとビルドが失敗する。（R-9）
- **AC-6**: `public: false` のコンテンツが本番ビルドでページ生成されず、一覧・検索インデックス・RSS・sitemapのいずれにも含まれない。（R-10, R-11）
- **AC-7**: `public: false` のコンテンツが開発サーバでは表示され、非公開の識別表示が付く。（R-10）
- **AC-8**: 本の`index.md`を`public: false`にすると、`public: true`の章も含めて本番ビルドから除外される。（R-12）
- **AC-9**: 存在しないslugへのwikilinkを含むmdがあると、ビルドが失敗しリンク元ファイルとリンク先slugがエラーに含まれる。（R-13, R-15）
- **AC-10**: 公開記事から非公開辞書へのwikilinkはビルドエラーになり、非公開記事から非公開辞書へのwikilinkはビルドが成功する。（R-14）

## 5. 未確定事項

なし（開発サーバでの非公開識別表示の具体デザインはR-10に確定済み）。
