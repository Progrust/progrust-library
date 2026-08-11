---
title: モジュール
description: 関連するコードを`mod`キーワードでまとめた入れ物。クレート内でツリーを構成し、コードの整理とプライバシー境界という2つの役割を担う単位。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成"]
public: true
---

モジュールは、`mod`キーワードで定義する、項目（item）を0個以上入れられる入れ物です[^1]。関連する[[function]]や[[struct]]をひとまとめにして名前を付けられるため、読み手は定義を全部読まなくてもグループ単位で目的のコードを探せます[^2]。

モジュールが担うのは**コードの整理**と**プライバシー境界**の2つの役割です。Rustでは項目はデフォルトで非公開で、モジュールの中身は親モジュールからは見えません[^2][^3]。`mod`の`{}`は名前空間の区切りであると同時に、外から触れる範囲を決める壁でもあります。

```rust playground
mod shop {
    // 非公開のまま。shop自身とその子孫からは使えるが、外からは見えない
    const TAX_RATE: u32 = 10;

    // モジュールはネストできる
    pub mod cart {
        pub fn total(prices: &[u32]) -> u32 {
            let subtotal: u32 = prices.iter().sum();
            subtotal * (100 + crate::shop::TAX_RATE) / 100
        }
    }
}

fn main() {
    // モジュール名を `::` でたどって呼び出す
    println!("税込合計: {}円", shop::cart::total(&[980, 1250]));
}
```

上のコードのように`{}`で中身をその場に書くモジュールを**インラインモジュール**と呼びます。`mod cart;`とセミコロンで終えれば、本体は外部ファイルから読み込まれます[^1]。

## モジュールツリー

モジュールは任意の深さにネストでき[^1]、[[crate]]の中身はクレートルートを頂点とするツリーになります[^2]。上のコードのツリーは次の形です。

```text
crate
└── shop          // 非公開
    ├── TAX_RATE  // 非公開
    └── cart      // pub
        └── total // pub
```

頂点にあるルートモジュールはそれ自体に名前がなく、[[module-path]]の先頭に`crate`と書いて起点にします。ツリー上の項目は、そこからモジュール名をたどって参照します。

## プライバシー境界

非公開の項目にアクセスできるのは、それを定義したモジュールとその子孫だけです[^3]。子モジュールからは祖先の非公開の項目が見える一方、親から子の非公開の項目は見えません。実装の詳細をモジュールの内側に隠したまま、公開したいものだけを`pub`で外に出す設計ができます。<!-- TODO: [[pub]] 作成後にリンク -->

## 補足

:::details[外部ファイルから読み込むモジュール]
`mod cart;`とセミコロンで終えたモジュールは、本体を外部ファイルから読み込みます。ファイルのパスは既定で論理的なモジュールパスをそのまま写した形になり、祖先のモジュールはディレクトリになります[^1]。クレートルートに書いた`mod cart;`なら`src/cart.rs`、`shop`の中に書いたなら`src/shop/cart.rs`です。<!-- TODO: [[module-file-split]] 作成後にリンク -->

インラインモジュールは、テスト用の`mod tests`のように、対象のコードと同じファイルに置いておきたい小さなまとまりに向いています。
:::

:::details[非公開が既定にならない例外]
デフォルトで非公開という規則には例外が2つあります。`pub`なトレイトの関連項目と、`pub`な[[enum]]のバリアントは、`pub`を書かなくてもそれ自体が公開されます[^3]。<!-- TODO: [[trait]] 作成後にリンク -->
:::

:::details[モジュールは型の名前空間に属する]
モジュールは、それが置かれたモジュールやブロックの**型名前空間**に定義されます[^1]。同じ名前空間に同名の項目は複数定義できないため[^1]、同じモジュール内に`mod shop`と`struct shop`は共存できません（E0428）。一方、値の名前空間に属する`fn shop`とは名前が衝突しません（Rust 1.93で確認）。
:::

[^1]: [Modules — The Rust Reference](https://doc.rust-lang.org/reference/items/modules.html)

[^2]: [Defining Modules to Control Scope and Privacy — The Rust Programming Language](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html)

[^3]: [Visibility and Privacy — The Rust Reference](https://doc.rust-lang.org/reference/visibility-and-privacy.html)
