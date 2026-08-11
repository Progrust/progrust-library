# Playgroundプロジェクト連携（`:::project`） 仕様

## 1. 概要

記事内の複数のコードブロックを1つのCargoプロジェクトとしてまとめ、Rust Playgroundで複数ファイル構成のまま開けるようにする機能の仕様。Rust Playgroundのマルチファイル対応（`?gist=<id>` で複数ファイルが復元され、シングル/マルチのエディタモードも自動で切り替わる。2026-08時点でフィーチャーフラグは全ユーザー展開済みと確認）を利用する。

Gistは**執筆時にローカルの同期スクリプトが1回だけ作成**し、`ハッシュ → Gist ID` のマッピングファイルをコミットする。ビルドはマッピングを参照するだけで、ネットワークアクセスを行わない（デプロイごとのGist量産を防ぐ）。

関連文書:

- 執筆者向け記法: [`../markdown-notation/rule.md`](../markdown-notation/rule.md)「プロジェクト（複数ファイルをPlaygroundで開く）」
- 単一コードブロック版のPlaygroundボタン: [`pages.md`](pages.md) R-23 / R-25（本仕様はその複数ファイル版。併存する）
- コード記法コメントの除去規則: [`pages.md`](pages.md) R-25（`stripCodeNotation`。本仕様でも同じ規則・同じ実装を共有する）
- 見た目（フレーム・ファイルツリー・ボタンのデザイン）: [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「`:::project`」（確定済み）
- Sätteriプラグインの実装方式: `../markdown-pipeline/`（実装時に作成）

## 2. 要求仕様

### 記法と表示

- **R-1**: `:::project` のcontainer directiveで複数のコードブロックを囲むと、1つのPlaygroundプロジェクトとして扱う。
  - 子には**ファイル名記法付きコードブロック**（` ```rust:src/main.rs ` 等。[`pages.md`](pages.md) R-23と同じ `lang:ファイル名` 記法）を1つ以上置く。ファイル名がプロジェクト内の相対パス（＝Gistのファイル名）になる
  - `rust` 以外の言語のファイル（` ```txt:src/data.txt ` 等）も置ける
  - コードブロックの間に解説文・`:::figure` 等の通常のブロック要素を挟んでよい（通常どおり表示される）
  - プロジェクトのファイルとして扱うのは **`:::project` の直下に置かれたコードブロックのみ**とする。入れ子のディレクティブ（`::::details` 等）の中のコードブロックは通常のコードブロックとして表示され、ファイルツリー・Gistには含まれない
  - `:::project[タイトル]` のlabel記法で任意のプロジェクト名を指定できる。指定時はプロジェクト表示内にタイトルを表示する（省略時はタイトルなし）
- **R-2**: `:::project` 全体に「Playgroundで開く」リンクボタンを**1つ**表示する。押下で `https://play.rust-lang.org/?version=stable&edition=2024&gist=<Gist ID>` を新規タブ（`target="_blank" rel="noopener noreferrer"`）で開く。Gist IDはマッピングファイル（§3）から解決し、URLはビルド時に静的生成する（クライアントJSなし）。ボタンのclass名は既存と同じ `playground-open` とし、見た目は `.code-project` 配下でアクセント色アウトライン型に上書きする（[`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「`:::project`」で確定。単一ブロック版 R-23 のチップは従来のまま）。
- **R-3**: `:::project` 内の全ファイル名から**ファイルツリー**（ディレクトリ階層のツリー表示）を生成して表示する。ツリー内の各ファイル名はページ内アンカーリンクとし、クリックで対応するコードブロックへジャンプする（各コードブロックのラッパに一意なidを付与する。クライアントJSなし）。ツリーの視覚デザイン（box-drawing・並び順等）は [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「`:::project`」で確定済み。
- **R-4**: Gistの内容は「各コードブロックのファイル名 → `stripCodeNotation` 適用後のコード」とする。除去規則と実装は [`pages.md`](pages.md) R-25 に従い、全ファイル（非Rustファイル含む）へ一律に適用する。**表示されるコードブロック側はマーカーを残す**（同R-25と同じ非対称）。
- **R-5**: version / edition は `stable` / `2024` 固定とする（[`pages.md`](pages.md) R-23と同様。プロジェクト別の指定は制約・残課題）。
- **R-6**: 既存の単一ブロック版 ` ```rust playground `（[`pages.md`](pages.md) R-23）は本機能導入後も従来どおり動作する。`:::project` の外のコードブロックの挙動は一切変えない。

### ビルド時検証

- **R-7**: 以下の場合はビルドエラーにする。エラーメッセージには対象ファイルのパスと位置（行:列）を含める（既存ディレクティブのthrow方式に準拠）。
  - (a) `:::project` 内にファイル名記法のないコードブロックがある
  - (b) `:::project` 内に `src/main.rs` も `src/lib.rs` もない（Playgroundで実行できないため）
  - (c) `:::project` 内でファイル名が重複している
  - (d) `:::project` 内のコードブロックに `playground` フェンスメタを併用している（プロジェクトのボタンと競合するため）
  - (e) `:::project` のハッシュ（§3）がマッピングファイルに未登録（メッセージで `npm run sync:playground` の実行を案内する）

### 同期スクリプト

- **R-8**: `npm run sync:playground`（`scripts/sync-playground-gists.mjs`）は、全mdコンテンツ（辞書・記事・本）の `:::project` を走査し、**マッピングに未登録のハッシュのみ** Playgroundの内部API `POST https://play.rust-lang.org/meta/gist`（ボディ `{"code": [{"name": <ファイル名>, "content": <stripCodeNotation適用後コード>}, ...]}`）でGistを作成してマッピングへ追記する。登録済みハッシュはスキップし、再実行してもGistを作らない（冪等）。
  - R-7 (a)〜(d) に違反する `:::project` を見つけた場合は、**NG行で報告してそのプロジェクトのGist作成をスキップする**（内容が欠けた・誤ったGistを作らないため）。1件でもあれば exit code 1 で終了する（R-11）。R-7(e) はビルド側だけの検証のためスクリプトでは扱わない（未登録＝作成対象そのもの）
  - 上記の判定はビルド側プラグインとは**別実装**になる（スクリプトは素のmdastを走査し、ビルド側は `codeFilename` 変換後のノードを走査するため入力形状が異なる）。両者の判定条件がずれないよう、R-7 の条件を変更するときは双方を同時に直す
- **R-9**: 同期スクリプトはマッピングの**旧エントリを削除しない**（コードをrevertした際に既存Gistを再利用するため。マッピングは追記のみで単調増加する）。
- **R-10**: `npm run sync:playground -- --verify` で、マッピング内の**全エントリ**のGist生存確認（`GET https://play.rust-lang.org/meta/gist/<id>` が成功すること）を行う。1件でも失敗があれば失敗一覧を報告して exit code 1 で終了する（Gist作成は行わない）。
- **R-11**: 出力・終了コードの形式は `scripts/check-dict-code.mjs`（[`../markdown-notation/dict-style.md`](../markdown-notation/dict-style.md)「コード例の規則」）に準拠する: ブロックごとの `OK / SKIP / NG` 行 + 末尾サマリ、成功で 0・失敗で 1。
- **R-12**: プロジェクトのハッシュ計算（§3）は、ビルド側プラグインと同期スクリプトで**同一の実装を共有**する（`stripCodeNotation` の一元化と同じ原則。計算方法が乖離すると R-7(e) の検証が壊れるため）。

## 3. データ定義

### マッピングファイル `playground-gists.json`（リポジトリ直下）

同期スクリプトが生成・追記し、gitにコミットする。ビルドはこれを読み取り専用で参照する。

```json
{
  "<ハッシュ>": {
    "id": "66d51816c55e0ac92fde619d3cc38fc3",
    "url": "https://gist.github.com/rust-play/66d51816c55e0ac92fde619d3cc38fc3"
  }
}
```

- キー = プロジェクトのハッシュ（下記）
- `id` = Gist ID（R-2のURL生成に使用）
- `url` = Gistの閲覧URL（人間の確認用。ビルドでは使用しない）

### プロジェクトのハッシュ

`:::project` 内の各ファイルを `[ファイル名, stripCodeNotation適用後コード]` の組とし、ファイル名の昇順（コードポイント順）にソートした配列を `JSON.stringify` した文字列のUTF-8バイト列の **SHA-256（16進小文字）**。

- `stripCodeNotation` 適用後を対象とするため、diffマーカー（`[!code ++]` 等）だけの変更ではハッシュが変わらず、Gistは作り直されない（送信内容が同じため正しい挙動）
- タイトル（`[タイトル]`）や解説文はハッシュに含めない（Gist内容に影響しないため）

## 4. 受入基準

- **AC-1**: `:::project` で囲んだ複数のコードブロックが、`.code-project` のラッパ要素にまとめられ、ラッパ内に「Playgroundで開く」の `<a class="playground-open" href="https://play.rust-lang.org/?version=stable&edition=2024&gist=<マッピング由来のGist ID>" target="_blank" rel="noopener noreferrer">` が**1つだけ**出力される。（R-1, R-2）
- **AC-2**: `:::project` 内の各コードブロックのラッパにページ内で一意なidが付与され、ファイルツリーに全ファイル名が階層表示され、ツリー内の各リンクのhrefが対応するコードブロックのidを指す。（R-3）
- **AC-3**: `:::project[タイトル]` のタイトルがプロジェクト表示内に出力され、省略時はタイトル要素が出力されない。（R-1）
- **AC-4**: コードブロックの間に置いた解説文・`:::figure` が通常どおり表示され、ファイルツリーとGistには含まれない。（R-1, R-4）
- **AC-5**: diffマーカー付きコードを含む `:::project` で、表示側の `<pre>` にはマーカー付きコードが渡り、同期スクリプトがGistへ送る内容はマーカー除去済みコードになる。（R-4）
- **AC-6**: 次のいずれもビルドエラーになり、エラーメッセージに対象mdファイルのパスと位置が含まれる: ファイル名なしブロック / `src/main.rs`・`src/lib.rs` 両方なし / ファイル名重複 / `playground` メタ併用。（R-7 a〜d）
- **AC-7**: マッピング未登録の `:::project` があるとビルドエラーになり、メッセージに `npm run sync:playground` の実行案内が含まれる。（R-7 e）
- **AC-8**: 同期スクリプトを2回連続で実行すると、2回目はGistを1つも作成せず正常終了する（冪等性）。既存エントリは実行後も削除されない。（R-8, R-9）
- **AC-9**: `--verify` で全エントリの生存確認が行われ、全件成功で exit code 0、失敗があると失敗一覧の報告と exit code 1 になる。（R-10）
- **AC-10**: `:::project` の外にある ` ```rust playground ` 単独ブロックの出力（[`pages.md`](pages.md) AC-11の構造）が本機能導入前と変わらない。（R-6）
- **AC-11**: ボタン押下でRust Playgroundが新規タブで開き、`:::project` 内の全ファイルがマルチファイルモードで復元されて実行できる。（R-2）※目視確認

## 5. 未確定事項

なし（PG1-1で解消済み。ファイルツリーUI・タイトル・ボタンの視覚デザインは [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「`:::project`」で確定。構造の目安となるクラス名・HTML骨子も同所に記載）
