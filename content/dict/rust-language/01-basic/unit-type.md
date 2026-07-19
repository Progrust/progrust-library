---
title: ユニット型
description: 唯一の値()だけを持つプリミティブ型。「返すべき意味のある値がない」ことを表し、戻り値の型を省略した関数などに現れる型。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["型システム", "基本文法", "プリミティブ型"]
public: true
---

ユニット型`()`は、`()`という唯一の値（ユニット値）だけを持つ[[primitive-type]]です。「返すべき意味のある値がない」ことを表すための型で、要素が0個の[[tuple]]でもあります[^1]。戻り値の型を省略した関数は暗黙に`()`を返し[^2]、[[expression]]の末尾にセミコロンを付けて[[statement]]にすると値は捨てられ、そのような文で終わるブロック式の値は`()`になります。

```rust playground
fn greet() { // 戻り値の型を省略 = 「-> ()」と書いたのと同じ
    println!("いらっしゃいませ");
}

fn main() {
    let result: () = greet(); // 戻り値 () を束縛できる（普段は書かない）
    println!("{:?}", result); // 「()」と表示される
}
```

## ユニット型が現れる場面

| 場面 | 例 | 説明 |
| --- | --- | --- |
| 戻り値の型を省略した関数 | `fn greet() { … }` | `fn greet() -> () { … }`と同じ意味 |
| 末尾に値を残さないブロック式 | `{ println!("…"); }` | 最後が文で終わるブロックの値は`()` |
| 代入式の評価結果 | `x = 5` | 代入式自体の値は代入した値ではなく`()` |
| 成功時に返す値がない`Result` | `Result<(), Error>` | 「成功したこと」だけを伝える<!-- TODO: [[result]] 作成後にリンク --> |

## 補足

:::details[サイズ0の型（ZST）]
ユニット型のサイズは0バイトで、実行時のメモリを一切占有しません（`std::mem::size_of::<()>()`は`0`を返します[^3]）。このようにサイズが0の型はZST（Zero-Sized Type）と呼ばれ、ZSTを生成・格納する操作は多くの場合コンパイル時に無操作（no-op）へ最適化されます。
:::

[^1]: [The Rust Reference: Tuple types](https://doc.rust-lang.org/reference/types/tuple.html) — フィールドが0個のタプル型はunit型、その値はunit値と呼ばれると述べています。
[^2]: [The Rust Reference: Functions](https://doc.rust-lang.org/reference/items/functions.html) — 戻り値の型を明示しない場合はユニット型であると定義しています。
[^3]: [std::mem::size_of](https://doc.rust-lang.org/std/mem/fn.size_of.html) — サイズ一覧表で`()`のサイズを0と明記しています。
