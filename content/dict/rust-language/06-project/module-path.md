---
title: パス（Path）
description: モジュールツリー上の項目を`::`区切りでたどって参照する書き方。クレートルートを起点とする絶対パスと、現在のモジュールを起点とする相対パスの2種類。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

パスは、`::`で区切ったセグメントを1つ以上並べて、項目・値・型・マクロ・属性を参照する書き方です[^1]。[[module]]ツリーのどこに置かれた項目でも、名前をたどるパスを書けば参照できます。

パスは起点の違いで2種類に分かれます。[[crate]]ルートから始める**絶対パス**と、現在のモジュールから始める**相対パス**です[^2]。同じ項目を、どちらの書き方でも参照できます。

```rust playground
mod shop {
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            prices.iter().sum()
        }
    }

    pub mod checkout {
        pub fn pay(prices: &[u32]) {
            // 絶対パス: クレートルートを起点にたどる
            let absolute = crate::shop::cart::total(prices);
            // 相対パス: 親モジュール shop を起点にたどる
            let relative = super::cart::total(prices);

            assert_eq!(absolute, relative); // 同じ関数を指すので結果も同じ
            println!("お支払い金額: {}円", absolute);
        }
    }
}

fn main() {
    // 相対パス: クレートルートにいるので shop から書き始める
    shop::checkout::pay(&[980, 1250]);
}
```

| 種類     | 起点             | 先頭に書くもの                                                     |
| -------- | ---------------- | ------------------------------------------------------------------ |
| 絶対パス | クレートのルート | 自クレートは`crate`、外部クレートはクレート名（`std::io::Write`）   |
| 相対パス | 現在のモジュール | `self`、`super`、現在のモジュール内の名前                          |

:::message{warning}
パスを書けることと、その項目にアクセスできることは別です。可視性はパスのセグメントごとに確認され、途中のモジュールと最後の項目のすべてが呼び出し側から見えている必要があります[^3]。公開するには[[pub]]を1つずつ付けます。
:::

## どちらを使うべきか

The Rust Programming Languageは、一般に**絶対パスを選ぶこと**を勧めています[^2]。項目の定義とその呼び出し側は、互いに独立して動かすことのほうが多いからです[^2]。コードを別のモジュールへ移したときに、どちらが壊れるかは次のように分かれます。

| コードの動かし方                         | 絶対パス       | 相対パス       |
| ---------------------------------------- | -------------- | -------------- |
| 呼び出し側だけを別のモジュールへ移す     | そのまま使える | 書き直しが必要 |
| 定義と呼び出し側をまとめて別の場所へ移す | 書き直しが必要 | そのまま使える |

つまり「定義と呼び出しが必ず一緒に動く」と分かっているまとまりでのみ相対パスが有利で、それ以外は絶対パスのほうが移動に強い、という判断になります。前者の典型例が、対象と同じファイルに置かれて必ず一緒に動く`#[cfg(test)]`付きのテストモジュールで、親モジュールを指す[[super]]を使って`use super::*;`と書き、親の項目を取り込むのが定番です[^4]。<!-- TODO: [[use-declaration]] 作成後にリンク -->

## 補足

:::details[関連概念: Referenceの「正規パス」]
The Rust Referenceのパスの章に「絶対パス」という分類はなく、代わりに項目が**定義された場所**に対応するパスを正規パス（canonical path）と呼び、同じ項目を指す他のパスはすべてその別名（alias）だとしています[^1]。

正規パスは起点ではなく定義場所で決まるため、絶対パスと同義ではありません。たとえば`pub use`で再エクスポートした項目を`crate::`から指すパスは、絶対パスではありますが正規パスではなく別名のほうにあたります。<!-- TODO: [[re-export]] 作成後にリンク -->

なお正規パスが意味を持つのは1つのクレートの中だけで、クレートをまたぐグローバルな名前空間は存在しません[^1]。
:::

:::details[`::`で始まるパス]
先頭を`::`にしたパスは**グローバルパス**と呼ばれ、解決の起点がエディションによって変わります。2018エディション以降は外部プレリュード（extern prelude）から解決されるため、`::`の直後にはクレート名が来ます（例: `::std::time::Instant::now()`）。2015エディションではクレートルート、つまり2018エディション以降の`crate::`にあたる場所から解決されていました[^1]。
:::

[^1]: [Paths — The Rust Reference](https://doc.rust-lang.org/reference/paths.html)

[^2]: [Paths for Referring to an Item in the Module Tree — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html)

[^3]: [Visibility and Privacy — The Rust Reference](https://doc.rust-lang.org/reference/visibility-and-privacy.html)

[^4]: [Test Organization — The Rust Programming Language](https://doc.rust-lang.org/book/ch11-03-test-organization.html)
