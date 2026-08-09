---
title: 第12章 OptionとResult
description: Some・NoneによるOption型、Ok・ErrによるResult型、if let式とlet-else文による簡潔な取り出し、?演算子によるエラー伝播まで、nullも例外も使わずに「値がない」「失敗した」を扱う方法を手を動かして学ぶ10問。
created_at: 2026-08-08
updated_at: 2026-08-08
tags: ["複合型", "パターンマッチング", "問題集"]
public: true
---

第11章で、列挙型と`match`式を身につけました。この最終章では、その2つが実際にどう使われているのか——標準ライブラリの`Option`型と`Result`型——を10問で扱います。

プログラムを書いていると、必ず2つの場面に出会います。「探したものが見つからなかった」と「処理に失敗した」です。多くの言語ではnullを返したり例外を投げたりして表しますが、どちらもチェックを忘れたコードがそのまま動いてしまい、実行時に初めて問題が表面化します。

Rustにはnullも例外もありません。代わりに、値がないかもしれないことを`Option`型、失敗するかもしれないことを`Result`型という**ただの列挙型**で表します。列挙型なので、扱うには`match`が必要です。そして`match`には網羅性チェックがあるので、「値がなかった場合」「失敗した場合」を書き忘れたコードはコンパイルを通りません。第11章で学んだ仕組みが、そのまま安全性の土台になっています。

進め方は[第11章](/books/rust-learning/enums-and-match)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - Option型

[[option]]と[[match-expression]]に関する問題です。
`show_stock`関数の中身を書いて、在庫が分かる場合と分からない場合を出し分けてください。

```txt:期待する出力
在庫は3個です
在庫が分かりません
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn show_stock(stock: Option<u32>) {
    // match式で次のように出力せよ
    // Some(count) → 在庫は〇〇個です
    // None        → 在庫が分かりません

}

fn main() {
    show_stock(Some(3));
    show_stock(None);
}
```

::::details[解答例と解説]
```rust playground
fn show_stock(stock: Option<u32>) {
    // match式で次のように出力せよ
    // Some(count) → 在庫は〇〇個です
    // None        → 在庫が分かりません
    match stock {
        Some(count) => println!("在庫は{count}個です"),
        None => println!("在庫が分かりません"),
    }
}

fn main() {
    show_stock(Some(3));
    show_stock(None);
}
```
[[option]]は、値が「ある」か「ない」かを表す標準ライブラリの[[enum]]です。定義は驚くほど単純で、次の2バリアントしかありません。

<!-- rustc: skip -->
```rust:標準ライブラリでの定義（イメージ）
enum Option<T> {
    Some(T), // 値がある
    None,    // 値がない
}
```

`Some(T)`は第11章で学んだ**データを持つバリアント**そのもので、`None`はデータを持たないバリアントです。したがって扱い方も第11章のままで、`match`でバリアントごとに分岐し、`Some(count)`のパターンで中の値を取り出します。

`T`は「どんな型でも入る」という意味の書き方（ジェネリクス）です。今回は`Option<u32>`なので`Some`の中身は`u32`、`Option<String>`なら`String`になります。

`Some`と`None`は`Option::Some`・`Option::None`と書かずにそのまま使えます。よく使うため、標準ライブラリが最初から名前を使えるようにしてくれているためです。

`Some(3)`のように書けば`Option<u32>`の値が作れます。`show_stock(None)`のほうは、引数の型が`Option<u32>`と決まっているので、`None`だけ書けばどの`Option`なのかがコンパイラに伝わります。

:::message{tip}
nullのある言語では「この変数はnullかもしれない」という情報がどこにも書かれていないため、チェックを忘れたことに実行時まで気付けません。Rustでは`Option<u32>`という**型そのもの**が「値がないかもしれない」と宣言していて、中の値を使うには必ず`Some`のパターンを通す必要があります。次の問題02で、その強制力を確かめます。
:::
::::

## 02 - Option\<T\>とTは別の型

[[option]]と[[match-expression]]に関する問題です。
次のコードはコンパイルエラー（E0369）になります。`match`で値を取り出す形に書き換えて修正してください。在庫が分からない場合は0個として扱います。

```txt:期待する出力
合計: 5個
```

