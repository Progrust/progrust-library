---
title: Displayトレイト
description: 値を利用者向けに表示する標準トレイト。{}での出力を担い、deriveできず手動実装が必要な代わりにto_stringが自動で付いてくる仕組み。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "標準ライブラリ"]
public: true
---

`Display`は、値を**利用者向けに表示する**ための[[standard-library]]の[[trait]]です（`std::fmt::Display`）。[[console-output]]の`{}`のうち、`?`や`x`のような**型の指定子を付けないもの**（`{:>10}`のように幅や寄せだけを指定したものを含む）は、このトレイトの実装を呼び出します[^1]。

要求される[[method]]は`fmt`の1つだけで、シグネチャは[[debug-trait]]と同じです。ただし`Debug`と違って、標準ライブラリは`Display`の[[derive]]を用意していません。**導出できないため、手で実装します**[^2]。そのかわり、実装すると[[string]]を返す`to_string`が自動で使えるようになります[^3]。

```rust playground
use std::fmt;

struct Book {
    title: String,
    price: u32,
}

impl fmt::Display for Book {
    // 表示したい形を自分で決めて、フォーマッタに書き込む
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "『{}』{}円", self.title, self.price)
    }
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    println!("{}", book); // 『Rust入門』3200円

    // Displayを実装すると to_string も使えるようになる
    let label: String = book.to_string();
    println!("ラベル: {}", label); // ラベル: 『Rust入門』3200円
}
```

## Debugとの違いとderiveできない理由

`Debug`は「型名・フィールド名・値を機械的に並べる」という決まった形があるため導出できますが、`Display`が担うのは利用者に見せる表示であり、何をどう見せるかは型ごとの意味に依存します。そのため標準ライブラリは導出を用意しておらず、std公式ドキュメントも「`Display`は利用者向けの出力のためのものなので導出できない」と明記しています[^2]。素の状態で`#[derive(Display)]`と書いても、そのようなderiveマクロは存在しないというエラーになります（Rust 1.93で確認。外部クレートが同名のderiveマクロを提供している場合は、それを取り込めば書けます）。

| 観点 | `Debug` | `Display` |
| --- | --- | --- |
| 書式指定 | `{:?}`・`{:#?}` | `{}`（型の指定子なし） |
| 想定する読み手 | 開発者 | 利用者 |
| deriveでの導出 | できる（`#[derive(Debug)]`） | 標準ライブラリには無い（手で実装） |
| 実装の方針 | すべての公開型に実装することが推奨[^4] | すべての型が実装することは想定されていない[^4] |
| 出力の性質 | 内部状態をできるだけ忠実に表す[^4] | 情報を省いてよく、解析できるとは限らない[^2] |

:::message{tip}
1つの型が持てる`Display`実装は1つだけです。そのためstd公式ドキュメントは、テキストとして表す最も自明な方法が1つに定まる場合にのみ実装することを勧めています[^5]。複数の見せ方が必要な場合は、後述の表示アダプタを使います。
:::

## ToStringが自動で付いてくる

`Display`を実装した型には、`to_string`メソッドが自動的に備わります。標準ライブラリに`impl<T: Display + ?Sized> ToString for T`というブランケット実装（[[generics]]の型引数に[[trait-bound]]を付けて、条件を満たす全型へまとめて実装するもの）があるためです[^3]。

そのため`ToString`を自分で実装する必要はなく、公式ドキュメントは「`ToString`を直接実装すべきではない。かわりに`Display`を実装すれば、`ToString`の実装は無償で手に入る」と明記しています[^3]。`format!("{}", book)`と`book.to_string()`は、どちらも同じ文字列を返します。

## 補足

:::details[Displayを実装していない型を表示しようとすると]
`Display`を実装していない型を`{}`で表示しようとすると、コンパイルエラー（E0277）になります。`Debug`さえ実装していれば`{:?}`では表示できるため、開発中の確認が目的なら`{:?}`に変え、利用者に見せる表示が必要なら`Display`を実装します。

<!-- rustc: expect E0277 -->
```rust
struct Book {
    title: String,
    price: u32,
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    println!("{}", book); // エラー: E0277（BookはDisplayを実装していない）
}
```
:::

:::details[幅や寄せの指定が効かないとき]
`{:>10}`のように**呼び出し側**が付けた幅・寄せ・精度の指定は、`Display`実装の中で`write!`をそのまま使うと**無視されます**。`write!`は組み立てた文字列を`Formatter::write_str`で書き込むだけの[[macro]]で、フォーマッタが保持している呼び出し側の設定を参照しないためです[^6]（`write!`自身の書式文字列に書いた`{:>8}`などの指定は、これとは別に解釈されます）。

呼び出し側の指定を反映させたい場合は、組み立てた文字列を`Formatter::pad`に渡します。`pad`は幅（最小の文字数）・寄せ・精度（最大の文字数。超えた分は切り詰め）を解釈します[^6]。

