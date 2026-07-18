---
title: 変数
description: 値に名前を付けて保持する仕組み。Rustでは let で宣言し、デフォルトで不変。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法"]
public: true
---

値に名前を付けて保持するための仕組みです。
Rustでは通常、`let`キーワードで変数を宣言します。

```rust playground
fn main() {
    let price = 300; // 変数宣言と初期化
    println!("合計: {}円", price);
}
```

:::message{tip}
関数の引数も変数の一種です。
:::

## 変数はデフォルトで不変

変数はデフォルトで**不変**（immutable）です。
宣言時に `mut` を付けたときだけ値を変更できます。

```rust playground
fn main() {
    let price = 300; // 不変の変数（mut なしで再代入するとエラー: E0384）
    let mut count = 2; // mut を付けると可変
    count += 1;
    println!("合計: {}円", price * count);
}
```

## 補足

:::details[シャドーイングとmutの違い]
`mut` は同じ変数の値を書き換えるのに対し、[[shadowing]]は `let` で**新しい変数**を作って同じ名前を再利用します。新しい変数なので、元と異なる型にすることもできます。

```rust playground
fn main() {
    let spaces = "   "; // &str型
    let spaces = spaces.len(); // usize型として作り直せる
    println!("空白の数: {}", spaces);
}
```
:::

:::details[未初期化の変数は使えない]
Rustでは宣言と初期化を分けて書けますが、すべての実行経路で初期化されるまでその変数は使えません。

<!-- rustc: expect E0381 -->
```rust playground
fn main() {
    let balance: i32;
    println!("{}", balance); // エラー: E0381（未初期化の可能性がある変数の使用）
}
```
:::
