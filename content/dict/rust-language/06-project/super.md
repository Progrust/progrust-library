---
title: super
description: パスの先頭に書いて親モジュールを起点にするキーワード。ファイルシステムの`..`に相当。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

`super`は、パスの先頭に置いて**親モジュール**を起点にするキーワードです[^1]。ファイルシステムのパスを`..`で始めて1つ上のディレクトリへ上がるのと同じ感覚で、[[module]]ツリーを1段上に登ってから、目的の[[function]]や型をたどります[^2]。

`super`を書けるのはパスの先頭部分だけです（先頭に`self`を置いた直後も可）。`super::super::`のように連ねれば、さらに上の祖先モジュールも指せます[^1]。

```rust playground
fn log(message: &str) {
    println!("[ログ] {}", message);
}

mod shop {
    const TAX_RATE: u32 = 10;

    fn with_tax(price: u32) -> u32 {
        price * (100 + TAX_RATE) / 100
    }

    pub mod cart {
        pub fn checkout(prices: &[u32]) -> u32 {
            let subtotal: u32 = prices.iter().sum();
            let total = super::with_tax(subtotal); // 1段上（shop）をたどる
            super::super::log("会計しました"); // 2段上（クレートルート）をたどる
            total
        }
    }
}

fn main() {
    println!("お支払い金額: {}円", shop::cart::checkout(&[980, 1250]));
}
```

```text
crate          // super::super の指す先
└── shop       // super の指す先
    └── cart   // checkout はここにいる
```

## パスの先頭に書けるキーワード

`super`は、[[module-path]]の先頭に書けるキーワードの1つです。[[crate]]のルートを起点にする`crate`との違いは次のとおりです。

| 先頭に書く語 | 起点             | ファイルシステムでの例え |
| ------------ | ---------------- | ------------------------ |
| `crate`      | クレートのルート | `/`                      |
| `self`       | 現在のモジュール | `./`                     |
| `super`      | 親モジュール     | `../`                    |

## 使いどころ

`super`が向くのは、**親モジュールと一緒に移動する可能性が高い**コードです。定義と呼び出しの位置関係が変わらないなら、そのまとまりごと別の場所へ移してもパスを書き直さずに済みます[^2]。

その典型が、テスト対象と同じファイルに置く`#[cfg(test)]`付きのテストモジュールです。`use super::*;`と書けば、親モジュール（慣例どおりファイル直下に置いたなら、そのファイルのトップレベル）の項目を、非公開のものまでまとめて取り込めます[^3]。<!-- TODO: [[use-declaration]] 作成後にリンク -->

```rust playground
fn with_tax(price: u32) -> u32 {
    price * 110 / 100
}

#[cfg(test)]
mod tests {
    use super::*; // 親モジュールの項目をまとめて取り込む

    #[test]
    fn tax_is_added() {
        assert_eq!(with_tax(1000), 1100); // 非公開のwith_taxも呼べる
    }
}

fn main() {
    println!("税込: {}円", with_tax(1000));
}
```

## 補足

:::details[クレートルートより上へは登れない]
クレートルートのモジュールには親がないため、そこで`super`を書くとコンパイルエラーになります。`super::super::`を重ねすぎて祖先を通り越した場合も同じです（Rust 1.93で確認）。

<!-- rustc: expect E0433 -->
```rust
mod shop {
    pub fn checkout() {}
}

fn main() {
    // エラー: E0433（先頭の`super`が多すぎる）
    super::shop::checkout();
}
```
:::

:::details[use宣言で使う場合]
`use`宣言の先頭にも`super`を書けます（`use super::with_tax;`）。親モジュールそのものを取り込むときは`as`で別名を付ける必要があり、`use super as parent;`は書けますが`use super;`は書けません[^5]。ただし別名付きで取り込めるようになったのはRust 1.95からで、1.94以前は`use super as parent;`もE0432になります[^6]。

2015エディションでは`use`のパスがクレートルート起点だったため、親モジュールの項目を取り込むにも`super::`を明示する必要がありました。2018エディション以降は現在のスコープからの相対解決になっています[^5]。<!-- TODO: [[scope]] 作成後にリンク -->
:::

:::details[可視性を指定する pub(super)]
`super`という語は、可視性の指定にも現れます。`pub(super)`は項目を親モジュールにだけ見せる指定で、`pub(in super)`と同じ意味です[^4]。パスの先頭に書く`super`とは文法上の位置が異なるため、混同しないよう注意してください。<!-- TODO: [[pub]] 作成後にリンク -->
:::

[^1]: [Paths — The Rust Reference](https://doc.rust-lang.org/reference/paths.html)

[^2]: [Starting Relative Paths with `super` — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html)

[^3]: [Test Organization — The Rust Programming Language](https://doc.rust-lang.org/book/ch11-03-test-organization.html)

[^4]: [Visibility and Privacy — The Rust Reference](https://doc.rust-lang.org/reference/visibility-and-privacy.html)

[^5]: [Use declarations — The Rust Reference](https://doc.rust-lang.org/reference/items/use-declarations.html)

[^6]: [Support importing path-segment keyword with renaming — rust-lang/rust #146972](https://github.com/rust-lang/rust/pull/146972)（Rust 1.95.0で導入）
