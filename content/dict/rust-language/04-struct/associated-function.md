---
title: 関連関数
description: implブロック内で特定の型に紐づけて定義する関数の総称。selfを取らないものはコンストラクタとして多用されるのが特徴。
created_at: 2026-07-22
updated_at: 2026-07-22
tags: ["型システム", "基本文法", "複合型"]
public: true
---

関連関数（associated function）は、implブロック内で特定の型に紐づけて定義する関数です。<!-- TODO: [[impl-block]] 作成後にリンク --> 第一引数に`self`を取るものは特に「メソッド」と呼ばれます。<!-- TODO: [[method]] 作成後にリンク --> 一方、`self`を取らない関連関数は`型名::関数名()`の形で呼び出し、インスタンスがまだ無い状態でも使える点がメソッドと異なります。

:::message{info}
The Rust Referenceの定義では、メソッドも関連関数の一種です。ただし慣習として`self`を取らない側だけを指して「関連関数」と呼ぶことがよくあり、本項でも以降このメソッド以外の関連関数について扱います。
:::

```rust playground
struct User {
    name: String,
    age: u32,
}

impl User {
    // self を取らない関連関数。コンストラクタとしてよく使われる
    fn new(name: String, age: u32) -> Self {
        User { name, age }
    }
}

fn main() {
    let user = User::new(String::from("田中"), 28);
    println!("{}さん（{}歳）", user.name, user.age);
}
```

## 呼び出し方と用途

関連関数は`型名::関数名()`の形で呼び出します（上記の`User::new(...)`）。[[standard-library]]でも[[string]]の`String::new()`・`String::from(...)`や[[vec]]の`Vec::new()`のように、インスタンスを新しく作る「コンストラクタ」的な役割でよく使われます。ただし`new`という名前自体はRustの予約語ではなく単なる命名慣習で、コンパイラが特別扱いするものではありません。

戻り値の型に使った`Self`は、`impl`対象の型（この例では`User`）を指すエイリアスです。`User`と書いても同じ意味ですが、型名を変更してもそのまま使えるため`Self`と書くのが一般的です。

## 補足

:::details[メソッド呼び出しとの関係]
`値.method()`というメソッド呼び出し構文でも、実体は`self`を取る関連関数の呼び出しです。コンパイラが受け手の型に応じて[[reference]]の付与・[[dereference]]を自動で行う（自動参照・自動参照外し）ため、`User::method(&user)`のように通常の関連関数と同じ形式でも呼び出せます（実用上はメソッド構文を使います）。<!-- TODO: [[auto-deref]] 作成後にリンク -->
:::
