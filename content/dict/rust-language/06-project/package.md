---
title: パッケージ
description: 1つ以上のクレートをCargo.tomlでまとめたビルド・配布の単位。ライブラリクレートは最大1つ、バイナリクレートは複数持てる。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成", "Cargo"]
public: true
---

パッケージは、1つ以上のクレート（コンパイルの単位）をまとめた、Cargoが扱うビルド・配布の単位です。ルートには必ず`Cargo.toml`（マニフェスト）が置かれ、パッケージ名・バージョン・依存関係といったパッケージ全体の設定が記述されます[^1]。`cargo new`が作るのもパッケージで、Rustのプロジェクトを扱う基本単位になります。<!-- TODO: [[crate]] 作成後にリンク -->

1つのパッケージに入れられるライブラリクレートは最大1つですが、バイナリクレートは何個でも入れられます（クレートは少なくとも1つ必要です）[^1]。両方を持つ構成にすると、ロジックをライブラリクレート側にまとめ、バイナリクレートからはパッケージ名で呼び出せます。

:::project[ライブラリとバイナリを持つパッケージ]

```rust:src/lib.rs
/// カートの合計金額を税込（10%）で計算する
pub fn total_price(prices: &[u32]) -> u32 {
    prices.iter().sum::<u32>() * 110 / 100
}
```

<!-- rustc: skip -->
```rust:src/main.rs
// ライブラリクレートはパッケージ名で参照する（Playgroundではパッケージ名が playground 固定）
use playground::total_price;

fn main() {
    let cart = [980, 1250, 300]; // カートに入れた商品の価格
    println!("合計金額: {}円", total_price(&cart));
}
```

:::

## パッケージの構成

どのファイルがどのクレートになるかは、Cargoの規約（ファイルの配置）で決まります[^1]。`Cargo.toml`はどのクレートにも属さず、`src/`と同じ階層（パッケージのルート）に置きます。

| ファイル             | なるクレート                             | 個数    |
| -------------------- | ---------------------------------------- | ------- |
| `src/lib.rs`         | ライブラリクレート                       | 最大1つ |
| `src/main.rs`        | バイナリクレート（クレート名はパッケージ名） | 最大1つ |
| `src/bin/`直下のファイル | バイナリクレート                     | 何個でも |

## 補足

:::details[cargo newが生成するもの]
`cargo new shopping`を実行すると、`Cargo.toml`と`src/main.rs`だけを持つバイナリのパッケージが作られ、同時にgitリポジトリも初期化されます（すでにVCSの管理下にある場合は初期化しません）。`--lib`を付けると`src/lib.rs`を持つライブラリのパッケージになります[^2]。

```toml:Cargo.toml
[package]
name = "shopping"
version = "0.1.0"
edition = "2024"

[dependencies]
```

`edition`の既定値は2024です（Rust 1.93で確認）[^2]。外部のパッケージを使うときは`[dependencies]`への追記が必要ですが、[[standard-library]]は追記なしで使えます。
:::

:::details[パッケージ名とクレート名がずれることがある]
パッケージ名にはハイフンを使えますが、ライブラリクレートの名前は既定で「パッケージ名のハイフンをアンダースコアに置き換えたもの」になります[^1]。そのため`shopping-cart`パッケージのライブラリは、コード上では`use shopping_cart::...`と書きます。
:::

:::details[複数のパッケージをまとめるワークスペース]
パッケージが増えてきたら、複数のパッケージを一緒に管理する「ワークスペース」を作れます。ワークスペースのメンバーは共通の`Cargo.lock`と出力先の`target`ディレクトリを共有します[^3]。パッケージの外側にもう一段階の単位があるため、パッケージが管理の最大単位とは限りません。<!-- TODO: [[workspace]] 作成後にリンク -->
:::

[^1]: [Glossary（Package） — The Cargo Book](https://doc.rust-lang.org/cargo/appendix/glossary.html#package)、[Packages and Crates — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html)、[Cargo Targets — The Cargo Book](https://doc.rust-lang.org/cargo/reference/cargo-targets.html)

[^2]: [cargo new — The Cargo Book](https://doc.rust-lang.org/cargo/commands/cargo-new.html)

[^3]: [Workspaces — The Cargo Book](https://doc.rust-lang.org/cargo/reference/workspaces.html)
