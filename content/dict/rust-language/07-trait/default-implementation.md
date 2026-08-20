---
title: デフォルト実装
description: トレイト宣言でメソッドの本体まで書いておく仕組み。実装側が定義を省略した場合に使われる既定の処理で、同名で定義した場合は上書きの対象。
created_at: 2026-08-20
updated_at: 2026-08-20
tags: ["トレイト", "型システム", "基本文法"]
public: true
---

デフォルト実装は、[[trait]]の宣言で[[method]]のシグネチャだけでなく**本体まで書いておく**仕組みです。本体を`;`で終えたメソッドは実装側で必ず定義しなければなりませんが、本体を書いておくと「実装側が上書きしなかったときに使われる既定の処理」になります[^1]。

実装側は上書きしたいメソッドだけを書けばよく、すべてデフォルトのままで足りるなら中身が空のimplブロック（`impl Trait for Type {}`）でも構いません[^2]。

```rust playground
trait Item {
    // 本体なし: 実装側で必ず定義する
    fn name(&self) -> String;
    fn price(&self) -> u32;

    // 本体あり: これがデフォルト実装になる
    fn label(&self) -> String {
        format!("{} {}円", self.name(), self.price())
    }
}

struct Book {
    title: String,
}

impl Item for Book {
    fn name(&self) -> String {
        self.title.clone()
    }
    fn price(&self) -> u32 {
        3200
    }
    // label は書かない → デフォルト実装が使われる
}

struct GiftSet;

impl Item for GiftSet {
    fn name(&self) -> String {
        String::from("ギフトセット")
    }
    fn price(&self) -> u32 {
        5000
    }
    // label を同じ名前で定義する → 上書きされる
    fn label(&self) -> String {
        format!("【ギフト】{} {}円（送料無料）", self.name(), self.price())
    }
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
    };
    println!("{}", book.label()); // Rust入門 3200円
    println!("{}", GiftSet.label()); // 【ギフト】ギフトセット 5000円（送料無料）
}
```

## デフォルト実装からのメソッド呼び出し

デフォルト実装の本体では、`self`を通じて同じトレイトの他のメソッドを呼べます。呼ぶ相手にデフォルト実装がなくても構いません[^3]。上の`label`は、実装側が必ず定義する`name`と`price`を組み立てているだけです。

この形にすると、**トレイト側で多くの機能を提供しながら、実装側に要求するのはごく一部**で済みます[^3]。実際に呼ばれるのはその型の実装で選ばれたメソッドなので、`name`を上書きすれば`label`の出力も自動で変わります。

:::message{warning}
デフォルト実装の本体では、実装先の型のフィールドを`self.title`のように直接書くことはできません（エラー: E0609）。トレイト宣言の時点では`Self`がどの型になるか決まっていないためです。値に触れる手段は、トレイトが宣言したメソッド・関連定数と、`Self`に課した[[trait-bound]]経由に限られます。
:::

## 上書きの規則

| 実装側の書き方 | 結果 |
| --- | --- |
| デフォルトのあるメソッドを書かない | デフォルト実装がそのまま使われる |
| デフォルトのあるメソッドを同名で定義する | その定義で**上書き**される[^4] |
| デフォルトのない項目（メソッド・関連定数・関連型）を書かない | エラー: E0046（必須の項目が足りない） |

上書きは「置き換え」であり、上書きした実装の中からそのメソッドのデフォルト実装を呼び出すことはできません[^5]。デフォルトの処理を土台にして前後に処理を足したい場合は、共通部分を別のメソッド（デフォルト実装付き）に切り出しておく必要があります。

## 補足

:::details[標準ライブラリでの使われ方]
[[standard-library]]の主要なトレイトは、この仕組みで「必須は最小限、残りはデフォルト」という形に整理されています。

