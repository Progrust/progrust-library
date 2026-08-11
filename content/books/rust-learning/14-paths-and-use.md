---
title: 第14章 パスとuse宣言
description: crateから書き始める絶対パスと現在地から書き始める相対パス、親モジュールをたどるsuper、長いパスをスコープへ持ち込むuse宣言、useが効く範囲、asによる名前の衝突回避、cfg(test)のテストモジュールとuse super::*まで、モジュールツリー上の項目を指す書き方を手を動かして学ぶ6問。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成", "問題集"]
public: true
---

第13章で、`mod`でコードをまとめ、`pub`で「どこまで見せるか」を決められるようになりました。この章では、そうやって組み上げたモジュールツリーの中の項目を**どう指すか**を6問で扱います。

第13章では`shop::cart::total(&prices)`のように毎回フルパスを書いていました。これが**パス**です。パスには`crate`から書き始める形と現在地から書き始める形の2種類があり、親をたどる`super`という書き方もあります。そして、同じ長いパスを何度も書かずに済ませるための仕組みが`use`宣言です。

第13章が「見えるかどうか」の話だったのに対して、この章は「どう指すか」の話です。2つは独立していて、パスが正しく書けていても`pub`がなければ届きませんし、`pub`が付いていてもパスを間違えれば届きません。エラーメッセージのE0603（非公開）とE0433（見つからない）は、そのどちらでつまずいたかを表しています。

この章もインラインモジュールだけを扱うので、1つのコードブロックで完結します。

進め方は[第13章](/books/rust-learning/modules-and-visibility)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - 絶対パスと相対パス

[[module-path]]に関する問題です。
同じ関数`total`を、絶対パスと相対パスの2通りで呼び出してください。

```txt:期待する出力
絶対パス: 2230円
相対パス: 2230円
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

fn main() {
    let prices = [980, 1250];

    // 絶対パスでtotalを呼び出し「絶対パス: 〇〇円」と出力せよ

    // 相対パスでtotalを呼び出し「相対パス: 〇〇円」と出力せよ

}
```

::::details[解答例と解説]
```rust playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

fn main() {
    let prices = [980, 1250];

    // 絶対パスでtotalを呼び出し「絶対パス: 〇〇円」と出力せよ
    // crateから書き始める
    println!("絶対パス: {}円", crate::shop::cart::total(&prices)); // [!code ++]

    // 相対パスでtotalを呼び出し「相対パス: 〇〇円」と出力せよ
    // 現在地にあるshopから書き始める
    println!("相対パス: {}円", shop::cart::total(&prices)); // [!code ++]
}
```
[[module-path]]は、`::`で区切った名前を並べてモジュールツリー上の項目をたどる書き方です。起点の違いで2種類に分かれます。

| 種類 | 起点 | 書き出し |
| --- | --- | --- |
| 絶対パス | クレートルート | `crate::` |
| 相対パス | 現在いるモジュール | その場から見える名前 |

ファイルのパスによく似ています。絶対パスは`/home/user/memo.txt`のようにルートから書く形、相対パスは`memo.txt`のように今いる場所から書く形です。

今回は`main`がクレートルートにいるので、どちらも同じ`shop`から始まります。`crate::`を付けるか付けないかだけの違いに見えますが、`main`が別のモジュールの中にあれば相対パスのほうは書けなくなります。**相対パスは書いている場所によって変わる**というのが本質的な違いです。

**どちらを使うべきか**
The Rust Programming Languageは、一般に**絶対パスを勧めています**。理由は、コードを別の場所へ移したときにどちらが壊れるかにあります。

| 移動のしかた | 絶対パス | 相対パス |
| --- | --- | --- |
| 呼び出す側だけを別のモジュールへ移す | そのまま使える | 書き直しが必要 |
| 定義と呼び出す側をまとめて移す | 書き直しが必要 | そのまま使える |

定義と呼び出しは別々に動かすことのほうが多いので、既定は絶対パスにしておくと安全です。逆に「この2つは必ず一緒に動く」と言い切れるまとまりでは相対パスが有利で、その典型が問題06で扱うテストモジュールです。

:::message{tip}
パスの先頭には`crate`のほかに`self`と`super`も書けます。`self::`は現在のモジュール、`super::`は親モジュールが起点で、ファイルパスの`./`と`../`に対応します。`super`は次の問題02で扱います。
:::
::::

## 02 - superで親をたどる

[[super]]と[[module-path]]に関する問題です。
次のコードはコンパイルエラー（E0433）になります。パスを直して修正してください。

