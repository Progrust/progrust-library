---
title: 比較のトレイト
description: 等価性と順序づけを型に与える`PartialEq`・`Eq`・`PartialOrd`・`Ord`の4トレイト。Partialの有無は反射律と全順序を保証するかの違い。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "標準ライブラリ", "型システム"]
public: true
---

値の等しさと大小を比べる振る舞いは、[[standard-library]]の`std::cmp`にある4つの[[trait]]が担っています。等価性を`PartialEq`と`Eq`が、順序づけを`PartialOrd`と`Ord`が担当し、`Partial`の付かない側は付く側より強い数学的性質を型に要求します。

[[comparison-operators]]（`==`や`<`）はこれらのメソッド呼び出しに展開されるため、自作の型を比較できるようにするには、この4つのうち必要なものを実装します。多くの場合は[[derive]]で導出するだけで済みます。

```rust playground
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Price(u32); // 税込価格（円）

fn main() {
    let mut prices = vec![Price(320), Price(120), Price(980)];
    prices.sort(); // sortはOrdを要求する
    println!("{:?}", prices);
    println!("最安: {:?}", prices.iter().min().unwrap()); // minもOrd
    println!("同額か: {}", Price(120) == Price(120)); // ==はPartialEq
}
```

## 4つのトレイトの関係

`Eq`は`PartialEq`を、`Ord`は`Eq`と`PartialOrd`を、それぞれスーパートレイトとして継承しています。つまり`Ord`を実装する型は、残り3つもすべて実装している必要があります。各トレイトが要求する[[method]]と、追加で保証する性質は次のとおりです。

| トレイト | スーパートレイト | 要求メソッド | 対応する演算子 | 追加で保証する性質 |
| --- | --- | --- | --- | --- |
| `PartialEq<Rhs = Self>` | なし | `eq` | `==`・`!=` | 対称律・推移律[^1] |
| `Eq` | `PartialEq` | なし | — | 反射律（`a == a`）[^2] |
| `PartialOrd<Rhs = Self>` | `PartialEq` | `partial_cmp` | `<`・`<=`・`>`・`>=` | 推移律・双対性[^3] |
| `Ord` | `Eq`と`PartialOrd` | `cmp` | — | 全順序（`a < b`・`a == b`・`a > b`のちょうど1つが成立）[^4] |

`Eq`と`Ord`は演算子を新たに増やすわけではなく、`Eq`に至ってはメソッドを1つも持ちません。

## 「部分」と「全」の違い

`Partial`は「比較が成立しない組み合わせがあってもよい」という意味です。この違いは、要求メソッドの戻り値の型にそのまま表れています。

- `PartialOrd`の`partial_cmp`は[[option]]（`Option<Ordering>`）を返し、順序が決まらない場合に`None`を返せます
- `Ord`の`cmp`は`Ordering`（`Less`・`Equal`・`Greater`のいずれか）を必ず返すため、どの2つの値を比べても必ず決着が付きます

等価性の側も同様で、`PartialEq`が要求するのは対称律と推移律だけです。`a == a`が成り立つこと（反射律）までは求めていないため、自分自身と等しくならない値が混じっていても構いません。`Eq`はそこに反射律を足して、比較を数学でいう同値関係にします[^2]。

```rust playground
fn main() {
    println!("{:?}", 3.partial_cmp(&5)); // Some(Less)
    println!("{:?}", 3.cmp(&5));         // Less（Ordなので必ず決まる）
    println!("{:?}", f64::NAN.partial_cmp(&1.0)); // None（順序が決まらない）
}
```

:::message{warning}
`Eq`と`Ord`が宣言する性質をコンパイラは検査できません。`#[derive(Eq)]`や手書きの`impl Eq for 型名 {}`は「この型では反射律が成り立つ」という実装者の申告であり、実際に成り立つかどうかは実装者の責任です[^2]。性質を破った実装は論理エラーとして扱われ、結果の挙動は規定されていません（ただし未定義動作を引き起こしてはならない、とも定められています）[^2][^4]。
:::

## 浮動小数点型が`Eq`を実装しない理由

[[floating-point-type]]（`f32`・`f64`）は`PartialEq`と`PartialOrd`だけを実装し、`Eq`と`Ord`は実装しません。IEEE 754が定める`NaN`（非数）が原因です。

`NaN`は自分自身とも等しくならず、`NaN == NaN`は`false`になります。これは反射律`a == a`に反するため、`Eq`の要求を満たせません[^1][^2]。順序についても`NaN`はどの値とも大小が決まらず、`partial_cmp`が`None`を返すため、必ず決着が付くことを求める`Ord`も実装できません[^3]。

実害が出るのはソートなどの場面です。`slice::sort`は`T: Ord`という[[trait-bound]]を持つため、要素が`f64`の[[vec]]はそのままでは並べ替えられません。比較の仕方を自分で渡す`sort_by`を使い、IEEE 754の`totalOrder`に従って全順序を与える`total_cmp`（Rust 1.62以降）を呼びます[^5]。

