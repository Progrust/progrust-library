---
title: プリミティブ型（Primitive Types）
description: Rustコンパイラに組み込まれた基本型の総称。単一の値のスカラー型と複数の値をまとめる複合型に大別。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法", "プリミティブ型"]
public: false
---

プリミティブ型（primitive type）は、Rustコンパイラに組み込まれた基本的な型の総称です。`String`や`Vec<T>`のように標準ライブラリが提供する型とは異なり、言語自体が直接サポートします。

The Rust Programming Language では、単一の値を表す**スカラー型**と、複数の値を1つにまとめる**複合型**に分類されます。スカラー型はいずれも`Copy`を実装するため、代入や関数呼び出しでは値がコピーされます。

| 分類 | 含まれる型 |
| --- | --- |
| スカラー型（単一の値） | [[integer-type]]・[[floating-point-type]]・[[boolean-type]]・[[char-type]] |
| 複合型（複数の値） | タプル `(T, U)`・配列 `[T; N]` |

## コード例

```rust playground
fn main() {
    // スカラー型: それぞれ単一の値
    let quantity: i32 = 3;      // 整数型
    let price: f64 = 199.5;     // 浮動小数点型
    let in_stock: bool = true;  // 論理値型
    let grade: char = 'A';      // 文字型

    // 複合型: 複数の値を1つにまとめる
    let item: (char, f64) = (grade, price); // タプル（異なる型を混在できる）
    let prices = [199.5, 120.0, 80.0];      // 配列（同じ型を固定長で並べる）

    println!("数量{}個 / 単価{}円 / 在庫{} / 評価{}", quantity, price, in_stock, grade);
    println!("タプル先頭{} / 配列の要素数{}", item.0, prices.len());
}
```

## 補足

:::details[スカラー型と複合型（TRPL の分類）]
The Rust Programming Language は、プリミティブ型を用途で2つに分けています。**スカラー型**は「単一の値」を表す型で、整数・浮動小数点数・論理値・文字の4種類です。**複合型**は複数の値を1つにまとめる型で、要素の型を混在できる**タプル**`(T, U)`と、同じ型を固定長で並べる**配列**`[T; N]`があります。配列や小さなタプルは、要素がすべて`Copy`であれば全体も`Copy`になります。
:::

:::details[Rust Reference が定めるプリミティブ型の一覧]
スカラー型・複合型のほかにも、言語組み込みのプリミティブ型があります。文字列スライス`str`、スライス`[T]`、参照`&T` / `&mut T`、生ポインタ`*const T` / `*mut T`、関数ポインタ`fn`、ユニット型`()`などです。`String`が標準ライブラリの型であるのに対し`str`はプリミティブ型、というように「組み込みかどうか」が両者を分けます。

なお、16 / 128ビット浮動小数点型`f16` / `f128`とnever型`!`は、Rust 1.94時点ではまだ experimental（不安定）です。
:::

<!-- TODO: [[type-inference]] 作成後にリンク -->