```txt:期待する出力
お支払い金額: 2230円
```

<!-- rustc: expect E0433 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }

    pub mod checkout {
        pub fn pay(prices: &[u32]) {
            let total = cart::total(prices);
            println!("お支払い金額: {total}円");
        }
    }
}

fn main() {
    shop::checkout::pay(&[980, 1250]);
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }

    pub mod checkout {
        pub fn pay(prices: &[u32]) {
            let total = cart::total(prices); // [!code --]
            let total = super::cart::total(prices); // [!code ++]
            println!("お支払い金額: {total}円");
        }
    }
}

fn main() {
    shop::checkout::pay(&[980, 1250]);
}
```
エラーは`failed to resolve: use of unresolved module or unlinked crate 'cart'`（E0433）です。「`cart`というモジュールが見つからない」と言われています。

`cart`と`checkout`はどちらも`shop`の中にある兄弟モジュールです。同じ親を持っているので隣同士のように見えますが、`checkout`の中から相対パスで書き始めたときに見えるのは、**`checkout`自身の中にあるもの**だけです。`cart`は1つ上の`shop`の中にあるので、そのままでは見つかりません。

```text
crate
└── shop
    ├── cart      // 目的地
    └── checkout  // ここから書き始めている
```

[[super]]は、パスの先頭に置いて**親モジュール**を起点にするキーワードです。`super::cart::total`と書けば、`checkout`から1つ上の`shop`へ上がり、そこから`cart`をたどることになります。

| 先頭に書く語 | 起点 | ファイルパスでの例え |
| --- | --- | --- |
| `crate` | クレートルート | `/` |
| `self` | 現在のモジュール | `./` |
| `super` | 親モジュール | `../` |

**絶対パスでも書ける**
`crate::shop::cart::total(prices)`と書いても同じ結果になります。問題01の基準に従えば、`cart`と`checkout`を切り離して別の場所へ移す可能性があるなら絶対パスのほうが安全です。逆に`shop`ごとまとめて移す前提なら、`super::`のほうが移動後もそのまま動きます。

**`super`は重ねられる**
`super::super::`と連ねれば、さらに上の祖先までたどれます。ただしクレートルートには親がないので、そこで`super`を書くとE0433になります。ファイルパスで`/`より上へ行けないのと同じです。

:::message{warning}
パスが書けることと、そこへアクセスできることは別です。`super::cart::total`と正しく書いても、`cart`か`total`のどちらかに`pub`が付いていなければ、今度は第13章のE0603になります。E0433は「道が違う」、E0603は「道は合っているが鍵がかかっている」だと考えると読み分けやすくなります。
:::
::::

## 03 - use宣言で持ち込む

[[use-declaration]]に関する問題です。
次のコードは`shop::cart::`の繰り返しが目立ちます。`use`宣言を1行足して、`cart::add`・`cart::total`と短く書けるようにしてください。出力は変えません。

```txt:期待する出力
1点目を追加しました
2点目を追加しました
合計: 2230円
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    pub mod cart {
        pub fn add(prices: &mut Vec<u32>, price: u32) {
            prices.push(price);
            println!("{}点目を追加しました", prices.len());
        }

        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

// ここにuse宣言を1行足せ

fn main() {
    let mut prices = Vec::new();

    // 下の3行を cart::add / cart::total と書けるように直せ
    shop::cart::add(&mut prices, 980);
    shop::cart::add(&mut prices, 1250);
    println!("合計: {}円", shop::cart::total(&prices));
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    pub mod cart {
        pub fn add(prices: &mut Vec<u32>, price: u32) {
            prices.push(price);
            println!("{}点目を追加しました", prices.len());
        }

        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

// ここにuse宣言を1行足せ
use crate::shop::cart; // [!code ++]

fn main() {
    let mut prices = Vec::new();

    // 下の3行を cart::add / cart::total と書けるように直せ
    shop::cart::add(&mut prices, 980); // [!code --]
    shop::cart::add(&mut prices, 1250); // [!code --]
    println!("合計: {}円", shop::cart::total(&prices)); // [!code --]
    cart::add(&mut prices, 980); // [!code ++]
    cart::add(&mut prices, 1250); // [!code ++]
    println!("合計: {}円", cart::total(&prices)); // [!code ++]
}
```
[[use-declaration]]は、パスをその場のスコープに**持ち込む**宣言です。`use crate::shop::cart;`と一度書いておけば、以降そのスコープでは`cart`という名前が`crate::shop::cart`を指すようになります。

ショートカットを作る操作だと考えると分かりやすいでしょう。実体が移動するわけではなく、その場から使える短い名前が1つ増えるだけです。

**どこまで持ち込むかには慣習がある**
`use crate::shop::cart::total;`と関数そのものまで持ち込めば、`total(&prices)`とさらに短く書けます。しかしThe Rust Programming Languageは、**関数は親モジュールまでで止める**ことを勧めています。

<!-- rustc: skip -->
```rust:関数は親モジュールまでで止める
use crate::shop::cart;

cart::total(&prices); // どこか別の場所で定義された関数だと分かる
```

<!-- rustc: skip -->
```rust:関数そのものまで持ち込むと出どころが読めない
use crate::shop::cart::total;

total(&prices); // このファイルで定義した関数のように見えてしまう
```

裸の名前で呼べるようにすると、そのファイルで定義した関数なのか、よそから持ち込んだ関数なのかが読み取れなくなります。親モジュールまでで止めれば、繰り返しは減らしつつ出どころも残せます。

一方、構造体・列挙型などの型は**それ自体まで持ち込む**のが慣習です。`use std::collections::HashMap;`と書いて`HashMap::new()`と呼ぶ形で、こちらは標準ライブラリのドキュメントでもよく見かけます。

| 対象 | 持ち込む深さ | 呼び出しの形 |
| --- | --- | --- |
| 関数 | 親モジュールまで | `cart::total(..)` |
| 構造体・列挙型など | 項目そのものまで | `HashMap::new()` |

**まとめ書きと別名**
`use`には便利な書き方がいくつかあります。

| 書き方 | 意味 |
| --- | --- |
| `use std::cmp::Ordering as Ord2;` | `as`で名前を変えて持ち込む |
| `use std::{cmp, io};` | 波括弧で同じ接頭辞のものをまとめて持ち込む |
| `use std::io::{self, Write};` | 波括弧の中の`self`で接頭辞の`io`自身も持ち込む |
| `use std::io::prelude::*;` | `*`でその先の項目をすべて持ち込む |

`as`は問題05、`*`は問題06で実際に使います。

:::message{tip}
`use`宣言は慣例としてファイルやモジュールの先頭にまとめて書きます。「このコードが外から何を使っているか」が冒頭を見れば分かるようにするためです。
:::
::::

## 04 - useが効くのはそのスコープだけ

[[use-declaration]]と[[module-path]]に関する問題です。
次のコードは`use`宣言を書いてあるのにコンパイルエラー（E0433）になります。`checkout`モジュールの中でも`cart`を使えるように修正してください。

```txt:期待する出力
合計: 2230円
お支払い金額: 2230円
```

<!-- rustc: expect E0433 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

use crate::shop::cart;

mod checkout {
    pub fn pay(prices: &[u32]) {
        println!("お支払い金額: {}円", cart::total(prices));
    }
}

fn main() {
    println!("合計: {}円", cart::total(&[980, 1250]));
    checkout::pay(&[980, 1250]);
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

use crate::shop::cart;

mod checkout {
    use crate::shop::cart; // [!code ++]

    pub fn pay(prices: &[u32]) {
        println!("お支払い金額: {}円", cart::total(prices));
    }
}

fn main() {
    println!("合計: {}円", cart::total(&[980, 1250]));
    checkout::pay(&[980, 1250]);
}
```
エラーは問題02と同じE0433で、`cart`が見つからないと言われています。`main`からは`cart::total`と書けているのに、`checkout`の中では書けません。

`use`宣言が作る名前が有効なのは、**それを書いたスコープの中だけ**です。ファイルの先頭に書いたからといって、そのファイル全体に効くわけではありません。今回の`use`はクレートルートに書かれているので、有効なのはクレートルート（つまり`main`など、モジュールで囲まれていない場所）だけです。

```text
crate
├── use crate::shop::cart  // この名前が有効なのはクレートルートの中だけ
├── shop
├── checkout               // ここには届かない
└── main                   // ここでは使える
```

`mod checkout { ... }`は新しいスコープなので、そこで`cart`という名前を使いたければ、そのモジュールの中でもう一度`use`を書きます。

**書かずに済ませる方法もある**
`use`を足す以外に、パスを最後まで書いてしまう手もあります。

<!-- rustc: skip -->
```rust:useを足さずに書く場合
mod checkout {
    pub fn pay(prices: &[u32]) {
        // 絶対パス
        println!("お支払い金額: {}円", crate::shop::cart::total(prices));
        // 相対パス（親であるクレートルートへ上がってからたどる）
        println!("お支払い金額: {}円", super::shop::cart::total(prices));
    }
}
```

同じモジュール内で1回しか使わないならフルパスのまま書き、何度も出てくるなら`use`を足す、という判断になります。

**なぜスコープ単位なのか**
`use`がファイル全体に効いてしまうと、モジュールの中身が外側の宣言に左右されることになります。第13章で見たとおり、モジュールは境界を作るための仕組みです。`use`もその境界に従うので、モジュールの中を読むときは「そのモジュールの`use`だけ見れば、どこから何を持ち込んでいるか分かる」状態が保たれます。

:::message{tip}
この後の第15章でモジュールをファイルへ分割すると、この規則の意味がもっとはっきりします。ファイルごとに`use`を書く必要があるのは、ファイルがそのままモジュール1つ分のスコープになるためです。
:::
::::

## 05 - asで別名を付ける

[[use-declaration]]に関する問題です。
次のコードはコンパイルエラー（E0252）になります。`use`宣言の書き方を変えて修正してください。

```txt:期待する出力
現金払い: 2230円
カード払い: 2280円
```

<!-- rustc: expect E0252 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod payment {
    pub mod cash {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }

    pub mod card {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum + 50 // カード手数料
        }
    }
}

use crate::payment::cash::total;
use crate::payment::card::total;

fn main() {
    let prices = [980, 1250];

    println!("現金払い: {}円", total(&prices));
    println!("カード払い: {}円", total(&prices));
}
```

::::details[解答例と解説]
```rust playground
mod payment {
    pub mod cash {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }

    pub mod card {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum + 50 // カード手数料
        }
    }
}

use crate::payment::cash::total; // [!code --]
use crate::payment::card::total; // [!code --]
use crate::payment::cash::total as cash_total; // [!code ++]
use crate::payment::card::total as card_total; // [!code ++]

fn main() {
    let prices = [980, 1250];

    println!("現金払い: {}円", total(&prices)); // [!code --]
    println!("カード払い: {}円", total(&prices)); // [!code --]
    println!("現金払い: {}円", cash_total(&prices)); // [!code ++]
    println!("カード払い: {}円", card_total(&prices)); // [!code ++]
}
```
エラーは`the name 'total' is defined multiple times`（E0252）です。

`use`宣言はスコープに名前を作る操作なので、同じ名前を2回持ち込めば衝突します。同じファイルに`fn total`を2つ書けないのと同じことが、持ち込んだ名前でも起きています。しかも仮に通ったとしても、`total(&prices)`と書いたときにどちらを呼びたいのかコンパイラには分かりません。

解決策の1つが`as`で、持ち込む名前を好きなものに変えられます。`use crate::payment::cash::total as cash_total;`と書けば、この先`cash_total`という名前で`cash::total`を呼べます。

**そもそも持ち込みすぎ、という見方もある**
この問題はもう1つの直し方でも解決できます。問題03の慣習どおり、関数は親モジュールまでで止める書き方です。

```rust:モジュールまでで止める場合 playground
mod payment {
    pub mod cash {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }

    pub mod card {
        pub fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum + 50 // カード手数料
        }
    }
}