<!-- rustc: expect E0369 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let stock: Option<u32> = Some(3);

    let total = stock + 2;

    println!("合計: {total}個");
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let stock: Option<u32> = Some(3);

    let total = match stock {
        Some(count) => count + 2,
        None => 2, // 在庫が分からない場合は0個として扱う
    };

    println!("合計: {total}個");
}
```
エラーメッセージは`cannot add '{integer}' to 'Option<u32>'`（E0369）です。「`Option<u32>`に整数は足せない」と言われています。

`Option<u32>`と`u32`は**別の型**です。`Some(3)`は「3という値が入った箱」であって、3そのものではありません。箱のまま計算することはできないので、中身を取り出す手続きが必要になります。

そして取り出す唯一の入口が`match`（およびこの後の問題で扱う`if let`・`let-else`）です。パターンで取り出そうとすれば、必然的に「`None`だったらどうするか」も書かされます。

<!-- rustc: skip -->
```rust:Noneの場合の書き忘れはコンパイルエラー
let total = match stock {
    Some(count) => count + 2,
    // Noneのアームがないとエラー: E0004
};
```

これが「nullチェック漏れが起きない」という言葉の中身です。チェックを忘れる余地がそもそもありません。第11章で学んだ網羅性チェックが、そのまま安全装置として働いています。

「在庫が分からない場合は0個として扱う」といった**判断は必ず書き手がすることになる**、という点も大事です。0とみなすのか、エラーにするのか、処理を打ち切るのか。言語が勝手に決めるのではなく、コードとして残ります。

:::message{tip}
`match`を毎回書くのは面倒に思えるかもしれません。実際には`unwrap_or`のような「`None`ならこの値を使う」を1行で書ける便利なメソッドが`Option`には数多く用意されていて、上の例は`stock.unwrap_or(0) + 2`とも書けます。ただし、それらはすべて`match`の short-hand です。まずは`match`で何が起きているのかを押さえておくと、後から出会うメソッドもすんなり読めるようになります。
:::
::::

## 03 - Optionを返す関数

[[option]]と[[function]]に関する問題です。
メニューから価格を探す関数`find_price`を実装して、テストに合格させてください。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// メニューから価格を探す関数find_priceを定義せよ
//   引数  : 商品名（&str）
//   戻り値: 見つかればSome(価格)、見つからなければNone
//   メニュー: コーヒー 500円 / 紅茶 450円 / ジュース 400円

#[test]
fn test_found() {
    assert_eq!(find_price("コーヒー"), Some(500));
    assert_eq!(find_price("紅茶"), Some(450));
    assert_eq!(find_price("ジュース"), Some(400));
}

#[test]
fn test_not_found() {
    assert_eq!(find_price("ビール"), None);
}
```

::::details[解答例と解説]
```rust playground
// メニューから価格を探す関数find_priceを定義せよ
//   引数  : 商品名（&str）
//   戻り値: 見つかればSome(価格)、見つからなければNone
//   メニュー: コーヒー 500円 / 紅茶 450円 / ジュース 400円
fn find_price(name: &str) -> Option<u32> {
    match name {
        "コーヒー" => Some(500),
        "紅茶" => Some(450),
        "ジュース" => Some(400),
        _ => None,
    }
}

#[test]
fn test_found() {
    assert_eq!(find_price("コーヒー"), Some(500));
    assert_eq!(find_price("紅茶"), Some(450));
    assert_eq!(find_price("ジュース"), Some(400));
}

#[test]
fn test_not_found() {
    assert_eq!(find_price("ビール"), None);
}
```
「探す」処理の戻り値は`Option`にする、というのがRustの定番です。見つかったときは`Some(値)`、見つからなかったときは`None`を返します。

戻り値の型に`Option<u32>`と書いてあるだけで、この関数を使う側は「見つからないことがある」と気付けます。ドキュメントを読まなくても、型が仕様を語っています。

`match`の対象が列挙型ではなく`&str`になっている点にも注目してください。第11章の問題07で数値のパターンを書いたのと同じで、**文字列リテラルもパターンとして書けます**。`&str`が取りうる値は無数にあるので、最後に包括パターンの`_`が必要です。

`_ => None`という1行が、この関数の「見つからなかった場合」を表しています。第11章で「列挙型では`_`を避ける」と書きましたが、こちらは値を列挙しきれない型なので`_`が適切な場面です。

:::message{tip}
`assert_eq!(find_price("ビール"), None)`の`None`は、どの`Option`か書かなくても通ります。比較相手の`find_price(...)`が`Option<u32>`を返すので、そちらから型が決まるためです。一方、`let x = None;`とだけ書くと何の`Option`か決まらずコンパイルエラーになります。その場合は`let x: Option<u32> = None;`と型注釈が必要です。
:::
::::

## 04 - if let式

[[if-let-expression]]と[[option]]に関する問題です。
`show_stock`関数の中身を`if let`式で書いて、在庫が分かるときだけ出力してください。分からないときは何も出力しません。

```txt:期待する出力
在庫は3個です
在庫は10個です
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn show_stock(stock: Option<u32>) {
    // if let式を使い、Someのときだけ「在庫は〇〇個です」と出力せよ
    // Noneのときは何も出力しないこと

}

fn main() {
    show_stock(Some(3));
    show_stock(None);
    show_stock(Some(10));
}
```

