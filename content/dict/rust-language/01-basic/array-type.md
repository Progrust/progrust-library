---
title: 配列型（Array Type）
description: 同じ型の要素を固定長で並べたプリミティブ型。要素数はコンパイル時に確定する型の一部。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法", "プリミティブ型", "複合型"]
public: false
---

配列型（array type、`[T; N]`）は、同じ型の要素を固定長で並べたプリミティブ型です。要素数`N`はコンパイル時に確定する[[constant]]で、型自体の一部になります。そのため`[i32; 3]`と`[i32; 4]`は異なる型として扱われます。[[primitive-type]]の分類では、[[integer-type]]のような単一の値を表す**スカラー型**とは異なり、複数の値をまとめる**複合型**に属します。

## コード例

```rust playground
fn main() {
    let scores: [i32; 3] = [80, 95, 70]; // 3科目の点数
    println!("2科目目: {}", scores[1]);
    println!("要素数: {}", scores.len());
}
```

## アクセス方法

要素には`array[index]`という添字アクセスで取得します。添字は`usize`型でなければならず、実行時に境界チェックされるため、範囲外を指定すると即座にパニックします。パニックさせずに範囲外を検出したい場合は、`Option`を返す`get`メソッドを使います。全要素を順に処理したいときは`for`文で反復できます。

```rust playground
fn main() {
    let scores: [i32; 3] = [80, 95, 70];

    println!("1科目目: {}", scores[0]); // 添字アクセス

    match scores.get(3) {
        // 範囲外でもパニックせずOptionで受け取れる
        Some(score) => println!("4科目目: {}", score),
        None => println!("4科目目のデータはありません"),
    }

    for score in &scores {
        // &を付けて反復すると各要素への参照を借用する
        print!("{score} ");
    }
    println!();
}
```

## 補足

:::details[同じ値で埋めるリピート式]
`[value; N]`という書き方（リピート式）で、同じ値を`N`個並べた配列を初期化できます。要素数が2以上の場合、`value`は`Copy`を実装した型の値であるか、const項目またはconstブロックである必要があります（The Rust Reference, Array expressions）。

```rust playground
fn main() {
    let zeros: [i32; 5] = [0; 5]; // 0を5個並べる
    println!("{:?}", zeros);
}
```
:::

:::details[可変長が必要なら`Vec<T>`]
配列は要素数が固定でコンパイル時に決まります（ローカル変数に束縛した場合は通常スタック上に置かれますが、`Box<[T; N]>`のようにヒープへ置くこともできます）。実行時に要素数が変わるデータを扱いたい場合は、常にヒープ上に確保され伸縮可能な標準ライブラリの`Vec<T>`を使います。
:::

<!-- TODO: [[vec]] 作成後にリンク -->
