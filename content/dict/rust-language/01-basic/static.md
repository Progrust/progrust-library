---
title: 静的変数
description: プログラム全体の実行期間にわたって存在する名前付きの値。static で宣言し、メモリ上に唯一の実体とアドレスを持つのが特徴。
created_at: 2026-08-16
updated_at: 2026-08-16
tags: ["基本文法"]
public: true
---

**静的変数**（static item）は、プログラム全体の実行期間にわたって存在する名前付きの値です。`static`キーワードで宣言し、[[constant]]と同じく型注釈が必須で、初期化に書けるのは定数式だけです。慣習として名前は`SCREAMING_SNAKE_CASE`で付けます。

定数との最大の違いは、値が**メモリ上に唯一の実体として置かれる**ことです。その実体はプログラムが終わるまで生き続けるため、[[borrow]]すると`'static`ライフタイムの[[reference]]が得られます<!-- TODO: [[lifetime]] 作成後にリンク -->。

```rust playground
static SHOP_NAME: &str = "プログルストア"; // 型注釈は省略できない
const TAX_RATE: f64 = 0.1;

fn main() {
    println!("{SHOP_NAME}の税率: {}%", TAX_RATE * 100.0);

    // 何度借用しても同じアドレスを指す
    println!("{:p} {:p}", &SHOP_NAME, &SHOP_NAME);
}
```

## 定数との違い

どちらも定数式で初期化する不変の名前付き値ですが、実体の持ち方が異なります。

| 観点 | `const` | `static` |
| --- | --- | --- |
| 実体 | 使用箇所ごとに値が埋め込まれる | プログラム全体で1つ |
| アドレス | 同じアドレスになる保証はない | つねに同じアドレスを指す |
| 可変にできるか | できない | `static mut`と書ける（`unsafe`が必要） |

小さな値に名前を付けたいだけなら`const`、大きなデータを1箇所に置きたい場合やアドレスの同一性が意味を持つ場合は`static`、と使い分けます。

## static mutがunsafeな理由

`static mut`と書くと書き換え可能な静的変数になりますが、**読み書きのどちらにも`unsafe`が必要**です。理由は、コンパイラが排他性を検査できないことにあります。静的変数はプログラムのどこからでも名前だけで触れて寿命も尽きないため、「いま誰が書き換えているか」を追跡する相手を特定できません。[[mutability]]の「書き換えるなら排他的に」という原則が保証できず、2つのスレッドが同時に書き込めばデータ競合が起きます。それを避ける検証は書き手の責任になります。

<!-- rustc: expect E0133 -->
```rust playground
static mut COUNTER: i32 = 0;

fn main() {
    COUNTER += 1; // エラー: E0133（可変な静的変数の操作にはunsafeが必要）
    println!("{}", COUNTER);
}
```

## 補足

:::details[Rust 2024エディションでは参照自体が禁止]
`static mut`への参照（`&`・`&mut`）は、共有と可変が同時に成立した瞬間に、そこから読み書きしなくても未定義動作になります。この違反はコンパイラに検出できないため、Rust 2024エディションでは`static_mut_refs`リントが`deny`になり、`unsafe`ブロックの中であってもコンパイルエラーです。新規のコードで`static mut`を使う理由は実質ありません。
:::

:::details[書き換えたい場合の代替手段]
[[standard-library]]には、`static`のまま安全に書き換えるための型が用意されています。カウンタなら`AtomicUsize`、複雑なデータなら`Mutex`、初期化を遅らせたいなら`OnceLock`・`LazyLock`が使えます。いずれも内部可変性を持つ型で、`&'static T`のまま安全に内部状態を扱えます（`OnceLock`・`LazyLock`は変更ではなく初期化のみ）<!-- TODO: [[interior-mutability]] 作成後にリンク -->。

```rust playground
use std::sync::atomic::{AtomicUsize, Ordering};

static VISITOR_COUNT: AtomicUsize = AtomicUsize::new(0);

fn main() {
    VISITOR_COUNT.fetch_add(1, Ordering::Relaxed); // unsafe が不要
    println!("来店者数: {}人", VISITOR_COUNT.load(Ordering::Relaxed));
}
```
:::

:::details[Syncが必要な理由]
`mut`の付かない静的変数はどのスレッドからも共有参照で読めるため、型が`Sync`トレイトを実装している必要があります<!-- TODO: [[trait]] 作成後にリンク -->。`Sync`でない型（`Rc`や`RefCell`など）を`static`に置こうとするとエラー: E0277になります。`static mut`にはこの制約がありません（そのぶん安全性の保証もありません）。
:::

:::details[静的変数はドロップされない]
静的変数はプログラム終了時に`drop`が呼ばれません（The Rust Reference「Static items」の規定）。値そのものはプロセスの終了とともに解放されますが、ファイルを閉じる・バッファを書き出すといった後始末の処理は動かないため、`static`にそうした責務を持つ値を置く場合は明示的に処理を呼ぶ必要があります。
:::
