---
title: ジェネリクス
description: 型引数<T>で具体的な型を後から差し込めるようにする抽象化の仕組み。関数・構造体・列挙型・implブロックで使え、単相化でコンパイル時に型ごとの専用コードへ展開されるため実行時コストが生じないのが特徴。
created_at: 2026-08-20
updated_at: 2026-08-20
tags: ["トレイト", "型システム", "基本文法"]
public: true
---

ジェネリクスは、`<T>`のような**型引数**（型パラメータ）を使って「具体的な型は後から決める」定義を書く仕組みです。`i32`用・`String`用と同じ処理を型ごとに書き分ける代わりに、型を引数にした定義を1つ書けば、呼び出し側が使った型に合わせてコンパイラが具体化してくれます。[[function]]・[[struct]]・[[enum]]・[[impl-block]]・[[trait]]などが型引数を持てます[^1]。

```rust playground
// 関数: どんな型のペアでも順番を入れ替えられる
fn swap_pair<T>(pair: (T, T)) -> (T, T) {
    (pair.1, pair.0)
}

// 構造体: 値の型を後から決める「ラベル付きの値」
struct Labeled<T> {
    label: String,
    value: T,
}

// implブロック: impl<T> と宣言してから Labeled<T> に使う
impl<T> Labeled<T> {
    fn new(label: &str, value: T) -> Self {
        Labeled { label: label.to_string(), value }
    }
}

// 特定の型だけに追加するメソッド（T = u32 のときだけ使える）
impl Labeled<u32> {
    fn with_tax(&self) -> u32 {
        self.value * 110 / 100
    }
}

fn main() {
    // 先攻と後攻を入れ替える（T = &str と推論される）
    let (first, second) = swap_pair(("赤組", "白組"));
    println!("先攻: {} / 後攻: {}", first, second);

    let price = Labeled::new("りんご", 150u32); // T = u32
    let memo = Labeled::new("備考", String::from("特売品")); // T = String
    println!("{}: {}円（税込{}円）", price.label, price.value, price.with_tax());
    println!("{}: {}", memo.label, memo.value);
}
```

## 使える場所と書き方

| 場所 | 書き方 | 補足 |
| --- | --- | --- |
| 関数 | `fn f<T>(x: T) -> T` | 呼び出し時の引数から`T`が[[type-inference]]で決まる |
| 構造体 | `struct S<T> { value: T }` | 型引数を使った`S<i32>`と`S<String>`は別の型 |
| 列挙型 | `enum E<T> { A(T), B }` | [[option]]の`Option<T>`・[[result]]の`Result<T, E>`がこの形 |
| implブロック | `impl<T> S<T> { ... }` | `impl`の直後で`T`を宣言する（宣言しないと具体的な型名扱い）[^2] |

## 単相化と実行時コスト

ジェネリックなコードは、コンパイル時に「実際に使われた具体的な型の組み合わせ」ごとに専用のコードへ展開されます。この処理を**単相化**（monomorphization）と呼びます[^5]。上の例では`swap_pair`が`&str`版として、`Labeled::new`が`u32`版と`String`版として、それぞれ別々に生成されます。

実行時には、型ごとに手書きした関数を呼ぶのと同じコードが動くため、ジェネリクスを使っても**プログラムは遅くなりません**[^5]。型の解決が実行時に行われることはなく、これを**静的ディスパッチ**と呼びます[^6]。実行時に呼び先を決める`dyn Trait`（トレイトオブジェクト）とは対照的です。<!-- TODO: [[trait-object]] 作成後にリンク -->

:::message{info}
型引数`T`だけでは、その値に対して「[[move]]する・[[reference]]を取る」程度のことしかできません。`T`の値を足し算したり表示したりするには、`T`が特定のトレイトを実装していることを[[trait-bound]]で要求します。
:::

## 補足

:::details[implブロックの型引数の制約とターボフィッシュ]
implブロックで宣言した型引数は、実装対象の型か実装するトレイト（またはそれらの境界の関連型）に現れる必要があります。`impl<T> S { ... }`のように、どこにも使われない`T`はエラー: E0207になります[^3]。

呼び出し側で型を推論できないときは、**ターボフィッシュ**記法`::<>`で明示します（例: `"42".parse::<u32>()`、`iter.collect::<Vec<_>>()`）[^4]。
:::

:::details[型引数以外のジェネリックパラメータ]
ジェネリックパラメータには型引数のほかに、**[[lifetime]]パラメータ**（`'a`）と**定数パラメータ**（`const N: usize`）があります[^1]。並べる順序は「ライフタイム → 型と定数（混在可）」と決まっています[^1]。[[array-type]]`[T; N]`の要素数`N`のように、値をコンパイル時の引数として受け取れるのが定数パラメータです。

```rust playground
// N 個分の合計を返す（要素数が型の一部なので、どの長さの配列でも1つの定義で済む）
fn total<const N: usize>(prices: [u32; N]) -> u32 {
    prices.iter().sum()
}

fn main() {
    println!("{}円", total([120, 350])); // N = 2
    println!("{}円", total([100, 200, 300])); // N = 3
}
```
:::

:::details[ジェネリクスでできないこと]
`Vec<T>`の`T`は1つの型に決まるため、「1つのコレクションに異なる型を混在させる」ことはジェネリクスではできません。そうした用途にはトレイトオブジェクトを使います[^6]。
:::

[^1]: [The Rust Reference - Generic parameters](https://doc.rust-lang.org/reference/items/generics.html) "Functions, type aliases, structs, enumerations, unions, traits, and implementations may be parameterized by types, constants, and lifetimes." / "The order of generic parameters is restricted to lifetime parameters and then type and const parameters intermixed."
[^2]: [The Rust Programming Language - Generic Data Types](https://doc.rust-lang.org/book/ch10-01-syntax.html) "By declaring T as a generic type after impl, Rust can identify that the type in the angle brackets in Point is a generic type rather than a concrete type."
[^3]: [The Rust Reference - Generic implementations](https://doc.rust-lang.org/reference/items/implementations.html#generic-implementations) "Type and const parameters must always constrain the implementation." / [Error code E0207](https://doc.rust-lang.org/error_codes/E0207.html)
[^4]: [The Rust Reference - Glossary: Turbofish](https://doc.rust-lang.org/reference/glossary.html#turbofish) "Paths with generic parameters in expressions must prefix the opening brackets with a ::. Combined with the angular brackets for generics, this looks like a fish ::<>."
[^5]: [The Rust Programming Language - Performance of Code Using Generics](https://doc.rust-lang.org/book/ch10-01-syntax.html#performance-of-code-using-generics) "Monomorphization is the process of turning generic code into specific code by filling in the concrete types that are used when compiled." / "When the code runs, it performs just as it would if we had duplicated each definition by hand."
[^6]: [The Rust Programming Language - Trait Objects Perform Dynamic Dispatch](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) "The code that results from monomorphization is doing static dispatch, which is when the compiler knows what method you're calling at compile time." / "If you'll only ever have homogeneous collections, using generics and trait bounds is preferable because the definitions will be monomorphized at compile time to use the concrete types."