use crate::payment::{card, cash}; // 波括弧でまとめて持ち込む

fn main() {
    let prices = [980, 1250];

    println!("現金払い: {}円", cash::total(&prices));
    println!("カード払い: {}円", card::total(&prices));
}
```

こちらは別名を考える必要がなく、`cash::total`・`card::total`という呼び方に「どちらの計算なのか」がそのまま残ります。E0252に出会ったら、`as`で別名を付ける前に「持ち込む深さが深すぎないか」を先に疑ってみてください。

なお、`payment`の中の2つのモジュールをまとめて持ち込む`use crate::payment::{card, cash};`が、問題03の表で挙げた波括弧の書き方です。接頭辞の`crate::payment::`を1回だけ書けばよく、`use`宣言が2行に増えるのを防げます。

**`as`が本当に必要になる場面**
名前が同じで、しかも両方を項目まで持ち込みたいときです。標準ライブラリの`std::fmt::Result`と`std::io::Result`が代表例で、どちらも`Result`という名前なので、片方に`use std::io::Result as IoResult;`のように別名を付けて使い分けます。

:::message{tip}
`as`は`use`宣言だけの機能で、元の名前が消えるわけではありません。別名を付けた後も`crate::payment::cash::total(..)`とフルパスで呼べます。第2章で出てきた型変換の`as`とは、たまたま同じ語を使っているだけの別物です。
:::
::::

## 06 - テストモジュールとuse super::\*

[[super]]と[[use-declaration]]に関する問題です。
次のコードは、TESTを実行するとコンパイルエラー（E0425）になります。`tests`モジュールに1行足して、テストに合格させてください。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
fn with_tax(price: u32) -> u32 {
    price * 110 / 100
}

fn discount(price: u32, off: u32) -> u32 {
    price - off
}

#[cfg(test)]
mod tests {
    // ここに1行足せ（with_taxとdiscountを、このモジュールの中で呼べるようにする）

    #[test]
    fn test_with_tax() {
        assert_eq!(with_tax(1000), 1100);
        assert_eq!(with_tax(2230), 2453);
    }

    #[test]
    fn test_discount() {
        assert_eq!(discount(1000, 200), 800);
    }
}
```

