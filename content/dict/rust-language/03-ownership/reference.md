---
title: 参照
description: 所有権を移動させずに値を指し示す&T・&mut T型の値。読み取り専用の共有参照と、排他的に書き換えもできる排他参照の2種類。
created_at: 2026-07-20
updated_at: 2026-07-20
tags: ["所有権", "型システム"]
public: true
---

別の誰かが持っている値を指し示しつつ、その[[ownership]]を持たない値のことを**参照**（reference）と呼びます。
参照は主に、値`x`に対して`&`や`&mut`などのような参照演算子が付与された式（`&x`や`&mut x`）から取得できます。（それ以外の方法でも参照が自動的に作成されるケースがあります。）
参照を作成して別の変数などに渡すことで、[[move]]することなく渡した先で値を利用できます。

```rust playground
fn count_chars(text: &str) -> usize {
    text.chars().count() // 参照経由で値を読める
}

fn main() {
    let message = String::from("こんにちは");
    let len = count_chars(&message); // 参照を作成して関数へ渡す（所有権はムーブしない）
    println!("「{message}」は{len}文字"); // 「message」の所有権は残っているので引き続き使える
}
```

## 2種類の参照

### 共有参照（不変参照）

主に`&`の参照演算子を付与して作成する参照を**共有参照**と呼びます。共有参照では指し示している値を書き換えることはできません（内部可変性パターンのデータ型を除く<!-- TODO: [[interior-mutability]] 作成後にリンク -->）。1つの値を指し示す複数の共有参照が同時に存在していても問題ありません。（共有）

```rust playground
fn main() {
    let message = String::from("こんにちは");
    let message1 = &message;
    let message2 = &message; // 複数の共有参照を同時に作成可能
    // message1.push_str(", 世界"); のような値の変更はできない
    println!("「{message1}」「{message2}」");
}
```

### 排他参照（可変参照）

主に`&mut`の参照演算子を付与して作成する参照を**排他参照**と呼びます。排他参照では指し示している値を書き換えることができます。1つの値を指し示す複数の排他参照が同時に存在することはできません。（排他）

```rust playground
fn main() {
    let mut message = String::from("こんにちは");
    let message1 = &mut message;
    message1.push_str(", 世界"); // 排他参照では値の書き換えができる
    // let message2 = &mut message; // 複数の排他参照を同時に作成することはできない
    // let message3 = &message; // 排他参照が有効な間は共有参照を作成することはできない（逆も同じ）
    println!("「{message1}」");
}
```

:::message{warning}
参照の型は、それが指し示している値の型と同じにはなりません。
例えば`String`という型の値を指し示す参照の型は`&String`となります。（排他参照では`&mut String`）
そのため、`String`の型を期待している変数などに`&String`という参照を渡すことはできません。
:::

:::message{info}
この「共有参照はいくつでも、排他参照はただ1つ」という制約の詳細や、参照の有効期間については[[borrow]]のページを参照してください。
:::


## 補足

:::details[排他参照だけでは値の変更はできない]

排他参照に対してそれが指し示す値を書き換えたい場合は`*`（参照外し）を通す必要があります。<!-- TODO: [[dereference]] 作成後にリンク -->

```rust playground
fn deposit(balance: &mut i32, amount: i32) {
    *balance += amount; // 参照先の値を書き換える
}

fn main() {
    let mut balance = 1000;
    deposit(&mut balance, 500);
    println!("入金後の残高: {balance}円");
}
```

ただし、メソッド呼び出しなど一部の機能では自動参照外しが働き、`*`（参照外し）を書かずとも値を変更することができます。<!-- TODO: [[auto-deref]] 作成後にリンク -->

```rust playground
fn main() {
    let mut message = String::from("こんにちは");
    let message = &mut message;
    message.push_str(", 世界"); // 自動参照外しにより書き換え
    println!("「{message}」");
}
```

:::

:::details[mutでない変数からは排他参照を作れない]
排他参照は「書き換えてよい」という許可を借りるものなので、そもそも書き換えを許していない（`mut`なしで宣言された）変数からは作れません。

<!-- rustc: expect E0596 -->
```rust playground
fn main() {
    let balance = 1000; // mutが付いていない
    let r = &mut balance; // エラー: E0596（不変の変数は排他借用できない）
    *r += 500;
}
```
:::

:::details[共有参照と排他参照の名前の由来について]
「共有参照と排他参照」は「不変参照と可変参照」とも呼ばれることがありますが、`&T`と`&mut T`の本質的な対比は不変/可変ではなく**共有/排他**であるという理解がRustコミュニティに浸透した結果、近年のRustではこの「共有参照と排他参照」という呼び方が好まれる傾向にあります。

実際に共有参照`&T`であったとしても、内部可変性パターンのデータ型の場合は値を変更することが可能になります。
:::