::::details[解答例と解説]
```rust playground
fn show_stock(stock: Option<u32>) {
    // if let式を使い、Someのときだけ「在庫は〇〇個です」と出力せよ
    // Noneのときは何も出力しないこと
    if let Some(count) = stock {
        println!("在庫は{count}個です");
    }
}

fn main() {
    show_stock(Some(3));
    show_stock(None);
    show_stock(Some(10));
}
```
`match`で書くと、何もしない`None`のアームが必要になります。

<!-- rustc: skip -->
```rust:matchで書いた場合
match stock {
    Some(count) => println!("在庫は{count}個です"),
    None => {} // 何もしないのに書かなければならない
}
```

この「1つのパターンだけ処理したい」という場面のための構文が[[if-let-expression]]です。

<!-- rustc: skip -->
```rust:if letの形
if let Some(count) = stock {
    println!("在庫は{count}個です");
}
```

読み方に少しコツがあります。`if let パターン = 対象の値`という順番で、**左がパターン、右が調べたい値**です。`=`は代入ではなく「このパターンに当てはまるか」の照合を表します。当てはまればブロックが実行され、パターンの中の変数（`count`）がブロックの中で使えます。

`match`との違いは1点だけ、**網羅性チェックが働かない**ことです。書かなかったパターンは黙って無視されます。

| | `match` | `if let` |
| --- | --- | --- |
| 扱えるパターン | すべて網羅する必要がある | 1つだけでよい |
| 網羅性チェック | あり | なし |
| 向いている場面 | 分岐ごとに処理が違う | 1つの場合だけ処理したい |

網羅性チェックは`match`の大きな価値なので、`if let`は「残りは本当に何もしなくてよい」と言い切れるときに使ってください。

:::message{tip}
`if let`は`if`と同じく`else if`や`else`と組み合わせられます。次の問題05で`else`を扱います。
:::
::::

## 05 - if letとelse

[[if-let-expression]]と[[catch-all-pattern]]に関する問題です。
`show_coupon`関数の中身を`if let`式と`else`で書いてください。

```txt:期待する出力
300円引きのクーポンがあります
クーポンはありません
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn show_coupon(coupon: Option<u32>) {
    // if let ... elseで次のように出力せよ
    // Some(amount) → 〇〇円引きのクーポンがあります
    // None         → クーポンはありません

}

fn main() {
    show_coupon(Some(300));
    show_coupon(None);
}
```

::::details[解答例と解説]
```rust playground
fn show_coupon(coupon: Option<u32>) {
    // if let ... elseで次のように出力せよ
    // Some(amount) → 〇〇円引きのクーポンがあります
    // None         → クーポンはありません
    if let Some(amount) = coupon {
        println!("{amount}円引きのクーポンがあります");
    } else {
        println!("クーポンはありません");
    }
}

fn main() {
    show_coupon(Some(300));
    show_coupon(None);
}
```
`if let`の`else`は「パターンに当てはまらなかった残り全部」を引き受けます。役割としては`match`の`_`（[[catch-all-pattern]]）と同じで、書き方が違うだけです。

<!-- rustc: skip -->
```rust:同じ意味の2つの書き方
// if let
if let Some(amount) = coupon {
    println!("{amount}円引きのクーポンがあります");
} else {
    println!("クーポンはありません");
}

// match
match coupon {
    Some(amount) => println!("{amount}円引きのクーポンがあります"),
    _ => println!("クーポンはありません"),
}
```

`else`のブロックでは、パターンで束縛した変数（`amount`）は使えません。当てはまらなかった以上、中の値は存在しないためです。

今回の`Option`のようにバリアントが2つしかない場合、`if let ... else`と`match`のどちらでも書けます。選び方の目安はこうです。

- **2つの分岐が対等な意味を持つ**なら`match`。`Some`と`None`を並べて書いたほうが、両方を扱っていることが目に見えます
- **片方が本筋で、もう片方は例外的な処理**なら`if let ... else`

バリアントが3つ以上ある列挙型では、`if let`だと残りが`else`にまとめられてしまうので、基本的に`match`を選びます。

:::message{tip}
`if let`は式なので、値を返すこともできます。ただしその場合は`else`が必須です（当てはまらなかったときの値が必要なため）。

<!-- rustc: skip -->
```rust:値を返すif let
let amount = if let Some(value) = coupon { value } else { 0 };
```

もっとも、この書き方をするなら`match`のほうが素直に読めることが多いです。
:::
::::

## 06 - let-else文

[[let-else-statement]]と[[return-expression]]に関する問題です。
次のコードはコンパイルエラー（E0425）になります。`let-else`文で`stock`から`count`を取り出して修正してください。

