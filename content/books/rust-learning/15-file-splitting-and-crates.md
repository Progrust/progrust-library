---
title: 第15章 ファイル分割とクレート
description: セミコロンで終えるmod宣言による別ファイルの読み込み、子モジュールとディレクトリの対応、modを書くのは1回だけという規則、ライブラリクレートとバイナリクレートの分担、crate::が指すクレートまで、1つのファイルに収まらなくなったコードを複数ファイルへ分ける方法を手を動かして学ぶ6問。
created_at: 2026-08-12
updated_at: 2026-08-12
tags: ["プロジェクト構成", "問題集"]
public: true
---

第13章と第14章では、`mod`でモジュールツリーを組み、`pub`で公開範囲を決め、パスと`use`宣言でその中の項目を指せるようになりました。ただし、ここまでのコードはすべて1つのファイルの中に書いてきました。

この章では、そのコードを**複数のファイル**へ分けます。使うのは`mod shop;`とセミコロンで終える書き方だけで、モジュールツリーの形も`pub`の効き方も、これまでと1つも変わりません。変わるのは「中身がどこに書いてあるか」だけです。

後半では、もう一段大きな単位である**クレート**を扱います。1つのプロジェクトの中に、実行される`main`を持つバイナリクレートと、機能を提供するライブラリクレートを共存させられます。この2つは別のクレートなので、`crate::`が指す先も別になります。

## この章からの出題形式

複数のファイルを扱うため、問題のコードは次のような**プロジェクト**の形で出題します。

- 枠の上部に、ファイル数と「Playgroundで開く」ボタンが並びます
- その下にファイル構成のツリーが表示されます（ファイル名をクリックすると、そのコードブロックへ移動します）
- ボタンを押すとRust Playgroundが複数ファイルモードで開き、すべてのファイルがそのまま再現されます

ボタンはプロジェクト全体に1つだけ付きます。ファイルごとのボタンはありません。

進め方は[第14章](/books/rust-learning/paths-and-use)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - モジュールをファイルへ切り出す

[[module-file-split]]と[[module]]に関する問題です。
次のプロジェクトには`src/shop.rs`が用意してあるのに、コンパイルエラー（E0433）になります。`src/main.rs`に1行足して修正してください。

```txt:期待する出力
合計: 2230円
```

:::project[「Playgroundで開く」をクリックして修正・実行してください]

<!-- rustc: skip -->
```rust:src/main.rs
// ここに1行足せ（shopの中身を src/shop.rs から読み込む）

fn main() {
    println!("合計: {}円", shop::total(&[980, 1250]));
}
```

<!-- rustc: skip -->
```rust:src/shop.rs
pub fn total(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }
    sum
}
```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/main.rs
// ここに1行足せ（shopの中身を src/shop.rs から読み込む）
mod shop; // [!code ++]

fn main() {
    println!("合計: {}円", shop::total(&[980, 1250]));
}
```

<!-- rustc: skip -->
```rust:src/shop.rs
pub fn total(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }
    sum
}
```

:::

エラーは第14章でも見たE0433で、`use of unresolved module or unlinked crate 'shop'`と言われています。`src/shop.rs`というファイルは確かに存在するのに、`shop`というモジュールは見つからない、という状態です。

**ファイルを置いただけでは何も起きない**
Rustのコンパイラは`src/`の中を探し回って、見つけたファイルを勝手に読み込んだりはしません。ファイルの中身をモジュールツリーに組み込むのは、あくまで`mod`宣言です。

[[module-file-split]]は、`mod shop;`のように**本体を持たずセミコロンで終える**宣言で行います。これは「`shop`というモジュールがここにあります。中身は別のファイルにあるので読んできてください」という指示です。

| 書き方 | 意味 |
| --- | --- |
| `mod shop { ... }` | 中身をその場に書く（インラインモジュール。第13章・第14章） |
| `mod shop;` | 中身を`src/shop.rs`から読み込む |

今回のエラーには、次のヒントが添えられています。

```text
help: to make use of source file src/shop.rs, use `mod shop` in this file to declare the module
```

「`src/shop.rs`を使いたいなら、このファイルに`mod shop`と書いて宣言せよ」という助言です。コンパイラはファイルの存在に気付いていて、それでも読み込まないのは、宣言がないからです。

**ツリーの形は変わらない**
ファイルを分けても、モジュールツリーは第13章までとまったく同じです。

```text
crate           // src/main.rs
├── shop        // src/shop.rs
│   └── total
└── main
```

`total`に`pub`が必要なことも、`shop::total(..)`というパスで呼ぶことも変わりません。ファイル分割は**中身の置き場所を移すだけ**の操作で、可視性やパスの規則には一切影響しません。第13章・第14章で学んだことは、そのまま使えます。

**`mod`は`#include`ではない**
C言語の`#include`や他言語の`import`と違い、`mod`はファイルの内容をその場に貼り付ける操作ではありません。「このモジュールはツリーのこの位置にあります」という位置の宣言です。この違いは問題03ではっきりします。

