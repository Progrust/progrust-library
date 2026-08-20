---
title: Defaultトレイト
description: 型ごとの既定値を返す標準トレイト。default()で既定のインスタンスを作り、構造体更新記法やderiveと組み合わせて一部だけ指定した初期化を書ける仕組み。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "標準ライブラリ"]
public: true
---

`Default`は、その型の**既定値**（デフォルト値）を返す[[standard-library]]の[[trait]]です（`std::default::Default`）。要求されるのは`fn default() -> Self`という[[associated-function]]1つだけで[^1]、`u32`なら`0`、`bool`なら`false`、[[string]]なら空文字列というように、標準ライブラリの多くの型があらかじめ実装しています。

自作の[[struct]]では[[derive]]（`#[derive(Default)]`）で導出でき、`..Default::default()`と[[struct-update-syntax]]を組み合わせると、「一部のフィールドだけ指定し、残りは既定値で埋める」初期化が書けます。設定項目の多い型を毎回すべて書き並べずに作れるのが主な用途です。

```rust playground
#[derive(Debug, Default)]
struct OrderOptions {
    gift_wrap: bool,     // 贈答用ラッピング → false
    message: String,     // メッセージカード → 空文字列
    coupon: Option<u32>, // クーポン割引額   → None
}

fn main() {
    // すべて既定値のインスタンス
    let plain = OrderOptions::default();
    println!("{:?}", plain); // OrderOptions { gift_wrap: false, message: "", coupon: None }

    // ラッピングだけ指定し、残りは既定値で埋める
    let gift = OrderOptions {
        gift_wrap: true,
        ..Default::default()
    };
    println!("{:?}", gift); // OrderOptions { gift_wrap: true, message: "", coupon: None }
}
```

## `Type::default()`と`Default::default()`

呼び出す関数は同じで、`Self`がどう決まるかだけが違います。`Default`は標準ライブラリのpreludeに含まれるため、どちらの書き方でも[[use-declaration]]は要りません[^4]。

| 書き方 | `Self`の決まり方 |
| --- | --- |
| `OrderOptions::default()` | 型名で明示する。読んだだけでどの型の既定値か分かる |
| `Default::default()` | 周囲の文脈から[[type-inference]]で決まる。`let opts: OrderOptions = Default::default();`や`..Default::default()`のように型が判明する位置で使う |

型名を書ける場面では`Type::default()`のほうが読みやすく、`..Default::default()`のように型が自明な位置では`Default::default()`で型名の繰り返しを省けます。型を決められない位置で書くとエラー: E0790になります。

:::message{warning}
`Default`トレイトと[[default-implementation]]は名前が似ていますが別物です。前者が返すのは**型の既定値**であり、後者が指すのは**トレイトのメソッドの既定の中身**です。`Default`トレイト自身は`default`にデフォルト実装を持たず、実装側で必ず定義します[^1]。
:::

## 構造体更新記法との組み合わせ

[[struct-update-syntax]]の`..base`には同じ型の値を返す式を書けます。そこに`Default::default()`を置いたのが`..Default::default()`で、既定値のインスタンスを基準に差分だけを指定する形になります。

このとき`Default`を実装している必要があるのは**構造体そのもの**であって、埋めたいフィールドの型ではありません。実装していない型に対して書くとエラー: E0277になります。

<!-- rustc: expect E0277 -->
```rust playground
struct OrderOptions { // Default を実装していない
    gift_wrap: bool,
    message: String,
}

fn main() {
    // エラー: E0277（OrderOptions が Default を実装していない）
    let gift = OrderOptions { gift_wrap: true, ..Default::default() };
    println!("{}", gift.gift_wrap);
}
```

## deriveでの導出

`#[derive(Default)]`が生成するのは、**全フィールドをそれぞれの型の既定値で埋めた値**を返す実装です[^1]。そのため導出には次の条件が付きます。

| 対象 | 条件 |
| --- | --- |
| 構造体 | 全フィールドの型が`Default`を実装していること（1つでも欠けるとエラー: E0277） |
| [[enum]] | 既定にするバリアントを`#[default]`属性で指定すること（Rust 1.62以降）[^1]。指定がないとエラー: E0665。指定できるのは値を持たないユニットバリアントだけで、値を持つバリアントを既定にしたい場合は手で実装する[^1] |
| [[generics]]を使った型 | すべての型引数に`Default`の[[trait-bound]]が付いた実装が生成される[^2] |

<!-- TODO: [[attribute]] 作成後にリンク -->

既定値が「ゼロ値・空」でよいならderiveで足り、`0`や空文字列以外を既定にしたい場合は`impl Default for 型名`を手で書きます。導出の一般的な規則は[[derive]]の項目で扱っています。

## 補足

:::details[主な型の既定値]
標準ライブラリの実装は、おおむね「ゼロ・空・なし」に揃えられています[^1]（値はRust 1.93で確認）。