```rust playground
fn main() {
    let mut weights = vec![1.5_f64, 0.3, 2.25]; // 商品の重さ（kg）
    // f64はOrdを実装しないため、sortはエラー: E0277になる
    weights.sort(); // [!code --]
    weights.sort_by(|a, b| a.total_cmp(b)); // [!code ++]
    println!("{:?}", weights); // [0.3, 1.5, 2.25]
}
```

## 補足

:::details[deriveするときの組み合わせ]
継承関係があるため、[[derive]]でも下位のトレイトを一緒に導出する必要があります。`#[derive(Eq)]`だけを書くと、スーパートレイトの`PartialEq`が実装されていないためコンパイルエラーになります。

<!-- rustc: expect E0277 -->
```rust playground
#[derive(Eq)] // エラー: E0277（PartialEqを実装していない）
struct Price(u32);

fn main() {
    println!("{}", Price(120).0);
}
```

実際には次の4通りのどれかを書くことになります。

| 書き方 | できるようになること |
| --- | --- |
| `#[derive(PartialEq)]` | `==`・`!=`での比較 |
| `#[derive(PartialEq, Eq)]` | 上に加えて`Eq`を要求するAPIで使える |
| `#[derive(PartialEq, PartialOrd)]` | 上に加えて`<`などでの比較（`f64`のフィールドを持つ型はここまで） |
| `#[derive(PartialEq, Eq, PartialOrd, Ord)]` | 上に加えて`Ord`を要求するAPIで使える |

導出される比較は[[struct]]ならフィールドの宣言順、[[enum]]ならバリアントの判別子（既定では宣言順）を優先度とする辞書式比較です[^3]。フィールドやバリアントの並び替えが比較結果を変えてしまう点に注意してください。
:::

:::details[手で実装するときはOrdに寄せる]
`!=`を担う`ne`と、`<`などを担う`lt`・`le`・`gt`・`ge`には[[default-implementation]]があるため、手で書くのは`eq`・`partial_cmp`・`cmp`の3つだけです[^1][^3]。

std公式ドキュメントは、`Ord`まで実装する型では4つとも[[derive]]で導出するか、4つとも`cmp`の実装をもとに手で書くかのどちらかに揃えることを勧めています[^4]。一部だけを導出して残りを手書きすると、`==`と`cmp`の答えが食い違いやすいためです[^1]。手で書く場合は比較のロジックを`cmp`に集約し、残りはそこへ委譲します。

```rust playground
use std::cmp::Ordering;

struct Book {
    title: String,
    price: u32,
}

impl Ord for Book {
    fn cmp(&self, other: &Self) -> Ordering {
        // 価格順。同額なら題名順で決着させる
        self.price.cmp(&other.price).then(self.title.cmp(&other.title))
    }
}

impl PartialOrd for Book {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other)) // Ordに委譲する
    }
}

impl PartialEq for Book {
    fn eq(&self, other: &Self) -> bool {
        self.cmp(other) == Ordering::Equal // 同じくOrdに委譲する
    }
}

impl Eq for Book {}

fn main() {
    let cheap = Book { title: String::from("Rust入門"), price: 3200 };
    let pricey = Book { title: String::from("Rust実践"), price: 4200 };
    println!("{}", cheap < pricey);  // true
    println!("{}", cheap == pricey); // false
}
```
:::

:::details[EqやOrdを要求する標準ライブラリのAPI]
`Eq`と`Ord`はメソッドを持たない（あるいは増やさない）にもかかわらず、標準ライブラリの各所でトレイト境界として要求されます。

| API | 要求される境界 | 理由 |
| --- | --- | --- |
| `slice::sort`・`Iterator::max`・`Iterator::min` | `Ord` | どの2値も必ず順序が決まらないと結果が定まらないため |
| `BTreeMap`・`BTreeSet`のキー | `Ord` | キーを順序どおりに並べて保持するため |
| `HashMap`・`HashSet`のキー | `Eq + Hash` | 等しいキーのハッシュ値は必ず等しい、という前提で探索するため[^6] |

<!-- TODO: [[btreemap]] 作成後にリンク -->
<!-- TODO: [[hashmap]] 作成後にリンク -->
<!-- TODO: [[hash-trait]] 作成後にリンク -->

比較の仕方を引数で受け取る`sort_by`・`max_by`などは`Ord`を要求しないため、`f64`のように`Ord`を実装しない型でも使えます。
:::

:::details[演算子との対応]
`==`・`!=`が`PartialEq`に、`<`・`<=`・`>`・`>=`が`PartialOrd`に対応するように、Rustの演算子の多くは対応するトレイトの実装として定義されています。`+`なら`std::ops::Add`といった具合です。この仕組みは演算子オーバーロードと呼ばれます。
<!-- TODO: [[operator-overloading]] 作成後にリンク -->

なお`PartialEq<Rhs = Self>`・`PartialOrd<Rhs = Self>`は右辺の型を型引数に取り、その既定値が`Self`であるために「同じ型同士」が原則になります。異なる型と比べたいときは、`impl PartialEq<別の型> for 自分の型`のように`Rhs`を明示して実装します[^1]。`String`と`&str`が`==`で比べられるのも、標準ライブラリがこの形の実装を用意しているためです。
:::