```txt:期待する出力
在庫3個、合計1500円です
在庫が分かりません
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn print_total(stock: Option<u32>) {
    // let-else文でstockからcountを取り出せ
    // Noneの場合は「在庫が分かりません」と出力して処理を打ち切ること

    println!("在庫{count}個、合計{}円です", count * 500);
}

fn main() {
    print_total(Some(3));
    print_total(None);
}
```

::::details[解答例と解説]
```rust playground
fn print_total(stock: Option<u32>) {
    // let-else文でstockからcountを取り出せ
    // Noneの場合は「在庫が分かりません」と出力して処理を打ち切ること
    let Some(count) = stock else {
        println!("在庫が分かりません");
        return;
    };

    println!("在庫{count}個、合計{}円です", count * 500);
}

fn main() {
    print_total(Some(3));
    print_total(None);
}
```
エラーメッセージは`cannot find value 'count' in this scope`（E0425）です。`count`を作るところがまだ書かれていません。

[[let-else-statement]]は「取り出せたら続ける、取り出せなければ打ち切る」を書くための`let`文です。

<!-- rustc: skip -->
```rust:let-elseの形
let Some(count) = stock else {
    println!("在庫が分かりません");
    return;
};
```

`if let`との一番の違いは、**取り出した値がブロックの外で使える**ことです。`if let`は`{}`の中でしか`count`を使えませんが、`let-else`は以降の行でずっと使えます。

<!-- rustc: skip -->
```rust:if letとlet-elseの違い
// if let: countはブロックの中だけ
if let Some(count) = stock {
    println!("{count}個");
}
// ここではcountは使えない

// let-else: 以降ずっと使える
let Some(count) = stock else { return };
println!("{count}個"); // 使える
```

これは処理の形に効いてきます。`if let`で書くと本筋の処理がブロックの中に入り、条件が増えるほど右へ右へとネストが深くなります。`let-else`なら「ダメな場合を先に片付けて抜ける」と書けるので、本筋がネストせずまっすぐ並びます。

`else`ブロックには**必ず処理を打ち切る何か**を書かなければなりません。`return`のほか、ループの中なら`break`や`continue`が使えます。

<!-- rustc: skip -->
```rust:これはコンパイルエラー
let Some(count) = stock else {
    println!("在庫が分かりません"); // 打ち切らずに抜けてしまう
};
```

理由を考えると当然で、`else`を素通りしたら`count`に入れる値がありません。「打ち切ること」が構文として強制されています。

:::message{tip}
`let-else`の`else`ブロックは末尾にセミコロンが必要です（`};`）。`if let`の`else`ブロックにはセミコロンが要らないので、混同しやすいところです。`let-else`はあくまで`let`**文**なので、文を終わらせる`;`が必要だと考えてください。
:::
::::

## 07 - Result型

[[result]]と[[match-expression]]に関する問題です。
`show`関数の中身を書いて、成功時と失敗時を出し分けてください。

```txt:期待する出力
1人あたり750円です
エラー: 人数が0人です
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn show(result: Result<u32, String>) {
    // match式で次のように出力せよ
    // Ok(amount)  → 1人あたり〇〇円です
    // Err(reason) → エラー: 〇〇

}

fn main() {
    show(Ok(750));
    show(Err(String::from("人数が0人です")));
}
```

::::details[解答例と解説]
```rust playground
fn show(result: Result<u32, String>) {
    // match式で次のように出力せよ
    // Ok(amount)  → 1人あたり〇〇円です
    // Err(reason) → エラー: 〇〇
    match result {
        Ok(amount) => println!("1人あたり{amount}円です"),
        Err(reason) => println!("エラー: {reason}"),
    }
}

fn main() {
    show(Ok(750));
    show(Err(String::from("人数が0人です")));
}
```
[[result]]も、`Option`と同じく標準ライブラリの列挙型です。

<!-- rustc: skip -->
```rust:標準ライブラリでの定義（イメージ）
enum Result<T, E> {
    Ok(T),  // 成功。結果の値を持つ
    Err(E), // 失敗。エラーの値を持つ
}
```

`Option`との違いは、**失敗した側も値を持てる**ことです。`None`は「ない」としか言えませんが、`Err`は「なぜ失敗したのか」を運べます。

| | `Option<T>` | `Result<T, E>` |
| --- | --- | --- |
| 成功 | `Some(T)` | `Ok(T)` |
| 失敗 | `None`（理由なし） | `Err(E)`（理由あり） |
| 使う場面 | 値の有無だけが問題 | 失敗の理由を伝えたい |

