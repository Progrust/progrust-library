---
title: タプル構造体
description: フィールドに名前を付けず位置で参照する構造体。ニュータイプパターンの土台になる定義形式。
created_at: 2026-07-26
updated_at: 2026-07-26
tags: ["型システム", "基本文法", "複合型"]
public: true
---

タプル構造体（tuple struct）は、フィールドに名前を付けずに定義する[[struct]]です。各フィールドは`.0`・`.1`のように位置で参照し、[[tuple]]と同じ感覚で扱えます。フィールド名を付けるほどでもないけれど、値のまとまりに型としての名前は与えたい、という場面で使います。

定義すると型名と同じ名前のコンストラクタが同時に作られるため、インスタンスは`Point(3, 5)`のように[[function]]呼び出しの形で生成します[^1]。

```rust playground
struct Point(i32, i32);

fn main() {
    let shop = Point(3, 5); // お店の位置（x, y）
    println!("x座標: {}, y座標: {}", shop.0, shop.1);
}
```

## タプル／構造体との違い

タプル・タプル構造体・構造体の違いは次のとおりです。

| | フィールド名 | 型としての名前 | 分解の書き方 |
| --- | --- | --- | --- |
| タプル | なし（位置） | なし | `let (x, y) = p;` |
| タプル構造体 | なし（位置） | あり | `let Point(x, y) = p;` |
| 構造体 | あり | あり | `let Point { x, y } = p;` |

タプルと違い、分解の際は型名を書く必要があります。

## ニュータイプパターン

フィールドが1つだけのタプル構造体で既存の型を包み、意味の違いを型として表す書き方はニュータイプパターンと呼ばれます。素の`u32`（[[integer-type]]）のままでは取り違えてもコンパイラが気づけない値も、包んでしまえば別の型として区別されます。

<!-- rustc: expect E0308 -->
```rust playground
struct PriceExcludingTax(u32); // 税抜き価格
struct PriceIncludingTax(u32); // 税込み価格

fn print_total(price: PriceIncludingTax) {
    println!("お会計は{}円です", price.0);
}

fn main() {
    let price = PriceExcludingTax(1000);
    print_total(price); // エラー: E0308（税抜きを税込みとして渡している）
}
```

## 補足

:::details[コンストラクタは関数として持ち回せる]
コンストラクタは実体が関数のため、`map`のような高階関数へそのまま渡せます。

```rust playground
struct Yen(u32);

fn main() {
    let prices = vec![120, 250, 380];
    let yens: Vec<Yen> = prices.into_iter().map(Yen).collect(); // Yenを関数として渡す
    println!("2つ目: {}円", yens[1].0);
}
```
:::

:::details[メソッドの定義やDebug出力も同じ]
タプル構造体にも[[impl-block]]で[[method]]を定義でき、`#[derive(Debug)]`も同じように使えます。`{:?}`での出力は`Point(3, 5)`の形になります（[[console-output]]も参照）。

```rust playground
#[derive(Debug)]
struct Point(i32, i32);

impl Point {
    fn distance_from_origin(&self) -> f64 {
        ((self.0 * self.0 + self.1 * self.1) as f64).sqrt()
    }
}

fn main() {
    let shop = Point(3, 4);
    println!("{shop:?}");                      // Point(3, 4)
    println!("{}", shop.distance_from_origin()); // 5
}
```
:::

:::details[フィールドを持たない構造体]
フィールドリストごと省略した`struct Marker;`は、タプル構造体ではなくユニット様構造体と呼ばれる別の形になります。<!-- TODO: [[unit-like-struct]] 作成後にリンク -->
:::

[^1]: [The Rust Reference: Structs](https://doc.rust-lang.org/reference/items/structs.html) — 型の定義に加えて、値の名前空間に同名のコンストラクタを定義すると述べています。