:::message{tip}
`mod`宣言を書かなかったファイルは、コンパイルの対象にすらなりません。書きかけのファイルを`src/`に置いておいてもビルドは通りますが、逆に「書いたのに反映されない」ときは`mod`の書き忘れをまず疑ってください。
:::
::::

## 02 - 子モジュールはディレクトリの中へ

[[module-file-split]]と[[module-path]]に関する問題です。
`shop`の子モジュール`cart`を`src/shop/cart.rs`に置いた2段構成です。2か所のコメントに従ってコードを完成させてください。

```txt:期待する出力
税込合計: 2453円
```

:::project[「Playgroundで開く」をクリックして修正・実行してください]

<!-- rustc: skip -->
```rust:src/main.rs
mod shop;

fn main() {
    println!("税込合計: {}円", shop::cart::total(&[980, 1250]));
}
```

<!-- rustc: skip -->
```rust:src/shop.rs
// ここに1行足せ（cartの中身を src/shop/cart.rs から読み込む。外からも使えるようにすること）

// 非公開の定数（shopとその子孫からだけ使える）
const TAX_RATE: u32 = 10;
```

<!-- rustc: skip -->
```rust:src/shop/cart.rs
pub fn total(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }

    // 親モジュールshopの非公開の定数TAX_RATEを使い、税込価格を返せ

}
```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/main.rs
mod shop;

fn main() {
    println!("税込合計: {}円", shop::cart::total(&[980, 1250]));
}
```

<!-- rustc: skip -->
```rust:src/shop.rs
// ここに1行足せ（cartの中身を src/shop/cart.rs から読み込む。外からも使えるようにすること）
pub mod cart; // [!code ++]

// 非公開の定数（shopとその子孫からだけ使える）
const TAX_RATE: u32 = 10;
```

<!-- rustc: skip -->
```rust:src/shop/cart.rs
pub fn total(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }

    // 親モジュールshopの非公開の定数TAX_RATEを使い、税込価格を返せ
    sum * (100 + super::TAX_RATE) / 100 // [!code ++]
}
```

:::

`shop`の中身が`src/shop.rs`にあるように、`shop::cart`の中身は`src/shop/cart.rs`にあります。祖先にあたるモジュールがディレクトリになり、モジュール自身の中身は「モジュール名 + `.rs`」のファイルに入ります。

| モジュールパス | ファイルパス | そのファイルの中身 |
| --- | --- | --- |
| `crate` | `src/main.rs` | `mod shop;` |
| `crate::shop` | `src/shop.rs` | `pub mod cart;` と`TAX_RATE` |
| `crate::shop::cart` | `src/shop/cart.rs` | `pub fn total` |

[[module-path]]をそのままファイルパスに写した形になっている、と考えると覚えやすいでしょう。`::`が`/`に変わり、最後のモジュールだけが`.rs`のファイルになります。

**`shop.rs`と`shop/`が並ぶ**
`src/`の直下には`shop.rs`というファイルと`shop`というディレクトリが並びます。同じ名前で紛らわしく見えますが、役割が違うので両方あってよいのです。

```text
src/
├── main.rs        // crate
├── shop.rs        // crate::shop 自身の中身
└── shop/          // crate::shop の子モジュールたちの置き場所
    └── cart.rs    // crate::shop::cart の中身
