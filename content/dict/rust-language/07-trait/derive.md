---
title: derive属性
description: 型定義に書き添えるだけで標準トレイトの実装をコンパイラに自動生成させる属性。導出できるのは組み込みの9種。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "型システム", "基本文法"]
public: true
---

`derive`属性は、[[struct]]や[[enum]]の定義に`#[derive(Clone, Debug)]`と書き添えるだけで、指定した[[trait]]の実装をコンパイラに自動生成させる仕組みです。フィールドを1つずつ辿るだけの定型的な[[impl-block]]を、手で書かずに済ませられます。[[standard-library]]とコンパイラが提供する組み込みの導出は9種類で、実体は[[macro]]の一種であるderiveマクロです[^1]。書けるのは構造体・列挙型・共用体（union）の定義に対してだけで、[[function]]や型エイリアスに付けるとエラー: E0774になります[^2]。
<!-- TODO: [[attribute]] 作成後にリンク -->

```rust playground
#[derive(Debug, Clone, PartialEq)]
struct Book {
    title: String,
    price: u32,
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    let spare = book.clone(); // Clone: .clone()で複製できる
    println!("{:?}", spare); // Debug: {:?}で中身を表示できる
    println!("同じ本か: {}", book == spare); // PartialEq: ==で比較できる
}
```

## 導出できるトレイト一覧

組み込みのderiveは次の9種類です[^1]。

| トレイト | 自動生成される実装 |
| --- | --- |
| `Clone` | 全フィールドを`.clone()`した複製を返す |
| `Copy` | ビット単位の複製でよいと宣言する（メソッドなし） |
| `Debug` | `{:?}`で型名・フィールド名・値を並べて表示する |
| `Default` | 全フィールドをその型の既定値で埋めた値を作る |
| `PartialEq` | 全フィールドの比較で`==`・`!=`を定義する |
| `Eq` | `PartialEq`に加えて同値関係が成り立つと宣言する（メソッドなし）[^3] |
| `PartialOrd` | 辞書式比較で`<`などを定義する。優先度は構造体ならフィールドの宣言順、列挙型ならバリアントの判別子（既定では宣言順）[^4] |
| `Ord` | 同じ順序づけを全順序として定義する |
| `Hash` | 全フィールドをハッシュ値の計算に混ぜ込む |

各トレイトの詳細は[[clone]]・[[copy]]・[[debug-trait]]・[[comparison-traits]]・[[console-output]]の各項目で扱っています。
<!-- TODO: [[default-trait]] 作成後にリンク -->

:::message{warning}
標準ライブラリが提供する導出はこの9種だけです。利用者向けの表示を担う[[display-trait]]は「何をどう見せるか」を機械的に決められないため導出できず、`impl std::fmt::Display for 型名`を手で書く必要があります[^5]。
:::

## 導出の条件（全フィールドの実装）

deriveが作るのは「各フィールドに同じ処理を委譲する」実装です。そのため対象の型の**全フィールド**（列挙型なら全バリアントの全フィールド）が、そのトレイトを実装している必要があります。1つでも欠けると自動生成に失敗し、コンパイルエラーになります。

<!-- rustc: expect E0277 -->
```rust playground
struct Isbn(String); // Clone を実装していない

#[derive(Clone)] // エラー: E0277（Isbn が Clone を実装していない）
struct Book {
    isbn: Isbn,
    price: u32,
}

fn main() {
    let book = Book {
        isbn: Isbn(String::from("978-4-00-000000-0")),
        price: 3200,
    };
    println!("{}円", book.price);
}
```

## 補足

:::details[Copyを導出するときの追加条件]
トレイト側の要求も同時に満たす必要があります。`Copy`は`Clone`を継承しているため`#[derive(Copy)]`だけでは足りず（エラー: E0277）、`#[derive(Copy, Clone)]`とセットで書きます。加えて`Copy`には「`Drop`を実装していないこと」という条件もあります（エラー: E0184）。
<!-- TODO: [[drop]] 作成後にリンク -->
:::

