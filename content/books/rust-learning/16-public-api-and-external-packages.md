---
title: 第16章 公開APIと外部パッケージ
description: pub useによる再エクスポート、非公開modと組み合わせて内部構造を隠す設計、Cargo.tomlの[dependencies]とuseの2段階で外部クレートを使う手順、宣言が要らない標準ライブラリまで、クレートを外からどう見せるか・他のクレートをどう取り込むかを手を動かして学ぶ5問。
created_at: 2026-08-12
updated_at: 2026-08-12
tags: ["プロジェクト構成", "問題集"]
public: true
---

第15章で、コードを複数のファイルへ分け、ライブラリクレートとバイナリクレートを共存させられるようになりました。この章では、そうして組み上げたクレートを**外からどう見せるか**、そして**他の人が書いたクレートをどう取り込むか**を扱います。

第13章の`pub`は「見せるか見せないか」の指定でした。この章の主役である`pub use`は、そこから一歩進んで「**どのパスで**見せるか」を決める仕組みです。内部のモジュール構造をそのまま外に押し付ける代わりに、使ってほしいものだけを短いパスで公開できます。

後半では外部パッケージを扱います。ここまで自分で書いてきたコードと、crates.ioから取ってくるクレートの使い方は、実はほとんど同じです。違うのは`Cargo.toml`への1行だけです。

進め方は[第15章](/books/rust-learning/file-splitting-and-crates)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - pub useで再エクスポートする

[[re-export]]と[[use-declaration]]に関する問題です。
`Cart`は`src/shop/cart.rs`にありますが、`src/main.rs`は`playground::Cart`という短いパスで使おうとしています。`src/lib.rs`に1行足して、そのパスで使えるようにしてください。

```txt:期待する出力
お支払い金額: 2730円
```

:::project[「Playgroundで開く」をクリックして修正・実行してください]

<!-- rustc: skip -->
```rust:src/lib.rs
pub mod shop;

// ここに1行足せ（Cartをクレートルートから公開し直す）

```

<!-- rustc: skip -->
```rust:src/shop.rs
pub mod cart;
```

<!-- rustc: skip -->
```rust:src/shop/cart.rs
pub struct Cart {
    prices: Vec<u32>,
}

impl Cart {
    pub fn new(prices: Vec<u32>) -> Self {
        Cart { prices }
    }

    /// 送料込みの合計金額（3000円以上は送料無料）
    pub fn total(&self) -> u32 {
        let mut sum = 0;
        for price in &self.prices {
            sum += price;
        }

        if sum >= 3000 { sum } else { sum + 500 }
    }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
use playground::Cart;

fn main() {
    let cart = Cart::new(vec![980, 1250]);
    println!("お支払い金額: {}円", cart.total());
}
```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/lib.rs
pub mod shop;

// ここに1行足せ（Cartをクレートルートから公開し直す）
pub use crate::shop::cart::Cart; // [!code ++]
```

<!-- rustc: skip -->
```rust:src/shop.rs
pub mod cart;
```

<!-- rustc: skip -->
```rust:src/shop/cart.rs
pub struct Cart {
    prices: Vec<u32>,
}

impl Cart {
    pub fn new(prices: Vec<u32>) -> Self {
        Cart { prices }
    }

