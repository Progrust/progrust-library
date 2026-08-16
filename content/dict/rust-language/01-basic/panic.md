---
title: パニック
description: 回復不能なエラーとして実行を即座に中断する仕組み。`panic!`マクロによる明示的な発生と、境界外アクセスや整数オーバーフローによる暗黙の発生の2通り。
created_at: 2026-08-16
updated_at: 2026-08-16
tags: ["基本文法", "標準ライブラリ"]
public: true
---

パニック（panic）は、回復不能なエラーが起きたときに現在のスレッドの実行を中断する仕組みです[^1]。中断の際はメッセージと発生位置を標準エラー出力へ表示し、既定の設定ではスタックを巻き戻しながら値を片付けます。[[main-function]]を実行するスレッドでパニックすると、プログラム全体が終了コード`101`で終わります[^1]。

パニックは`panic!`[[macro]]で明示的に起こせるほか、境界外アクセスのように言語や[[standard-library]]の側から暗黙に起こることもあります[^2]。失敗を呼び出し元へ返して処理を委ねる[[result]]と違い、パニックは「この先を続けても意味がない」と判断したときの打ち切り手段です。

```rust playground
fn withdraw(balance: u32, amount: u32) -> u32 {
    if amount > balance {
        panic!("残高不足です（残高{balance}円、引き出し{amount}円）");
    }
    balance - amount
}

fn main() {
    println!("残り{}円", withdraw(3000, 1000));
    println!("残り{}円", withdraw(3000, 5000)); // ここで中断する
    println!("この行は実行されません");
}
```

## 暗黙にパニックする場面

`panic!`を書いていなくても、次の操作は条件を満たした瞬間にパニックします。いずれもコンパイルは通るため、**実行して初めて発覚します**。

| 操作 | パニックする条件 |
| --- | --- |
| 添字アクセス`v[i]`・`&v[a..b]` | 添字や範囲が長さを超える（[[array-type]]・[[slice]]・[[vec]]・[[string-slice]]） |
| 整数の除算`/`・剰余`%` | 右辺が`0`、または符号あり[[integer-type]]の`MIN / -1`[^3] |
| 整数の加減乗算・符号反転・シフト | 検査が有効なビルドでのオーバーフロー（シフト量がビット幅以上の場合を含む）[^3] |
| [[option]]・[[result]]の[[unwrap]]・`expect` | 中身が`None`・`Err`のとき |

オーバーフローだけは検査の有無で結果が変わるため、パニックするかどうかがビルドプロファイルに依存します。整数演算そのものの規則は[[numeric-operations]]にまとめてあります。

## 巻き戻し（unwind）と中止（abort）

パニック後の後片付けには2つの戦略があり、ビルド時に選びます[^2]。

| 戦略 | 挙動 | 回復 |
| --- | --- | --- |
| `unwind`（多くのターゲットで既定） | スタックを1フレームずつ巻き戻し、値の`Drop`を呼ぶ[^2] | 回復点まで戻れる |
| `abort` | 後片付けせずプロセスを即時終了する[^4] | できない |

`unwind`の`Drop`呼び出しは通常の[[scope]]の終了と同じで、スレッド境界などの回復点まで戻れます。`abort`はメモリの解放をOSに任せるぶんバイナリが小さくなり、最適化も効きやすくなります[^2]。

## 補足

:::details[オーバーフローの検査はビルドプロファイル依存]
オーバーフローの検査は、既定ではdevプロファイル（およびその設定を継承するtestプロファイル）でのみ有効です[^5]。同じコードでもreleaseビルドではパニックせず、2の補数で範囲の反対側へ折り返した値になります[^3]。

```rust playground
fn main() {
    let stock: u8 = 250;
    let arrival: u8 = "10".parse().unwrap(); // 実行時に決まる値
    println!("合計{}個", stock + arrival); // devビルドはパニック、releaseは4
}
```

値がコンパイル時に確定していて必ずオーバーフローする式は、実行を待たずコンパイルエラーになります（deny-by-defaultの`arithmetic_overflow`リント。Rust 1.93で確認）。上の例が実行時のパニックで済んでいるのは、`arrival`が実行時に決まる値だからです。
:::

