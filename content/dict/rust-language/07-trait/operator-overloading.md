---
title: 演算子オーバーロード
description: 演算子の振る舞いを`std::ops`のトレイト実装として定義し、自作の型でも`+`や`!`を使えるようにする仕組み。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "標準ライブラリ", "基本文法"]
public: true
---

演算子オーバーロードは、`+`や`!`といった演算子の振る舞いを[[trait]]の実装として定義し、自作の型でも演算子を使えるようにする仕組みです。演算子はそれぞれ[[standard-library]]の`std::ops`にあるトレイトと対応づけられていて、`a + b`という[[expression]]は`Add`トレイトの`add`という[[method]]の呼び出しとして扱われます[^1]。

オーバーロードできるのは**裏付けとなるトレイトを持つ演算子だけ**です。トレイトのない`=`（代入）の意味は変えられませんし、新しい演算子を作る手段も用意されていません（構文そのものを増やしたい場合は[[macro]]を使うことになります）[^2]。

```rust playground
use std::ops::Add;

// 税込価格（円）
#[derive(Debug, Clone, Copy)]
struct Price(u32);

impl Add for Price {
    type Output = Price; // 加算した結果の型

    fn add(self, rhs: Price) -> Price {
        Price(self.0 + rhs.0)
    }
}

fn main() {
    let book = Price(3200);
    let coffee = Price(480);
    println!("{:?}", book + coffee); // Price(3680)
    println!("{:?}", book + coffee + coffee); // Price(4160)
}
```

## 演算子と対応するトレイト

オーバーロードできるのは[[numeric-operations]]で使う算術演算子だけではなく、ビット演算・添字アクセス・[[dereference]]なども`std::ops`のトレイトに対応づけられています[^2]。複合代入（`+=`など）は`+`とは独立したトレイトが担当するため、`Add`を実装しただけでは`+=`は使えるようになりません。

:::details[演算子と`std::ops`トレイトの対応表]

| 演算子 | トレイト | 複合代入のトレイト |
| --- | --- | --- |
| `+`・`-`・`*`・`/`・`%` | `Add`・`Sub`・`Mul`・`Div`・`Rem` | `AddAssign`〜`RemAssign` |
| `&`・`\|`・`^`・`<<`・`>>` | `BitAnd`・`BitOr`・`BitXor`・`Shl`・`Shr` | `BitAndAssign`〜`ShrAssign` |
| `-`（符号反転）・`!`（否定） | `Neg`・`Not` | — |
| `[]`（添字アクセス） | `Index`・`IndexMut` | — |
| `*`（参照外し） | `Deref`・`DerefMut` | — |
| `()`（[[function]]呼び出し） | `Fn`・`FnMut`・`FnOnce` | — |

<!-- TODO: [[deref-trait]] 作成後にリンク -->
<!-- TODO: [[fn-traits]] 作成後にリンク -->
<!-- TODO: [[closure]] 作成後にリンク -->

このうち`()`に対応する`Fn`・`FnMut`・`FnOnce`だけは、自作の型に**手で実装することがまだできません**（Rust 1.93時点。試みるとエラー: E0183になります）。クロージャや関数がコンパイラによって自動的に実装するトレイト、という位置づけです[^8]。
:::

:::message{tip}
std公式ドキュメントは、演算子トレイトの実装を**その演算子の通常の意味から外れないもの**にすることを求めています。`Mul`を実装するなら掛け算らしい振る舞い（結合則が成り立つなど）にする、といった具合です[^2]。`+`で要素を削除するような実装はコンパイルこそ通りますが、読み手を裏切ります。
:::

## `Output`と右辺の型

`std::ops`のトレイトは、演算した結果の型を`Output`という[[associated-type]]で表します。`Add`の宣言は次の形です[^3]。

```rust
// std::ops::Add の宣言（抜粋）
trait Add<Rhs = Self> {
    type Output; // 演算結果の型
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

型引数`Rhs`は右辺の型で、既定値が`Self`のため、省略すると同じ型同士の演算になります。`Rhs`と`Output`を変えれば、異なる型との演算や、被演算子とは別の型を返す演算も定義できます。

```rust playground
use std::ops::Mul;

#[derive(Debug, Clone, Copy)]
struct Price(u32);

// 価格 × 個数 → 価格（右辺は u32、結果は Price）
impl Mul<u32> for Price {
    type Output = Price;

    fn mul(self, count: u32) -> Price {
        Price(self.0 * count)
    }
}