`Result<u32, String>`は「成功すれば`u32`、失敗すれば`String`のエラーメッセージ」という意味です。エラーの型は`String`でなくてもよく、第11章で学んだ自作の列挙型を使うこともよくあります（問題10で扱います）。

扱い方は`Option`とまったく同じで、`match`でバリアントごとに分岐します。`Ok`と`Err`も、`Some`・`None`と同様に`Result::`を付けずそのまま使えます。

なぜ例外ではなくこの形なのでしょうか。例外は関数のシグネチャに現れないため、どの呼び出しが失敗しうるのかがコードから読み取れません。`Result`なら戻り値の型を見るだけで失敗の可能性が分かり、しかも`match`の網羅性チェックによって`Err`の処理を書き忘れられません。

:::message{tip}
`Result`は`#[must_use]`という指定付きで定義されていて、戻り値を受け取らずに捨てると「使われていない`Result`があります」という警告が出ます。ファイル書き込みの失敗のように、握りつぶすと困るエラーを見逃しにくくするための仕組みです。
:::
::::

## 08 - Resultを返す関数

[[result]]と[[function]]に関する問題です。
在庫から商品を出荷する関数`ship`を実装して、テストに合格させてください。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// 在庫stockからcount個を出荷する関数shipを定義せよ
//   在庫が足りていれば、出荷後の残り在庫数をOkで返す
//   足りなければ「在庫が足りません（在庫〇〇個）」というErrを返す

#[test]
fn test_ship_ok() {
    assert_eq!(ship(10, 3), Ok(7));
    assert_eq!(ship(5, 5), Ok(0));
}

#[test]
fn test_ship_error() {
    assert_eq!(ship(2, 5), Err(String::from("在庫が足りません（在庫2個）")));
    assert_eq!(ship(0, 1), Err(String::from("在庫が足りません（在庫0個）")));
}
```

::::details[解答例と解説]
```rust playground
// 在庫stockからcount個を出荷する関数shipを定義せよ
//   在庫が足りていれば、出荷後の残り在庫数をOkで返す
//   足りなければ「在庫が足りません（在庫〇〇個）」というErrを返す
fn ship(stock: u32, count: u32) -> Result<u32, String> {
    if count > stock {
        return Err(format!("在庫が足りません（在庫{stock}個）"));
    }

    Ok(stock - count)
}

#[test]
fn test_ship_ok() {
    assert_eq!(ship(10, 3), Ok(7));
    assert_eq!(ship(5, 5), Ok(0));
}

#[test]
fn test_ship_error() {
    assert_eq!(ship(2, 5), Err(String::from("在庫が足りません（在庫2個）")));
    assert_eq!(ship(0, 1), Err(String::from("在庫が足りません（在庫0個）")));
}
```
失敗しうる処理を書くときの基本形です。押さえておきたい点が3つあります。

**失敗のチェックを先に済ませる**
`if count > stock`で足りない場合を先に判定し、`return Err(...)`で早期リターンしています。第4章で学んだ`return`式の出番です。こうしておけば、それ以降の行は「在庫は足りている」と分かった状態で書けます。第10章の`withdraw`と同じ組み立て方です。

**成功の値は`Ok`で包む**
`stock - count`をそのまま返すことはできません。戻り値の型が`Result<u32, String>`なので、`Ok(stock - count)`と包む必要があります。`Option`のときの`Some`と同じで、箱に入れて返すイメージです。

**エラーメッセージは`format!`で組み立てる**
第6章で学んだ`format!`で、在庫数を埋め込んだ`String`を作っています。`println!`が画面に出力するのに対し、`format!`は文字列を作って返すマクロでした。失敗の理由を呼び出し元へ「値として」渡せるのが`Result`の強みなので、必要な情報を入れておきます。

`u32`の引き算にも注意が必要でした。`count > stock`のチェックを飛ばして`stock - count`を計算すると、負の値になるところで実行時にプログラムが停止します。**チェックが先、計算が後**です。

:::message{tip}
`ship(5, 5)`が`Ok(0)`を返す点にも意味があります。「在庫がちょうど0になる出荷」は失敗ではなく成功です。境界の値をテストに入れておくと、`>`と`>=`の書き間違いにすぐ気付けます。
:::
::::

## 09 - ?演算子でエラーを伝播する

[[result]]と[[function]]に関する問題です。
`ship_twice`関数の中の`match`の入れ子を、`?`演算子を使って書き換えてください。出力は変わりません。

```txt:期待する出力
残り5個
エラー: 在庫が足りません（在庫2個）
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn ship(stock: u32, count: u32) -> Result<u32, String> {
    if count > stock {
        return Err(format!("在庫が足りません（在庫{stock}個）"));
    }

    Ok(stock - count)
}

