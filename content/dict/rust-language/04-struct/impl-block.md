---
title: implブロック
description: 型に紐づけて関連関数・メソッドを定義するためのブロック。複数のimplブロックへの分割が可能な点が特徴。
created_at: 2026-07-23
updated_at: 2026-07-23
tags: ["型システム", "基本文法", "複合型"]
public: true
---

implブロック（`impl 型名 { ... }`）は、特定の型に紐づけて[[associated-function]]や[[method]]を定義するためのブロックです。同じ型に対するimplブロックを1つにまとめる必要はなく、複数に分けて書くこともできます。

```rust playground
struct User {
    name: String,
    age: u32,
}

// 1つ目のimplブロック: コンストラクタ用の関連関数をまとめる
impl User {
    fn new(name: String, age: u32) -> Self {
        User { name, age }
    }
}

// 2つ目のimplブロック: メソッドは別のブロックに分けてもよい
impl User {
    fn is_adult(&self) -> bool {
        self.age >= 18
    }
}

fn main() {
    let user = User::new(String::from("田中"), 20);
    println!("成人: {}", user.is_adult());
}
```

## 定義できる範囲の制約

implブロックで関連関数・メソッドを追加できるのは、その型が定義されているのと同じクレート内に限られます。[[standard-library]]が提供する型（例: `Vec<T>`）に対して、自分のクレートから直接implブロックを追加することはできません。

:::message{info}
implブロックに置けるのは関連関数・メソッドだけではありません。定数を関連定数として置くこともできますが、本項では関連関数・メソッドに絞って扱います。
:::

## 補足

:::details[名前の重複は複数のimplブロックをまたいでも許されない]
implブロックを複数に分けても、同じ型に対して同じ名前の関連関数・メソッドを重複して定義することはできません。ブロックをまたいでいてもコンパイルエラーになります。

<!-- rustc: expect E0592 -->
```rust
struct User;

impl User {
    fn greet(&self) {}
}

impl User {
    fn greet(&self) {} // エラー: E0592（重複した定義）
}
```
:::

:::details[`impl Trait for 型名`との違い]
本項で扱う`impl 型名 { ... }`とは別に、`impl トレイト名 for 型名 { ... }`という形でトレイトを型に実装する用途でも`impl`キーワードを使います。こちらはトレイトの実装であり、扱う内容が異なるため別項で扱います。<!-- TODO: [[trait]] 作成後にリンク -->
:::