:::details[ジェネリックな型に付けたとき]
[[generics]]を使った型にderiveを付けると、生成される実装には、**すべての型引数に対して**同じトレイトの[[trait-bound]]が付きます。例えば`#[derive(Clone)] struct Foo<T> { .. }`からは`impl<T: Clone> Clone for Foo<T>`が生成されます[^1]。

この境界は、フィールドの型を見て必要最小限に絞り込まれるわけではありません。次の`Shared<T>`は`Rc<T>`しか持たず、`Rc<T>`は`T`が何であってもクローンできますが、生成された実装が`T: Clone`を要求するため`.clone()`が呼べません。

<!-- rustc: expect E0599 -->
```rust playground
use std::rc::Rc;

// impl<T: Clone> Clone for Shared<T> が生成される
#[derive(Clone)]
struct Shared<T> {
    inner: Rc<T>,
}

struct Config; // Clone を実装していない

fn main() {
    let shared = Shared { inner: Rc::new(Config) };
    let _spare = shared.clone(); // エラー: E0599（T: Clone を満たさない）
}
```

このような型では、deriveをやめて`impl<T> Clone for Shared<T>`を手で書きます。
:::

:::details[列挙型にDefaultを導出するには]
列挙型はどのバリアントを既定とすべきかをコンパイラが決められないため、`#[derive(Default)]`だけではエラー: E0665になります。フィールドを持たないバリアントに`#[default]`属性を付けて明示します（Rust 1.62以降）[^6]。

```rust playground
#[derive(Debug, Default)]
enum Payment {
    #[default]
    Cash,
    Credit,
    QrCode,
}

fn main() {
    println!("{:?}", Payment::default()); // Cash
}
```
:::

:::details[外部クレートが提供するderive]
組み込みの9種以外にも、[[external-package]]が独自のderiveマクロを提供していることがあります（`#[derive(Serialize)]`など）。これらは手続き的マクロとして定義され、`#[serde(rename = "...")]`のような**ヘルパー属性**をフィールドやバリアントに付けて挙動を細かく指定できます[^7]。ヘルパー属性はそれ自体では何もせず、宣言元のderiveマクロが読み取るための目印です。
:::

[^1]: [The Rust Reference — Derive](https://doc.rust-lang.org/reference/attributes/derive.html) "The `derive` attribute invokes one or more derive macros, allowing new items to be automatically generated for data structures." / "The PartialEq derive macro emits an implementation of PartialEq for `Foo<T> where T: PartialEq`." 組み込みderiveとして`Clone`・`Copy`・`Debug`・`Default`・`Eq`・`Hash`・`Ord`・`PartialEq`・`PartialOrd`の9つが列挙されている。

[^2]: [The Rust Reference — Derive](https://doc.rust-lang.org/reference/attributes/derive.html) "The `derive` attribute may only be applied to structs, enums, and unions."（エラーコードはRust 1.93で確認）

[^3]: [std公式ドキュメント — Trait Eq](https://doc.rust-lang.org/std/cmp/trait.Eq.html) "When derived, because Eq has no extra methods, it is only informing the compiler that this is an equivalence relation rather than a partial equivalence relation."

[^4]: [std公式ドキュメント — Trait PartialOrd](https://doc.rust-lang.org/std/cmp/trait.PartialOrd.html) "When derived on structs, it will produce a lexicographic ordering based on the top-to-bottom declaration order of the struct's members. When derived on enums, variants are primarily ordered by their discriminants."

[^5]: [std公式ドキュメント — Trait Display](https://doc.rust-lang.org/std/fmt/trait.Display.html) "Display is similar to Debug, but Display is for user-facing output, and so cannot be derived."

[^6]: [std公式ドキュメント — Trait Default](https://doc.rust-lang.org/std/default/trait.Default.html) "When using `#[derive(Default)]` on an enum, you need to choose which unit variant will be default. You do this by placing the `#[default]` attribute on the variant."

[^7]: [The Rust Reference — Derive macro helper attributes](https://doc.rust-lang.org/reference/procedural-macros.html#derive-macro-helper-attributes) "Derive macros can declare derive macro helper attributes to be used within the scope of the item to which the derive macro is applied. These attributes are inert."
