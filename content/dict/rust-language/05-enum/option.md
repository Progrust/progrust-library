---
title: Option型
description: 値の有無を表す標準ライブラリの列挙型。SomeとNoneの2バリアントを持ち、nullを使わず欠損値をコンパイル時に検出できる型。
created_at: 2026-07-26
updated_at: 2026-07-27
tags: ["型システム", "複合型", "標準ライブラリ"]
public: true
---

`Option<T>`は、値が「ある」か「ない」かを表す[[standard-library]]の[[enum]]です[^1]。値が存在することを表す`Some(値)`と、存在しないことを表す`None`という2つのバリアントを持ちます。多くの言語ではnullやnilで値の不在を表現しますが、Rustにはnull参照がなく、値が欠けうる場面では必ず`Option<T>`を使うことで、「値がないかもしれない」という事実を型として明示します。

```rust playground
fn find_price(item: &str) -> Option<i32> {
    match item {
        "りんご" => Some(120),
        "みかん" => Some(80),
        _ => None, // 該当する商品なし
    }
}

fn main() {
    let price = find_price("りんご");
    match price {
        Some(value) => println!("価格: {value}円"),
        None => println!("商品が見つかりません"),
    }
}
```

## null安全性

null参照の考案者であるTony Hoareは、これを自ら「10億ドルの過ち」と呼んでいます[^2]。値がnullかもしれないという可能性を型システムで扱わない言語では、nullチェックの漏れをコンパイラが検出できず、実行時のnull参照エラーとして表面化します。Rustは参照にnullを許さず、値が欠ける可能性を`Option<T>`という型で表現するため、チェック漏れは網羅性チェックによってコンパイル時に検出されます。

## `Option<T>`と`T`は別の型

`Option<T>`と`T`は異なる型として扱われるため、`Option<i32>`の値をそのまま`i32`として計算に使うことはできません。

<!-- rustc: expect E0369 -->
```rust playground
fn main() {
    let stock: Option<i32> = Some(3);
    let total = stock + 1; // エラー: E0369（Option<i32>に対する`+`演算子は未実装）
}
```

値を使うには、[[match-expression]]や`unwrap_or`などの[[method]]で中身を取り出す必要があります。取り出しを忘れたまま`T`として扱おうとするコードは、この型の違いによってコンパイルが通らなくなります。

## 補足

:::details[core/stdどちらに定義されているか]
`Option<T>`は`core::option`で定義されており、OSにも依存しない[[standard-library]]の最下層である`core`クレートの一部です。`std`はこれを再エクスポートしており、さらにプレリュードに含まれるため、`use`なしで`Option`・`Some`・`None`をそのまま書けます[^1]。
:::

[^1]: [std::option::Option](https://doc.rust-lang.org/std/option/enum.Option.html) — `pub enum Option<T> { None, Some(T) }`として定義されています。
[^2]: Tony Hoare, "Null References: The Billion Dollar Mistake"（2009年の講演）