```rust playground
use std::fmt;

struct Yen(u32);
struct PaddedYen(u32);

impl fmt::Display for Yen {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}円", self.0) // 呼び出し側の幅指定は無視される
    }
}

impl fmt::Display for PaddedYen {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.pad(&format!("{}円", self.0)) // 呼び出し側の幅・寄せ・精度が反映される
    }
}

fn main() {
    println!("[{:>10}]", Yen(1200));       // [1200円]（指定が無視される）
    println!("[{:>10}]", PaddedYen(1200)); // [     1200円]（幅と寄せが効く）
    println!("[{:.2}]", PaddedYen(1200));  // [12]（精度は最大文字数として効く）
}
```
:::

:::details[Displayの実装が要求される場面]
| 場面 | 要求される理由 |
| --- | --- |
| `{}`を含む`println!`・`format!`など | 型の指定子を付けない`{}`が`Display`の実装を呼ぶため[^1] |
| `to_string` | `ToString`のブランケット実装が`T: Display`を要求するため[^3] |
| `std::error::Error`の実装 | `Error`の定義自体が`Debug + Display`を要求するため[^7] |

自作のエラー型を`Error`として扱えるようにするには、`Debug`（[[derive]]でよい）と`Display`（手で実装）の両方が必要です[^7]。「エラー型を作ったのに`Error`が実装できない」ときは、`Display`の実装忘れがよくある原因です。
:::

:::details[表示の形を複数持ちたいとき]
1つの型に`Display`実装は1つしか持てないため、同じ型を別の形でも表示したい場合、std公式ドキュメントは**表示アダプタ**（display adapter）という方法を勧めています[^5]。`Display`を実装したラッパー型を返すメソッドを用意する形で、標準ライブラリの`str::escape_default`や`Path::display`が実際にこれにあたります[^5]。
:::

[^1]: [std公式ドキュメント — Module std::fmt](https://doc.rust-lang.org/std/fmt/index.html) 書式指定とトレイトの対応表に "nothing ⇒ `Display`" とある。"If no format is specified (as in `{}` or `{:6}`), then the format trait used is the `Display` trait."

[^2]: [std公式ドキュメント — Trait Display](https://doc.rust-lang.org/std/fmt/trait.Display.html) "Format trait for an empty format, `{}`." / "`Display` is similar to `Debug`, but `Display` is for user-facing output, and so cannot be derived." / "`Display` for a type might not necessarily be a lossless or complete representation of the type. It may omit internal state, precision, or other information the type does not consider important for user-facing output... As such, the output of `Display` might not be possible to parse."

[^3]: [std公式ドキュメント — Trait ToString](https://doc.rust-lang.org/std/string/trait.ToString.html) "This trait is automatically implemented for any type which implements the `Display` trait. As such, `ToString` shouldn't be implemented directly: `Display` should be implemented instead, and you get the `ToString` implementation for free." ブランケット実装は `impl<T> ToString for T where T: Display + ?Sized`。

[^4]: [std公式ドキュメント — Module std::fmt（fmt::Display vs fmt::Debug）](https://doc.rust-lang.org/std/fmt/index.html#fmtdisplay-vs-fmtdebug) "`fmt::Display` implementations assert that the type can be faithfully represented as a UTF-8 string at all times. It is not expected that all types implement the `Display` trait." / "`fmt::Debug` implementations should be implemented for all public types. Output will typically represent the internal state as faithfully as possible."

[^5]: [std公式ドキュメント — Trait Display（Internationalization）](https://doc.rust-lang.org/std/fmt/trait.Display.html) "Because a type can only have one `Display` implementation, it is often preferable to only implement `Display` when there is a single most 'obvious' way that values can be formatted as text." / "the most flexible approach is display adapters: methods like `str::escape_default` or `Path::display` which create a wrapper implementing `Display` to output the specific display format."

[^6]: [std公式ドキュメント — Formatter::pad](https://doc.rust-lang.org/std/fmt/struct.Formatter.html#method.pad) "Takes a string slice and emits it to the internal buffer after applying the relevant formatting flags specified." 認識されるフラグは "width - the minimum width of what to emit" / "fill/align" / "precision - the maximum length to emit, the string is truncated if it is longer than this length"。対する[`Formatter::write_str`](https://doc.rust-lang.org/std/fmt/struct.Formatter.html#method.write_str)（`write!`が経由するメソッド）の例では "assert_eq!(format!(\"{Foo:0>8}\"), \"Foo\");" と、呼び出し側の幅指定が反映されないことが示されている。

[^7]: [std公式ドキュメント — Trait Error](https://doc.rust-lang.org/std/error/trait.Error.html) 定義は `pub trait Error: Debug + Display`。"Errors must describe themselves through the `Display` and `Debug` traits." / "Implementing the `Error` trait only requires that `Debug` and `Display` are implemented too."
