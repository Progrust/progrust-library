---
title: 変数（Variable）
description: 値に名前を付けて保持する仕組み。Rustでは let で宣言し、デフォルトで不変。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法"]
public: false
---

値に名前を付けて保持するための仕組みです。Rustでは通常、`let` キーワードで変数（ローカル変数）を宣言します（関数の引数も変数の一種です）。変数はデフォルトで**不変**（immutable）であり、宣言時に `mut` を付けたときだけ値を変更できます。型は初期値から推論されるため、多くの場合は型注釈を省略できます（`let nedan: u32 = 300;` のように明示も可能）。

また、未初期化の変数を使うとコンパイルエラーになるほか、同じ名前で `let` を使って宣言し直す「シャドーイング」も許されています。

## コード例

```rust playground
fn main() {
    let nedan = 300; // 不変の変数（mut なしで再代入するとエラー: E0384）
    let mut kosuu = 2; // mut を付けると可変
    kosuu += 1;
    println!("合計: {}円", nedan * kosuu);
}
```

## 補足

:::details[シャドーイングとmutの違い]
`mut` は同じ変数の値を書き換えるのに対し、シャドーイングは `let` で**新しい変数**を作って同じ名前を再利用します。新しい変数なので、元と異なる型にすることもできます。

```rust playground
fn main() {
    let kuuhaku = "   "; // &str型
    let kuuhaku = kuuhaku.len(); // usize型として作り直せる
    println!("空白の数: {}", kuuhaku);
}
```
:::

:::details[未初期化の変数は使えない]
Rustでは宣言と初期化を分けて書けますが、すべての実行経路で初期化されるまでその変数は使えません。

<!-- rustc: expect E0381 -->
```rust playground
fn main() {
    let zandaka: i32;
    println!("{}", zandaka); // エラー: E0381（未初期化の可能性がある変数の使用）
}
```
:::

<!-- TODO: 以下のslug作成後に「## 関連項目」として追加 -->
<!-- TODO: [[mutability]] 作成後にリンク -->
<!-- TODO: [[shadowing]] 作成後にリンク -->
<!-- TODO: [[constant]] 作成後にリンク -->
<!-- TODO: [[type-inference]] 作成後にリンク -->
