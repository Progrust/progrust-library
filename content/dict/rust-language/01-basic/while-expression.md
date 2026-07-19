---
title: while式
description: 条件がtrueの間だけ本体のブロックを繰り返すループ式。条件の再評価で継続を判断する述語ループで、式としての値は常にユニット型。パターンマッチで繰り返すwhile letにも対応。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["基本文法"]
public: true
---

`while`式は、条件が`true`の間だけ本体のブロックを繰り返すループです。本体を実行するたびに条件を再評価し、`false`になった時点で終了します[^1]。条件には[[boolean-type]]の[[expression]]を書きます（`0`など数値を条件にはできません）。式全体の値は常に[[unit-type]]`()`で、[[loop-expression]]と違い`break`で値を返せません。

```rust playground
fn main() {
    let mut savings = 0;
    while savings < 1000 {
        savings += 300; // 毎回300円ずつ貯金します
        println!("現在の貯金額: {savings}円");
    }
    println!("目標の1000円に到達しました");
}
```

## while let式

条件の代わりにパターンを書く`while let`は、パターンがマッチする間だけ繰り返します[^1]。「値を取り出せる間ずっと処理する」という定番の書き方で、[[vec]]の`pop`のように`Option`を返すメソッド<!-- TODO: [[option]] 作成後にリンク -->と相性が良い構文です。

```rust playground
fn main() {
    let mut cart = vec!["りんご", "みかん", "バナナ"];
    while let Some(item) = cart.pop() {
        println!("{item}を袋に詰めました"); // Someでなくなったら終了します
    }
}
```

## 補足

:::details[breakで値を返せない（E0571）]
`break 値;`が使えるループは`loop`式だけです（ループ以外ではラベル付きブロック式でも使えます）。`while`（および`for`）で値を渡すとコンパイルエラーE0571になります[^3]。

<!-- rustc: expect E0571 -->
```rust
fn main() {
    let mut count = 0;
    let result = while count < 3 {
        count += 1;
        break count; // エラー: E0571（while式のbreakには値を渡せない）
    };
}
```

:::

:::details[let chains — 条件を&&で連結する]
Rust 1.88（edition 2024限定）から、`while`や`if`の条件で`let`パターンと論理式を[[logical-operators]]`&&`で連結できます[^2]。「`Some`を取り出せて、かつ条件も満たす間」のような繰り返しが1行で書けます。

```rust playground
fn main() {
    let mut stock = vec![1200, 500, 300]; // popは末尾から取り出します
    let mut total = 0;
    while let Some(price) = stock.pop()
        && total + price <= 1000
    {
        total += price; // 予算1000円に収まる間だけ買います
    }
    println!("合計: {total}円");
}
```

:::

[^1]: [The Rust Reference: Loops and other breakable expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html)
[^2]: [Announcing Rust 1.88.0 | Rust Blog](https://blog.rust-lang.org/2025/06/26/Rust-1.88.0/)
[^3]: [E0571 - Error codes index](https://doc.rust-lang.org/error_codes/E0571.html)
