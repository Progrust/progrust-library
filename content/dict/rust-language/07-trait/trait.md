---
title: トレイト
description: 型が持つ振る舞いを定義する仕組み。trait宣言で求めるメソッドを並べ、impl Trait for Typeで型ごとに実装する構文。
created_at: 2026-08-20
updated_at: 2026-08-20
tags: ["トレイト", "型システム", "基本文法"]
public: true
---

トレイトは、「この型はこういう振る舞いを持つ」という**共通のインターフェース**を定義する仕組みです。`trait`宣言でメソッドのシグネチャを並べ、`impl トレイト名 for 型名 { ... }`で型ごとに中身を実装します。同じトレイトを実装した型は、型が違っても同じメソッド名で同じように扱えます。

```rust playground
// 「説明文を返せる」という振る舞いを定義する
trait Describe {
    fn describe(&self) -> String;
}

struct Book {
    title: String,
    price: u32,
}

// 自分で定義した型に実装する
impl Describe for Book {
    fn describe(&self) -> String {
        format!("書籍『{}』 {}円", self.title, self.price)
    }
}

// 標準ライブラリの型にも、自分のトレイトなら実装できる
impl Describe for u32 {
    fn describe(&self) -> String {
        format!("数値 {}", self)
    }
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    println!("{}", book.describe());
    println!("{}", 42.describe());
}
```

## 宣言と実装の規則

トレイトの本体には[[method]]や[[associated-function]]のほか、関連定数・関連型も置けます[^1]。<!-- TODO: [[associated-type]] 作成後にリンク -->本体を省略した（`;`で終わる）メソッドは実装側で必ず定義しなければならず、トレイト側に本体を書いておくとそれが[[default-implementation]]（既定の実装）になります[^2]。

実装側（`impl Trait for Type`）は、トレイトが要求する項目を**すべて**定義する必要があり（足りないとエラー: E0046）、トレイトにないメソッドを勝手に追加することもできません（エラー: E0407。関連型ならE0437、関連定数ならE0438）[^3]。型に固有のメソッドを追加する[[impl-block]]（`impl 型名 { ... }`）とは、この点で役割が異なります。

## 他言語のインターフェースとの違い

Java・C#・Goなどの「インターフェース」と似ていますが[^5]、次の点が異なります。

| 観点 | 多くの言語のインターフェース | Rustのトレイト |
| --- | --- | --- |
| 実装を書く場所 | 型の定義と一体（`class X implements Y`） | 型の定義とは別の`impl`ブロック。**後付け**できる |
| 他所の型への実装 | 基本的に不可 | 自分のトレイトなら[[standard-library]]の型にも実装できる（上の例の`u32`） |
| メソッドの呼び出し | 常に呼べる | トレイトが[[scope]]内にあるときだけ呼べる[^6] |

[[clone]]・[[copy]]・[[conversion-traits]]など、標準ライブラリの機能の多くもこの「後付けできる振る舞い」の形で提供されています。

:::message{tip}
別の[[module]]や[[crate]]で定義されたトレイトのメソッドを呼ぶには、そのトレイトを[[use-declaration]]でスコープに持ち込む必要があります。「実装されているはずのメソッドが見つからない」というエラーの多くはこれが原因です（型引数`T: Trait`の境界経由で呼ぶ場合は例外です）。
:::

## オーファンルール（コヒーレンス）

トレイトの実装は、**トレイトか、実装に現れる型の少なくとも1つが自分のクレートで定義されている**ときだけ書けます[^7]（`impl Trait<A> for B`なら`A`・`B`のどちらかが自分の型であればよい）。外部のトレイトを外部の型に実装しようとするとエラー: E0117になります。この規則を**オーファンルール**（孤児の規則）と呼びます。

<!-- rustc: expect E0117 -->
```rust
use std::fmt;

// Display（std）を Vec<i32>（std）に実装しようとしている
impl fmt::Display for Vec<i32> { // エラー: E0117（トレイトも型も外部のもの）
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}個の要素", self.len())
    }
}
```

この規則がないと、2つの外部クレートが同じトレイトを同じ型に別々に実装でき、依存を1つ追加しただけで実装が衝突してコンパイルが通らなくなる事態が起こりえます[^7]。「1つの型に対する1つのトレイトの実装は、プログラム全体で1つに定まる」という性質を**コヒーレンス**（一貫性）と呼び、オーファンルールはそれを保証するための規則です。

## 補足

:::details[外部トレイトを外部型に実装したいとき]
どうしても外部の型に外部のトレイトを実装したい場合は、外部の型を自分の[[struct]]で包んだ**ニュータイプ**（`struct Wrapper(Vec<i32>);`のような[[tuple-struct]]）を用意し、そのラッパーに実装します。ラッパーは自分のクレートの型なので、オーファンルールに違反しません。

```rust playground
use std::fmt;

struct Wrapper(Vec<i32>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}個の要素", self.0.len())
    }
}

fn main() {
    let scores = Wrapper(vec![80, 95, 70]);
    println!("{}", scores); // 3個の要素
}
```
:::

:::details[本項で扱わない発展的な機能]
トレイトには、ここで扱った基本のほかに次のような使い方があります。

- トレイト内では`Self`という型が暗黙に使え、「このトレイトを実装している型」を指します[^4]
- [[generics]]の型引数に「このトレイトを実装していること」を要求する[[trait-bound]]
- `dyn トレイト名`で、異なる型の値を同じトレイトの実装として実行時に切り替える（[[trait-object]]）
- `#[derive(...)]`で標準トレイトの実装を自動生成する<!-- TODO: [[derive]] 作成後にリンク -->
- `+`や`==`などの演算子の振る舞いを、対応するトレイトの実装で定義する<!-- TODO: [[operator-overloading]] 作成後にリンク -->
:::

[^1]: [The Rust Reference - Traits](https://doc.rust-lang.org/reference/items/traits.html) "This interface consists of associated items, which come in three varieties: functions, types, constants"
[^2]: [The Rust Reference - Traits](https://doc.rust-lang.org/reference/items/traits.html) "Trait functions may omit the function body by replacing it with a semicolon. ... If the trait function defines a body, this definition acts as a default for any implementation which does not override it."
[^3]: [The Rust Reference - Trait implementations](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementations) "A trait implementation must define all non-default associated items declared by the implemented trait, may redefine default associated items defined by the implemented trait, and cannot define any other items."
[^4]: [The Rust Reference - Traits](https://doc.rust-lang.org/reference/items/traits.html) "All traits define an implicit type parameter Self that refers to 'the type that is implementing this interface'."
[^5]: [The Rust Programming Language - Traits: Defining Shared Behavior](https://doc.rust-lang.org/book/ch10-02-traits.html) "Traits are similar to a feature often called interfaces in other languages, although with some differences."
[^6]: [The Rust Reference - Method-call expressions](https://doc.rust-lang.org/reference/expressions/method-call-expr.html) "Any of the methods provided by a visible trait implemented by T."
[^7]: [The Rust Reference - Orphan rules](https://doc.rust-lang.org/reference/items/implementations.html#orphan-rules) "The orphan rule states that a trait implementation is only allowed if either the trait or at least one of the types in the implementation is defined in the current crate. It prevents conflicting trait implementations across different crates and is key to ensuring coherence."
