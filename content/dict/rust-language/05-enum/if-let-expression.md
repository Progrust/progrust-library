---
title: if let式
description: match式で1つのパターンだけを処理したい場合に使う糖衣構文。網羅性チェックを失う代わりに簡潔に書け、elseで残りの値をまとめて処理できるのが特徴。
created_at: 2026-07-27
updated_at: 2026-07-27
tags: ["基本文法", "パターンマッチング"]
public: true
---

`if let`式は、[[match-expression]]で1つのパターンだけを処理し残りは無視したい場合に使う糖衣構文とみなせます[^1]。パターンが一致したときだけブロックを実行し、一致しない場合の処理は`else`に書けます。`match`のように[[enum]]が取りうる値をすべて網羅する必要はなく、その分簡潔に書けますが、網羅性チェックは働きません。

```rust playground
enum Coupon {
    NotIssued,
    Discount(i32), // 割引額(円)
}

fn describe(coupon: Coupon) {
    if let Coupon::Discount(amount) = coupon {
        println!("{amount}円引きのクーポンです");
    } else {
        println!("クーポンはありません");
    }
}

fn main() {
    describe(Coupon::Discount(300));
    describe(Coupon::NotIssued);
}
```

## 等価なmatch式

上記の例は、以下の`match`式と同じ意味です。「1つのパターンにマッチしたときだけ処理し、それ以外は無視する」という書き方を短く表現したものと考えられます[^1]。

:::details[match式で書いた場合]
```rust playground
enum Coupon {
    NotIssued,
    Discount(i32),
}

fn describe(coupon: Coupon) {
    match coupon {
        Coupon::Discount(amount) => println!("{amount}円引きのクーポンです"),
        _ => println!("クーポンはありません"),
    }
}

fn main() {
    describe(Coupon::Discount(300));
    describe(Coupon::NotIssued);
}
```
:::

:::message{warning}
`if let`は`match`と違い網羅性チェックが働かないため、対応漏れがあってもコンパイラは教えてくれません[^1]。列挙型にバリアントを追加してもコンパイルエラーにならず、対応漏れに気づきにくくなる点に注意が必要です。
:::

## elseとの組み合わせ

`else`は、等価な`match`式における[[catch-all-pattern]]（`_`のアーム）と同じ役割です[^1]。省略した場合は、パターンに一致しないときは何もせず`if let`式全体が[[unit-type]]`()`の値になります[^2]。実務では[[option]]の`Some`から値を取り出す用途で使うことが最も多く、`if let Some(値) = option { ... }`という形をよく見かけます。

## 補足

:::details[if letとlet chains]
`if let`の条件は[[logical-operators]]`&&`で[[boolean-type]]の[[expression]]と連結できます（let chains）。バージョン・edition要件などの詳細は[[if-expression]]を参照してください。
:::

[^1]: [The Rust Programming Language: Concise Control Flow with if let and let...else](https://doc.rust-lang.org/book/ch06-03-if-let.html) — `if let`を、値が1つのパターンにマッチしたときだけコードを実行し他の値は無視する`match`の糖衣構文とみなせると説明し、`match`が強制する網羅性チェックを失う代わりに簡潔に書けるとしています。`else`ブロックは、等価な`match`式における`_`アームの処理と同じであるとも述べています。
[^2]: [The Rust Reference: `if` expressions - if let patterns](https://doc.rust-lang.org/reference/expressions/if-expr.html#if-let-patterns) — `let`パターンが対象の値にマッチしない場合、直後のブロックはスキップされ、`else`ブロックがあればそちらが評価されると定義しています。
