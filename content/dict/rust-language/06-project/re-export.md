---
title: 再エクスポート
description: 項目を`pub use`で別の場所から公開し直し、そこで定義されたかのように使わせる仕組み。内部のモジュール構造と公開APIの形を切り離す手段。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

再エクスポートは、[[use-declaration]]に[[pub]]を付けて`pub use`と書き、持ち込んだ名前をそのモジュールの外へも公開することです[^1]。ある場所にある公開された項目を別の場所で公開し直し、**あたかもそちらで定義されたかのように**使わせられます[^2]。

これにより、内部の[[module]]構造と、外から見える公開APIの形を切り離せます。使う側は深い階層を[[module-path]]でたどらずに済み、作る側は内部の階層をあとから組み替えられます[^2]。

:::project[入口をまとめたライブラリ]

```rust:src/price.rs
/// カートに入れた商品の価格（`lib.rs`から再エクスポートするので`pub`にする）
pub struct Cart {
    prices: Vec<u32>,
}

impl Cart {
    pub fn new(prices: Vec<u32>) -> Self {
        Cart { prices }
    }

    /// 送料込みの合計金額（3000円以上は送料無料）
    pub fn total(&self) -> u32 {
        let subtotal: u32 = self.prices.iter().sum();
        if subtotal >= 3000 { subtotal } else { subtotal + 500 }
    }
}
```

<!-- rustc: skip -->
```rust:src/lib.rs
// `pub`を付けないので、`price`モジュール自体は外から見えない
mod price;

// 使ってほしいものだけをクレートルートで公開する
pub use crate::price::Cart;
```

<!-- rustc: skip -->
```rust:src/main.rs
// 内部の`price`は隠れたまま、`Cart`だけが短いパスで使える
use playground::Cart; // ライブラリのクレート名（Playgroundでは playground 固定）

fn main() {
    let cart = Cart::new(vec![1200, 800]);
    println!("お支払い金額: {}円", cart.total()); // 2500円
}
```

:::

## 内部構造と公開APIを分ける

`mod price;`には`pub`が付いていないため、`price`モジュールは[[crate]]の外から見えません。<!-- TODO: [[module-file-split]] 作成後にリンク -->それでも外から`playground::Cart`と書けるのは、`Cart`への経路が再エクスポートによって開かれるからです。The Rust Referenceはこれを、通常のように名前空間の階層をたどる代わりに「プライバシーの連鎖が再エクスポートを通じて短絡される」と表現しています[^3]。

使う側が書くパスは次のように変わります。

| 公開のしかた       | 使う側が書くパス               | `price`モジュール         |
| ------------------ | ------------------------------ | ------------------------- |
| 再エクスポートなし | `use playground::price::Cart;` | `pub mod`にする必要がある |
| 再エクスポートあり | `use playground::Cart;`        | 非公開のまま隠せる        |

公開APIが内部構造から切り離されるため、あとで`price`を分割・改名しても、直すのはクレートの中だけで済み、使う側のコードには影響しません。

## 使いどころ

クレートを使う人は作者ほど内部の構造に詳しくないので、公開APIの形は公開時の重要な検討事項になります[^2]。

| 場面                                   | ねらい                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| 深い階層にある型や[[function]]を集める | 使う側が`use my_crate::UsefulType;`と短く書ける。`cargo doc`のトップページにも載る[^2]        |
| 実装用のモジュールを非公開のまま隠す   | 公開したい項目だけを通し、内部はあとから自由に変更できる[^3]                                 |
| プレリュードを用意する                 | まとめて取り込ませたいAPI群を1つのモジュールに集め、`use my_crate::prelude::*;`で使わせる[^4] |

## 補足

:::details[再エクスポートできるのは`pub`な項目だけ]
`pub use`で公開し直せるのは、それ自体に`pub`が付いた項目だけです。隠せるのは**経路**であって項目そのものではないため、非公開モジュールの中の`pub`な項目は再エクスポートできますが、`pub`の付いていない項目は同じモジュールからでも再エクスポートできずE0364になります。

<!-- rustc: expect E0364 -->
```rust
mod shop {
    // `pub`が付いていない＝非公開の関数
    fn subtotal(prices: &[u32]) -> u32 {
        prices.iter().sum()
    }

    // エラー: E0364（`pub`でない項目は再エクスポートできない）
    pub use self::subtotal as sum;
}

fn main() {}
```
:::

:::details[再エクスポートで作った名前は正規パスではない]
項目の**正規パス**はそれが定義された場所で決まり、同じ項目を指す他のパスはすべて別名として扱われます[^5]。上のライブラリでいえば、`Cart`の正規パスは`crate::price::Cart`のままで、`pub use`で作った`playground::Cart`はそこへの別名です（[[module-path]]も参照）。
:::

:::details[公開範囲を絞る・まとめて再エクスポートする]
`pub use`のほかに、公開範囲の指定やglob演算子と組み合わせた書き方もあります。

| 書き方                                | 意味                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `pub use crate::price::Cart;`         | 制限なしで再エクスポート（外部クレートからも使える）   |
| `pub(crate) use crate::price::Cart;`  | 同じクレートの中だけに見せる（内部向けの共通の入口）   |
| `pub use crate::price::*;`            | `price`の中の持ち込める項目をまとめて再エクスポート    |

再エクスポートは公開する名前を別の定義へ**リダイレクト**する働きを持つため、リダイレクトが循環したり一意に解決できなかったりする場合はコンパイルエラーになります[^1]。
:::

[^1]: [Use declarations — The Rust Reference](https://doc.rust-lang.org/reference/items/use-declarations.html)

[^2]: [Exporting a Convenient Public API with `pub use` — The Rust Programming Language](https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html)

[^3]: [Visibility and Privacy — The Rust Reference](https://doc.rust-lang.org/reference/visibility-and-privacy.html)

[^4]: [Bringing Paths into Scope with the `use` Keyword — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html)

[^5]: [Paths — The Rust Reference](https://doc.rust-lang.org/reference/paths.html)
