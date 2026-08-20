---
title: トレイト境界
description: ジェネリクスの型引数に特定のトレイトの実装を要求する制約。型引数名の後ろにトレイト名を書く基本形のほか、+による複数指定、where句への切り出し、引数位置のimpl Traitといった書き方。
created_at: 2026-08-20
updated_at: 2026-08-20
tags: ["トレイト", "型システム", "基本文法"]
public: true
---

トレイト境界は、[[generics]]の型引数に「この[[trait]]を実装している型に限る」という制約を付ける仕組みです。`fn f<T: Display>(x: T)`のように、型引数名の後ろに`:`とトレイト名を並べて書きます[^1]。

境界のない`T`は「どんな型か分からない型」なので、値を[[move]]したり[[reference]]を取ったり別の場所へ格納したりする程度のことしかできず、メソッド呼び出しや演算子は使えません。境界を付けると、そのトレイトの[[method]]・[[associated-function]]・関連定数・関連型を`T`の値に対して使えるようになります[^2]。<!-- TODO: [[associated-type]] 作成後にリンク -->

```rust playground
use std::fmt::Display;

// 「大小を比較できて、表示もできる」型だけを受け付ける
// 境界がなければ `>` も `{}` も使えない
fn print_larger<T: PartialOrd + Display>(a: T, b: T) {
    if a > b {
        println!("大きいのは {} です", a);
    } else {
        println!("大きいのは {} です", b);
    }
}

fn main() {
    print_larger(150, 980); // T = i32（りんごとメロンの値段）
    print_larger(36.5, 37.2); // T = f64 でも同じ関数が使える
}
```

## 境界の書き方

| 書き方 | 例 | 補足 |
| --- | --- | --- |
| 型引数の直後に書く | `fn f<T: Display>(x: T)` | 基本の形。`fn f<T>(x: T) where T: Display`と同じ意味[^1] |
| `+`で複数並べる | `fn f<T: Display + Clone>(x: T)` | 並べたトレイトを**すべて**実装する型だけを受け付ける[^3] |
| `where`句に切り出す | `fn f<T>(x: T) where T: Display` | 境界が増えてもシグネチャを読みやすく保てる[^4] |
| 引数位置の`impl Trait` | `fn f(x: impl Display)` | 名前のない型引数を1つ宣言する糖衣構文[^5] |

境界を書けるのは[[function]]だけではありません。[[struct]]・[[enum]]・[[impl-block]]・トレイト宣言など、型引数を持てる場所すべてで同じように書けます。

## where句

境界が増えると`<>`の中が長くなり、引数と戻り値が離れて読みにくくなります。`where`句を使うと、境界をシグネチャの後ろへまとめて切り出せます[^4]。

さらに`where`句には、`T`のような型引数だけでなく`T::Item`（関連型）や`String`といった**型引数そのものではない型**にも境界を書けます[^4]。たとえば`String: PartialEq<T>`のような境界は`where`句でしか書けません。

```rust playground
use std::fmt::Display;

// 「1つずつ取り出せる」ことと「取り出した要素が表示できる」ことを別々に要求する
fn print_all<I>(items: I)
where
    I: IntoIterator,
    I::Item: Display, // 型引数そのものではなく、その関連型に対する境界
{
    for item in items {
        println!("- {}", item);
    }
}

fn main() {
    print_all(vec!["りんご", "みかん"]);
    print_all([150, 980]);
}
```

## 引数位置のimpl Trait

引数の型の位置に`impl トレイト名`と書くと、そのトレイトを境界に持つ名前のない型引数を1つ宣言したのと**ほぼ**同じ意味になります[^5]。型引数名を考えずに済むぶん簡潔ですが、型引数版と完全に同じではありません。

| 観点 | `<T: Trait>`（型引数版） | `impl Trait`（引数位置） |
| --- | --- | --- |
| 呼び出し側での型の明示 | ターボフィッシュ`f::<u32>(x)`で指定できる | 指定できない（型引数リストに現れないため）[^6] |
| 複数の引数を同じ型に揃える | できる（`fn f<T: Display>(a: T, b: T)`） | できない（`fn f(a: impl Display, b: impl Display)`は別々の型でよい）[^7] |
| 書ける場所 | 関数・構造体・列挙型・implブロック・トレイト宣言など | 関数（`extern`関数を除く）の引数と戻り値の型の位置のみ[^8] |

そのため、公開する関数で`impl Trait`と`<T: Trait>`を入れ替えると、呼び出し側にとって破壊的変更になりえます[^6]。また`impl Trait`は[[variable]]の型注釈・構造体のフィールドの型・型エイリアスには書けません[^8]。

なお、戻り値の位置の`impl Trait`は「そのトレイトを実装した具体的な型を1つ返す（どの型かは関数側が決める）」という別の意味になります[^9]。<!-- TODO: [[impl-trait]] 作成後にリンク -->

## 補足

:::details[境界を満たさない型を渡したとき]
境界を満たさない型を渡すと、エラー: E0277（トレイト境界が満たされていない）になります[^10]。エラーが報告されるのは呼び出し側で、関数の中身は境界として宣言された範囲だけを見て検査されます。

