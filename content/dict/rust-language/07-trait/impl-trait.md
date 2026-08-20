---
title: impl Trait
description: 型名の代わりに「そのトレイトを実装した型」とだけ書く記法。戻り値位置では具体的な型を1つ隠して返す意味になり、クロージャやイテレータのように名前を書けない型・長すぎる型を返すのに使うのが特徴。引数位置との意味の違いも整理。
created_at: 2026-08-20
updated_at: 2026-08-21
tags: ["トレイト", "型システム"]
public: true
---

`impl Trait`は、具体的な型名の代わりに「この[[trait]]を実装した型」とだけ書く記法です。書けるのは[[function]]の**引数と戻り値の型の位置だけ**です[^1]。`extern`ブロック内で宣言する外部関数には書けません[^12]。

戻り値の位置に書くと、「そのトレイトを実装した**具体的な型を1つ**返す」という意味になります[^2]。どの型を返すかを決めるのは関数側で、呼び出し側には型名が伏せられ、指定したトレイトが宣言する[[method]]だけが使えます[^2]。特に役立つのはクロージャとイテレータです。クロージャの型は書き表せる名前を持たず、イテレータはメソッドを重ねるほど型名が長く複雑になるためです[^3]。<!-- TODO: [[closure]] 作成後にリンク --><!-- TODO: [[iterator]] 作成後にリンク -->

```rust playground
// 割引率から「価格に割引を適用するクロージャ」を作って返す
// クロージャの型には名前がないので、impl Fn で「呼び出せる何か」として返す
fn make_discount(rate: u32) -> impl Fn(u32) -> u32 {
    move |price| price * (100 - rate) / 100
}

// メソッドを重ねたイテレータの型は長くなる
// impl Iterator と書けば「u32を順に返すもの」とだけ公開できる
fn half_prices(prices: Vec<u32>) -> impl Iterator<Item = u32> {
    prices.into_iter().map(|price| price / 2)
}

fn main() {
    let apply_20off = make_discount(20);
    println!("1500円の2割引きは{}円", apply_20off(1500));

    for price in half_prices(vec![100, 150, 200]) {
        println!("半額は{}円", price);
    }
}
```

## 引数位置との意味の違い

引数の位置の`impl Trait`は、名前のない型引数を1つ宣言する糖衣構文で、実際の型を選ぶのは**呼び出し側**です[^4]。戻り値の位置では逆に、型を選ぶのは**関数側**で、呼び出し側は型を指定できません[^5]。同じ記法ですが、位置によって役割が入れ替わります。

| 観点 | 引数位置 `fn f(x: impl Trait)` | 戻り値位置 `fn f() -> impl Trait` |
| --- | --- | --- |
| 具体的な型を決めるのは | 呼び出し側[^4] | 関数側[^5] |
| 意味 | 名前のない型引数（[[trait-bound]]付きの`<T: Trait>`の糖衣構文）[^4] | 具体的な型を伏せた抽象型[^2] |
| 呼び出しごとの型 | 渡した型ごとに変わる[^4] | 関数（とそのジェネリック引数）ごとに1つに固定される[^2] |

なお、[[generics]]の型引数を戻り値に使った`fn f<T: Trait>() -> T`は、戻り値位置の`impl Trait`とは別物です。前者は呼び出し側が`T`を決めて関数はその型を返すのに対し、後者は関数が型を決め「トレイトを実装していること」だけを約束します[^5]。

## 返せる型は1つだけ

`impl Trait`の裏側には隠された具体的な型が1つあり、関数のどの経路を通っても**同じ具体的な型に解決**される必要があります[^2]。そのため分岐で違う型を返すことはできず、エラー: E0308になります[^6][^7]。

<!-- rustc: expect E0308 -->
```rust
trait Payment {
    fn pay(&self, amount: u32) -> String;
}

struct Cash;
struct CreditCard;

impl Payment for Cash {
    fn pay(&self, amount: u32) -> String {
        format!("現金で{}円を支払いました", amount)
    }
}

impl Payment for CreditCard {
    fn pay(&self, amount: u32) -> String {
        format!("カードで{}円を支払いました", amount)
    }
}

fn pick(use_card: bool) -> impl Payment {
    // エラー: E0308（ifとelseで返す型が違う）
    if use_card { CreditCard } else { Cash }
}
```

