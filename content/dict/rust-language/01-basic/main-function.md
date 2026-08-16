---
title: main関数
description: プログラムの実行が始まるエントリポイントとなる関数。バイナリクレートに必須で、戻り値にResultやExitCodeも取れる点が特徴。
created_at: 2026-08-16
updated_at: 2026-08-16
tags: ["基本文法", "プロジェクト構成"]
public: true
---

main関数は、プログラムの実行が始まるエントリポイントです。実行可能ファイルになるバイナリ[[crate]]には必須で、クレートルートに`main`という名前の[[function]]が見つからないとコンパイルエラー`E0601`になります（ライブラリクレートは`main`を持ちません）。

`main`には引数を渡せず（`E0580`）、型引数やライフタイムパラメータとその境界も付けられません（`E0131`）。`where`句も書けません（`E0646`）。戻り値の型は[[standard-library]]の`std::process::Termination`トレイトを実装した型に限られ、`->`を省略すると[[unit-type]]`()`を返す扱いになります[^1]。
<!-- TODO: [[trait]] 作成後にリンク --><!-- TODO: [[generics]] 作成後にリンク -->

```rust playground
// プログラムの実行はここから始まる（->を省略しているので戻り値は()）
fn main() {
    let total = 1200 + 800; // 買い物かごの合計
    println!("お支払い金額: {total}円");
}
```

## 戻り値に取れる型

標準ライブラリにある主な実装は次のとおりです[^2]。プログラムの終了コードは、返した値をこのトレイト経由で変換して決まります。

| 戻り値の型 | 終了コード | 用途 |
| --- | --- | --- |
| `()`（`->`の省略時） | 0 | 失敗を表現しない通常の`main` |
| `Result<T, E>`（`T: Termination`・`E: Debug`） | `Ok`は`T`に従い、`Err`は`FAILURE`（主要な環境では1） | `Err`のときエラー値を標準エラー出力へ表示 |
| `ExitCode` | 保持している値そのもの | 終了コードを自分で決めたいとき（Rust 1.61で安定化）[^3] |
| `!`（never型）<!-- TODO: [[never-type]] 作成後にリンク --> | ―（到達しない） | `std::process::exit`などで発散して戻らないとき |
| `Infallible` | ―（到達しない） | 値を構築できず、失敗しえないことを型で示すとき |

戻り値を[[result]]にすると、`main`の中でも`?`演算子で失敗を早期に返せます。返された`Err`の後始末はランタイムが引き受けます。
<!-- TODO: [[question-mark-operator]] 作成後にリンク -->

```rust playground
fn main() -> Result<(), String> {
    let input = "千二百"; // 数字として解釈できない入力
    let price: u32 = input
        .parse()
        .map_err(|_| format!("価格を解釈できません: {input}"))?; // ここでErrを返すので以降は実行されない
    println!("価格: {price}円");
    Ok(())
}
```

:::message[`Err`の表示は`Display`ではなく`Debug`]{warning}
返された`Err`は`Error: `に続けて`{:?}`で標準エラー出力へ表示されます。上のコードの出力は`Error: "価格を解釈できません: 千二百"`と引用符付きになり、終了コードは`ExitCode::FAILURE`（主要な環境では1）になります。利用者に見せるメッセージを整えたい場合は、`Result`を返さずに自分で表示してから`ExitCode`を返します。
:::

## 補足

:::details[`main`はモジュールから持ち込んでもよい]
`main`はクレートルートに`main`という名前で見えていればよく、定義そのものは別の[[module]]にあっても構いません[^1]。次のコードは[[use-declaration]]の`as`で`app::run`に`main`という別名を付けており、そのまま実行できます。

```rust playground
mod app {
    pub fn run() {
        println!("こんにちは");
    }
}

use app::run as main;
```

逆に、モジュールの中に`main`を定義しただけではエントリポイントとは見なされず、`E0601`になります。
:::

:::details[`async fn main`は書けない]
`main`を`async fn`にすると`E0752`になります。Rust本体に非同期ランタイムが含まれておらず、`Future`を駆動する仕組みが標準では用意されていないためです。tokioなどが提供する`#[tokio::main]`属性は、`async fn main`をランタイムの起動処理を含む通常の`main`へ書き換えることで、この制約を回避しています。
<!-- TODO: [[attribute]] 作成後にリンク -->
:::

[^1]: [Crates and source files — The Rust Reference](https://doc.rust-lang.org/reference/crates-and-source-files.html)

[^2]: [std::process::Termination](https://doc.rust-lang.org/std/process/trait.Termination.html)

[^3]: [std::process::ExitCode](https://doc.rust-lang.org/std/process/struct.ExitCode.html)