fn ship_twice(stock: u32, first: u32, second: u32) -> Result<u32, String> {
    // 次のmatchの入れ子を?演算子で書き換えよ（動作は変えないこと）
    match ship(stock, first) {
        Ok(rest) => match ship(rest, second) {
            Ok(last) => Ok(last),
            Err(reason) => Err(reason),
        },
        Err(reason) => Err(reason),
    }
}

fn main() {
    match ship_twice(10, 3, 2) {
        Ok(rest) => println!("残り{rest}個"),
        Err(reason) => println!("エラー: {reason}"),
    }

    match ship_twice(10, 8, 5) {
        Ok(rest) => println!("残り{rest}個"),
        Err(reason) => println!("エラー: {reason}"),
    }
}
```

::::details[解答例と解説]
```rust playground
fn ship(stock: u32, count: u32) -> Result<u32, String> {
    if count > stock {
        return Err(format!("在庫が足りません（在庫{stock}個）"));
    }

    Ok(stock - count)
}

fn ship_twice(stock: u32, first: u32, second: u32) -> Result<u32, String> {
    // 次のmatchの入れ子を?演算子で書き換えよ（動作は変えないこと）
    let rest = ship(stock, first)?;
    let last = ship(rest, second)?;

    Ok(last)
}

fn main() {
    match ship_twice(10, 3, 2) {
        Ok(rest) => println!("残り{rest}個"),
        Err(reason) => println!("エラー: {reason}"),
    }

    match ship_twice(10, 8, 5) {
        Ok(rest) => println!("残り{rest}個"),
        Err(reason) => println!("エラー: {reason}"),
    }
}
```
12行あった`match`の入れ子が3行になりました。

`?`は`Result`を返す式の後ろに付ける演算子で、次の`match`とまったく同じ意味です。

<!-- rustc: skip -->
```rust:?が展開される内容
// この1行は
let rest = ship(stock, first)?;

// おおよそこう書いたのと同じ
let rest = match ship(stock, first) {
    Ok(value) => value,               // 成功なら中身を取り出して続行
    Err(reason) => return Err(reason), // 失敗ならその場で関数から抜ける
};
```

**成功なら中身を取り出し、失敗なら即座に呼び出し元へ返す**。これだけです。失敗を上へ渡していくことを**エラーの伝播**と呼び、`?`はそのための専用の記法です。

`?`が書ける場所には条件があります。**その関数の戻り値も`Result`でなければなりません**。`Err`をそのまま`return`するので、返せる型でなければ成立しないためです。`Option`を返す関数の中でも`?`は使え、その場合は`None`が返ります。

`?`を使うと、コードの見た目が「成功したときの流れ」だけになります。`ship_twice`を読むと「出荷して、また出荷して、結果を返す」と上から素直に読め、失敗時の分岐は`?`の1文字に畳まれています。失敗しうる処理を何段も重ねるコードでは、この差が大きく効いてきます。

なお、`let last = ship(rest, second)?; Ok(last)`は`ship(rest, second)`とだけ書いても同じ結果になります。`?`で開けた箱を`Ok`で包み直しているだけだからです。今回は`?`の動きを見せるためにあえて2行に分けています。

:::message{warning}
`?`は`main`関数の中では、そのままでは使えません。`main`の戻り値が`()`で`Result`ではないためです。`fn main() -> Result<(), String>`のように戻り値を変えれば使えるようになります。
:::
::::

## 10 - 応用: 在庫管理システム

第7章以降の総復習として、[[struct]]・[[enum]]・[[option]]・[[result]]・[[method]]をすべて組み合わせた問題です。
商品の在庫を管理する`Inventory`を実装して、テストに合格させてください。

まず、扱う型を2つ定義します。

| 型 | 種類 | 内容 |
| --- | --- | --- |
| `Item` | 構造体 | `name`（`String`）・`price`（`u32`）・`stock`（`u32`） |
| `StockError` | 列挙型 | `NotFound`（商品なし）・`OutOfStock { stock: u32 }`（在庫不足。現在庫を持つ） |

そのうえで、`items`（`Vec<Item>`）を持つ構造体`Inventory`に次を定義します。

| 名前 | 種類 | 内容 |
| --- | --- | --- |
| `new()` | 関連関数 | 空の在庫を作って返す |
| `add(name, price, stock)` | メソッド | 商品を1つ追加する |
| `find_price(name)` | メソッド | 価格を`Option<u32>`で返す。商品がなければ`None` |
| `buy(name, count)` | メソッド | 在庫を減らし、合計金額を`Result<u32, StockError>`で返す |

<!-- rustc: expect E0433 -->
```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// 商品を表す構造体Itemを定義せよ（name: String / price: u32 / stock: u32）

