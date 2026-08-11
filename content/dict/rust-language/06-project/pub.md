---
title: pub
description: 項目やフィールドを定義したモジュールの外へ公開するキーワード。既定はすべて非公開で、公開したいものだけを1つずつ指定する足し算方式。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

`pub`は、項目（item）や構造体のフィールドを、定義した[[module]]の外からも使えるようにするキーワードです。Rustでは既定ですべてが非公開で、非公開のものにアクセスできるのは定義したモジュールとその子孫だけです[^1]。

`pub`が開けるのは常に1段だけです。モジュールを`pub`にしても中の項目は非公開のままで、[[struct]]を`pub`にしてもフィールドは非公開のままなので、公開したいものに1つずつ付けていきます。例外は[[enum]]で、`pub`を付けるとバリアントもすべて公開されます[^2]。

```rust playground
mod shop {
    // モジュールを`pub`にしても、中身は別途`pub`を付けないと公開されない
    pub mod cart {
        // 構造体は`pub`でもフィールドは非公開のまま。公開したいものだけ指定する
        pub struct Receipt {
            pub total: u32, // 外から読める
            issuer: String, // 非公開のまま
        }

        // 列挙型は`pub`を付けるとバリアントもすべて公開される
        pub enum Payment {
            Cash,
            Card,
        }

        impl Receipt {
            // 非公開のフィールドは、公開したメソッド経由でだけ外に見せられる
            pub fn issuer(&self) -> &str {
                &self.issuer
            }
        }

        pub fn checkout(prices: &[u32], payment: Payment) -> Receipt {
            let issuer = match payment {
                Payment::Cash => "レジ",
                Payment::Card => "カード端末",
            };
            Receipt {
                total: prices.iter().sum(),
                issuer: issuer.to_string(),
            }
        }
    }
}

fn main() {
    let card = shop::cart::checkout(&[980, 1250], shop::cart::Payment::Card);
    let cash = shop::cart::checkout(&[300], shop::cart::Payment::Cash);
    println!("{}円（発行: {}）", card.total, card.issuer());
    println!("{}円（発行: {}）", cash.total, cash.issuer());
}
```

## 対象ごとの既定

| `pub`を付ける対象 | 公開されるもの   | 中身の既定                       |
| ----------------- | ---------------- | -------------------------------- |
| モジュール        | モジュールの名前 | 中の項目は非公開（1つずつ`pub`） |
| 構造体            | 型そのもの       | フィールドは非公開               |
| 列挙型            | 型そのもの       | バリアントはすべて公開           |
| トレイト          | トレイトそのもの | 関連項目はすべて公開             |

公開が中身まで伝わるのは下2つ、つまり`pub`なトレイトの関連項目と`pub`な列挙型のバリアントだけです[^1]。<!-- TODO: [[trait]] 作成後にリンク -->

外から使えるかどうかは[[module-path]]のセグメントごとに確認されるため、途中のモジュールを公開しても、最後の[[function]]に`pub`を付け忘れればアクセスできません。

## 補足

:::details[pubの付け忘れはE0603になる]
モジュールだけを公開して中の項目に`pub`を付け忘れると、パスは書けてもアクセスできずコンパイルエラーになります。

<!-- rustc: expect E0603 -->
```rust
mod shop {
    pub mod cart {
        // `pub`を付け忘れた
        fn total(prices: &[u32]) -> u32 {
            prices.iter().sum()
        }
    }
}

fn main() {
    // エラー: E0603（cartは公開だが、totalは非公開）
    println!("合計: {}円", shop::cart::total(&[980, 1250]));
}
```
:::

:::details[公開範囲を絞る pub(crate) と pub(super)]
`pub`のあとに丸括弧で範囲を書くと、「どこまでに見せるか」を絞れます[^1]。

| 書き方                | 見せる範囲                        |
| --------------------- | --------------------------------- |
| `pub`                 | 制限なし（外部クレートからも）    |
| `pub(crate)`          | 同じ[[crate]]の中                 |
| `pub(super)`          | 親モジュール（`pub(in super)`と同じ） |
| `pub(self)`           | 現在のモジュール（`pub`なしと同じ） |
| `pub(in crate::shop)` | 指定した祖先モジュール            |

指定できるのはその項目の祖先モジュールだけで、無関係なモジュールにだけ見せることはできません。パスは`crate`・`self`・`super`のいずれかで始める必要があります（2018エディション以降）[^1]。

またこれらは「最大でここまで」という上限の指定にすぎず、実際に見えるかどうかは祖先モジュール側の可視性にも左右されます[^1]。非公開モジュールの中の`pub(crate)`な項目は、クレート内からでも届きません。

なお`pub(super)`の`super`は可視性の指定であり、パスの先頭に書く[[super]]とは文法上の位置が異なります。
:::

:::details[列挙型のバリアントだけ既定で公開される理由]
The Rust Programming Languageは、列挙型は「バリアントが公開されていなければあまり役に立たない」ため、毎回すべてのバリアントに`pub`を書かせるのは煩わしく、既定を公開にしたと説明しています[^2]。

逆に構造体は、フィールドを隠したまま使えることに意味があります。上のコード例の`Receipt`のように非公開フィールドを持つ構造体は、外から`Receipt { .. }`と書いて作れないため、公開した[[associated-function]]や[[method]]を入口にする設計になります[^2]。
:::

:::details[公開APIの形は内部構造と切り離せる]
`pub use`で項目を再エクスポートすると、内部のモジュール構造をそのまま外に見せずに済みます。非公開の項目を再エクスポートした場合は、通常の階層をたどる代わりに、その再エクスポートを経由して「プライバシーの連鎖が短絡される」と考えられます[^1]。<!-- TODO: [[re-export]] 作成後にリンク -->
:::

[^1]: [Visibility and Privacy — The Rust Reference](https://doc.rust-lang.org/reference/visibility-and-privacy.html)

[^2]: [Exposing Paths with the `pub` Keyword / Making Structs and Enums Public — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html)
