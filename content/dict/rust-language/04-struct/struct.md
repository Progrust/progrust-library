---
title: 構造体
description: 複数の値を名前付きフィールドとして1つにまとめる、ユーザー定義の複合型。
created_at: 2026-07-21
updated_at: 2026-07-21
tags: ["型システム", "基本文法", "複合型"]
public: true
---

構造体（struct）は、複数の値を名前付きの「フィールド」としてひとまとめにする、ユーザーが独自に定義する複合型です。[[tuple]]と違い各値に名前が付くため、フィールドの並び順を覚えていなくても意味が分かります。なお`struct`キーワードでは、本項で扱う名前付きフィールド構造体のほか、フィールドに名前を付けないタプル構造体や、フィールドを持たないユニット様構造体も定義できます。<!-- TODO: [[tuple-struct]] 作成後にリンク --><!-- TODO: [[unit-like-struct]] 作成後にリンク -->

```rust playground
// 構造体定義
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    // 構造体のインスタンス作成
    let user = User {
        name: String::from("田中"),
        age: 28,
        active: true,
    };

    // フィールドへは . でアクセス
    println!("{}さん（{}歳）", user.name, user.age);
}
```

## 定義とアクセス

`struct`キーワードで構造体名と各フィールドの名前・型を宣言します。インスタンスを作るときは`構造体名 { フィールド名: 値, ... }`の形で全フィールドに値を渡します（他インスタンスの値を流用する[[struct-update-syntax]]`..`もあります）。フィールドへのアクセスはドット`.`に続けてフィールド名を書きます。

構造体は[[variable]]と同様にそのフィールドも含めてデフォルトで不変です。インスタンスを`let mut`で変数に束縛すると、`user.age = 29;`のようにフィールドを書き換えられます。

:::message{warning}
可変にできるのはインスタンス単位です。一部のフィールドだけを可変にすることはできません。<!-- TODO: [[mutability]] 作成後にリンク -->
:::

## フィールド初期化省略記法

スコープ内の変数名がフィールド名と一致する場合、`name: name`のような冗長な記述を`name`だけに省略できます（[[function]]の引数として受け取った変数もこれに該当します）。

```rust playground
struct User {
    name: String,
    age: u32,
}

fn build_user(name: String, age: u32) -> User {
    User { name, age } // name: name, age: age の省略形
}

fn main() {
    let user = build_user(String::from("鈴木"), 35);
    println!("{}さん", user.name);
}
```

## 補足

:::details[構造体のデバッグ出力]
構造体はデフォルトでは`println!`の`{}`や`{:?}`で表示できません。構造体定義の直前に`#[derive(Debug)]`属性を付けると、`{:?}`（1行）や`{:#?}`（整形）でフィールドの内容を出力できるようになります。`println!`に関する詳細は[[console-output]]をご確認ください。

```rust playground
#[derive(Debug)]
struct User {
    name: String,
    age: u32,
}

fn main() {
    let user = User { name: String::from("佐藤"), age: 40 };
    println!("{user:?}");  // User { name: "佐藤", age: 40 }
    println!("{user:#?}"); // フィールドごとに改行して整形表示
}
```
:::