[^1]: [std公式ドキュメント — Trait PartialEq](https://doc.rust-lang.org/std/cmp/trait.PartialEq.html) "Trait for comparisons using the equality operator." / 定義は`pub trait PartialEq<Rhs = Self> where Rhs: ?Sized`、必須メソッドは`eq`、`ne`は提供メソッド（"The default implementation is almost always sufficient"）。要求される性質: "symmetric: if `A: PartialEq<B>` and `B: PartialEq<A>`, then `a == b` implies `b == a`" / "transitive: ... `a == b` and `b == c` implies `a == c`" / "This trait allows for comparisons using the equality operator, for types that do not have a full equivalence relation. For example, in floating point numbers `NaN != NaN`, so floating point types implement `PartialEq` but not `Eq`." / "If `PartialOrd` or `Ord` are also implemented for `Self` and `Rhs`, their methods must also be consistent with `PartialEq` ... It's easy to accidentally make them disagree by deriving some of the traits and manually implementing others." / 異なる型との比較: "How can I compare two different types? The type you can compare with is controlled by `PartialEq`'s type parameter."（`impl PartialEq<BookFormat> for Book`の例が示されている）

[^2]: [std公式ドキュメント — Trait Eq](https://doc.rust-lang.org/std/cmp/trait.Eq.html) 定義は`pub trait Eq: PartialEq`。"The primary difference to `PartialEq` is the additional requirement for reflexivity." / "`Eq`, which builds on top of `PartialEq` also implies: reflexive: `a == a`" / "This property cannot be checked by the compiler, and therefore `Eq` is a trait without methods." / "Violating this property is a logic error. The behavior resulting from a logic error is not specified, but users of the trait must ensure that such logic errors do *not* result in undefined behavior." / "Floating point types such as `f32` and `f64` implement only `PartialEq` but *not* `Eq` because `NaN` != `NaN`."（Rust 1.93のstdソース`core/src/cmp.rs`で確認）

[^3]: [std公式ドキュメント — Trait PartialOrd](https://doc.rust-lang.org/std/cmp/trait.PartialOrd.html) 定義は`pub trait PartialOrd<Rhs = Self>: PartialEq<Rhs>`、必須メソッドは`partial_cmp`、`lt`・`le`・`gt`・`ge`は提供メソッド。要求される性質は "Transitivity" と "Duality" の2つで、"irreflexivity of `<` and `>`: `!(a < a)`, `!(a > a)`" は、そこから導かれる系（Corollaries）として記載されている。"`partial_cmp` returns `None` if the values are not comparable"（`f64::NAN.partial_cmp(&1.0) == None`の例あり）。導出: "When `derive`d on structs, it will produce a lexicographic ordering based on the top-to-bottom declaration order of the struct's members. When `derive`d on enums, variants are primarily ordered by their discriminants." 実装の指針: "If your type is `Ord`, you can implement `partial_cmp` by using `cmp`" （`Some(self.cmp(other))`）。

[^4]: [std公式ドキュメント — Trait Ord](https://doc.rust-lang.org/std/cmp/trait.Ord.html) 定義は`pub trait Ord: Eq + PartialOrd`、必須メソッドは`cmp`。要件は "Implementations must be consistent with the `PartialOrd` implementation" / "`partial_cmp(a, b) == Some(cmp(a, b))`"。本文の「ちょうど1つが成立」は、そこから導かれる系（Corollaries）"From the above and the requirements of `PartialOrd`, it follows that ... exactly one of `a < b`, `a == b` or `a > b` is true" にあたる。厳密には "Mathematically speaking, the `<` operator defines a strict weak order. In cases where `==` conforms to mathematical equality, it also defines a strict total order." とされている。実装方針は "If you derive it, you should derive all four traits. If you implement it manually, you should manually implement all four traits, based on the implementation of `Ord`."。"Violating these requirements is a logic error. The behavior resulting from a logic error is not specified, but users of the trait must ensure that such logic errors do *not* result in undefined behavior."（Rust 1.93のstdソース`core/src/cmp.rs`で確認）

[^5]: [std公式ドキュメント — f64::total_cmp](https://doc.rust-lang.org/std/primitive.f64.html#method.total_cmp) "Unlike the standard partial comparison between floating point numbers, this comparison always produces an ordering in accordance to the `totalOrder` predicate as defined in the IEEE 754 (2008 revision) floating point standard." 安定化バージョンは`#[stable(feature = "total_cmp", since = "1.62.0")]`（Rust 1.93のソースで確認）。`slice::sort`の境界`T: Ord`も同ソースで確認。

[^6]: [std公式ドキュメント — Struct HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html) "It is required that the keys implement the `Eq` and `Hash` traits, although this can frequently be achieved by using `#[derive(PartialEq, Eq, Hash)]`. If you implement these yourself, it is important that the following property holds: `k1 == k2 -> hash(k1) == hash(k2)`. ... Violating this property is a logic error."
