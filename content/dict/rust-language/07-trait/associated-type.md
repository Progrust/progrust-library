---
title: 関連型
description: トレイトの中に型のプレースホルダを宣言し、実装側で具体的な型を1つに決める仕組み。Iterator::Itemが代表例。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "型システム"]
public: true
---

関連型は、[[trait]]の中に`type Item;`のように**型のプレースホルダ**を宣言しておき、実際の型は`impl`側で`type Item = u32;`と決める仕組みです。[[method]]や[[associated-function]]と同じくトレイトが持つ項目の1つで、実装した型に関連付けられた型エイリアスという位置づけです[^1]。トレイトの中では`Self::Item`、外からは型引数を通して`T::Item`のように参照します[^2]。

```rust playground
use std::fmt::Debug;

// 「おすすめを1つ返せる」という振る舞い。返す型は実装側で決める
trait Shop {
    type Product; // 関連型（この時点では型を決めない）
    fn recommend(&self) -> Self::Product;
}

#[derive(Debug)]
struct Book {
    title: String,
    price: u32,
}

struct Bookstore;
struct Bakery;

impl Shop for Bookstore {
    type Product = Book; // この実装での Product は Book
    fn recommend(&self) -> Book {
        Book { title: String::from("Rust入門"), price: 3200 }
    }
}

impl Shop for Bakery {
    type Product = String; // こちらの実装では String
    fn recommend(&self) -> String {
        String::from("あんぱん")
    }
}

// 使う側は Shop とだけ書けばよく、商品の型は T::Product で取り出せる
fn show<T: Shop>(shop: &T)
where
    T::Product: Debug,
{
    println!("おすすめ: {:?}", shop.recommend());
}

fn main() {
    show(&Bookstore); // おすすめ: Book { title: "Rust入門", price: 3200 }
    show(&Bakery); // おすすめ: "あんぱん"
}
```

## ジェネリックな型引数との違い

同じ「型を後から決める」仕組みでも、[[generics]]の型引数とは**誰が型を決めるか**が違います。トレイト自体が型引数を持つ`trait Shop<P>`の形なら、`Bookstore`に対して`Shop<Book>`と`Shop<String>`の両方を実装できます。一方、関連型は実装1つにつき型が1つに定まるため、`impl Shop for Bookstore`は1回しか書けず、`Product`が何になるかもそこで確定します[^3]。

| 観点 | 型引数（`trait Shop<P>`） | 関連型（`type Product`） |
| --- | --- | --- |
| 型を決めるのは | 使う側 | 実装側 |
| 同じ型への実装 | 型引数を変えて何度でも書ける | 1回だけ |
| 使う側の[[trait-bound]] | `T: Shop<Book>`と毎回型を書く | `T: Shop`だけでよい |
| 型の取り出し | できない（自分で書いた型を使う） | `T::Product`で取り出せる |

「1つの型に対する実装は1通りに決めたい」なら関連型、「同じ型に複数の組み合わせを実装したい」なら型引数、という使い分けになります。[[conversion-traits]]の`From<T>`のように、`u32`が`From<u8>`・`From<u16>`と何通りも実装するトレイトは後者です。

## `Iterator::Item`

[[standard-library]]で関連型の代表例となるのが`Iterator`の`Item`です。<!-- TODO: [[iterator]] 作成後にリンク -->「何を取り出すか」は実装ごとに決まるため、トレイト側では型を固定せず、`next`が返す[[option]]の中身を`Self::Item`と書いています[^4]。

```rust
// std::iter::Iterator の宣言（抜粋）
trait Iterator {
    type Item; // 取り出される要素の型
    fn next(&mut self) -> Option<Self::Item>;
}
```

型引数`Iterator<T>`だった場合、使う側は`next`を呼ぶたびに「どの`T`の`Iterator`か」を書き分ける必要がありました[^3]。関連型なので、要素の型を絞りたいときだけ`Iterator<Item = u32>`のように`=`で指定します（この`Item = u32`という書き方を**等価制約**と呼びます[^5]）。