| 型 | 既定値 |
| --- | --- |
| [[integer-type]]・[[floating-point-type]] | `0` / `0.0` |
| [[boolean-type]] | `false` |
| [[char-type]] | `'\0'`（ヌル文字） |
| [[string]]・[[vec]]・`HashMap`などのコレクション | 空 |
| [[option]] | `None` |
| [[unit-type]] | `()` |

<!-- TODO: [[hashmap]] 作成後にリンク -->

一方[[result]]は`Default`を実装していません（Rust 1.93で確認）。`Ok`と`Err`のどちらを既定とすべきかが型からは決まらないためです。`Result`から既定値を得たいときは、後述の`unwrap_or_default`のように`Ok`側の型に対して使います。
:::

:::details[既定値を自分で決める]
`0`や空以外を既定にしたい場合は、`impl Default for 型名`で`default`を実装します。この`default`は[[method]]ではなく`self`を取らない関連関数なので、`Type::default()`の形で呼ばれます。

```rust playground
#[derive(Debug)]
struct Shipping {
    fee: u32,
    express: bool,
}

// 通常配送・送料500円を既定とする
impl Default for Shipping {
    fn default() -> Self {
        Shipping {
            fee: 500,
            express: false,
        }
    }
}

fn main() {
    println!("{:?}", Shipping::default()); // Shipping { fee: 500, express: false }

    // 手で書いた実装でも ..Default::default() はそのまま使える
    let rush = Shipping {
        express: true,
        ..Default::default()
    };
    println!("{:?}", rush); // Shipping { fee: 500, express: true }
}
```
:::

:::details[Defaultが要求される場面]
`Default`は、値を作る側だけでなく標準ライブラリの各所で[[trait-bound]]として要求されます。

| 場面 | 挙動 |
| --- | --- |
| [[unwrap]]系の`unwrap_or_default` | `None`・`Err`のときに`T`の既定値を返す（`T: Default`） |
| `std::mem::take(&mut 値)` | 値を既定値に置き換え、元の値を返す（`T: Default`）[^3] |

`mem::take`は、[[borrow]]しかできない状況でフィールドの中身だけを持ち出したいときに使われます。

```rust playground
struct Cart {
    memo: String,
}

fn main() {
    let mut cart = Cart {
        memo: String::from("プレゼント用"),
    };
    // cart は借用したまま、memo の中身だけを取り出す
    let memo = std::mem::take(&mut cart.memo);
    println!("取り出した: {memo:?}"); // "プレゼント用"
    println!("残り: {:?}", cart.memo); // ""（既定値に置き換わっている）
}
```
:::

:::details[..Default::default()は既定値を丸ごと1つ作る]
`..Default::default()`は「指定しなかったフィールドだけを個別に作る」記法ではありません。既定値のインスタンスを**丸ごと1つ構築**し、そこから必要なフィールドだけを取り出す動きになります。取り出されなかったフィールドはその場で破棄されます（リリースビルドで最適化されるかどうかは別の話です）。

既定値の生成が重い型では、この点が問題になることがあります。
<!-- TODO: [[drop]] 作成後にリンク -->
:::

:::details[dyn Defaultは作れない]
`Default`は[[trait-object]]（`dyn Default`）には使えません[^1]（エラー: E0038）。`Sized`を継承している時点で不適合が確定し、加えて「`self`を取らず`Self`を返す関連関数」という形も単独で不適合の条件を満たします。「型が決まってはじめて既定値が決まる」トレイトなので、実行時に型を伏せる用途とは相容れません。
<!-- TODO: [[sized]] 作成後にリンク -->
:::

[^1]: [std公式ドキュメント — Trait Default](https://doc.rust-lang.org/std/default/trait.Default.html) トレイト定義は`pub trait Default: Sized { fn default() -> Self; }`で、`default`は Required Methods に置かれている。"This trait can be used with `#[derive]` if all of the type's fields implement `Default`. When `derive`d, it will use the default value for each field's type." / "When using `#[derive(Default)]` on an `enum`, you need to choose which unit variant will be default. You do this by placing the `#[default]` attribute on the variant. ... The `#[default]` attribute was stabilized in Rust 1.62.0." / 各型の既定値は同ページの Implementors 一覧で確認できる。

[^2]: [The Rust Reference — Derive](https://doc.rust-lang.org/reference/attributes/derive.html) "The PartialEq derive macro emits an implementation of PartialEq for `Foo<T> where T: PartialEq`."（組み込みderiveに共通する境界の付き方。`Default`でも同じ形の境界が付くことをRust 1.93で確認）

[^3]: [std公式ドキュメント — Function std::mem::take](https://doc.rust-lang.org/std/mem/fn.take.html) "Replaces `dest` with the default value of `T`, returning the previous `dest` value."

[^4]: [std公式ドキュメント — Module std::prelude](https://doc.rust-lang.org/std/prelude/index.html) `std::prelude::v1`の一覧に`std::default::Default`が含まれる。