```

**`pub`が要る理由**
`mod cart;`ではなく`pub mod cart;`と書く必要があります。`cart`は`main`から`shop::cart::total(..)`とたどられるので、第13章の問題03のとおり、途中の`cart`にも`pub`が要ります。ファイルへ分けても可視性の規則は変わりません。

**`super`もそのまま効く**
`cart.rs`から親の`TAX_RATE`を`super::TAX_RATE`で参照できています。`TAX_RATE`は非公開ですが、第13章の問題06のとおり、子モジュールからは祖先の非公開の項目が見えます。**ファイルが分かれてもツリー上の位置関係は変わらない**ので、第14章で学んだ`super`も`crate::`もそのまま使えます。ここでは`crate::shop::TAX_RATE`と書いても同じ結果になります。

**古い書き方: `mod.rs`スタイル**
モジュールの中身は、モジュール名のディレクトリの中の`mod.rs`に置くこともできます。

| 内容 | `src/shop.rs`スタイル | `src/shop/mod.rs`スタイル |
| --- | --- | --- |
| `shop`自身の中身 | `src/shop.rs` | `src/shop/mod.rs` |
| 子モジュール`cart` | `src/shop/cart.rs` | `src/shop/cart.rs` |

どちらも有効ですが、現在推奨されるのは`src/shop.rs`スタイルです。`mod.rs`スタイルだと、プロジェクト中に`mod.rs`という同名のファイルがいくつもでき、エディタでタブを並べたときに見分けが付かなくなるためです。既存のプロジェクトで見かけることはあるので、読めるようにしておけば十分です。

:::message{warning}
同じモジュールに対して`src/shop.rs`と`src/shop/mod.rs`の両方を置くことはできず、E0761（`file for module 'shop' found at both ...`）になります。どちらのスタイルを使うかは、モジュールごとに1つに決めます。
:::
::::

## 03 - modの宣言は1回だけ

[[module-file-split]]と[[use-declaration]]に関する問題です。
次のプロジェクトはコンパイルエラー（E0583）になります。エラーメッセージを読み、`src/checkout.rs`の1行目を書き換えて修正してください。

```txt:期待する出力
お支払い金額: 2230円
```

:::project[「Playgroundで開く」をクリックして修正・実行してください]

<!-- rustc: skip -->
```rust:src/main.rs
mod checkout;
mod shop;

fn main() {
    checkout::pay(&[980, 1250]);
}
```

<!-- rustc: skip -->
```rust:src/shop.rs
pub fn total(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }
    sum
}
```

<!-- rustc: skip -->
```rust:src/checkout.rs
mod shop;

pub fn pay(prices: &[u32]) {
    println!("お支払い金額: {}円", shop::total(prices));
}
```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/main.rs
mod checkout;
mod shop;

fn main() {
    checkout::pay(&[980, 1250]);
}
```

<!-- rustc: skip -->
```rust:src/shop.rs
pub fn total(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }
    sum
}
```

<!-- rustc: skip -->
```rust:src/checkout.rs
mod shop; // [!code --]
use crate::shop; // [!code ++]

pub fn pay(prices: &[u32]) {
    println!("お支払い金額: {}円", shop::total(prices));
}
```

:::

エラーは`file not found for module 'shop'`（E0583）です。`src/shop.rs`は確かにあるのに「見つからない」と言われるのが、この問題のつまずきどころです。

エラーメッセージには2行の補足が付いています。

```text
help: to create the module `shop`, create file "src/checkout/shop.rs" or "src/checkout/shop/mod.rs"
note: if there is a `mod shop` elsewhere in the crate already, import it with `use crate::...` instead
```

1行目で、コンパイラが探した場所が分かります。`src/shop.rs`ではなく`src/checkout/shop.rs`です。問題02のとおり、`mod`宣言が探すファイルの位置は**その宣言を書いたモジュールからの相対**で決まります。`checkout`の中に`mod shop;`と書けば、それは`checkout`の子モジュールの宣言になり、対応するファイルは`src/checkout/shop.rs`になります。

そして2行目が、この問題の答えそのものです。「クレートのどこかにすでに`mod shop`があるなら、代わりに`use crate::...`で取り込め」と書かれています。

**`mod`は位置の宣言、`use`は名前の持ち込み**
問題01で「`mod`は`#include`ではない」と書いた理由がここにあります。`mod`はファイルの中身を貼り付ける操作ではなく、**モジュールツリーのどこに置くか**を決める宣言です。1つのモジュールをツリーの2か所に同時に置くことはできないので、`mod`は1つのモジュールにつき1回しか書けません。

すでに読み込まれているモジュールを別のファイルから使いたいときに書くのは、[[use-declaration]]です。`use crate::shop;`は`shop`を新しく作るのではなく、すでにツリーにある`crate::shop`への短い名前をこのファイルのスコープに増やすだけです。

| 書きたいこと | 書くもの | 何回書けるか |
| --- | --- | --- |
| モジュールをツリーに登録する | `mod shop;` | クレート全体で1回 |
| 登録済みのモジュールを使う | `use crate::shop;` | 使いたいスコープごとに何回でも |

