---
title: ワークスペース
description: 複数のパッケージをまとめて管理するCargoの単位。共通のCargo.lockとtargetディレクトリを共有するメンバーの集まり。
created_at: 2026-08-16
updated_at: 2026-08-16
tags: ["プロジェクト構成", "Cargo"]
public: true
---

ワークスペースは、一緒に管理される1つ以上の[[package]]の集まりです[^1]。ルートの`Cargo.toml`に`[workspace]`テーブルを置くとその場所が**ワークスペースルート**になり、`members`に並べたディレクトリのパッケージが**メンバー**になります[^1]。メンバーは共通の`Cargo.lock`と出力先の`target`ディレクトリを共有します[^1]。

[[cargo]]はメンバー同士が依存し合うとは仮定しないため、メンバーのライブラリ[[crate]]を別のメンバーから使うときも依存関係を明示します[^2]。この依存はcrates.ioを介さず、`path`でディレクトリを指して宣言します[^1]。

```text
shop/
├── Cargo.lock        ← ワークスペース全体で1つ
├── Cargo.toml        ← [workspace] を書くマニフェスト
├── cart/
│   ├── Cargo.toml
│   └── src/lib.rs
├── register/
│   ├── Cargo.toml
│   └── src/main.rs
└── target/           ← ワークスペース全体で1つ
```

```toml:Cargo.toml
[workspace]
resolver = "3" # 仮想マニフェストでは既定が"1"になるため明示する（補足を参照）
members = ["cart", "register"]
```

```rust:cart/src/lib.rs
/// カートの合計金額を税込（10%）で計算する
pub fn total_price(prices: &[u32]) -> u32 {
    prices.iter().sum::<u32>() * 110 / 100
}
```

```toml:register/Cargo.toml
[package]
name = "register"
version = "0.1.0"
edition = "2024"

[dependencies]
cart = { path = "../cart" } # 同じワークスペースのメンバーをパスで指定する
```

<!-- rustc: skip -->
```rust:register/src/main.rs
use cart::total_price; // メンバーのライブラリクレートを名前で参照する

fn main() {
    let prices = [980, 1250, 300]; // カートに入れた商品の価格
    println!("合計金額: {}円", total_price(&prices));
}
```

ワークスペースルートで`cargo run -p register`と実行すると、`cart`と`register`の両方がビルドされて「合計金額: 2783円」と表示されます（Rust 1.93時点）。`-p`は対象のメンバーを選ぶオプションです[^1]。なおRust Playgroundは単一パッケージ専用のため、ワークスペースは手元で試してください。

## 何が共有され、何が共有されないか

| 対象                                  | 扱い                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `Cargo.lock`                          | ルートに1つ。全メンバーが依存の同じバージョンを使う[^2]                     |
| `target`ディレクトリ                  | ルートに1つ。成果物を使い回すため不要な再ビルドが減る[^2]                   |
| `[profile.*]`・`[patch]`・`[replace]` | ルートのマニフェストでのみ有効。メンバー側に書いても警告が出て無視される[^1] |
| `[dependencies]`                      | 共有されない。使うメンバーごとに宣言が要る[^2]                              |

:::message{warning}
共有されるのは「解決されたバージョン」であって「依存の宣言」ではありません。あるメンバーが[[external-package]]の`regex`を使っていても、別のメンバーで使うにはそのメンバーの`Cargo.toml`にも`regex`を書く必要があります[^2]。
:::

## 補足

:::details[仮想マニフェストとルートパッケージ]
上の例のように、ルートの`Cargo.toml`が`[workspace]`だけを持ち`[package]`セクションを持たない形を**仮想マニフェスト**（virtual manifest）と呼びます[^1]。主役となる[[package]]がなく、すべてを別々のディレクトリに並べて整理したい場合に向いています[^1]。逆に`[package]`のあるマニフェストへ`[workspace]`を足すと、そのパッケージがワークスペースの**ルートパッケージ**になります[^1]。

仮想マニフェストには`package.edition`がないため、Cargoは依存解決の方式（resolver）をエディションから推測できません[^1]。`resolver`を明示しないと既定の`"1"`が使われ、次の警告が出ます（Rust 1.93時点）。

```text
warning: virtual workspace defaulting to `resolver = "1"` despite one or more
workspace members being on edition 2024 which implies `resolver = "3"`
```

:::

:::details[membersに書かなくてもメンバーになるもの]
ワークスペースのディレクトリ内にある`path`依存は、書かなくても自動的にメンバーになります[^1]。`members`に並べるのは、それ以外に含めたいディレクトリです。`members`にはグロブも使えるため、`crates/*`のようにまとめて指定できます[^1]。含めたくないディレクトリは`exclude`で外します[^1]。

なおワークスペース内で`cargo new`を実行すると、作られたパッケージが`members`へ自動で追記されます（Rust 1.93時点）。

```text
$ cargo new cart --lib
    Creating library `cart` package
      Adding `cart` as member of workspace at `/path/to/shop`
```

:::

:::details[設定をメンバーへ継承させる]
`[workspace.package]`と`[workspace.dependencies]`に書いた値は、メンバー側で`キー.workspace = true`と書くと継承できます（Rust 1.64以降）[^1]。バージョンやライセンス、共通で使う依存の指定を1か所にまとめられます。

```toml:Cargo.toml
[workspace.package]
version = "1.2.3"
license = "MIT"

[workspace.dependencies]
regex = "1"
```

```toml:cart/Cargo.toml
[package]
name = "cart"
version.workspace = true
license.workspace = true

[dependencies]
regex.workspace = true
```

`[workspace.dependencies]`側では`optional`を指定できません[^1]（継承するメンバー側で`regex = { workspace = true, optional = true }`と書くことはできます）。
:::

:::details[コマンドの対象を選ぶ]
パッケージ単位のコマンドがどのメンバーに効くかは、フラグで決まります[^1]。

| 実行するコマンド         | 実行場所   | 対象                                                        |
| ------------------------ | ---------- | ----------------------------------------------------------- |
| `cargo test -p cart`     | どこでも   | `cart`メンバーだけ                                          |
| `cargo test --workspace` | どこでも   | 全メンバー                                                  |
| `cargo test`             | メンバー内 | カレントディレクトリのパッケージ                            |
| `cargo test`             | ルート     | `default-members`。未指定なら仮想マニフェストでは全メンバー |

`default-members`はルートで実行したときの既定の対象を絞るための項目です。ルートパッケージのあるワークスペースで未指定の場合は、ルートパッケージが対象になります[^1]。
:::

[^1]: [Workspaces — The Cargo Book](https://doc.rust-lang.org/cargo/reference/workspaces.html)

[^2]: [Cargo Workspaces — The Rust Programming Language](https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html)