<!-- rustc: expect E0277 -->
```rust
use std::fmt::Display;

struct Point {
    x: i32,
    y: i32,
}

fn show<T: Display>(value: T) {
    println!("{}", value);
}

fn main() {
    let p = Point { x: 1, y: 2 };
    show(p); // エラー: E0277（PointはDisplayを実装していない）
}
```
:::

:::details[型定義に付ける境界とimplブロックに付ける境界]
構造体の定義に境界を付けると、その型を組み立てる時点で境界を満たす型しか使えなくなります。一方、implブロック側に境界を付けると「境界を満たす`T`のときだけ使えるメソッド」を定義できます（条件付き実装）。境界は必要な場所にだけ付けるのが原則です。

```rust playground
use std::fmt::Display;

struct Labeled<T> {
    label: String,
    value: T,
}

impl<T> Labeled<T> {
    fn new(label: &str, value: T) -> Self {
        Labeled { label: label.to_string(), value }
    }
}

// T が表示できるときだけ使えるメソッド
impl<T: Display> Labeled<T> {
    fn print(&self) {
        println!("{}: {}", self.label, self.value);
    }
}

fn main() {
    let price = Labeled::new("りんご", 150);
    price.print(); // りんご: 150

    // 表示できない型でも Labeled 自体は作れる
    let point = Labeled::new("座標", (35.6, 139.7));
    println!("{}は表示用のメソッドを持ちません", point.label);
}
```
:::

:::details[暗黙のSized境界と?Sized]
型引数（トレイト内の`Self`を除く）と関連型には、既定で`Sized`（サイズがコンパイル時に分かる型）の境界が暗黙に付いています[^11]。<!-- TODO: [[sized]] 作成後にリンク -->そのため`T`には[[slice]]`[i32]`のようなサイズが定まらない型を渡せません。`T: ?Sized`と書くとこの暗黙の境界だけを緩められます。`?`はこの用途専用で、他のトレイトを緩めるためには使えません[^12]。
:::

[^1]: [The Rust Reference - Trait and lifetime bounds](https://doc.rust-lang.org/reference/trait-bounds.html) "Trait and lifetime bounds provide a way for generic items to restrict which types and lifetimes are used as their parameters." / "Bounds written after declaring a generic parameter: `fn f<A: Copy>() {}` is the same as `fn f<A>() where A: Copy {}`."
[^2]: [The Rust Reference - Trait and lifetime bounds](https://doc.rust-lang.org/reference/trait-bounds.html) "In the body of a generic function, methods from `Trait` can be called on `Ty` values. Likewise associated constants on the `Trait` can be used." / "Associated types from `Trait` can be used."
[^3]: [The Rust Reference - Trait and lifetime bounds](https://doc.rust-lang.org/reference/trait-bounds.html) 構文規則 "Bounds → Bound ( + Bound )\* +?" / [The Rust Programming Language - Multiple Trait Bounds with the + Syntax](https://doc.rust-lang.org/book/ch10-02-traits.html#multiple-trait-bounds-with-the--syntax) "With the two trait bounds specified, the body of notify can call summarize and use {} to format item."
[^4]: [The Rust Reference - Where clauses](https://doc.rust-lang.org/reference/items/generics.html#where-clauses) "Where clauses provide another way to specify bounds on type and lifetime parameters as well as a way to specify bounds on types that aren't type parameters."
[^5]: [The Rust Reference - Anonymous type parameters](https://doc.rust-lang.org/reference/types/impl-trait.html#anonymous-type-parameters) "impl Trait in argument position is syntactic sugar for a generic type parameter like `<T: Trait>`, except that the type is anonymous and doesn't appear in the GenericParams list."
[^6]: [The Rust Reference - Anonymous type parameters](https://doc.rust-lang.org/reference/types/impl-trait.html#anonymous-type-parameters) "With a generic parameter such as `<T: Trait>`, the caller has the option to explicitly specify the generic argument for T at the call site using GenericArgs, for example, `foo::<usize>(1)`. Changing a parameter from either one to the other can constitute a breaking change for the callers of a function, since this changes the number of generic arguments."
[^7]: [The Rust Programming Language - Trait Bound Syntax](https://doc.rust-lang.org/book/ch10-02-traits.html#trait-bound-syntax) "If we want to force both parameters to have the same type, however, we must use a trait bound."
[^8]: [The Rust Reference - Impl trait limitations](https://doc.rust-lang.org/reference/types/impl-trait.html#limitations) "impl Trait can only appear as a parameter or return type of a non-extern function. It cannot be the type of a let binding, field type, or appear inside a type alias."
[^9]: [The Rust Reference - Abstract return types](https://doc.rust-lang.org/reference/types/impl-trait.html#abstract-return-types) "Functions can use impl Trait to return an abstract return type. These types stand in for another concrete type where the caller may only use the methods declared by the specified Trait."
[^10]: [Error code E0277](https://doc.rust-lang.org/error_codes/E0277.html) "You tried to use a type which doesn't implement some trait in a place which expected that trait."
[^11]: [The Rust Reference - Sized](https://doc.rust-lang.org/reference/special-types-and-traits.html#sized) "Type parameters (except Self in traits) are Sized by default, as are associated types."
[^12]: [The Rust Reference - ?Sized](https://doc.rust-lang.org/reference/trait-bounds.html#sized) "? is only used to relax the implicit Sized trait bound for type parameters or associated types. ?Sized may not be used as a bound for other types."