実行時に型を切り替えたい場合は、[[trait-object]]を使って`Box<dyn Payment>`を返します[^6]。<!-- TODO: [[box]] 作成後にリンク -->

| 観点 | `-> impl Trait` | `-> Box<dyn Trait>` |
| --- | --- | --- |
| 返せる型 | 常に同じ1つの型[^2] | 実装した型のどれでもよい[^6] |
| ヒープ確保 | なし[^3] | あり[^3] |
| メソッド呼び出し | 静的ディスパッチ[^3] | 動的ディスパッチ[^3] |
| 使えるトレイト | 任意 | dyn互換なトレイトのみ[^8] |

## 補足

:::details[呼び出し側にはトレイトのメソッドしか見えない]
戻り値が`impl Trait`だと、呼び出し側からは具体的な型が見えないため、そのトレイト（とスーパートレイト）が宣言するメソッド以外は呼べません[^2]。下の例では[[range-expression]]`1..=3`が作る`RangeInclusive<u16>`を返していますが、`impl Iterator`としか宣言していないので、`ExactSizeIterator`の`len`は呼べずエラー: E0599になります。

<!-- rustc: expect E0599 -->
```rust
fn steps() -> impl Iterator<Item = u16> {
    1..=3
}

fn main() {
    // エラー: E0599（不透明型にlenというメソッドはない）
    println!("{}", steps().len());
}
```

具体的な型を返すと決めているなら、`-> std::ops::RangeInclusive<u16>`のように書けば呼び出し側は`len`も使えます。`impl Trait`は「公開する能力をトレイトの範囲に絞る」記法でもあります。
:::

:::details[トレイトのメソッドの戻り値にも書ける（RPITIT）]
トレイト宣言の中のメソッドの戻り値にも`impl Trait`を書けます。これは匿名の[[associated-type]]への糖衣構文として扱われ、実装側のシグネチャに書いた型がその関連型の中身になります[^9]。

```rust playground
trait Shop {
    // 「名前を順に返すもの」とだけ決めて、実際の型は実装側に任せる
    fn items(&self) -> impl Iterator<Item = String>;
}

struct Bakery;

impl Shop for Bakery {
    fn items(&self) -> impl Iterator<Item = String> {
        ["食パン", "クロワッサン"].into_iter().map(String::from)
    }
}

fn main() {
    for item in Bakery.items() {
        println!("{}", item);
    }
}
```

ただし戻り値位置に`impl Trait`を持つメソッドはdyn互換の条件を満たさないため、そのままでは`dyn Shop`にできません[^8]。
:::

::::details[ジェネリック引数の捕捉とuse<..>]
`impl Trait`が隠している具体的な型が、関数の型引数や[[lifetime]]を含むことがあります。そのため戻り値位置の`impl Trait`は、[[scope]]にあるジェネリック引数（型・const・ライフタイム）を**すべて自動的に捕捉**します[^10]。

:::message{warning}
edition 2024より前は、自由関数と固有implのメソッドについて、抽象戻り値型の境界に現れないライフタイム引数は自動では捕捉されませんでした[^10]。edition 2024以降はすべて捕捉されるため、editionをまたぐと同じコードの可否が変わります。
:::

捕捉する対象は`use<..>`境界で明示的に絞れます[^11]。たとえば`use<>`（何も捕捉しない）と書くと、引数の[[reference]]とは無関係な戻り値であることを表明できます。

```rust playground
// use<> により「引数の参照を捕捉しない」ことを明示する
fn to_prices(text: &str) -> impl Iterator<Item = u32> + use<> {
    let prices: Vec<u32> = text.split(',').filter_map(|s| s.parse().ok()).collect();
    prices.into_iter()
}

fn main() {
    let input = String::from("150,980,120");
    let prices = to_prices(&input);
    drop(input); // 捕捉していないので、元のStringを先に破棄してよい

    for price in prices {
        println!("{}円", price);
    }
}
```
::::

:::details[書けない場所]
`impl Trait`は[[variable]]の型注釈や[[struct]]のフィールドの型には書けず、書くとエラー: E0562になります[^1][^12]。型エイリアス（`type Shown = impl Display;`）も安定版では使えず、こちらはエラー: E0658（unstable）になります。

