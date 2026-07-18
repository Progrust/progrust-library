---
title: 定数
description: コンパイル時に値が確定する不変の名前付き値。const で宣言し、型注釈が必須。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法"]
public: true
---

コンパイル時に値が確定する、不変の名前付き値です。`const` キーワードで宣言します。
慣習として名前は `SCREAMING_SNAKE_CASE` で付けます。使用箇所にはその値が直接埋め込まれます。

```rust playground
const TAX_RATE: f64 = 0.1; // 消費税率（f64 と型を明示する）

fn main() {
    let price = 500; // 税抜価格
    let tax = price as f64 * TAX_RATE;
    println!("税込: {}円", price + tax as i32);
}
```

## 不変な変数との違い

`let` で宣言する[[variable]]とは以下のような違いがあります。

- 型注釈が必須
- 可変にすることはできない
- 代入できるのは定数式（コンパイル時に評価できる式）のみ
- 関数の外側を含む任意のスコープで宣言可能

## 補足

:::details[定数式しか代入できない]
`const` に代入できるのはコンパイル時に評価できる式に限られ、実行時に決まる値（他の変数など）は使えません。ただし他の `const` の参照や `const fn` の呼び出しは定数式なので使えます。

<!-- rustc: expect E0435 -->
```rust playground
fn main() {
    let items = 5;
    const TOTAL: i32 = items * 2; // エラー: E0435（定数の中で非定数の値を使用）
    println!("{}", TOTAL);
}
```
:::

:::details[const と static の違い]
<!-- TODO: [[static]] 作成後にリンク -->
`const` は使用箇所ごとに値が埋め込まれ、固定のメモリ位置を持ちません。一方 `static` はプログラム全体で単一のメモリ位置を持つ静的変数で、参照するとつねに同じアドレスを指します。単なる不変の定数値には `const` を使うのが基本です。
:::