**`use`を書かない選択肢もある**
第14章の問題04と同じで、パスを最後まで書いてしまう手もあります。

<!-- rustc: skip -->
```rust:useを書かない場合のsrc/checkout.rs
pub fn pay(prices: &[u32]) {
    println!("お支払い金額: {}円", crate::shop::total(prices));
}
```

`shop::total`という書き方を保ちたいなら`use crate::shop;`、1回しか使わないならフルパス、という判断になります。

:::message{tip}
`mod`宣言をどこに書くかは、そのままモジュールツリーの設計になります。「クレート全体で使う共通のモジュールはクレートルート（`main.rs`）に、あるモジュール専用の下請けはそのモジュールの中に」と考えると、置き場所に迷いにくくなります。
:::
::::

## 04 - ライブラリクレートとバイナリクレート

[[crate]]と[[package]]に関する問題です。
次のプロジェクトには`src/main.rs`と`src/lib.rs`があります。`src/lib.rs`の`total_with_shipping`を`main`から呼び出してください。

Rust Playgroundのパッケージ名は`playground`で固定されています。

```txt:期待する出力
お支払い金額: 2730円
お支払い金額: 3230円
```

:::project[「Playgroundで開く」をクリックして修正・実行してください]

<!-- rustc: skip -->
```rust:src/lib.rs
/// 送料込みの合計金額を返す（3000円以上は送料無料）
pub fn total_with_shipping(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }

    if sum >= 3000 { sum } else { sum + 500 }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
fn main() {
    // ライブラリクレートのtotal_with_shippingを呼び出し「お支払い金額: 〇〇円」と出力せよ
    // 1回目の引数は &[980, 1250]、2回目は &[1980, 1250]

}
```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/lib.rs
/// 送料込みの合計金額を返す（3000円以上は送料無料）
pub fn total_with_shipping(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }

    if sum >= 3000 { sum } else { sum + 500 }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
fn main() {
    // ライブラリクレートのtotal_with_shippingを呼び出し「お支払い金額: 〇〇円」と出力せよ
    // 1回目の引数は &[980, 1250]、2回目は &[1980, 1250]
    println!("お支払い金額: {}円", playground::total_with_shipping(&[980, 1250])); // [!code ++]
    println!("お支払い金額: {}円", playground::total_with_shipping(&[1980, 1250])); // [!code ++]
}
```

:::

[[crate]]は、コンパイラが一度に処理するコンパイルの単位です。種類は2つあります。

| 種類 | 入口のファイル | `main`関数 | 役割 |
| --- | --- | --- | --- |
| バイナリクレート | `src/main.rs` | 必要 | 実行可能ファイルになる |
| ライブラリクレート | `src/lib.rs` | 不要 | 機能を他から使わせる |

この2つのファイルを両方置くと、1つの[[package]]の中にバイナリクレートとライブラリクレートが1つずつできます。ここまでの問題で書いてきた`mod shop;`のようなモジュールがクレートの**内側**の構造だったのに対して、クレートはその外側にある、もう一段大きな単位です。

**別のクレートなので、名前で呼ぶ**
`shop`のときは`mod shop;`と宣言してから`shop::total(..)`と呼びました。しかし`lib.rs`の中身に`mod`宣言は要りません。`lib.rs`は`main.rs`の一部ではなく、**別のクレート**だからです。別のクレートを指すときは、その**クレート名**をパスの起点に書きます。

```text
playground（パッケージ）
├── playground（ライブラリクレート）    // src/lib.rs
│   └── total_with_shipping
└── playground（バイナリクレート）      // src/main.rs
    └── main
```

ライブラリクレートの名前はパッケージ名から決まります。Rust Playgroundのパッケージ名は`playground`固定なので、`playground::total_with_shipping(..)`と書けます。手元で`cargo new shopping`として作ったパッケージなら、`shopping::total_with_shipping(..)`になります。

**`use`で短く書く**
第14章で学んだ`use`はここでも使えます。

<!-- rustc: skip -->
```rust:useを書く場合のsrc/main.rs
use playground::total_with_shipping;