<!-- rustc: expect E0562 -->
```rust
use std::fmt::Display;

fn main() {
    // エラー: E0562（変数束縛の型にimpl Traitは書けない）
    let price: impl Display = 1500;
    println!("{}", price);
}
```
:::

[^1]: [The Rust Reference - Impl trait limitations](https://doc.rust-lang.org/reference/types/impl-trait.html#limitations) "`impl Trait` can only appear as a parameter or return type of a non-`extern` function. It cannot be the type of a `let` binding, field type, or appear inside a type alias."
[^2]: [The Rust Reference - Abstract return types](https://doc.rust-lang.org/reference/types/impl-trait.html#abstract-return-types) "Functions can use `impl Trait` to return an abstract return type. These types stand in for another concrete type where the caller may only use the methods declared by the specified `Trait`." / "Each possible return value from the function must resolve to the same concrete type."
[^3]: [The Rust Reference - Abstract return types](https://doc.rust-lang.org/reference/types/impl-trait.html#abstract-return-types) "`impl Trait` in return position allows a function to return an unboxed abstract type. This is particularly useful with closures and iterators. For example, closures have a unique, un-writable type." / "This could incur performance penalties from heap allocation and dynamic dispatch." / "which also avoids the drawbacks of using a boxed trait object." / "Similarly, the concrete types of iterators could become very complex, incorporating the types of all previous iterators in a chain."
[^4]: [The Rust Reference - Anonymous type parameters](https://doc.rust-lang.org/reference/types/impl-trait.html#anonymous-type-parameters) "`impl Trait` in argument position is syntactic sugar for a generic type parameter like `<T: Trait>`, except that the type is anonymous and doesn't appear in the GenericParams list." / "The caller must provide a type that satisfies the bounds declared by the anonymous type parameter."
[^5]: [The Rust Reference - Differences between generics and impl Trait in return position](https://doc.rust-lang.org/reference/types/impl-trait.html#differences-between-generics-and-impl-trait-in-return-position) "In argument position, `impl Trait` is very similar in semantics to a generic type parameter. However, there are significant differences between the two in return position. With `impl Trait`, unlike with a generic type parameter, the function chooses the return type, and the caller cannot choose the return type." / "doesn't allow the caller to determine the return type. Instead, the function chooses the return type, but only promises that it will implement `Trait`."
[^6]: [The Rust Programming Language - Returning Types That Implement Traits](https://doc.rust-lang.org/book/ch10-02-traits.html#returning-types-that-implement-traits) "However, you can only use `impl Trait` if you're returning a single type." / "Returning either a `NewsArticle` or a `SocialPost` isn't allowed due to restrictions around how the `impl Trait` syntax is implemented in the compiler." / "We'll cover how to write a function with this behavior in the \"Using Trait Objects to Abstract over Shared Behavior\" section of Chapter 18."
[^7]: [Error code E0308](https://doc.rust-lang.org/error_codes/E0308.html) "Expected type did not match the received type."
[^8]: [The Rust Reference - Dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility) "Dispatchable functions must: ... Not have an opaque return type"
[^9]: [The Rust Reference - Return-position impl Trait in traits and trait implementations](https://doc.rust-lang.org/reference/types/impl-trait.html#return-position-impl-trait-in-traits-and-trait-implementations) "Every `impl Trait` in the return type of an associated function in a trait is desugared to an anonymous associated type. The return type that appears in the implementation's function signature is used to determine the value of the associated type."
[^10]: [The Rust Reference - Automatic capturing](https://doc.rust-lang.org/reference/types/impl-trait.html#automatic-capturing) "Return-position `impl Trait` abstract types automatically capture all in-scope generic parameters, including generic type, const, and lifetime parameters (including higher-ranked ones)." / "2024 Edition differences: Before the 2024 edition, on free functions and on associated functions and methods of inherent impls, generic lifetime parameters that do not appear in the bounds of the abstract return type are not automatically captured."
[^11]: [The Rust Reference - Precise capturing](https://doc.rust-lang.org/reference/types/impl-trait.html#precise-capturing) "The set of generic parameters captured by a return-position `impl Trait` abstract type may be explicitly controlled with a `use<..>` bound. If present, only the generic parameters listed in the `use<..>` bound will be captured."
[^12]: [Error code E0562](https://doc.rust-lang.org/error_codes/E0562.html) "`impl Trait` is only allowed as a function return and argument type."