// 購入の失敗理由を表す列挙型StockErrorを定義せよ
//   NotFound                 … 商品が見つからない
//   OutOfStock { stock: u32 } … 在庫不足（現在の在庫数を持つ）
// テストのassert_eq!で比較するため #[derive(Debug, PartialEq)] を付けること

// 在庫全体を表す構造体Inventoryを定義せよ（items: Vec<Item>）

// Inventoryのimplブロックにnew・add・find_price・buyを定義せよ

fn sample() -> Inventory {
    let mut inventory = Inventory::new();
    inventory.add("コーヒー豆", 1200, 3);
    inventory.add("マグカップ", 800, 10);
    inventory
}

#[test]
fn test_find_price() {
    let inventory = sample();
    assert_eq!(inventory.find_price("コーヒー豆"), Some(1200));
    assert_eq!(inventory.find_price("マグカップ"), Some(800));
    assert_eq!(inventory.find_price("ビール"), None);
}

#[test]
fn test_buy() {
    let mut inventory = sample();
    assert_eq!(inventory.buy("コーヒー豆", 2), Ok(2400));
    assert_eq!(inventory.buy("コーヒー豆", 1), Ok(1200));
    // 在庫を使い切ったので次は失敗する
    assert_eq!(
        inventory.buy("コーヒー豆", 1),
        Err(StockError::OutOfStock { stock: 0 })
    );
}

#[test]
fn test_buy_not_found() {
    let mut inventory = sample();
    assert_eq!(inventory.buy("ビール", 1), Err(StockError::NotFound));
}

#[test]
fn test_buy_out_of_stock() {
    let mut inventory = sample();
    assert_eq!(
        inventory.buy("コーヒー豆", 5),
        Err(StockError::OutOfStock { stock: 3 })
    );
    // 失敗したときは在庫を減らさない
    assert_eq!(inventory.buy("コーヒー豆", 3), Ok(3600));
}
```

::::details[解答例と解説]
```rust playground
// 商品を表す構造体Itemを定義せよ（name: String / price: u32 / stock: u32）
struct Item {
    name: String,
    price: u32,
    stock: u32,
}

// 購入の失敗理由を表す列挙型StockErrorを定義せよ
//   NotFound                 … 商品が見つからない
//   OutOfStock { stock: u32 } … 在庫不足（現在の在庫数を持つ）
// テストのassert_eq!で比較するため #[derive(Debug, PartialEq)] を付けること
#[derive(Debug, PartialEq)]
enum StockError {
    NotFound,
    OutOfStock { stock: u32 },
}

// 在庫全体を表す構造体Inventoryを定義せよ（items: Vec<Item>）
struct Inventory {
    items: Vec<Item>,
}

// Inventoryのimplブロックにnew・add・find_price・buyを定義せよ
impl Inventory {
    fn new() -> Self {
        Inventory { items: Vec::new() }
    }

    fn add(&mut self, name: &str, price: u32, stock: u32) {
        self.items.push(Item {
            name: String::from(name),
            price,
            stock,
        });
    }

    fn find_price(&self, name: &str) -> Option<u32> {
        for item in &self.items {
            if item.name == name {
                return Some(item.price);
            }
        }

        None
    }

    fn buy(&mut self, name: &str, count: u32) -> Result<u32, StockError> {
        for item in &mut self.items {
            if item.name == name {
                if item.stock < count {
                    return Err(StockError::OutOfStock { stock: item.stock });
                }

                item.stock -= count;
                return Ok(item.price * count);
            }
        }

        Err(StockError::NotFound)
    }
}

fn sample() -> Inventory {
    let mut inventory = Inventory::new();
    inventory.add("コーヒー豆", 1200, 3);
    inventory.add("マグカップ", 800, 10);
    inventory
}

#[test]
fn test_find_price() {
    let inventory = sample();
    assert_eq!(inventory.find_price("コーヒー豆"), Some(1200));
    assert_eq!(inventory.find_price("マグカップ"), Some(800));
    assert_eq!(inventory.find_price("ビール"), None);
}

#[test]
fn test_buy() {
    let mut inventory = sample();
    assert_eq!(inventory.buy("コーヒー豆", 2), Ok(2400));
    assert_eq!(inventory.buy("コーヒー豆", 1), Ok(1200));
    // 在庫を使い切ったので次は失敗する
    assert_eq!(
        inventory.buy("コーヒー豆", 1),
        Err(StockError::OutOfStock { stock: 0 })
    );
}

#[test]
fn test_buy_not_found() {
    let mut inventory = sample();
    assert_eq!(inventory.buy("ビール", 1), Err(StockError::NotFound));
}