| トレイト | 必須のメソッド | デフォルト実装を持つ主なメソッド |
| --- | --- | --- |
| `Iterator` | `next`（と関連型`Item`） | `map`・`filter`・`sum`など多数[^7] |
| `PartialEq` | `eq` | `ne`（`eq`の否定。「よほどの理由がない限り上書きすべきでない」と明記されている）[^8] |
| `Ord` | `cmp` | `max`・`min`・`clamp`[^9] |

`Iterator`を自作の型に実装するとき`next`だけ書けば大量のメソッドが使えるようになるのは、それらがすべて`next`を呼ぶデフォルト実装だからです。<!-- TODO: [[iterator]] 作成後にリンク -->
:::

:::details[関連定数・関連型のデフォルト]
デフォルトを持てるのはメソッドだけではありません。関連定数は`=`と値を書いておけばデフォルト値になり、逆に`=`以降を省略すると実装側での定義が必須になります[^6]。

一方、**関連型にデフォルトの型は書けません**。型を指定できるのは実装側だけです[^6]（安定版Rustの場合。nightly限定の`associated_type_defaults`機能として提案中）。<!-- TODO: [[associated-type]] 作成後にリンク -->

```rust playground
trait Tax {
    const RATE: u32 = 10; // デフォルト値付きの関連定数

    fn price(&self) -> u32;

    fn price_with_tax(&self) -> u32 {
        self.price() * (100 + Self::RATE) / 100
    }
}

struct Book;
impl Tax for Book {
    const RATE: u32 = 8; // 書籍は軽減税率として上書き
    fn price(&self) -> u32 {
        3200
    }
}

struct Pen;
impl Tax for Pen {
    // RATE は書かない → デフォルトの 10 が使われる
    fn price(&self) -> u32 {
        150
    }
}

fn main() {
    println!("{}円", Book.price_with_tax()); // 3456円
    println!("{}円", Pen.price_with_tax()); // 165円
}
```
:::

[^1]: [The Rust Reference - Traits](https://doc.rust-lang.org/reference/items/traits.html) "Trait functions may omit the function body by replacing it with a semicolon. This indicates that the implementation must define the function. If the trait function defines a body, this definition acts as a default for any implementation which does not override it."
[^2]: [The Rust Programming Language - Default Implementations](https://doc.rust-lang.org/book/ch10-02-traits.html#default-implementations) "To use a default implementation to summarize instances of NewsArticle, we specify an empty impl block with impl Summary for NewsArticle {}."
[^3]: [The Rust Programming Language - Default Implementations](https://doc.rust-lang.org/book/ch10-02-traits.html#default-implementations) "Default implementations can call other methods in the same trait, even if those other methods don't have a default implementation. In this way, a trait can provide a lot of useful functionality and only require implementors to specify a small part of it."
[^4]: [The Rust Reference - Trait implementations](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementations) "A trait implementation must define all non-default associated items declared by the implemented trait, may redefine default associated items defined by the implemented trait, and cannot define any other items."
[^5]: [The Rust Programming Language - Default Implementations](https://doc.rust-lang.org/book/ch10-02-traits.html#default-implementations) "Note that it isn't possible to call the default implementation from an overriding implementation of that same method."
[^6]: [The Rust Reference - Traits](https://doc.rust-lang.org/reference/items/traits.html) "Similarly, associated constants may omit the equal sign and expression to indicate implementations must define the constant value. Associated types must never define the type, the type may only be specified in an implementation."
[^7]: [std::iter::Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html) Required Methods に`next`のみが挙げられ、その他は Provided Methods として列挙されている。
[^8]: [std::cmp::PartialEq](https://doc.rust-lang.org/std/cmp/trait.PartialEq.html) "The default implementation of ne provides this consistency and is almost always sufficient. It should not be overridden without very good reason."
[^9]: [std::cmp::Ord](https://doc.rust-lang.org/std/cmp/trait.Ord.html) Required Methods は`cmp`のみで、`max`・`min`・`clamp`は Provided Methods。
