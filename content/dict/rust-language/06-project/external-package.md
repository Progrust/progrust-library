---
title: 外部パッケージ
description: 依存を`Cargo.toml`の`[dependencies]`で宣言し、`use`でスコープに持ち込む2段階の手順。標準ライブラリのみ宣言不要。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成", "Cargo"]
public: true
---

自分で書いていない外部の[[package]]を使う手順は2段階です。まず`Cargo.toml`の`[dependencies]`にパッケージ名とバージョンを書いて依存を宣言し、次にコード側で[[use-declaration]]を書いて使いたい項目をスコープに持ち込みます。この宣言を見て、Cargoは既定のレジストリであるcrates.ioからパッケージを取得してコンパイルします[^1]。<!-- TODO: [[scope]] 作成後にリンク -->

```toml:Cargo.toml
[package]
name = "shopping"
version = "0.1.0"
edition = "2024"

[dependencies]
regex = "1" # 正規表現のクレートに依存する
```

<!-- rustc: skip -->
```rust:src/main.rs playground
use regex::Regex; // 依存に加えたregexクレートから型を持ち込む

fn main() {
    // 郵便番号（123-4567）の形式かどうかを判定する
    let postal_code_pattern = Regex::new(r"^[0-9]{3}-[0-9]{4}$").unwrap();

    for input in ["150-0002", "1500002"] {
        println!("{input} は郵便番号の形式か: {}", postal_code_pattern.is_match(input));
    }
}
```

## 片方だけ忘れるとどうなるか

2つは目的が別なので、忘れたときの症状も違います。依存の宣言はCargoへの指示で、これがないとクレート名そのものが解決できません。`use`のほうは名前を短く書くためのもので、`regex::Regex::new(..)`のように[[module-path]]を最後まで書くなら省略もできます。

| 手順                 | 書く場所                       | 忘れるとどうなるか                                                     |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| 依存の宣言           | `Cargo.toml`の`[dependencies]` | クレート名が解決できずコンパイルエラー（E0432 / E0433）                |
| スコープへの持ち込み | `.rs`ファイルの`use`           | フルパスで書けばエラーにはならないが、毎回`regex::Regex::new(..)`と書くことになる |

## 標準ライブラリだけは宣言が要らない

`std`クレートは、クレートルートに`#![no_std]`属性が付いていない限り**常に**コンパイラへ渡されます[^2]。そのため[[standard-library]]は`Cargo.toml`に何も書かなくても使えます。

:::message{tip}
不要になるのは`Cargo.toml`への追記だけです。`use`の要否は外部パッケージと変わらず、`String`や`Vec`のようにプレリュード（自動で取り込まれる項目群）に入っているものだけが`use`なしで書けます。
:::

```rust playground
use std::collections::HashMap; // 標準ライブラリでも`use`は同じように必要

fn main() {
    let mut stock = HashMap::new(); // 商品ごとの在庫数
    stock.insert("りんご", 3);

    // `String`はプレリュードに入っているので`use`なしで書ける
    let label = String::from("りんごの在庫");
    println!("{label}: {}個", stock["りんご"]);
}
```

## 補足

:::details[なぜ追記すると名前が解決できるようになるのか]
Cargoは依存先の[[crate]]を`--extern`でコンパイラへ渡します。この方法で渡されたクレートの名前は**外部プレリュード**（extern prelude）に入り、パスの起点として書けるようになります[^2]。`std`が宣言なしで使えるのも、`#![no_std]`が付いていない限り同じ外部プレリュードへ自動で追加されるからです[^2]。

なお、外部プレリュードのクレートを`use`から参照できるのは2018エディション以降で、2015エディションでは別途`extern crate regex;`の宣言が必要でした[^2]。
:::

:::details[手で書かずにcargo addで追記する]
`cargo add regex`を実行すると、Cargoがそのパッケージを調べて`[dependencies]`へ追記してくれます[^3]。追記後に`cargo build`すると、依存とその依存が取得・コンパイルされ、実際に使われた版が`Cargo.lock`に記録されます[^1]。
:::

:::details[バージョン要件の読み方]
`regex = "1"`は既定（キャレット）の要件で、「1.0.0以上2.0.0未満」を意味します[^4]。左端の非ゼロの要素（major・minor・patchのいずれか）が同じ範囲をSemVer互換とみなすため、`0.2.3`と書いた場合は`>=0.2.3, <0.3.0`になります[^4]。0.x系は基準となる要素が1つ右にずれる点に注意します。
:::

:::details[allocやtestは自動では入らない]
`rustc`に同梱されるクレートでも、`alloc`や`test`はCargoが自動で`--extern`に含めません。2018エディション以降でも`extern crate alloc;`と宣言してから使う必要があります[^2]。`core`・`alloc`・`std`の関係は[[standard-library]]を参照してください。
:::

:::details[Rust Playgroundでの外部クレート]
このサイトのコード例が動くRust Playgroundには、ダウンロード数上位100クレートとRust Cookbookに登場するクレート、およびそれらの依存があらかじめ用意されています[^5]。そのため上のコード例も`Cargo.toml`を書かずにそのまま実行できます。用意されているクレートと版の一覧は[Playgroundのクレート一覧](https://play.rust-lang.org/meta/crates)で確認できます。
:::

[^1]: [Adding a Dependency — The Cargo Book](https://doc.rust-lang.org/cargo/guide/dependencies.html)

[^2]: [Preludes（Extern prelude） — The Rust Reference](https://doc.rust-lang.org/reference/names/preludes.html#extern-prelude)

[^3]: [cargo add — The Cargo Book](https://doc.rust-lang.org/cargo/commands/cargo-add.html)

[^4]: [Specifying Dependencies — The Cargo Book](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html)

[^5]: [rust-lang/rust-playground — README](https://github.com/rust-lang/rust-playground)