#[test]
fn test_buy_out_of_stock() {
    let mut inventory = sample();
    assert_eq!(
        inventory.buy("コーヒー豆", 5),
        Err(StockError::OutOfStock { stock: 3 })
    );
    // 失敗したときは在庫を減らさない
    assert_eq!(inventory.buy("コーヒー豆", 3), Ok(3600));
}
```
第7章以降で学んだものがほぼすべて登場しました。順に見ていきます。

**`Option`と`Result`の使い分け**
`find_price`は`Option`、`buy`は`Result`を返しています。境目は「失敗の理由を伝える必要があるか」です。価格を探して見つからなければ`None`で十分ですが、購入の失敗には「そんな商品はない」と「在庫が足りない」の2種類があり、呼び出し側は区別したいはずです。だから`Result`を選び、エラーの型で理由を表現します。

**エラーの型に列挙型を使う**
問題08では`Result<u32, String>`とエラーをメッセージで表しましたが、ここでは`StockError`という列挙型にしました。文字列と違い、呼び出し側が`match`で理由ごとに処理を分けられ、しかも網羅性チェックが効きます。`OutOfStock { stock: u32 }`のように**エラーが追加の情報を運べる**のも列挙型ならではです。実務のRustでは、エラー型を列挙型で定義するのが標準的なやり方です。

**`#[derive(Debug, PartialEq)]`が必要な理由**
`assert_eq!`は2つの値を比較し、違っていたら中身を表示します。そのため比較する型には「等しさを判定する方法」と「表示する方法」が必要です。`PartialEq`が前者、`Debug`が後者で、単純な列挙型ならどちらも`derive`で自動生成できます。第9章で`{:?}`のために`Debug`を付けたのと同じ仕組みです。

**`&self`と`&mut self`の使い分け**
`find_price`は探すだけなので`&self`、`add`と`buy`は`items`を変更するので`&mut self`です。第10章で学んだ判断がそのまま出てきます。

**`for item in &mut self.items`**
第6章では`for item in &vec`と共有参照で走査しました。書き換えたいときは`&mut`を付けて排他参照で走査します。こうすると`item`は`&mut Item`になり、`item.stock -= count`で中身を更新できます。

**失敗するときは何も変えない**
`buy`は在庫が足りないと判定した時点で`return`し、`item.stock`には一切触れません。「失敗したなら何も起きていない状態にする」のは、状態を持つ処理を書くうえで大事な性質です。`test_buy_out_of_stock`の最後で、失敗した後も在庫3個が残っていることを確認しています。

**見つからなかった場合はループの後に書く**
`find_price`の`None`と`buy`の`Err(StockError::NotFound)`は、どちらも`for`ループを抜けた後にあります。「最後まで探しても見つからなかった」がそのまま「ループが終わった」という位置に対応していて、`return`で途中脱出する形と自然に噛み合います。

:::message{tip}
実際に手を動かして確かめられる余力があれば、`Inventory`に`restock(name, count)`（入荷）や`total_value()`（在庫金額の合計）を足してみてください。どちらも`&mut self`と`&self`、`Option`と`Result`のどちらを選ぶかを考えることになり、この章の内容がそのまま練習になります。
:::
::::

## おわりに

これで全12章、112問が終わりです。おつかれさまでした。

第1章の`println!`から始めて、型と演算、制御フロー、関数、コレクションと基本文法を一通り押さえ、第7章からはRust最大の特徴である所有権・借用へ、そして構造体・列挙型で自分の型を作り、最後に`Option`と`Result`まで到達しました。

振り返ると、Rustの設計には一本の筋が通っていたはずです。**間違いうることを型で表し、コンパイラに確認させる**。可変性を`mut`で明示するのも、所有権と借用を追跡するのも、`match`の網羅性チェックも、nullや例外の代わりに`Option`と`Result`を使うのも、すべて同じ考え方の現れです。コンパイラと言い争っているように感じる時間は、実行時に起きたはずの問題を前借りして潰している時間でもあります。

この問題集では扱わなかったものも、まだたくさんあります。

- **トレイト**とジェネリクス — 型が違っても同じ振る舞いを共有する仕組み。`#[derive(Debug)]`の正体でもあります
- **イテレータ** — `map`・`filter`・`collect`など、ループをより簡潔かつ高速に書くための道具
- **ライフタイム** — 参照がいつまで有効かを明示する記法。第8章の借用の続きにあたります
- **エラーハンドリングの実践** — 独自エラー型の設計、`?`によるエラー型の変換
- **並行処理** — 所有権と借用の規則が、そのままデータ競合の防止に効いてくる領域

次に進むなら、まずは**トレイトとイテレータ**をおすすめします。この2つを覚えると、書けるコードの量と読めるコードの範囲が一気に広がります。

このサイトの[辞書](/dict)には、ここで出てきた用語の解説がそろっています。分からない言葉に出会ったら、いつでも戻ってきてください。