```rust playground
// 要素が u32 のものだけを受け取る
fn total<I: Iterator<Item = u32>>(prices: I) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }
    sum
}

fn main() {
    let prices = vec![120u32, 350, 480];
    println!("合計{}円", total(prices.into_iter()));
}
```

## 補足

:::details[関連型に境界を付ける・デフォルトは書けない]
宣言側で`type Product: Debug;`のように境界を付けると、実装が指定する型はそれを満たす必要があります[^6]。また関連型には暗黙の`Sized`境界があり、`?Sized`で緩められます[^6]。<!-- TODO: [[sized]] 作成後にリンク -->

一方、安定版のRustでは関連型に**デフォルトの型は書けません**。型を指定できるのは実装側だけです[^6]（[[default-implementation]]の補足も参照）。同じく、`impl 型名 { ... }`の[[impl-block]]（固有実装）に関連型を置くこともできません[^6]。
:::

:::details[トレイトオブジェクトでは関連型の指定が必須]
[[trait-object]]は関連型をすべて指定しないと作れません。`dyn Iterator`とだけ書くとエラー: E0191になるため、`dyn Iterator<Item = u32>`のように書きます[^7]。実行時に型が切り替わる以上、要素の型まで曖昧では扱えないためです。

なお、トレイト内のメソッドの戻り値に書いた[[impl-trait]]は、匿名の関連型への糖衣構文として扱われます[^8]。この関連型には名前がないため`dyn`側から指定できず、そうしたメソッドを持つトレイトはトレイトオブジェクトにできません[^9]。
:::

:::details[具体的な型から関連型を取り出す]
`T::Product`という短縮形が使えるのは、`T`が型引数のときだけです[^2]。`Bookstore`のような具体的な型から取り出すときは、`<Bookstore as Shop>::Product`と**完全修飾構文**で書きます。型引数が複数のトレイトを実装していて`T::Product`では曖昧な場合も、同じ構文でどのトレイトの関連型かを明示します。
:::

[^1]: [The Rust Reference - Associated Items](https://doc.rust-lang.org/reference/items/associated-items.html) "Associated types are type aliases associated with another type."
[^2]: [The Rust Reference - Associated Types](https://doc.rust-lang.org/reference/items/associated-items.html#associated-types) "If a type Item has an associated type Assoc from a trait Trait, then `<Item as Trait>::Assoc` is a type that is an alias of the type specified in the associated type definition. Furthermore, if Item is a type parameter, then Item::Assoc can be used in type parameters."
[^3]: [The Rust Programming Language - Defining Traits with Associated Types](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html) "when a trait has a generic parameter, it can be implemented for a type multiple times, changing the concrete types of the generic type parameters each time." / "With associated types, we don't need to annotate types, because we can't implement a trait on a type multiple times."
[^4]: [std::iter::Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html) "type Item ... The type of the elements being iterated over." / "fn next(&mut self) -> Option<Self::Item>"
[^5]: [The Rust Reference - Paths: Generic arguments](https://doc.rust-lang.org/reference/paths.html) "The order of generic arguments is restricted to lifetime arguments, then type arguments, then const arguments, then equality constraints."
[^6]: [The Rust Reference - Associated Types](https://doc.rust-lang.org/reference/items/associated-items.html#associated-types) "The optional trait bounds must be fulfilled by the implementations of the type alias." / "There is an implicit Sized bound on associated types that can be relaxed using the special ?Sized bound." / "Associated types cannot be defined in inherent implementations nor can they be given a default implementation in traits."
[^7]: [Error code E0191](https://doc.rust-lang.org/error_codes/E0191.html) "An associated type wasn't specified for a trait object." / "Trait objects need to have all associated types specified."
[^8]: [The Rust Reference - Return-position impl Trait in traits and trait implementations](https://doc.rust-lang.org/reference/types/impl-trait.html#return-position-impl-trait-in-traits-and-trait-implementations) "Every `impl Trait` in the return type of an associated function in a trait is desugared to an anonymous associated type."
[^9]: [The Rust Reference - Dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility) "Dispatchable functions must: ... Not have an opaque return type"