fn main() {
    println!("{:?}", Price(120) * 3); // Price(360)
}
```

[[generics]]を使うコードで演算子に頼るときは、`T: Add<Output = T>`のように[[trait-bound]]の中で`Output`まで指定します。結果の型が決まらないと、加算した値を何に使えるか分からないためです。

## オーバーロードできない演算子

`&&`と`||`には対応するトレイトがなく、オーバーロードできません。左辺だけで結果が決まるなら右辺を評価しないという**短絡評価**の性質が、両辺の値を受け取る他の演算子トレイトの設計と噛み合わないためで、std公式ドキュメントでは「設計を検討中」とされています[^2]。そのため`&&`・`||`は[[boolean-type]]専用のままです。[[logical-operators]]のうち`!`（`Not`）や、短絡評価しない`&`・`|`・`^`（`BitAnd`・`BitOr`・`BitXor`）はオーバーロードできるので、対象外なのは`&&`・`||`の2つだけ、ということになります。

このほか、次の演算子もオーバーロードの対象外です。

- `=`（代入）— 裏付けとなるトレイトがありません[^2]
- `&`・`&mut`（[[borrow]]演算子）— The Rust Referenceに「オーバーロードできない」と明記されています[^4]。ビット演算の`&`とは別物である点に注意してください
- `as`（[[type-cast]]）— `std::ops`にキャストを担うトレイトが存在しません[^2]。自作の型に型変換を持たせたい場合は、[[conversion-traits]]の`From`・`Into`を実装して`.into()`で変換します

## 比較演算子は`std::cmp`が担う

[[comparison-operators]]（`==`や`<`）もオーバーロードできますが、対応するトレイトは`std::ops`ではなく`std::cmp`の`PartialEq`・`PartialOrd`です[^5]。4つのトレイトの関係は[[comparison-traits]]で扱っています（多くの場合は[[derive]]で導出できます）。

オペランドの受け取り方にも違いがあります。算術演算子のオペランドは値として評価されるため、[[copy]]を実装していない型では演算のたびに[[move]]が起きます[^6]。一方、比較演算子はオペランドを共有借用で受け取り、`a == b`は`PartialEq::eq(&a, &b)`に展開されるため、比較しても値は失われません[^5]。

## 補足

:::details[`+=`には`AddAssign`が別に必要]
`+`と`+=`は別のトレイトです。`Add`だけを実装した型に`+=`を使うとエラー: E0368になります。

<!-- rustc: expect E0368 -->
```rust playground
use std::ops::Add;

#[derive(Debug, Clone, Copy)]
struct Price(u32);

impl Add for Price {
    type Output = Price;
    fn add(self, rhs: Price) -> Price {
        Price(self.0 + rhs.0)
    }
}

fn main() {
    let mut total = Price(0);
    total += Price(120); // エラー: E0368（AddAssignを実装していない）
    println!("{:?}", total);
}
```

`AddAssign`を実装すると`+=`が使えるようになります。[[primitive-type]]以外では`a += b`は`a.add_assign(b)`と同じで[^7]、`add_assign`が`&mut self`を取るため、左辺をムーブせずその場で書き換えます。

```rust playground
use std::ops::AddAssign;

#[derive(Debug)]
struct Price(u32);

impl AddAssign for Price {
    fn add_assign(&mut self, rhs: Price) {
        self.0 += rhs.0;
    }
}

fn main() {
    let mut total = Price(0);
    total += Price(120);
    total += Price(480);
    println!("{:?}", total); // Price(600)
}
```
:::

:::details[オペランドがムーブされる問題]
`Add::add`は`self`を値で受け取るため、`Copy`を実装していない型では`a + b`のあとに`a`が使えなくなります。標準ライブラリの[[string]]の`+`もこの形で、`impl Add<&str> for String`として左辺を値で、右辺を[[string-slice]]への[[reference]]で受け取ります。

std公式ドキュメントは、自作の型が加算をサポートするなら`T`だけでなく`&T`にも`Add`を実装しておくことを勧めています。そうすれば、型引数を使う汎用的なコードから呼ぶときに毎回[[clone]]せずに済むためです[^2]。標準ライブラリの数値型もこの形の実装を持っており、`&3 + &4`のように参照同士でも加算できます。
:::

:::details[外部の型にも実装できる場合がある]
`std::ops`のトレイトは外部（std）のトレイトなので、実装できる範囲は[[trait]]のオーファンルールに従います。ただし制約は「トレイトか、実装に現れる型の少なくとも1つが自分の[[crate]]で定義されていること」なので、型引数のどこかに自分の型が現れていれば`u32`のような外部の型にも実装できます。`3 * Price(120)`のように自分の型を右辺に置く演算を書きたいときは、この形の実装を追加します。

```rust playground
use std::ops::Mul;

#[derive(Debug, Clone, Copy)]
struct Price(u32);

// 外部の型 u32 への実装。型引数に自分の型 Price が現れているため書ける
impl Mul<Price> for u32 {
    type Output = Price;

    fn mul(self, price: Price) -> Price {
        Price(self * price.0)
    }
}

