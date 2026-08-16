---
title: 可変性
description: 値を書き換えてよいかどうかを表す性質。Rustの既定は不変で、データ自体ではなく変数の束縛や参照といったアクセス経路に付くのが特徴。
created_at: 2026-08-16
updated_at: 2026-08-16
tags: ["基本文法", "所有権"]
public: true
---

値を書き換えてよいかどうかを表す性質を**可変性**（mutability）と呼びます。Rustでは[[variable]]も[[reference]]の指し先も**既定では不変**（immutable）で、書き換えを許したいときだけ`mut`キーワードを明示的に付けます。

可変性は原則としてデータそのものに備わる性質ではなく、**そのデータへアクセスする経路**（名前と値を結び付ける変数の束縛や、参照）に付きます。そのため同じ値でも、どの経路から触るかで書き換えの可否が変わります。

```rust playground
fn main() {
    let balance = 1000; // 既定は不変
    // balance += 500; // エラー: E0384（不変の変数への再代入）

    let mut total = balance; // mut を付けたときだけ書き換えられる
    total += 500;
    println!("元の残高: {balance}円 / 加算後: {total}円");
}
```

## 変数の可変性と参照の可変性

`mut`は書く位置によって対象が変わります。`let mut`の`mut`は**束縛**に付き「その変数を書き換えてよい」ことを表します（再代入だけでなく、`&mut`を作っての書き換えも含みます）。`&mut`の`mut`は**参照**に付き「その参照を通して指し先を書き換えてよい」ことを表します。2つは独立しているため、組み合わせは4通りあります。

| 書き方 | `r`の差し替え | `*r`での書き換え |
| --- | --- | --- |
| `let r = &x;` | ✗ | ✗ |
| `let mut r = &x;` | ✓ | ✗ |
| `let r = &mut x;` | ✗ | ✓ |
| `let mut r = &mut x;` | ✓ | ✓ |

参照先を書き換えるには`*`による[[dereference]]を通します。

:::message{warning}
`&mut x`という[[borrow]]は「書き換えてよい」という許可を借りる操作なので、変数を直接借りる場合は借用元の`x`自身も`mut`で宣言されている必要があります。
:::

## ムーブで可変性は付け替えられる

可変性が束縛の側に付くことは、値を別の変数へ[[move]]すると分かります。不変な変数が持っていた値でも、`mut`付きの変数へ移してしまえば書き換えられます。

```rust playground
fn main() {
    let greeting = String::from("こんにちは"); // 不変の束縛
    // greeting.push_str("、世界"); // エラー: E0596（不変の変数は排他借用できない）

    let mut message = greeting; // ムーブ先を mut にすれば書き換えられる
    message.push_str("、世界");
    println!("{message}");
}
```

逆に`mut`なしの変数へムーブすれば、そこから先は書き換えられなくなります。

## 補足

:::details[束縛も参照先も可変な場合の動き]
`let mut r = &mut x;`は束縛と参照先の両方が可変なので、指し先の書き換えと参照そのものの差し替えを両方できます。

```rust playground
fn main() {
    let mut price = 300;
    let mut tax = 30;

    let mut r = &mut price; // 束縛も参照先も可変
    *r += 100; // 参照先の値を書き換える
    r = &mut tax; // 参照そのものを別の値へ差し替える
    *r += 10;

    println!("本体: {price}円 / 税: {tax}円");
}
```
:::

:::details[変数以外を借りるときの例外]
「借用元も`mut`で宣言されている必要がある」のは、名前の付いた変数を直接借りる場合の話です。一時値や`&mut`参照越しの借り直しなど、変数以外の場所を借りるときはこの限りではありません。

```rust playground
fn deposit(balance: &mut i32) {
    let r = &mut *balance; // rはmutでないが、参照越しに借り直せる
    *r += 500;
}

fn main() {
    let mut balance = 1000;
    deposit(&mut balance);
    println!("残高: {balance}円");
}
```
:::

:::details[可変性の検査はコンパイル時だけ]
可変性はコンパイラが静的に検査するだけの情報で、値のメモリ表現には現れません。そのためムーブによる可変性の付け替えに実行時のコストはかかりません。
:::

:::details[mutはletキーワード専用ではない]
`mut`は`let`の一部ではなく、値を受け取る側の識別子パターンに付く要素です。そのためパターンを書ける場所であれば、[[function]]の引数・[[for-expression]]のループ変数・[[match-expression]]のアームなどにも同じように付けられます。

```rust playground
fn add_tax(mut price: u32) -> u32 {
    price += price / 10; // 引数を可変な束縛として受け取る
    price
}

fn main() {
    println!("税込: {}円", add_tax(300));
}
```

引数に付けた`mut`は関数の内部だけの都合であり、呼び出し側の書き方には影響しません。
:::

:::details[constとstaticの可変性]
[[constant]]（`const`）は常に不変で、`mut`を付けることはできません。一方、プログラム全体で1つの実体を持つ[[static]]だけは`static mut`と書けますが、データ競合を防げないため読み書きには`unsafe`が必要です。さらにRust 2024エディションでは`static mut`への参照を作ること自体がエラー（`static_mut_refs`）になるため、実質的に使うべきではありません。
:::

:::details[共有参照越しに書き換えられる例外]
「共有参照`&T`の指し先は書き換えられない」というのが原則ですが、[[standard-library]]の`UnsafeCell<T>`を土台とする**内部可変性**パターンのデータ型はこの制約から外れます<!-- TODO: [[interior-mutability]] 作成後にリンク -->。`Cell`・`RefCell`・`Mutex`などが該当し、`&T`しか持っていない状態でも中身を変更できます。
:::
