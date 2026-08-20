---
title: Debugトレイト
description: 値の中身を開発者向けに表示する標準トレイト。{:?}・{:#?}での出力を担い、実装の多くはderiveによる自動生成。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "標準ライブラリ"]
public: true
---

`Debug`は、値の中身を**開発者向け**に表示するための[[standard-library]]の[[trait]]です（`std::fmt::Debug`）。[[console-output]]の`{:?}`はこのトレイトの実装を呼び出す指定で、`{:#?}`と書くと整形された複数行で表示されます[^2]。

要求される[[method]]は`fmt`の1つだけですが、実装は[[derive]]（`#[derive(Debug)]`）に任せるのが基本です[^1]。デバッグを助けることが目的のトレイトのため、std公式ドキュメントは**すべての公開型に実装すること**を推奨しています[^2]。

```rust playground
#[derive(Debug)]
struct Book {
    title: String,
    price: u32,
}

#[derive(Debug)]
enum Payment {
    Cash,
    Credit(String),
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    println!("{:?}", book);  // Book { title: "Rust入門", price: 3200 }
    println!("{:#?}", book); // 1フィールド1行に整形して表示される
    println!("{:?}", Payment::Cash);                          // Cash
    println!("{:?}", Payment::Credit(String::from("JCB")));   // Credit("JCB")
}
```

## 導出される出力の形式

`#[derive(Debug)]`が生成する表示は、型の名前とフィールドの値を機械的に並べたものです[^3]。

| 対象 | 出力の形 | 例 |
| --- | --- | --- |
| [[struct]] | 型名 + `{ フィールド名: 値, ... }` | `Book { title: "Rust入門", price: 3200 }` |
| データを持たない[[enum]]のバリアント | バリアント名だけ | `Cash` |
| 名前付きフィールドを持たないバリアント・[[tuple-struct]] | 名前 + `(値, ...)` | `Credit("JCB")` |
| 名前付きフィールドを持つバリアント | 名前 + `{ フィールド名: 値, ... }` | `Credit { brand: "JCB" }` |

各フィールドの値もそれぞれの`Debug`実装で表示されます。[[string]]や[[string-slice]]の値はクオートで囲まれ、改行や`"`は`\n`・`\"`とエスケープされた形で出ます[^2]。

:::message{tip}
`Debug`が開発者向けの表示を担うのに対し、`{}`で使われる`Display`は利用者向けの表示を担うトレイトです。`Display`は「何をどう見せるか」を機械的に決められないため導出できず、手で実装します[^4]。
<!-- TODO: [[display-trait]] 作成後にリンク -->
:::

## 補足

:::details[Debugが要求される場面]
`Debug`は表示のためだけでなく、標準ライブラリの各所で[[trait-bound]]として要求されます。

| 場面 | 要求される理由 |
| --- | --- |
| [[result]]の[[unwrap]]・`expect` | 失敗時に`Err`の中身を[[panic]]のメッセージに出すため（`E: Debug`）[^5] |
| `assert_eq!`などのテスト用[[macro]] | 値が一致しなかったときに両辺を表示するため[^6] |
| `dbg!` | 式の値を、ソース位置とともに標準エラー出力へ表示するため[^7] |

「`{:?}`を書いていないのに`Debug`を実装しろと言われる」ときは、たいていこれらが原因です。なお`dbg!`は渡した式の[[ownership]]を奪うため、値を使い続けたい場合は`dbg!(&value)`と[[borrow]]を渡します[^7]。
:::

:::details[表示内容を自分で決める（debug_struct）]
形式を制御したい場合は`fmt`を手で実装します。`Formatter`の`debug_struct`ビルダーを使うと、フィールドを並べるだけでderiveと同じ体裁になります[^8]。`{:#?}`を指定したときの整形にもそのまま対応します（Rust 1.93で確認）。

```rust playground
use std::fmt;

struct Book {
    title: String,
    price: u32,
}

impl fmt::Debug for Book {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Book")
            .field("title", &self.title)
            .field("price", &format_args!("{}円", self.price))
            .finish()
    }
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    println!("{:?}", book); // Book { title: "Rust入門", price: 3200円 }
}
```

`format_args!`で包んだ値はクオートなしでそのまま埋め込まれます。
:::

:::details[出力の形式に依存してはいけない]
deriveが生成する`Debug`の出力も、標準ライブラリが提供する型の`Debug`実装も安定した仕様ではなく、**将来のRustで変わる可能性があります**[^9]。出力を文字列として解析したり、テストで完全一致を期待したりするコードは避け、あくまで人が読むためのものとして扱います。
:::

:::details[16進数で表示する]
`{:x?}`・`{:X?}`と書くと、`Debug`表示に含まれる[[integer-type]]の値を小文字・大文字の16進数で出力できます[^10]。バイト列を確認するときに便利です。

```rust playground
fn main() {
    let bytes = [255u8, 16, 1];
    println!("{:?}", bytes);  // [255, 16, 1]
    println!("{:x?}", bytes); // [ff, 10, 1]
    println!("{:X?}", bytes); // [FF, 10, 1]
}
```
:::

[^1]: [std公式ドキュメント — Trait Debug](https://doc.rust-lang.org/std/fmt/trait.Debug.html) トレイト定義は`fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), Error>`の1メソッドのみ。"Generally speaking, you should just `derive` a `Debug` implementation."

[^2]: [std公式ドキュメント — Module std::fmt](https://doc.rust-lang.org/std/fmt/index.html) "`fmt::Debug` implementations should be implemented for all public types. ... The purpose of the `Debug` trait is to facilitate debugging Rust code. In most cases, using `#[derive(Debug)]` is sufficient and recommended." / alternate flag: "`#?` - pretty-print the `Debug` formatting (adds linebreaks and indentation)" / エスケープの例: "assert_eq!(format!(\"{} {:?}\", \"foo\\n\", \"bar\\n\"), \"foo\\n \\\"bar\\\\n\\\"\");"

[^3]: [std公式ドキュメント — Trait Debug](https://doc.rust-lang.org/std/fmt/trait.Debug.html) "This trait can be used with `#[derive]` if all fields implement `Debug`. When derived for structs, it will use the name of the struct, then `{`, then a comma-separated list of each field's name and `Debug` value, then `}`. For enums, it will use the name of the variant and, if applicable, `(`, then the `Debug` values of the fields, then `)`." なお、タプル構造体と、名前付きフィールドを持つバリアントの形式は同ドキュメントに明記がなく、実際の出力（Rust 1.93で確認）に基づく。

[^4]: [std公式ドキュメント — Trait Display](https://doc.rust-lang.org/std/fmt/trait.Display.html) "`Display` is similar to `Debug`, but `Display` is for user-facing output, and so cannot be derived."

[^5]: [std公式ドキュメント — Result::unwrap](https://doc.rust-lang.org/std/result/enum.Result.html#method.unwrap) `unwrap`・`expect`は`impl<T, E: Debug> Result<T, E>`に定義されている。"Panics if the value is an `Err`, with a panic message provided by the `Err`'s value."

[^6]: [std公式ドキュメント — Macro assert_eq!](https://doc.rust-lang.org/std/macro.assert_eq.html) "On panic, this macro will print the values of the expressions with their debug representations."

[^7]: [std公式ドキュメント — Macro dbg!](https://doc.rust-lang.org/std/macro.dbg.html) "Prints and returns the value of a given expression for quick and dirty debugging." "The macro works by using the `Debug` implementation of the type of the given expression to print the value to stderr along with the source location of the macro invocation as well as the source code of the expression." "Invoking the macro on an expression moves and takes ownership of it before returning the evaluated expression unchanged. If the type of the expression does not implement `Copy` and you don't want to give up ownership, you can instead borrow with `dbg!(&expr)` for some expression `expr`."

[^8]: [std公式ドキュメント — Formatter::debug_struct](https://doc.rust-lang.org/std/fmt/struct.Formatter.html#method.debug_struct) "Creates a `DebugStruct` builder designed to assist with creation of `fmt::Debug` implementations for structs."

[^9]: [std公式ドキュメント — Trait Debug](https://doc.rust-lang.org/std/fmt/trait.Debug.html) "Derived `Debug` formats are not stable, and so may change with future Rust versions. Additionally, `Debug` implementations of types provided by the standard library (`std`, `core`, `alloc`, etc.) are not stable, and may also change with future Rust versions."

[^10]: [std公式ドキュメント — Module std::fmt](https://doc.rust-lang.org/std/fmt/index.html) "`x?` ⇒ `Debug` with lower-case hexadecimal integers" / "`X?` ⇒ `Debug` with upper-case hexadecimal integers"
