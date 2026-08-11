---
title: クレート
description: Rustコンパイラが一度に処理するコンパイルの最小単位。実行可能なバイナリクレートと、機能を共有するライブラリクレートの2種類。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

クレートは、Rustコンパイラが一度に処理するコンパイルの最小単位です。実行可能ファイルにコンパイルされる**バイナリクレート**と、実行可能ファイルにはならず機能を他から使わせる**ライブラリクレート**の2種類があります[^1]。

バイナリクレートには実行時の入口となる`main`という[[function]]が必要で、ライブラリクレートは`main`を持ちません。1つの[[package]]には、ライブラリクレートを最大1つ、バイナリクレートを何個でも入れられます[^1]。

:::project[ライブラリとバイナリを持つパッケージ]

```rust:src/lib.rs
/// 送料込みの合計金額を計算する（3000円以上は送料無料）
pub fn total_with_shipping(prices: &[u32]) -> u32 {
    let subtotal: u32 = prices.iter().sum();
    if subtotal >= 3000 { subtotal } else { subtotal + 500 }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
// ライブラリクレートはクレート名で参照する（Playgroundでは playground 固定）
use playground::total_with_shipping;

fn main() {
    let cart = [1200, 800]; // カートに入れた商品の価格
    println!("お支払い金額: {}円", total_with_shipping(&cart));
}
```

:::

## クレートルート

クレートルートは、コンパイラが最初に読み込むソースファイルで、そのクレートのルート[[module]]になります[^1]。クレートの中身は入れ子になったモジュールのツリーで、ルートモジュールはその頂点にあたる、パスの上では名前を持たない無名のモジュールです[^2]。絶対パスの起点に書く`crate::`は、この頂点を指しています。

どのファイルがクレートルートになるかは、言語仕様ではなくCargoの規約で決まります。Cargoはファイルの配置からクレートを自動的に見つけます[^1][^3]。

| ファイル                 | なるクレート       | 決まる名前                                     |
| ------------------------ | ------------------ | ---------------------------------------------- |
| `src/lib.rs`             | ライブラリクレート | クレート名はパッケージ名（`-`は`_`に置換）     |
| `src/main.rs`            | バイナリクレート   | 実行ファイル名はパッケージ名                   |
| `src/bin/`直下のファイル | バイナリクレート   | 実行ファイル名はファイル名（`report.rs`→`report`） |

`src/bin/`に置いたファイルはそれぞれ独立したバイナリクレートになるため、1つのパッケージから複数の実行可能ファイルを作れます[^1]。実行するものは`cargo run --bin report`のように選びます[^3]。

<!-- rustc: skip -->
```rust:src/bin/report.rs
// このファイル自体が1つのバイナリクレートになる（cargo run --bin report で実行）
use playground::total_with_shipping;

fn main() {
    println!("送料込み: {}円", total_with_shipping(&[1200, 800]));
}
```

## 補足

:::details[rustcから見たクレート]
`cargo`を使わずに`rustc`へソースファイルを1つ渡した場合も、コンパイラはそのファイルを1つのクレートとして扱います[^1]。クレートはCargo固有の概念ではなく、コンパイラそのものの単位です。

そのrustcのレベルでは、クレートの種類は`--crate-type`で指定する成果物の種類にすぎません。指定できるのは`bin`・`lib`のほか`rlib`・`dylib`・`cdylib`・`staticlib`・`proc-macro`を含む7種類で、1回のコンパイルで複数の成果物を生成することもできます[^4]。Cargoを使う場合は通常ファイルの配置から自動的に決まりますが、C言語から使えるライブラリを作る場合などは`Cargo.toml`の`[lib]`に`crate-type`を明示します[^3]。
:::

[^1]: [Packages and Crates — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html)

[^2]: [Crates and source files — The Rust Reference](https://doc.rust-lang.org/reference/crates-and-source-files.html)

[^3]: [Cargo Targets — The Cargo Book](https://doc.rust-lang.org/cargo/reference/cargo-targets.html)

[^4]: [Linkage — The Rust Reference](https://doc.rust-lang.org/reference/linkage.html)
