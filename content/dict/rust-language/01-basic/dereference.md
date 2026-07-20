---
title: 参照外し
description: 単項演算子`*`を使って参照が指し示す先の値そのものにアクセスする操作。読み書きの両方に使用。
created_at: 2026-07-21
updated_at: 2026-07-21
tags: ["所有権"]
public: true
---

**参照外し**（dereference）とは、単項演算子`*`を使って[[reference]]が指し示す先の値そのものにアクセスする操作のことです。参照はあくまで値の在り処を指し示すだけなので、参照先の値を直接読み書きするには原則`*`で参照を外します（メソッド呼び出しやフィールドアクセスでは自動的に行われるため省略できます）。

```rust playground
fn deposit(balance: &mut i32, amount: i32) {
    *balance += amount; // 参照外しで参照先の値を書き換える
}

fn main() {
    let mut balance = 1000;
    deposit(&mut balance, 500);
    println!("入金後の残高: {balance}円");
}
```

## 補足

:::details[メソッド呼び出し・フィールドアクセスでは省略できる]
`message.push_str(...)`のようなメソッド呼び出しでは、コンパイラがレシーバの型に応じて参照外し・参照付与を自動的に行ってくれる（自動参照外し）ため、`(*message).push_str(...)`のように明示的な`*`を書く必要はありません。フィールドアクセス（`s.field`）でも同様に自動で参照外しが行われます。<!-- TODO: [[auto-deref]] 作成後にリンク -->
:::
