---
title: unwrap
description: OptionやResultに包まれた値を取り出す標準ライブラリのメソッド群。取り出せないときにパニックするか既定値を返すかで使い分けるのが基本。
created_at: 2026-08-10
updated_at: 2026-08-10
tags: ["標準ライブラリ", "型システム"]
public: true
---

`unwrap`は、[[option]]や[[result]]に包まれた値を取り出す[[standard-library]]の[[method]]です[^1][^2]。`Some(値)`・`Ok(値)`ならその中身を返し、`None`・`Err`ならパニックして<!-- TODO: [[panic]] 作成後にリンク -->処理を中断します。パニックの代わりに既定値を返す`unwrap_or`などを含め、これらをまとめてunwrap系のメソッドと呼びます。

```rust playground
fn find_price(item: &str) -> Option<i32> {
    match item {
        "りんご" => Some(120),
        _ => None,
    }
}

fn main() {
    let apple = find_price("りんご").unwrap(); // Someと分かっているので取り出す
    println!("りんご: {apple}円");

    let banana = find_price("バナナ").unwrap_or(0); // Noneなら0を使う
    println!("バナナ: {banana}円");
}
```

## 主なunwrap系メソッド

`Option`と`Result`の両方に、同じ名前のメソッドが用意されています。

| メソッド | `Some` / `Ok` のとき | `None` / `Err` のとき |
| --- | --- | --- |
| `unwrap()` | 中身を返す | パニックする |
| `expect("メッセージ")` | 中身を返す | メッセージ付きでパニックする |
| `unwrap_or(既定値)` | 中身を返す | 引数の既定値を返す |
| `unwrap_or_else(処理)` | 中身を返す | 処理を実行し、その戻り値を返す |
| `unwrap_or_default()` | 中身を返す | 型`T`の既定値を返す |

`unwrap_or`の引数は`Some`・`Ok`のときでも必ず評価されるため、既定値の生成にコストがかかる場合は、必要なときだけ評価される`unwrap_or_else`を使います[^2]。

## `unwrap`を使ってよい場面

The Rust Programming Languageは、`unwrap`と`expect`が適切な場面として次の2つを挙げています[^3]。

- **サンプルコード・プロトタイプ・テスト**: エラー処理の方針をまだ決めていない段階では、後から手を入れる目印として使えます。テストでは失敗したテスト自体をパニックで落とすことが望ましい挙動です
- **コンパイラより開発者のほうが多くを知っている場合**: `Err`にならないことがコードを読めば分かるものの、その根拠をコンパイラが理解できない場合です

逆に、外部入力やファイル操作のように失敗が現実に起こりうる箇所では、取り出す前に[[match-expression]]・[[if-let-expression]]・[[let-else-statement]]で分岐するか、`?`演算子で呼び出し元に処理を委ねます<!-- TODO: [[question-mark-operator]] 作成後にリンク -->。unwrap系は「取り出せなかったときにどうするか」をその場で決め打ちするメソッドなので、決め打ってよい根拠があるかどうかが選択の基準になります。

```rust playground
fn main() {
    // 直書きの値なので必ず数値として解釈できる
    let people: u32 = "4".parse().expect("人数の指定は数値として正しいはず");
    println!("1人あたり{}円", 3000 / people);
}
```

:::message{tip}
根拠があって取り出す場合は、`unwrap`ではなく`expect`を使い、成功すると期待する理由をメッセージに書くことが推奨されています[^1][^4]。「〜のはず（should）」という言い回しで、失敗したときに何が想定外だったのかが伝わる文にします。
:::

## 補足

:::details[`unwrap_or_else`と`unwrap_or_default`の細かい規則]
`unwrap_or_else`が受け取るのは`FnOnce`を実装する値（通常はクロージャ）で<!-- TODO: [[closure]] 作成後にリンク -->、`Result`版だけはそれが`Err`の中身を引数として受け取ります[^2]。`unwrap_or_default`は`T`が`Default`トレイトを実装している場合にだけ呼べ<!-- TODO: [[trait]] 作成後にリンク -->、数値なら`0`、[[string]]なら空文字列が返ります。
:::

:::details[失敗のほうを取り出す`unwrap_err`]
`Result`には、`Err`の中身を取り出す`unwrap_err`と`expect_err`もあります[^2]。`Ok`だった場合はパニックし、そのために`T`が`Debug`を実装している必要があります。処理が確実に失敗することを確認するテストなどで使います。
:::

:::details[検査を省く`unwrap_unchecked`]
`unwrap_unchecked`はRust 1.58.0で安定化されたunsafeなメソッドで、[[enum]]のバリアントを検査せずに中身を取り出します[^1][^2]。`None`や`Err`に対して呼ぶと未定義動作になるため、通常のコードでは使いません。
:::

[^1]: [std::option::Option](https://doc.rust-lang.org/std/option/enum.Option.html) — 各メソッドのシグネチャのほか、`expect`の項に「Recommended Message Style」として推奨されるメッセージの書き方が示されています。
[^2]: [std::result::Result](https://doc.rust-lang.org/std/result/enum.Result.html) — `unwrap_or`の引数が先行評価されること、`unwrap`・`expect`・`unwrap_err`・`expect_err`が`E`（または`T`）に`Debug`を要求することが記載されています。
[^3]: [The Rust Programming Language: To `panic!` or Not to `panic!`](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)
[^4]: [The Rust Programming Language: Recoverable Errors with `Result`](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) — 製品品質のコードでは`unwrap`より`expect`を選び、成功するはずの理由を添えることが多いと述べられています。
