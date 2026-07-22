---
title: メソッド
description: 関連関数のうち、第一引数にselfを取り値.method()構文で呼び出せるもの。
created_at: 2026-07-22
updated_at: 2026-07-22
tags: ["型システム", "基本文法", "複合型"]
public: true
---

メソッド（method）は、implブロック<!-- TODO: [[impl-block]] 作成後にリンク -->内で定義する[[associated-function]]のうち、第一引数に`self`（またはその[[reference]]）を取るものです。関連関数は`型名::関数名()`の形でしか呼び出せませんが、メソッドは`値.メソッド名()`という専用の呼び出し構文（ドット記法）でも呼べる点が異なります（`型名::メソッド名(値)`という通常の関数呼び出し記法も引き続き使えます）。

```rust playground
struct User {
    name: String,
    age: u32,
}

impl User {
    // &self: フィールドを読み取るだけのメソッド（共有参照を受け取る）
    fn is_adult(&self) -> bool {
        self.age >= 18
    }

    // &mut self: フィールドを書き換えるメソッド（排他参照を受け取る）
    fn have_birthday(&mut self) {
        self.age += 1;
    }
}

fn main() {
    let mut user = User { name: String::from("田中"), age: 17 };
    println!("成人: {}", user.is_adult());

    user.have_birthday();
    println!("{}さん、{}歳になりました", user.name, user.age);
}
```

## selfの3つの形式

`&self`・`&mut self`・`self`は、それぞれ`self: &Self`・`self: &mut Self`・`self: Self`の省略記法です（`Self`はimpl対象の型を指すエイリアス）。

| 記法 | 完全形 | 用途 |
| --- | --- | --- |
| `&self` | `self: &Self` | 値を読み取るだけ（最も多い） |
| `&mut self` | `self: &mut Self` | フィールドを書き換える |
| `self` | `self: Self` | [[ownership]]を奪って消費・変換する（例: ビルダーパターンの終端メソッド） |

:::message{info}
`値.method()`の呼び出しでは、コンパイラがレシーバの型に合わせて参照の付与などを自動で行います（自動参照）。詳細は別項で扱います。<!-- TODO: [[auto-deref]] 作成後にリンク -->
:::

## 補足

:::details[selfにはBox・Rc・Arcなども指定できる]
`self`の型には`Self`への参照だけでなく`Box<Self>`・`Rc<Self>`<!-- TODO: [[rc]] 作成後にリンク -->・`Arc<Self>`も直接指定できます。例えば`self: Box<Self>`は、ヒープ上のインスタンスの所有権を消費するメソッドを定義したい場合に使います。
:::