::::details[解答例と解説]
```rust playground
fn with_tax(price: u32) -> u32 {
    price * 110 / 100
}

fn discount(price: u32, off: u32) -> u32 {
    price - off
}

#[cfg(test)]
mod tests {
    // ここに1行足せ（with_taxとdiscountを、このモジュールの中で呼べるようにする）
    use super::*; // [!code ++]

    #[test]
    fn test_with_tax() {
        assert_eq!(with_tax(1000), 1100);
        assert_eq!(with_tax(2230), 2453);
    }

    #[test]
    fn test_discount() {
        assert_eq!(discount(1000, 200), 800);
    }
}
```
`use super::*;`は、Rustのテストコードで最も定番の1行です。3つの要素の組み合わせでできています。

**`super`で親モジュールを指す**
`mod tests`はクレートルートの子モジュールなので、`super`はクレートルート、つまり`with_tax`と`discount`が置かれている場所です。ここでは絶対パスの`use crate::*;`と書いても同じ結果になりますが、テストモジュールは対象と必ず一緒に動くので、問題01の基準どおり相対パスの`super`を使うのが定番になっています。

**`*`でまとめて持ち込む**
`use super::with_tax;`と`use super::discount;`を並べても動きますが、テスト対象が増えるたびに`use`を足すことになります。glob演算子の`*`は「その先の持ち込めるものを全部」という意味で、テストモジュールはまさに全部使いたい場所です。

