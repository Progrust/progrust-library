---
title: use宣言
description: パスをその場のスコープに持ち込む宣言。効果は宣言したスコープの中だけで、`as`での改名・波括弧でのまとめ書き・`*`での一括取り込みも可能。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

use宣言は、[[module-path]]をその場のスコープに**持ち込む**宣言です。`use crate::shop::cart;`と一度書いておけば、以降は`shop::cart::total(..)`と書かずに`cart::total(..)`と短く書けます。厳密には、指定したパスと同じものを指すローカルな名前をそのスコープに作る項目（item）の一種です[^1]。

use宣言は[[module]]の中とブロックの中に書け、慣例としてその先頭に置きます[^1]。作られた名前が有効なのは、**宣言したスコープの中だけ**です[^2]。<!-- TODO: [[scope]] 作成後にリンク -->

```rust playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            prices.iter().sum()
        }
    }
}

use crate::shop::cart; // `cart`という名前をこのスコープに持ち込む

fn main() {
    // `shop::cart::total(..)`と書かずに済む
    println!("合計: {}円", cart::total(&[980, 1250]));
}
```

## 有効範囲はスコープ単位

同じファイルの中でも、子モジュールには親のuse宣言が届きません。上のコードに`mod checkout`を足して中から`cart::total(..)`と呼ぶと、`cart`という名前が見つからずコンパイルエラーになります。

```text
crate
├── use crate::shop::cart  // この名前が有効なのはクレートルートの中だけ
├── shop
└── checkout               // ここからは `cart` と書いても届かない
```

子モジュールの中でもう一度`use crate::shop::cart;`と書くか、[[super]]を使って`super::cart::total(prices)`と相対パスで呼ぶか、`crate::shop::cart::total(prices)`とフルパスで書くかのいずれかで解決します[^2]。

## どこまで持ち込むかの慣習

パスのどこで止めて持ち込むかには、The Rust Programming Languageが示す慣習があります[^2]。

| 対象                            | 持ち込む深さ           | 例                                                       |
| ------------------------------- | ---------------------- | -------------------------------------------------------- |
| [[function]]                    | 親モジュールまで       | `use std::cmp;`と書いて`cmp::max(a, b)`と呼ぶ           |
| [[struct]]・[[enum]]・その他    | 項目そのものまで       | `use std::collections::HashMap;`と書いて`HashMap::new()`と呼ぶ |

関数を裸の名前で呼べるようにすると、そのファイルで定義された関数なのかどうかが読み取れなくなります。親モジュールまでで止めれば、繰り返しを減らしつつ「よそで定義された関数」だと示せます[^2]。

```rust playground
use std::cmp; // 関数は親モジュールまで
use std::collections::HashMap; // 構造体は項目そのものまで

fn main() {
    let mut stock = HashMap::new();
    stock.insert("りんご", 3);
    stock.insert("みかん", 8);

    println!("在庫の多いほう: {}個", cmp::max(stock["りんご"], stock["みかん"]));
}
```

## 別名・まとめ書き・一括取り込み

パスを並べる以外にも、持ち込み方には次の書き方があります。

| 書き方                             | 意味                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| `use std::io::Result as IoResult;` | `as`で名前を変えて持ち込む（名前の衝突を避けられる）     |
| `use std::{cmp::Ordering, io};`    | 波括弧で同じ接頭辞のものをまとめて持ち込む（ネストしたパス） |
| `use std::io::{self, Write};`      | 波括弧の中の`self`で、接頭辞の`io`自身も併せて持ち込む   |
| `use std::io::prelude::*;`         | glob演算子`*`で、その先の持ち込める項目をすべて持ち込む  |

波括弧は入れ子にでき、パスの木を作れます[^1]。`as`とまとめ書きは同時に使えるので、次の1行にすべて詰め込めます。

```rust playground
// `fmt`自身・`Display`・別名を付けた`Result`を、1行でまとめて持ち込む
use std::fmt::{self, Display, Result as FmtResult};

struct Price(u32);

impl Display for Price {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> FmtResult {
        write!(f, "{}円", self.0)
    }
}

fn main() {
    println!("お支払い金額: {}", Price(2230));
}
```