    /// 送料込みの合計金額（3000円以上は送料無料）
    pub fn total(&self) -> u32 {
        let mut sum = 0;
        for price in &self.prices {
            sum += price;
        }

        if sum >= 3000 { sum } else { sum + 500 }
    }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
use playground::Cart;

fn main() {
    let cart = Cart::new(vec![980, 1250]);
    println!("お支払い金額: {}円", cart.total());
}
```

:::

[[use-declaration]]に`pub`を付けた`pub use`が[[re-export]]です。第14章で学んだとおり`use`は名前をそのスコープへ持ち込む宣言でしたが、`pub`が付くと、持ち込んだ名前を**そのスコープの外へも公開**します。

今回`pub use crate::shop::cart::Cart;`を書いた場所はクレートルートなので、`Cart`はクレートルートの名前としても公開されます。結果として、使う側は`playground::Cart`と書けるようになります。

```text
crate（ライブラリ）
├── shop
│   └── cart
│       └── Cart      // 定義されている場所
└── Cart              // pub use で開いた入口（同じ型を指す）
```

**何が良いのか**
この1行がないと、使う側は定義されている場所まで自分でたどることになります。

| 公開のしかた | 使う側が書くパス |
| --- | --- |
| 再エクスポートなし | `use playground::shop::cart::Cart;` |
| 再エクスポートあり | `use playground::Cart;` |

利点は短さだけではありません。使う側が書くパスと、作る側の内部構造が**切り離される**ことが本質です。あとで`cart`を別のモジュールへ移しても、`lib.rs`の`pub use`の行を直せば済み、使う側のコードは無傷です。再エクスポートなしの場合は、内部を動かすたびに使う側が壊れます。

**あくまで別名**
`pub use`は型を移動させるわけではありません。`Cart`が定義されている場所は`crate::shop::cart::Cart`のままで、`playground::Cart`はそこへの入口が1つ増えただけです。今回は`pub mod shop`と公開してあるので、`use playground::shop::cart::Cart;`と長いほうのパスで書いても動きます。この「長いほうの道」を塞ぐ方法が、次の問題02です。

:::message{tip}
`cargo doc`が生成するドキュメントでも、再エクスポートした項目はクレートのトップページに並びます。使ってほしいものをクレートルートに集めておくと、ドキュメントの目次がそのまま「このクレートでできること」の一覧になります。
:::
::::

## 02 - 内部モジュールを隠す

[[re-export]]と[[pub]]に関する問題です。
次のプロジェクトはコンパイルエラー（E0603）になります。`src/lib.rs`は書き換えずに、`src/main.rs`の1行目を直して修正してください。

```txt:期待する出力
合計: 2230円
```

:::project[「Playgroundで開く」をクリックして修正・実行してください]

<!-- rustc: skip -->
```rust:src/lib.rs
// pubを付けていないので、priceモジュール自体は外から見えない
mod price;

// 使ってほしいものだけをクレートルートで公開する
pub use crate::price::Receipt;
```

<!-- rustc: skip -->
```rust:src/price.rs
pub struct Receipt {
    pub total: u32,
}

impl Receipt {
    pub fn issue(prices: &[u32]) -> Self {
        let mut sum = 0;
        for price in prices {
            sum += price;
        }

        Receipt { total: sum }
    }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
use playground::price::Receipt;

fn main() {
    let receipt = Receipt::issue(&[980, 1250]);
    println!("合計: {}円", receipt.total);
}
```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/lib.rs
// pubを付けていないので、priceモジュール自体は外から見えない
mod price;

// 使ってほしいものだけをクレートルートで公開する
pub use crate::price::Receipt;
```

<!-- rustc: skip -->
```rust:src/price.rs
pub struct Receipt {
    pub total: u32,
}

impl Receipt {
    pub fn issue(prices: &[u32]) -> Self {
        let mut sum = 0;
        for price in prices {
            sum += price;
        }

        Receipt { total: sum }
    }
}
```

<!-- rustc: skip -->
```rust:src/main.rs
use playground::price::Receipt; // [!code --]
use playground::Receipt; // [!code ++]

fn main() {
    let receipt = Receipt::issue(&[980, 1250]);
    println!("合計: {}円", receipt.total);
}
```

:::

エラーは`module 'price' is private`（E0603）で、指されているのはパスの`price`の部分です。`Receipt`ではありません。

`lib.rs`の`mod price;`には`pub`が付いていません。第13章で学んだとおり、`pub`が付いていないモジュールはクレートの外から見えないので、`playground::price::...`というパスは`price`のところで止まります。問題01との違いはここだけです。

**それなのに`Receipt`は使える**
不思議に見えるかもしれません。`price`が見えないのに、その中にある`Receipt`は`playground::Receipt`として使えます。

```text
crate（ライブラリ）
├── price             // 非公開 → この道は通れない
│   └── Receipt       // pub
└── Receipt           // pub use で開いた入口 → こちらは通れる
```

再エクスポートが隠すのは**経路**であって、項目そのものではありません。`pub use`はプライバシーの連鎖を短絡させ、非公開のモジュールの中にある公開された項目へ、別の道を1本だけ開けます。開いていない道（`playground::price::Receipt`）は塞がったままです。

**これが公開APIの設計**
問題01の構成では、使う側は短いパスと長いパスのどちらでも書けました。この問題の構成では、短いパスしか存在しません。

| 構成 | 使う側が書けるパス | 内部を変更したとき |
| --- | --- | --- |
| `pub mod price;` のみ | `playground::price::Receipt` | 使う側が壊れる |
| `pub mod price;` ＋ `pub use` | 両方 | 長いパスを使っていた側が壊れる |
| `mod price;` ＋ `pub use` | `playground::Receipt`のみ | 壊れない |

いちばん下の形なら、`price`というモジュール名を変えようが、中を2つに分割しようが、`pub use`の行さえ直せば外への約束は変わりません。**外に見せたいものだけを`pub use`で通し、モジュール自体は非公開のままにする**というのが、ライブラリを作るときの定番の形です。

**`pub`が付いた項目しか通せない**
`price.rs`の`Receipt`には`pub`が付いています。ここを非公開にすると、同じクレートの中であっても`pub use`できずE0364になります。隠せるのは経路だけなので、通したい項目そのものには`pub`が必要です。

:::message{tip}
「クレートの中でだけ共有したい」という中間の指定もあります。`pub(crate) use crate::price::Receipt;`と書くと、同じクレートのどこからでも`crate::Receipt`と書けますが、クレートの外からは見えません。第13章で触れた`pub(crate)`と同じ考え方です。
:::
::::

## 03 - 外部パッケージを使う

[[external-package]]と[[use-declaration]]に関する問題です。
次のコードは`regex`という外部のクレートを使って、商品コードの形式を判定します。`Cargo.toml`側の準備は済んでいるものとして、コードに1行足して動くようにしてください。

```toml:Cargo.toml（準備済み）
[package]
name = "playground"
version = "0.1.0"
edition = "2024"

[dependencies]
regex = "1"
```

```txt:期待する出力
A-1234 は商品コードの形式か: true
12345 は商品コードの形式か: false
```

<!-- rustc: skip -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// ここに1行足せ（regexクレートのRegexを持ち込む）

fn main() {
    // 商品コード（英大文字1文字 + ハイフン + 数字4桁）の形式かどうかを判定する
    let code_pattern = Regex::new(r"^[A-Z]-[0-9]{4}$").unwrap();

    for code in ["A-1234", "12345"] {
        println!("{code} は商品コードの形式か: {}", code_pattern.is_match(code));
    }
}
```

::::details[解答例と解説]

<!-- rustc: skip -->
```rust playground
// ここに1行足せ（regexクレートのRegexを持ち込む）
use regex::Regex; // [!code ++]

fn main() {
    // 商品コード（英大文字1文字 + ハイフン + 数字4桁）の形式かどうかを判定する
    let code_pattern = Regex::new(r"^[A-Z]-[0-9]{4}$").unwrap();

    for code in ["A-1234", "12345"] {
        println!("{code} は商品コードの形式か: {}", code_pattern.is_match(code));
    }
}
```

自分で書いていない[[external-package]]を使う手順は2段階です。

| 手順 | 書く場所 | 書くこと |
| --- | --- | --- |
| 1. 依存の宣言 | `Cargo.toml`の`[dependencies]` | `regex = "1"` |
| 2. スコープへの持ち込み | `.rs`ファイル | `use regex::Regex;` |

1つ目はCargoへの指示です。これを見てCargoがcrates.ioからパッケージを取得し、コンパイルして、自分のクレートから使えるように渡してくれます。2つ目は第14章で学んだ`use`そのもので、外部のクレートだからといって特別な書き方はありません。

**なぜ2段階なのか**
2つは目的が別なので、忘れたときの症状も違います。

| 忘れたもの | どうなるか |
| --- | --- |
| `Cargo.toml`への追記 | `regex`というクレート名自体が解決できずコンパイルエラー |
| `use`宣言 | エラーにはならない。ただし毎回`regex::Regex::new(..)`とフルパスで書くことになる |

`use`は名前を短くするためのものなので、なくても書けます。実際、`use`を消して`let code_pattern = regex::Regex::new(..)`と書いても動きます。第14章の慣習どおり、構造体などの型は項目そのものまで持ち込むのが一般的なので、ここでは`use regex::Regex;`としました。

**バージョンの`"1"`の意味**
`regex = "1"`は「1.0.0以上2.0.0未満」という要件です。この範囲であれば互換性が保たれる約束（セマンティックバージョニング）になっているので、細かい版を指定せずに書くのが普通です。手で書く代わりに`cargo add regex`と実行すれば、Cargoが適切な行を追記してくれます。

**このコードが何をしているか**
`Regex::new(..)`は正規表現をコンパイルして`Result`を返します（第12章）。今回のパターンは文字列リテラルとして正しいことが分かっているので、`unwrap`で取り出しています。`r"..."`は生文字列リテラルで、`\`をエスケープせずに書ける記法です。正規表現そのものはRustの話ではないので、ここでは「外部のクレートを1つ使ってみる」という部分だけ押さえてください。

:::message[Playgroundでは追記なしで動きます]{warning}
Rust Playgroundには、ダウンロード数の多い主要なクレートがあらかじめ用意されています。そのため`Cargo.toml`を書かなくても`use regex::Regex;`だけで実行できます。上の`Cargo.toml`は、手元の環境で同じことをする場合に必要になるものです。

用意されているクレートの一覧は[Playgroundのクレート一覧](https://play.rust-lang.org/meta/crates)で確認できます。ここにないクレートはPlaygroundでは使えません。
:::
::::

## 04 - 標準ライブラリは宣言いらず

[[external-package]]と[[use-declaration]]に関する問題です。
次のコードはコンパイルエラー（E0433）になります。`Cargo.toml`には何も足さずに、コードだけを直して修正してください。

```txt:期待する出力
りんごの在庫: 3個
みかんの在庫: 12個
```

<!-- rustc: expect E0433 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    // 商品ごとの在庫数
    let mut stock = HashMap::new();
    stock.insert("りんご", 3);
    stock.insert("みかん", 12);

    println!("りんごの在庫: {}個", stock["りんご"]);
    println!("みかんの在庫: {}個", stock["みかん"]);
}
```

::::details[解答例と解説]
```rust playground
use std::collections::HashMap; // [!code ++]

fn main() {
    // 商品ごとの在庫数
    let mut stock = HashMap::new();
    stock.insert("りんご", 3);
    stock.insert("みかん", 12);

    println!("りんごの在庫: {}個", stock["りんご"]);
    println!("みかんの在庫: {}個", stock["みかん"]);
}
```

エラーは`use of undeclared type 'HashMap'`（E0433）です。`HashMap`は[[standard-library]]の`std::collections`にある型で、使うには`use std::collections::HashMap;`が要ります。

問題03の表と並べると、標準ライブラリの位置付けがはっきりします。

| | `Cargo.toml`への追記 | `use`宣言 |
| --- | --- | --- |
| 外部パッケージ（`regex`など） | 必要 | 必要（フルパスで書くなら省略可） |
| 標準ライブラリ（`std`） | **不要** | 必要（フルパスで書くなら省略可） |

`std`クレートは、特別な指定をしない限り常にコンパイラへ渡されます。そのため依存として宣言する必要がありません。ですが、渡されていることと、名前が短く書けることは別の話です。`std`の中にある項目を裸の名前で使いたければ、外部パッケージとまったく同じように`use`が要ります。

**`String`や`Vec`に`use`が要らない理由**
ここまで`String`も`Vec`も`use`なしで使ってきました。これらは**プレリュード**と呼ばれる、あらかじめ自動で取り込まれる項目群に入っているためです。`std`の中でも特によく使うものだけが選ばれていて、`HashMap`はそこに入っていません。

「`use`が要るかどうか」はプレリュードに入っているかどうかで決まる、と考えると混乱しません。

**エラーメッセージが答えを教えてくれる**
今回のエラーには、次のヒントが付いています。

```text
help: consider importing this struct
  |
1 + use std::collections::HashMap;
```

コンパイラが`HashMap`という名前を持つ項目を探し出して、必要な`use`の行をそのまま提示してくれます。「型名は分かるがどこにあるか分からない」というときは、とりあえず書いてコンパイルし、この助言を読むのが速い方法です。

:::message{tip}
`HashMap`は「キーと値の組」を保持する標準ライブラリのコレクションで、`stock["りんご"]`のようにキーで値を取り出せます。この問題の主題ではないので詳しくは扱いませんが、第6章のベクタと並んでよく使うコレクションです。
:::
::::


## 05 - 応用: ライブラリの公開APIを設計する

プロジェクト構成編（第13章〜第16章）の総復習です。
買い物カートのライブラリを4つのファイルに分けて実装し、テストに合格させてください。プロジェクトにはコメントだけを書いたファイルが用意してあります。`src/lib.rs`のテストコード以外は、すべて自分で書きます。

**ファイル構成**

```text
src/
├── lib.rs      … 公開APIの整備（テストは記述済み）
├── cart.rs     … Cartの実装
├── price.rs    … 送料の計算
└── price/
    └── tax.rs  … 消費税の計算
```

**クレートの外から使える公開API**

| パス | 内容 |
| --- | --- |
| `playground::Cart` | 買い物カートの型 |
| `playground::with_tax` | 税込価格を返す関数 |

内部のモジュール（`cart`・`price`・`price::tax`）は、クレートの外からは見えないようにしてください。

**`Cart`（`src/cart.rs`）**

| 名前 | 種類 | 内容 |
| --- | --- | --- |
| `Item` | 構造体 | `name`（`String`）・`price`（`u32`）。ライブラリの外には見せない |
| `Cart` | 構造体 | `items`（`Vec<Item>`）。フィールドは非公開のままにする |
| `new()` | 関連関数 | 空のカートを作って返す |
| `add(name, price)` | メソッド | 商品を1つ追加する |
| `count()` | メソッド | 入っている商品数を`usize`で返す |
| `find_price(name)` | メソッド | 価格を`Option<u32>`で返す。なければ`None` |
| `total()` | メソッド | 小計に消費税、そのあと送料を足した支払い金額を返す |

**価格の計算（`src/price.rs`・`src/price/tax.rs`）**

| 名前 | 置き場所 | 内容 |
| --- | --- | --- |
| `with_tax(price)` | `price::tax` | 消費税10%を足した金額（端数切り捨て） |
| `with_shipping(price)` | `price` | 3000円未満なら送料500円を足す。3000円以上はそのまま |

:::message{warning}
このプロジェクトには`main`関数がありません。Playgroundを開いたら、RUNではなく**TEST**を押して実行してください。
:::

:::project[「Playgroundで開く」をクリックしてTESTを実行してください]

<!-- rustc: skip -->
```rust:src/lib.rs
// 内部のモジュールを読み込め（クレートの外へは見せないこと）


// 公開APIを整えよ（Cartとwith_taxをクレートルートから使えるようにする）


#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Cart {
        let mut cart = Cart::new();
        cart.add("コーヒー豆", 1200);
        cart.add("マグカップ", 800);
        cart
    }

    #[test]
    fn test_count() {
        let cart = sample();
        assert_eq!(cart.count(), 2);
    }

    #[test]
    fn test_find_price() {
        let cart = sample();
        assert_eq!(cart.find_price("コーヒー豆"), Some(1200));
        assert_eq!(cart.find_price("ビール"), None);
    }

    #[test]
    fn test_with_tax() {
        assert_eq!(with_tax(1000), 1100);
        assert_eq!(with_tax(105), 115);
    }

    #[test]
    fn test_total_with_shipping() {
        // 小計2000円 → 税込2200円 → 3000円未満なので送料500円
        assert_eq!(sample().total(), 2700);
    }

    #[test]
    fn test_total_free_shipping() {
        let mut cart = sample();
        cart.add("電気ケトル", 5000);
        // 小計7000円 → 税込7700円 → 3000円以上なので送料無料
        assert_eq!(cart.total(), 7700);
    }
}
```

<!-- rustc: skip -->
```rust:src/cart.rs
// 商品を表す構造体Itemを定義せよ（name: String / price: u32）


// 買い物カートを表す構造体Cartを定義せよ（items: Vec<Item>）


// Cartのimplブロックにnew・add・count・find_price・totalを定義せよ
// totalはpriceモジュールの関数を使い、消費税 → 送料の順に足すこと

```

<!-- rustc: skip -->
```rust:src/price.rs
// taxの中身を src/price/tax.rs から読み込め


// 送料の計算に使う定数を定義せよ（このモジュールの中だけで使う）
//   送料が無料になる金額: 3000
//   送料: 500


// 税込価格を受け取り、3000円未満なら送料を足して返す関数with_shippingを定義せよ

```

<!-- rustc: skip -->
```rust:src/price/tax.rs
// 消費税率の定数TAX_RATEを定義せよ（10）


// 価格を受け取り、消費税を足した金額（端数切り捨て）を返す関数with_taxを定義せよ

```

:::

::::details[解答例と解説]

:::project[解答例]

<!-- rustc: skip -->
```rust:src/lib.rs
// 内部のモジュールを読み込め（クレートの外へは見せないこと）
mod cart; // [!code ++]
mod price; // [!code ++]

// 公開APIを整えよ（Cartとwith_taxをクレートルートから使えるようにする）
pub use crate::cart::Cart; // [!code ++]
pub use crate::price::tax::with_tax; // [!code ++]

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Cart {
        let mut cart = Cart::new();
        cart.add("コーヒー豆", 1200);
        cart.add("マグカップ", 800);
        cart
    }

    #[test]
    fn test_count() {
        let cart = sample();
        assert_eq!(cart.count(), 2);
    }

    #[test]
    fn test_find_price() {
        let cart = sample();
        assert_eq!(cart.find_price("コーヒー豆"), Some(1200));
        assert_eq!(cart.find_price("ビール"), None);
    }

    #[test]
    fn test_with_tax() {
        assert_eq!(with_tax(1000), 1100);
        assert_eq!(with_tax(105), 115);
    }

    #[test]
    fn test_total_with_shipping() {
        // 小計2000円 → 税込2200円 → 3000円未満なので送料500円
        assert_eq!(sample().total(), 2700);
    }

    #[test]
    fn test_total_free_shipping() {
        let mut cart = sample();
        cart.add("電気ケトル", 5000);
        // 小計7000円 → 税込7700円 → 3000円以上なので送料無料
        assert_eq!(cart.total(), 7700);
    }
}
```

<!-- rustc: skip -->
```rust:src/cart.rs
// 商品を表す構造体Itemを定義せよ（name: String / price: u32）
struct Item { // [!code ++]
    name: String, // [!code ++]
    price: u32, // [!code ++]
} // [!code ++]

// 買い物カートを表す構造体Cartを定義せよ（items: Vec<Item>）
pub struct Cart { // [!code ++]
    items: Vec<Item>, // [!code ++]
} // [!code ++]

// Cartのimplブロックにnew・add・count・find_price・totalを定義せよ
// totalはpriceモジュールの関数を使い、消費税 → 送料の順に足すこと
impl Cart { // [!code ++]
    pub fn new() -> Self { // [!code ++]
        Cart { items: Vec::new() } // [!code ++]
    } // [!code ++]

    pub fn add(&mut self, name: &str, price: u32) { // [!code ++]
        self.items.push(Item { // [!code ++]
            name: String::from(name), // [!code ++]
            price, // [!code ++]
        }); // [!code ++]
    } // [!code ++]

    pub fn count(&self) -> usize { // [!code ++]
        self.items.len() // [!code ++]
    } // [!code ++]

    pub fn find_price(&self, name: &str) -> Option<u32> { // [!code ++]
        for item in &self.items { // [!code ++]
            if item.name == name { // [!code ++]
                return Some(item.price); // [!code ++]
            } // [!code ++]
        } // [!code ++]

        None // [!code ++]
    } // [!code ++]

    pub fn total(&self) -> u32 { // [!code ++]
        let mut subtotal = 0; // [!code ++]
        for item in &self.items { // [!code ++]
            subtotal += item.price; // [!code ++]
        } // [!code ++]

        let taxed = crate::price::tax::with_tax(subtotal); // [!code ++]
        crate::price::with_shipping(taxed) // [!code ++]
    } // [!code ++]
} // [!code ++]
```

<!-- rustc: skip -->
```rust:src/price.rs
// taxの中身を src/price/tax.rs から読み込め
pub mod tax; // [!code ++]

// 送料の計算に使う定数を定義せよ（このモジュールの中だけで使う）
//   送料が無料になる金額: 3000
//   送料: 500
const FREE_SHIPPING_LINE: u32 = 3000; // [!code ++]
const SHIPPING_FEE: u32 = 500; // [!code ++]

// 税込価格を受け取り、3000円未満なら送料を足して返す関数with_shippingを定義せよ
pub fn with_shipping(price: u32) -> u32 { // [!code ++]
    if price >= FREE_SHIPPING_LINE { // [!code ++]
        price // [!code ++]
    } else { // [!code ++]
        price + SHIPPING_FEE // [!code ++]
    } // [!code ++]
} // [!code ++]
```

<!-- rustc: skip -->
```rust:src/price/tax.rs
// 消費税率の定数TAX_RATEを定義せよ（10）
const TAX_RATE: u32 = 10; // [!code ++]

// 価格を受け取り、消費税を足した金額（端数切り捨て）を返す関数with_taxを定義せよ
pub fn with_tax(price: u32) -> u32 { // [!code ++]
    price * (100 + TAX_RATE) / 100 // [!code ++]
} // [!code ++]
```

:::

プロジェクト構成編で学んだものが、ほぼすべて登場しました。

| 章 | この問題で使ったところ |
| --- | --- |
| 第9章・第10章 | `Item`・`Cart`の定義、`new`という関連関数、`&self` / `&mut self`のメソッド |
| 第12章 | `find_price`が返す`Option<u32>` |
| 第13章 | 型・メソッド・モジュールへの`pub`の付け方 |
| 第14章 | `crate::price::tax::with_tax(..)`というパス、`use super::*` |
| 第15章 | `mod cart;`によるファイル分割、`price.rs`と`price/tax.rs`の2段構成 |
| 第16章 | `pub use`による公開APIの整備 |

出来上がったモジュールツリーは次の形です。

```text
crate（ライブラリ）
├── cart              // 非公開
│   ├── Item          // 非公開
│   └── Cart          // pub
├── price             // 非公開
│   ├── FREE_SHIPPING_LINE / SHIPPING_FEE  // 非公開
│   ├── with_shipping // pub
│   └── tax           // pub
│       ├── TAX_RATE  // 非公開
│       └── with_tax  // pub
├── Cart              // pub use
├── with_tax          // pub use
└── tests             // use super::* でクレートルートの名前を拾う
```

**`pub`は1段ずつ、必要なところにだけ**
この問題でいちばん間違えやすいのが`pub`の付け方です。`pub`は1段しか開かないので、外から使われる経路上のものには1つずつ付ける必要があります。

| 対象 | `pub` | 理由 |
| --- | --- | --- |
| `mod cart;` / `mod price;` | 不要 | 外へは`pub use`で通すので、モジュール自体は隠す |
| `pub mod tax;` | **必要** | `pub use crate::price::tax::with_tax;`が`tax`を通る |
| `struct Item` | 不要 | 外にも他のモジュールにも出さない |
| `pub struct Cart` | **必要** | 公開APIの型 |
| `Cart`の`items` | 不要 | フィールドは非公開のまま。個数は`count()`で見せる |
| `Cart`の各メソッド | **必要** | 型を公開しても、メソッドは1つずつ`pub`が要る |
| `pub fn with_shipping` | **必要** | 兄弟モジュールの`cart`から呼ぶ |
| 定数（`TAX_RATE`など） | 不要 | 同じモジュールの中だけで使う |

メソッドの`pub`は特に忘れがちです。`pub struct Cart`と書いてもメソッドは非公開のままなので、テストから呼ぶとE0624（`method 'add' is private`）になります。第13章の問題04で見た「構造体を公開してもフィールドは非公開」と同じ、1段ずつの原則です。

**`Item`と定数を非公開にできる理由**
`Item`は`cart`の中だけで使い、`FREE_SHIPPING_LINE`は`price`の中だけで使うので、どちらも`pub`が要りません。非公開のままにできたものが多いほど、あとから自由に変えられる部分が多いということです。たとえば`Item`にフィールドを1つ足しても、このライブラリを使う人には何の影響もありません。

**`with_shipping`にだけ`pub`が要る理由**
同じ「内部で使うだけの関数」でも、`with_shipping`には`pub`が必要でした。呼び出し元の`cart`が`price`の**子孫ではない**からです。第13章の問題06で確かめたとおり、非公開の項目が見えるのは、それを定義したモジュールとその子孫だけです。`cart`と`price`は兄弟なので、この関係にあてはまりません。

外に出したくないが同じクレートの中からは呼びたい、という意図をより正確に書くなら`pub(crate) fn with_shipping`とします。今回は`price`自体が非公開なので、`pub`でもクレートの外には漏れません。

**パスの書き方**
`total`の中では`crate::price::tax::with_tax(..)`と絶対パスで書きました。第14章の問題01のとおり、絶対パスは書いている場所に依存しないので、既定の選択として無難です。`use`で短くするなら次のように書けます。

<!-- rustc: skip -->
```rust:useを使う場合のsrc/cart.rs
use crate::price::{self, tax};

// ...

    pub fn total(&self) -> u32 {
        let mut subtotal = 0;
        for item in &self.items {
            subtotal += item.price;
        }

        price::with_shipping(tax::with_tax(subtotal))
    }
```

`use crate::price::{self, tax};`は、第14章の問題03の表で挙げた波括弧の書き方です。`self`が`price`自身、`tax`がその子を指すので、1行で両方を持ち込めます。

**テストが見ているもの**
`mod tests`の中の`use super::*;`が拾うのは、親であるクレートルートの名前です。`cart`や`price`の中身を直接見ているわけではありません。`pub use`を2行書いてはじめて、クレートルートに`Cart`と`with_tax`という名前ができ、テストがそれを使えるようになります。

裏を返せば、このテストは**公開APIをそのまま使う形**になっています。使う人が書くのと同じコードでテストしているので、公開APIの使い勝手もここで確かめられます。

**テストでは守れない設計もある**
`mod cart;`を`pub mod cart;`に変えても、テストは全部通ります。内部を隠せているかどうかは、テストでは検出できません。同じように、`Item`に`pub`を付けても、`with_shipping`を`pub`のまま外に見せてもテストは通ります。

だからこそ、公開APIの形は自分で意識して決める必要があります。判断の基準はいつも同じで、「これは外との約束にしてよいか」です。約束にしたものは、あとから変えると使う側が壊れます。迷ったら隠しておき、必要になってから`pub use`で通すほうが安全です。

:::message{tip}
これで第16章、そしてプロジェクト構成編（第13章〜第16章）は終わりです。`pub use`で公開APIの形を整える方法と、外部パッケージを取り込む手順まで押さえました。ここまでくれば、複数のファイルとクレートで構成された、実際のRustプロジェクトの形を読み書きできます。

第1章の`println!`から始めて、変数・制御フロー・関数・所有権・借用・構造体・列挙型・`Option`と`Result`・モジュールとクレートまで、Rustの土台になる部分を一通り歩いてきました。おつかれさまでした。

続きの章は順次追加していきます。Rustにはこの先も、トレイト・ジェネリクス・ライフタイム注釈・クロージャとイテレータといった重要な話題があります。どれもここまでの知識の上に積み上がるものなので、進み方は変わりません。次の章が追加されるまでの間は、解いた問題を自分なりに書き換えて試してみたり、このサイトの辞書を読み進めたりしてみてください。
:::
::::
