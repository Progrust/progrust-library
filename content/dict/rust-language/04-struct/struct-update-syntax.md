---
title: 構造体更新記法
description: 既存インスタンスの値を流用し、残りのフィールドを埋めて新しいインスタンスを作る構文。
created_at: 2026-07-21
updated_at: 2026-07-21
tags: ["所有権", "型システム", "複合型"]
public: true
---

構造体更新記法（`..base`）は、既存の[[struct]]のインスタンス（base）から値を流用して新しいインスタンスを作る記法です。明示的に指定したフィールドには新しい値が使われ、指定しなかった残りのフィールドはbaseから引き継がれます。全フィールドを毎回書き並べずに、一部だけ異なるインスタンスを簡潔に作れます。

:::message{warning}
`..base`は必ずフィールド列の最後に置く必要があります（`{..base, y: 0}`のように先頭や途中に置くと構文エラーになります）。他言語のスプレッド構文と混同しないよう注意してください。
:::

```rust playground
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    let user1 = User {
        name: String::from("田中"),
        age: 28,
        active: true,
    };

    // name と active は user1 の値を流用し、age だけ上書き
    let user2 = User {
        age: 29,
        ..user1
    };

    println!("{}さん（{}歳）", user2.name, user2.age);
}
```

## 所有権への影響

`..base`で引き継がれるフィールドは、[[ownership]]の観点では[[move]]と同じ規則に従います。フィールドの型によって、base側がその後も使えるかどうかが変わります。

| baseのフィールド型 | `..base`での挙動 | base側のその後 |
| --- | --- | --- |
| `Copy`実装あり（例: `u32`） | コピー | フィールド単体は引き続き使用可 |
| `Copy`未実装（例: `String`） | ムーブ | 使用不可 |

<!-- TODO: [[copy]] 作成後にリンク -->

<!-- rustc: expect E0382 -->
```rust playground
struct User {
    name: String,
    age: u32,
}

fn main() {
    let user1 = User { name: String::from("田中"), age: 28 };
    let user2 = User { age: 29, ..user1 }; // name（非Copy型）が user1 からムーブ

    println!("{}", user2.name);
    println!("{}", user1.name); // エラー: E0382（ムーブ済みフィールドの使用）
}
```
