---
title: if式
description: 条件がtrueかどうかで実行するブロックを選ぶ分岐の式。実行されたブロックの値がif式全体の値になるため、評価結果をそのまま変数の束縛に使えるのが特徴。パターンマッチで分岐するif letにも対応。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["基本文法"]
public: true
---

`if`式は、条件が`true`なら直後のブロックを、`false`なら`else`のブロックを実行する分岐です。条件には[[boolean-type]]の[[expression]]を書きます（`0`など数値を条件にはできません）。分岐が3つ以上あるときは`else if`で条件をつなげます[^1]。

Rustの`if`は[[statement]]ではなく式であり、実行されたブロックの値が`if`式全体の値になります[^1]。そのため三項演算子（`cond ? a : b`）は存在せず、評価結果をそのまま[[variable]]の束縛に使えます。

```rust playground
fn main() {
    let temperature = 31;
    let advice = if temperature >= 30 {
        "猛暑です。水分補給を忘れずに"
    } else if temperature >= 20 {
        "過ごしやすい気温です"
    } else {
        "上着があると安心です"
    };
    println!("{advice}");
}
```

## 値として使うときの規則

| 状況 | 規則 |
| --- | --- |
| 値を変数に束縛する | すべての分岐が**同じ型**の値を返す必要があります（型が食い違うとE0308） |
| `else`がない | どのブロックも実行されない場合があるため、`if`式の値は[[unit-type]]`()`になります。`()`以外の値の束縛には`else`が必須です |

## if let式

条件の代わりに`let`とパターンを書く`if let`は、パターンがマッチしたときだけブロックを実行します[^1]。`Option`の中身を取り出す<!-- TODO: [[option]] 作成後にリンク -->ときの定番の書き方で、マッチしなかった場合の処理は`else`に書けます。

```rust playground
fn main() {
    let coupon: Option<u32> = Some(300);
    if let Some(discount) = coupon {
        println!("クーポンで{discount}円引きです");
    } else {
        println!("クーポンはありません");
    }
}
```

## 補足

:::details[elseなしで値を束縛できない（E0317）]
`else`のない`if`式の値は[[unit-type]]`()`なので、`()`以外の分岐の値を束縛しようとするとコンパイルエラーE0317になります[^2]。

<!-- rustc: expect E0317 -->
```rust
fn main() {
    let stock = 5;
    let message = if stock > 0 {
        "在庫あり"
    }; // エラー: E0317（elseがないと値を束縛できない）
    println!("{message}");
}
```

:::

:::details[let chains — 条件を&&で連結する]
Rust 1.88（edition 2024限定）から、`if`や[[while-expression]]の条件で`let`パターンと論理式を[[logical-operators]]`&&`で連結できます[^3]。「`Some`を取り出せて、かつ条件も満たすとき」のような分岐が1行で書けます。

```rust playground
fn main() {
    let point_balance: Option<u32> = Some(800);
    if let Some(points) = point_balance && points >= 500 {
        println!("{points}ポイントあるので500円引きクーポンと交換できます");
    }
}
```

:::

[^1]: [The Rust Reference: `if` expressions](https://doc.rust-lang.org/reference/expressions/if-expr.html)
[^2]: [E0317 - Error codes index](https://doc.rust-lang.org/error_codes/E0317.html)
[^3]: [Announcing Rust 1.88.0 | Rust Blog](https://blog.rust-lang.org/2025/06/26/Rust-1.88.0/)