:::message{warning}
glob演算子`*`はパスの最後のセグメントにのみ置けます[^1]。便利な一方で、どの名前がスコープにあるのか・使っている名前がどこで定義されたのかが読み取りにくくなるため、乱用は避けます[^2]。主な用途は、テストモジュールで親の項目をまとめて取り込む`use super::*;`と、[[standard-library]]のプレリュードのように、使う側にまとめて取り込ませたいAPI群を提供する場面です[^2]。
:::

## 補足

:::details[同じ名前の項目を2つ持ち込むときの例外]
慣習には例外があり、同じ名前の項目を2つ持ち込むときは構造体や列挙型でも親モジュールまでで止めます[^2]。`use std::fmt::Result;`と`use std::io::Result;`を並べると、同じスコープに`Result`が2つできてしまい、その場でE0252のコンパイルエラーになるためです。`use std::io::Result as IoResult;`のように`as`で別名を付ける手もあります[^2]。
:::

:::details[子モジュールには親のuse宣言が届かない]
最初のコード例に`mod checkout`を足して、その中から`cart`という名前を使おうとしたコードです。

<!-- rustc: expect E0433 -->
```rust
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            prices.iter().sum()
        }
    }
}

use crate::shop::cart;

mod checkout {
    pub fn pay(prices: &[u32]) {
        // エラー: E0433（親スコープのuse宣言はここには届かない）
        println!("お支払い金額: {}円", cart::total(prices));
    }
}

fn main() {
    checkout::pay(&[980, 1250]);
}
```
:::

:::details[外へ公開する pub use]
use宣言が作る名前は、項目と同じく既定では囲むモジュールの外へは公開されません。[[pub]]を付けた`pub use`にすると、その名前を外へ公開する[[re-export]]になります[^1]。
:::

:::details[globで持ち込んだ名前は上書きできる]
同じ名前空間に定義済みの名前があると、glob経由で持ち込まれた同名の名前はそちらに覆い隠されます。項目の定義と名前付きのuse宣言はどちらもglobを覆い隠せるため[^1]、`*`で取り込んだうえで一部だけ自前の定義に差し替える、という書き方ができます。

```rust playground
mod shop {
    pub fn open() -> &'static str {
        "本店 10:00-20:00"
    }
    pub fn close() -> &'static str {
        "本店 20:00"
    }
}

use shop::*;

// globで持ち込んだ`open`を、こちらの定義が覆い隠す
fn open() -> &'static str {
    "支店 11:00-19:00"
}

fn main() {
    println!("開店: {}", open()); // 支店（自前の定義）
    println!("閉店: {}", close()); // 本店（globで持ち込んだほう）
}
```
:::

:::details[名前を作らずに持ち込む use path as _]
`use path as _;`と書くと、名前を束縛せずに項目を持ち込めます[^1]。トレイトの[[method]]を使いたいだけで、トレイト名そのものは他の名前とぶつかるので持ち込みたくない、という場面で使います[^1]。<!-- TODO: [[trait]] 作成後にリンク -->

```rust playground
use std::io::Write as _; // `Write`という名前は作らず、メソッドだけ使えるようにする

struct Write; // 同名の構造体を定義しても衝突しない

fn main() {
    let mut receipt: Vec<u8> = Vec::new();
    receipt.write_all("合計 2230円".as_bytes()).unwrap(); // Writeのメソッド
    println!("{}", String::from_utf8(receipt).unwrap());
}
```
:::

:::details[2015エディションでの解決の起点]
2018エディション以降、use宣言のパスは他のパスと同じ規則で解決され、現在のモジュールの項目名からも外部クレート名からも書き始められます[^1]。2015エディションではuse宣言のパスだけが[[crate]]ルート起点で、それ以外のコードのパスとは起点が違っていました[^1]。そのため、クレートルート以外のモジュールで同じモジュールの中の`shop`を指すには、`use self::shop::cart;`と`self::`を明示する必要がありました（クレートルート直下では両者の起点が一致するため、上のコード例の書き方は2015エディションでもそのまま動きます）。

また2015エディションのuse宣言は外部プレリュードを参照できないため、外部のクレートを使うには別途`extern crate`の宣言が必要でした[^1]。
:::

[^1]: [Use declarations — The Rust Reference](https://doc.rust-lang.org/reference/items/use-declarations.html)

[^2]: [Bringing Paths into Scope with the `use` Keyword — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html)