問題03で触れたとおり`*`は普段は避けるべき書き方ですが、テストモジュールは数少ない例外として推奨されています。取り込む相手が自分の親モジュールに限られていて、出どころを見失う心配がないためです。

**非公開のままテストできる**
`with_tax`にも`discount`にも`pub`が付いていません。それでもテストから呼べるのは、第13章の問題06で確かめたとおり、**子モジュールからは祖先の非公開の項目が見える**ためです。`tests`はクレートルートの子なので、そこにある非公開の関数がすべて見えます。

Rustで「テストのために`pub`にする」必要がないのは、この規則のおかげです。公開範囲を広げずに内部の関数を直接テストできます。

**`#[cfg(test)]`は何をしているか**
`#[cfg(test)]`は「テストとしてビルドするときだけ、この項目をコンパイルする」という指定です。付けておけば、`cargo build`で作られる成果物にテストコードは一切含まれません。テスト用のデータや補助関数を気軽に置けるのはこのためです。

`#[test]`のほうは個々のテスト関数に付ける印で、こちらは第4章から使ってきました。2つはセットで、`#[cfg(test)] mod tests { ... }`の中に`#[test]`付きの関数を並べるのが標準的な形です。

:::message{warning}
この問題のコードには`fn main`がありません。Rust Playgroundでは`main`関数があるとテストが実行されないため、テスト形式の問題では`main`を置かない構成にしています。RUNではなくTESTを押して実行してください。
:::

:::message{tip}
これで第14章は終わりです。パスの2つの起点、`super`での親たどり、`use`宣言とその有効範囲まで押さえたので、モジュールツリーのどこにあるものでも指せるようになりました。

ここまでの第13章・第14章は、すべて1つのファイルの中で完結していました。次の第15章では、いよいよ**複数のファイル**にコードを分けます。`mod shop;`とセミコロンで終える書き方で中身を別ファイルから読み込む方法、そしてクレートとパッケージという「プロジェクトの単位」を扱います。
:::
::::