fn main() {
    println!("お支払い金額: {}円", total_with_shipping(&[980, 1250]));
}
```

第14章の問題03では「関数は親モジュールまでで止める」という慣習を紹介しましたが、この形は例外的によく見かけます。裸の`total_with_shipping(..)`でも、`use`の行を見ればどのクレートのものかがすぐ分かるためです。

**なぜ分けるのか**
`main.rs`にすべて書いても動くのに、わざわざライブラリ側へ移すのには理由があります。

- 他のプログラムから使える。同じパッケージの中に実行ファイルを増やしても、共通のロジックは1か所で済みます
- テストしやすい。ライブラリクレートは`main`を持たないので、そのままテストの対象にできます
- 公開できる。crates.ioへ公開できるのはライブラリクレートです

`main.rs`には引数の受け取りや結果の表示だけを書き、中身の処理は`lib.rs`側に置く、という分け方が定番です。

:::message{tip}
1つのパッケージに入れられるライブラリクレートは最大1つですが、バイナリクレートは何個でも入れられます。`src/bin/report.rs`のように`src/bin/`の下に置いたファイルは、それぞれ独立したバイナリクレートになります。
:::
::::

## 05 - crate::はどのクレートを指すか

[[crate]]と[[module-path]]に関する問題です。
問題04と同じ構成で、`main.rs`から`crate::`でライブラリ側の関数を参照しようとしたところ、コンパイルエラー（E0432）になりました。パスを直して修正してください。

```txt:期待する出力
お支払い金額: 2730円
```

:::project[「Playgroundで開く」をクリックして修正・実行してください]

<!-- rustc: skip -->
```rust:src/lib.rs
/// 送料込みの合計金額を返す（3000円以上は送料無料）
pub fn total_with_shipping(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }

    if sum >= 3000 { sum } else { sum + 500 }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
use crate::total_with_shipping;

fn main() {
    println!("お支払い金額: {}円", total_with_shipping(&[980, 1250]));
}
```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/lib.rs
/// 送料込みの合計金額を返す（3000円以上は送料無料）
pub fn total_with_shipping(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }

    if sum >= 3000 { sum } else { sum + 500 }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
use crate::total_with_shipping; // [!code --]
use playground::total_with_shipping; // [!code ++]

fn main() {
    println!("お支払い金額: {}円", total_with_shipping(&[980, 1250]));
}
```

:::

エラーは`unresolved import 'crate::total_with_shipping'`（E0432）で、`no 'total_with_shipping' in the root`と続きます。「ルートにそんなものはない」という指摘です。

第14章で、`crate`はクレートルートを指すと学びました。ここで問われるのは**どのクレートの**ルートかです。答えは「今コンパイルしているクレート」で、`main.rs`に書いた`crate::`は`main.rs`をルートとするバイナリクレートを指します。ライブラリクレートは別のクレートなので、そちらのルートには届きません。

```text
crate（main.rsから見たとき）      crate（lib.rsから見たとき）
└── main                          └── total_with_shipping
```

`crate::`は「自分のクレートの中」を指す書き方なので、クレートの壁を越えることはできません。越えるときは、問題04のようにクレート名を起点にします。

| 起点 | 指す先 | どこから書けるか |
| --- | --- | --- |
| `crate::` | 今コンパイルしているクレートのルート | そのクレートの中 |
| `playground::` | `playground`という名前のクレートのルート | そのクレートを使える場所 |

**`crate::`が使えなくなるわけではない**
バイナリ側にモジュールがあれば、`main.rs`でも`crate::`は今までどおり使えます。問題03の`use crate::shop;`がまさにそれで、`shop`はバイナリクレートの中のモジュールでした。ライブラリ側のファイル（`lib.rs`やそこから読み込むファイル）の中で`crate::`と書けば、そちらはライブラリクレートのルートを指します。同じ`crate::`という記号が、書かれているファイルがどちらのクレートに属するかによって別の場所を指す、ということです。

**直接パスで書いた場合**
`use`を使わずに`crate::total_with_shipping(..)`と直接書いた場合は、E0432ではなくE0425（`cannot find function ... in the crate root`）になります。エラーコードは違いますが、原因は同じです。

:::message{warning}
`src/main.rs`と`src/lib.rs`は隣り合ったファイルなので、つい同じクレートの一部のように見えてしまいます。ですが、Cargoにとってこの2つは別々にコンパイルされる別のクレートです。「ファイルが隣にあること」と「同じクレートであること」は無関係だと覚えておいてください。
:::
::::

## 06 - 応用: 買い物カートを分割する

第15章の総復習です。
次のコードは、インラインモジュールで書かれた買い物カートです。**出力を変えずに**、下のファイル構成へ移し替えてください。

