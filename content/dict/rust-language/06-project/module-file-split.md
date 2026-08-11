---
title: モジュールのファイル分割
description: 本体を持たない`mod`宣言でモジュールの中身を別ファイルへ切り出す仕組み。既定のファイルパスはモジュールパスをそのまま写した形。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

`mod shop;`のように本体（`{}`）を持たない[[module]]の宣言は、その中身を外部ファイルから読み込みます[^1]。ファイルの置き場所は既定でモジュールの[[module-path]]をそのまま写した形になります[^1]。ツリーの形を変えずにコードだけをファイルへ分けられるため、`main.rs`が膨らんできたときの整理手段になります。

`mod`は他言語の`#include`のようなテキスト取り込みではありません。ファイルを読み込む`mod`宣言はモジュールツリーの中で**1回だけ**書き、他のファイルからはそれが宣言された場所へのパスで参照します[^2]。

:::project[買い物カートをファイルに分ける]

<!-- rustc: skip -->
```rust:src/main.rs
// `shop`の中身を src/shop.rs から読み込む
mod shop;

fn main() {
    println!("税込合計: {}円", shop::cart::total(&[980, 1250])); // 2453円
}
```

`shop`は`cart`の祖先になるので、`cart`のファイルは`src/shop/`ディレクトリの中に置きます。ツリーの形も[[pub]]によるプライバシー境界の効き方も、`{}`に直接書いた場合と変わりません。

<!-- rustc: skip -->
```rust:src/shop.rs
// `cart`の中身を src/shop/cart.rs から読み込む
pub mod cart;

// 非公開のまま。shop自身とその子孫からは使える
const TAX_RATE: u32 = 10;
```

<!-- rustc: skip -->
```rust:src/shop/cart.rs
pub fn total(prices: &[u32]) -> u32 {
    let subtotal: u32 = prices.iter().sum();
    // ファイルは分かれても、ツリー上の位置は変わらない
    subtotal * (100 + crate::shop::TAX_RATE) / 100
}
```

:::

## ファイルの置き場所

祖先のモジュールはディレクトリになり、モジュール自身の中身は「モジュール名 + `.rs`」のファイルに入ります[^1]。

| モジュールパス      | ファイルパス       | そのファイルの中身 |
| ------------------- | ------------------ | ------------------ |
| `crate`             | `src/main.rs`      | `mod shop;`        |
| `crate::shop`       | `src/shop.rs`      | `pub mod cart;`    |
| `crate::shop::cart` | `src/shop/cart.rs` | `pub fn total`     |

つまり`src/`の直下には、`shop`自身の中身である`shop.rs`と、その子モジュールを入れるディレクトリ`shop/`が並びます。役割が違うので、両方あってよいのです。

## 宣言は1回だけ

`mod`は取り込みではなく**ツリー上の位置の宣言**なので、1つのモジュールをツリーの2か所に置くことはできません。すでに読み込んであるコードを別のファイルから使いたいときに書くのは、`mod`の再宣言ではなく[[use-declaration]]（あるいは`crate::`や[[super]]から始まるパスでの直接参照）です[^2]。

## 2つのスタイル

モジュールの中身は、モジュール名のディレクトリの中の`mod.rs`に置くこともできます[^1]。`src/shop.rs`スタイルが現在推奨される書き方で、`src/shop/mod.rs`スタイルは古い書き方ですが今も有効です[^2]。

| 内容               | `src/shop.rs`スタイル | `src/shop/mod.rs`スタイル |
| ------------------ | --------------------- | ------------------------- |
| `shop`自身の中身   | `src/shop.rs`         | `src/shop/mod.rs`         |
| 子モジュール`cart` | `src/shop/cart.rs`    | `src/shop/cart.rs`        |

`mod.rs`スタイルの難点は、プロジェクト中に`mod.rs`という同名ファイルが大量にでき、エディタで同時に開いたときに見分けづらくなることです[^2]。別々のモジュールで2つのスタイルを混在させること自体は許されますが、読み手が混乱するため避けるのが無難です[^2]。

:::message{warning}
同じモジュールに対して`src/shop.rs`と`src/shop/mod.rs`の両方を置くことはできません[^1]。両方あるとE0761（`file for module 'shop' found at both ...`）になります（Rust 1.93で確認）。
:::

## 補足

:::details[`mod`を書き足したときのエラー]
すでに別の場所で読み込んであるモジュールを、うっかり`mod`し直すと、コンパイラはその位置に対応するファイルを探しに行って見つけられず、E0583（`file not found for module`）になります。このエラーには「クレート内の他の場所に`mod`があるなら`use crate::...`で取り込め」という助言が付きます（Rust 1.93で確認）。
:::

:::details[`#[path]`属性で置き場所を変える]
既定の対応関係から外れた場所にファイルを置きたい場合は、`#[path]`属性でパスを指定できます[^1]。

<!-- rustc: skip -->
```rust
#[path = "legacy/shop_v1.rs"]
mod shop;
```

インラインモジュールの中で使う場合、相対パスの起点は、クレートルート（`main.rs`・`lib.rs`など）や`mod.rs`といったmod-rsファイルと、それ以外のnon-mod-rsファイルとで変わります[^1]。なお`#[path]`を使えば同じファイルを2か所から読み込めますが、その場合は中身が独立した2つのモジュールとして二重に定義されます。
:::

:::details[ファイルを分ける単位の目安]
ファイル分割はあくまで整理の手段で、[[crate]]の公開APIの形とは独立です。まずインラインモジュールで構造を決め、ファイルが読みづらい大きさになった時点で切り出す進め方が扱いやすくなります。切り出したあとで公開APIの形だけを整えたい場合は[[re-export]]と組み合わせます。
:::

[^1]: [Modules — The Rust Reference](https://doc.rust-lang.org/reference/items/modules.html)

[^2]: [Separating Modules into Different Files — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html)