fn main() {
    println!("{:?}", 3 * Price(120)); // Price(360)
}
```
:::

:::details[演算子トレイトは`derive`できない]
`PartialEq`などとは違い、`Add`や`Not`を`#[derive(...)]`で導出することはできません。フィールドごとに加算すればよいのか、片方のフィールドだけを足すのかは型ごとに違い、機械的には決められないためです。

処理系が組み込みで用意している`derive`は`Clone`・`Copy`・`Debug`・`Default`・`Eq`・`Hash`・`Ord`・`PartialEq`・`PartialOrd`の9つだけで[^9]、いずれも振る舞いがフィールドから一意に決まるものです（[[derive]]）。`std::ops`のトレイトは1つも含まれていないため、演算子の中身は必ず手で書きます。
:::

[^1]: [The Rust Reference - Operator expressions](https://doc.rust-lang.org/reference/expressions/operator-expr.html) "Operators are defined for built in types by the Rust language." / "Many of the following operators can also be overloaded using traits in `std::ops` or `std::cmp`."

[^2]: [std公式ドキュメント — Module std::ops](https://doc.rust-lang.org/std/ops/index.html) 同ページのトレイト一覧に`as`（キャスト）に対応するトレイトは存在しない。"Only operators backed by traits can be overloaded. For example, the addition operator (`+`) can be overloaded through the `Add` trait, but since the assignment operator (`=`) has no backing trait, there is no way of overloading its semantics. Additionally, this module does not provide any mechanism to create new operators. If traitless overloading or custom operators are required, you should look toward macros to extend Rust's syntax." / "Implementations of operator traits should be unsurprising in their respective contexts, keeping in mind their usual meanings and operator precedence. For example, when implementing `Mul`, the operation should have some resemblance to multiplication (and share expected properties like associativity)." / "Note that the `&&` and `||` operators are currently not supported for overloading. Due to their short circuiting nature, they require a different design from traits for other operators like `BitAnd`. Designs for them are under discussion." / "Many of the operators take their operands by value. ... using these operators in generic code, requires some attention if values have to be reused as opposed to letting the operators consume them. One option is to occasionally use `clone`. Another option is to rely on the types involved providing additional operator implementations for references. For example, for a user-defined type `T` which is supposed to support addition, it is probably a good idea to have both `T` and `&T` implement the traits `Add<T>` and `Add<&T>` so that generic code can be written without unnecessary cloning." 演算子とトレイトの対応表も同ページ（Rust 1.93のstdソース`core/src/ops/mod.rs`で確認）。

[^3]: [std公式ドキュメント — Trait std::ops::Add](https://doc.rust-lang.org/std/ops/trait.Add.html) 定義は`pub trait Add<Rhs = Self>`、必須の関連型`type Output`と必須メソッド`fn add(self, rhs: Rhs) -> Self::Output`（Rust 1.93のstdソース`core/src/ops/arith.rs`で確認）。

[^4]: [The Rust Reference - Borrow operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#borrow-operators) "These operators cannot be overloaded."

[^5]: [The Rust Reference - Comparison operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#comparison-operators) 対応表で`==`・`!=`が`std::cmp::PartialEq::eq`・`ne`に、`<`・`<=`・`>`・`>=`が`std::cmp::PartialOrd`のメソッドに対応づけられている。"Unlike the arithmetic and logical operators above, these operators implicitly take shared borrows of their operands, evaluating them in place expression context" / "`a == b;` is equivalent to `::std::cmp::PartialEq::eq(&a, &b);`" / "This means that the operands don't have to be moved out of."

[^6]: [The Rust Reference - Arithmetic and logical binary operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#arithmetic-and-logical-binary-operators) "The operands of all of these operators are evaluated in value expression context so are moved or copied." 演算子と`std::ops`トレイト・複合代入トレイトの対応表も同節。

[^7]: [The Rust Reference - Compound assignment expressions](https://doc.rust-lang.org/reference/expressions/operator-expr.html#compound-assignment-expressions) "this expression is syntactic sugar for using the corresponding trait for the operator ... and calling its method with the left hand side as the receiver and the right hand side as the next argument."（`x += y;`と`x.add_assign(y);`が等価であることが例示されている）

[^8]: [std公式ドキュメント — Trait std::ops::Fn](https://doc.rust-lang.org/std/ops/trait.Fn.html) 必須メソッド`call`には "🔬 This is a nightly-only experimental API. (`fn_traits` #29625)" と付いており、安定版では自作の型に手で実装できない。Rust 1.93で`impl FnOnce<(u32,)> for 自作型`を書くと "error[E0183]: manual implementations of `FnOnce` are experimental" になる。

[^9]: [The Rust Reference - The `derive` attribute](https://doc.rust-lang.org/reference/attributes/derive.html) "The list of built-in derives are: `Clone`, `Copy`, `Debug`, `Default`, `Eq`, `Hash`, `Ord`, `PartialEq`, `PartialOrd`"