```text:移し替え先のファイル構成
src/
├── main.rs
├── shop.rs
└── shop/
    ├── cart.rs
    └── checkout.rs
```

```txt:期待する出力
小計: 2230円
お支払い金額: 2453円
```

:::message{info}
Rust Playgroundでの複数ファイルへの切り替えは画面右上の「CONFIG」を開いて「Edit files」の項目を「MULTIPLE」に切り替えることで変更できます。
:::

```rust:このコードを複数ファイルへ移し替えてください playground
mod shop {
    const TAX_RATE: u32 = 10;

    pub mod cart {
        pub fn subtotal(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }

    pub mod checkout {
        pub fn pay(prices: &[u32]) {
            let subtotal = super::cart::subtotal(prices);
            let total = subtotal * (100 + super::TAX_RATE) / 100;

            println!("小計: {subtotal}円");
            println!("お支払い金額: {total}円");
        }
    }
}

fn main() {
    shop::checkout::pay(&[980, 1250]);
}
```

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/main.rs
mod shop;

fn main() {
    shop::checkout::pay(&[980, 1250]);
}
```

<!-- rustc: skip -->
```rust:src/shop.rs
pub mod cart;
pub mod checkout;

const TAX_RATE: u32 = 10;
```

<!-- rustc: skip -->
```rust:src/shop/cart.rs
pub fn subtotal(prices: &[u32]) -> u32 {
    let mut sum = 0;
    for price in prices {
        sum += price;
    }
    sum
}
```

<!-- rustc: skip -->
```rust:src/shop/checkout.rs
pub fn pay(prices: &[u32]) {
    let subtotal = super::cart::subtotal(prices);
    let total = subtotal * (100 + super::TAX_RATE) / 100;

    println!("小計: {subtotal}円");
    println!("お支払い金額: {total}円");
}
```

:::

移し替えの手順は機械的です。`mod 名前 { ... }`と書いてあるところを`mod 名前;`に置き換え、`{}`の中身をそのまま対応するファイルへ移すだけです。

| 元の位置 | 移した先 | 残るもの |
| --- | --- | --- |
| `mod shop { ... }`（クレートルート） | `src/shop.rs` | `mod shop;` |
| `pub mod cart { ... }`（`shop`の中） | `src/shop/cart.rs` | `pub mod cart;` |
| `pub mod checkout { ... }`（`shop`の中） | `src/shop/checkout.rs` | `pub mod checkout;` |

`TAX_RATE`は`shop`が直接持っている定数なので、`shop`自身の中身である`src/shop.rs`に残ります。

**パスは1文字も変えていない**
注目してほしいのは、`checkout`の中の`super::cart::subtotal(prices)`と`super::TAX_RATE`を、まったく書き換えていないことです。ファイルが3つに分かれても、モジュールツリーは元のままだからです。

```text
crate
└── shop
    ├── TAX_RATE     // 非公開
    ├── cart
    │   └── subtotal
    └── checkout
        └── pay
```

`checkout`から見て`super`が`shop`であること、`shop`の非公開の`TAX_RATE`が子から見えることも、すべて変わりません。**ファイル分割はツリーの形に影響しない**という、この章で繰り返し確かめてきた性質が、そのまま効いています。

**`pub`の付け方も変わらない**
`cart`と`checkout`には`pub`が必要で、`TAX_RATE`には要りません。元のコードで付いていたとおりに写せば、それが正解になります。逆に言えば、移し替えのときに`pub`を足したくなったら、それはツリーの形を変えてしまっているサインです。

**どこまで分けるか**
今回は練習のためにモジュール1つにつき1ファイルへ分けましたが、この規模なら1ファイルのままでもまったく問題ありません。分割はコードが読みづらい大きさになってから行うもので、早すぎる分割はファイルを行き来する手間が増えるだけです。まずインラインモジュールで構造を決め、育ってきたら切り出す、という順番が扱いやすいでしょう。

:::message{tip}
これで第15章は終わりです。`mod 名前;`でモジュールをファイルへ切り出す方法、ディレクトリとの対応、`mod`は1回だけという規則、そしてバイナリクレートとライブラリクレートの関係まで押さえました。これで、1つのファイルに収まらない規模のプロジェクトも書けます。

次の第16章では、そうして分けた内部構造を**外からどう見せるか**を扱います。`pub use`で公開APIの形を整える方法と、他の人が書いたクレートを取り込んで使う方法です。
:::
::::