:::details[`abort`への切り替え方]
切り替えは[[package]]の`Cargo.toml`にあるプロファイルで指定します[^5]。

```toml:Cargo.toml
[profile.release]
panic = "abort"
```

テスト・ベンチマーク・ビルドスクリプト・手続き的マクロはこの設定を無視し、常に`unwind`でビルドされます[^5]。また`abort`でビルドすると、パニック時の終了コードは`101`ではなくプロセス中止のもの（Unix系ではSIGABRTによる134）になります（Rust 1.93で確認）。
:::

:::details[パニックメッセージとバックトレース]
既定のパニックフック（パニック直後に走る処理）は、メッセージと発生位置を標準エラー出力へ出します[^1]。

```txt:境界外アクセスのメッセージ
thread 'main' (3658200) panicked at src/main.rs:4:28:
index out of bounds: the len is 3 but the index is 5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

1行目の括弧内はスレッドIDです（Rust 1.93での出力）。案内のとおり`RUST_BACKTRACE=1`を付けて実行すると、どの関数から呼ばれてパニックに至ったかの履歴が表示されます[^4]。フック自体は`std::panic::set_hook`で差し替えられます[^1]。
:::

:::details[巻き戻しを捕まえる`catch_unwind`]
`std::panic::catch_unwind`は、渡した処理の中で起きた巻き戻しを捕まえて`Result`として返します[^6]。ただし公式ドキュメントは、これを一般的なtry/catchとして使わないよう明記しています。日常的に失敗しうる処理には`Result`が適切で、`catch_unwind`はFFI境界の外へ巻き戻しを漏らさないといった限られた用途のものです[^6]。`panic = "abort"`でビルドした場合は、そもそも巻き戻しが起きないため捕まえられません[^6]。
:::

:::details[パニック中のパニックは中止になる]
巻き戻しの最中に呼ばれた`Drop`がさらにパニックすると、回復のしようがないため`panic in a destructor during cleanup`というメッセージとともにプロセスが中止されます[^7]（Rust 1.93で確認）。`unwind`でビルドしていても`catch_unwind`では捕まえられません。`Drop`の実装ではパニックしうる処理を避けるのが原則です。
:::

:::details[`panic!`が持つ型]
`panic!`はその場で実行を打ち切るため、値を返しません。型としてはnever型`!`を持ち<!-- TODO: [[never-type]] 作成後にリンク -->、どんな型が期待される位置にも書けます。そのため[[match-expression]]の一部のアームだけを`panic!`にしても、アーム全体の型は残りのアームの型に揃います。

```rust playground
fn main() {
    let stock = 0;
    let n: u32 = match stock {
        0 => panic!("在庫がありません"), // 型は!なのでu32のアームと共存できる
        n => n,
    };
    println!("残り{n}個");
}
```
:::

[^1]: [std::panic — マクロ](https://doc.rust-lang.org/std/macro.panic.html) — 現在のスレッドをパニックさせること、mainスレッドがパニックすると終了コード101で終わること、既定のフックがメッセージと発生位置をstderrへ出すことが記載されています。
[^2]: [The Rust Reference: Panic](https://doc.rust-lang.org/reference/panic.html) — `unwind`と`abort`の2戦略、`unwind`が多くのターゲットで既定であること、巻き戻し中に`Drop`が呼ばれること、境界外の添字アクセスのように自動でパニックする言語構文があることが記載されています。
[^3]: [The Rust Reference: Operator expressions](https://doc.rust-lang.org/reference/expressions/operator-expr.html#overflow) — オーバーフローとみなされる演算の一覧と、0除算・`MIN / -1`が検査の有無に関わらずパニックすることが記載されています。
[^4]: [The Rust Programming Language: Unrecoverable Errors with `panic!`](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html)
[^5]: [The Cargo Book: Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html#panic) — `panic`の指定値、devとreleaseの`overflow-checks`の既定値、testプロファイルがdevを継承すること、テストなどが`panic`設定を無視することが記載されています。
[^6]: [std::panic::catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html)
[^7]: [std::ops::Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html) — 巻き戻し中の`drop`がパニックする「二重パニック」ではプログラムが中止されうることが記載されています。
