---
title: タプル型（Tuple Type）
description: 異なる型の値を固定個数まとめられるプリミティブ型。要素の型の並びと個数が型の一部。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法", "プリミティブ型", "複合型"]
public: true
---

タプル型`(T1, T2, …)`は、値を固定個数並べて1つにまとめる[[primitive-type]]です。
すべての要素が同じ型でなければならない[[array-type]]と異なり、要素ごとに別の型を持てます。
要素の型の並びと個数は型自体の一部で、コンパイル時に確定します。そのため`(i32, bool)`と`(bool, i32)`は異なる型として扱われます。

```rust playground
fn main() {
    // 商品名・価格・セール対象かどうかをひとまとめにする
    let item: (String, u32, bool) = (String::from("りんご"), 150, true);
    println!("{}は{}円です", item.0, item.1);

    let (name, price, on_sale) = item; // パターンで分解
    println!("{} / {}円 / セール対象: {}", name, price, on_sale);
}
```

## アクセス方法

### 方法①：タプルインデックス式

`tuple.0`のように`.`の後ろへ10進リテラルを書いて要素へアクセスします。インデックスに指定できるのはリテラルのみで、`tuple.i`のように実行時の値で要素を選ぶことはできません。範囲外のインデックスはコンパイルエラーになります。

```rust playground
fn main() {
    let point: (i32, i32) = (3, 5);
    println!("x座標: {}", point.0);
    println!("y座標: {}", point.1);
}
```

### 方法②：パターンによる分解

`let (a, b) = tuple;`のように、パターンを使って全要素をまとめて取り出せます。関数の引数や`match`でも同じパターンが使えます。

```rust playground
fn main() {
    let point: (i32, i32) = (3, 5);
    let (x, y) = point; // 各要素をまとめて取り出す
    println!("x座標: {}, y座標: {}", x, y);
}
```

## 補足

:::details[要素0個のタプルはユニット型]
要素が0個のタプル型`()`は**ユニット型**と呼ばれます。値も`()`の1つだけで、意味のある値を返さない式や関数の型として使われます。<!-- TODO: [[unit-type]] 作成後にリンク -->
:::

:::details[1要素タプルにはカンマが必要]
要素が1個のタプルは、末尾にカンマを付けて括弧付きの式・型と区別します。

```rust playground
fn main() {
    let single: (i32,) = (500,); // カンマがあれば1要素タプル
    let grouped: i32 = (500); // カンマがなければただの括弧式（型はi32）
    println!("{} {}", single.0, grouped);
}
```
:::
