---
title: 第11章 列挙型とmatch式
description: 列挙型の定義とバリアント、match式による分岐と網羅性チェック、データを持つバリアントの分解、包括パターンと範囲パターン、複数パターンのまとめ方まで、「どれか1つ」を表す型と安全な分岐を手を動かして学ぶ9問。
created_at: 2026-08-08
updated_at: 2026-08-08
tags: ["複合型", "パターンマッチング", "問題集"]
public: true
---

第10章までで、構造体にデータをまとめ、`impl`ブロックで振る舞いを与えられるようになりました。
この章では、もう1つのユーザー定義型である**列挙型**と、それを扱うための`match`式を9問で身につけます。

構造体が「名前も価格も在庫も持つ」という**AもBもCも**の型だったのに対し、列挙型は「支払いは現金かカードかQR決済のどれか」という**AかBかC**を表す型です。取りうる選択肢を型として書き切ってしまうのが列挙型の役割で、そこに`match`式を組み合わせると「どの選択肢を処理し忘れているか」をコンパイラが指摘してくれるようになります。

この「書き忘れたら怒られる」という性質は、次の第12章で扱う`Option`型や`Result`型——Rustがnullや例外の代わりに使う仕組み——を支える土台でもあります。この章は、その手前にある一番大事な準備運動です。

進め方は[第10章](/books/rust-learning/methods-and-associated-functions)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - 列挙型を定義する

[[enum]]に関する問題です。
3種類のドリンクを表す列挙型`Drink`を定義してください。`{:?}`で出力できるようにする必要があります。

```txt:期待する出力
1杯目: Coffee
2杯目: Tea
3杯目: Juice
```

<!-- rustc: expect E0433 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// Coffee・Tea・Juiceの3つのバリアントを持つ列挙型Drinkを定義せよ
// {:?}で出力できるようにすること

fn main() {
    let first = Drink::Coffee;
    let second = Drink::Tea;
    let third = Drink::Juice;

    println!("1杯目: {first:?}");
    println!("2杯目: {second:?}");
    println!("3杯目: {third:?}");
}
```

::::details[解答例と解説]
```rust playground
// Coffee・Tea・Juiceの3つのバリアントを持つ列挙型Drinkを定義せよ
// {:?}で出力できるようにすること
#[derive(Debug)] // [!code ++]
enum Drink { // [!code ++]
    Coffee, // [!code ++]
    Tea, // [!code ++]
    Juice, // [!code ++]
} // [!code ++]

fn main() {
    let first = Drink::Coffee;
    let second = Drink::Tea;
    let third = Drink::Juice;

    println!("1杯目: {first:?}");
    println!("2杯目: {second:?}");
    println!("3杯目: {third:?}");
}
```
`enum 型名 { ... }`と書き、中に取りうる選択肢を並べたものが[[enum]]です。並べた1つ1つを**バリアント**と呼びます。

構造体との違いは、値の作り方を見るとはっきりします。

| | 構造体 | 列挙型 |
| --- | --- | --- |
| 意味 | すべてのフィールドを**同時に**持つ | どれか**1つ**の状態を取る |
| 定義 | `struct Product { name, price }` | `enum Drink { Coffee, Tea, Juice }` |
| 値の作り方 | `Product { name: ..., price: ... }` | `Drink::Coffee` |

バリアントは`Drink::Coffee`のように`型名::バリアント名`で書きます。`Drink::Coffee`と`Drink::Tea`はどちらも型としては`Drink`で、変数に入れたり関数の引数にしたりできます。

`#[derive(Debug)]`は第9章の構造体のときと同じで、`{:?}`での出力をコンパイラに自動生成させる指定です。列挙型でも付け方はまったく同じで、`{:?}`で出力するとバリアント名がそのまま表示されます。

:::message{tip}
「3種類のうちどれか」を`0`・`1`・`2`のような数値や`"coffee"`のような文字列で表すこともできますが、その場合`7`や`"cofee"`のような無効な値をコンパイラは止められません。列挙型にしておけば、`Drink`型の変数には3つのバリアントしか入りようがないので、無効な状態を型のレベルで作れなくできます。
:::
::::

## 02 - match式で分岐する

[[match-expression]]と[[enum]]に関する問題です。
`announce`関数の中身を書いて、バリアントごとにメッセージを出し分けてください。

```txt:期待する出力
コーヒーをどうぞ
ジュースをどうぞ
紅茶をどうぞ
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
enum Drink {
    Coffee,
    Tea,
    Juice,
}

fn announce(drink: Drink) {
    // match式でバリアントごとに次のメッセージを出力せよ
    // Coffee → コーヒーをどうぞ
    // Tea    → 紅茶をどうぞ
    // Juice  → ジュースをどうぞ

}

fn main() {
    announce(Drink::Coffee);
    announce(Drink::Juice);
    announce(Drink::Tea);
}
```

::::details[解答例と解説]
```rust playground
enum Drink {
    Coffee,
    Tea,
    Juice,
}

fn announce(drink: Drink) {
    // match式でバリアントごとに次のメッセージを出力せよ
    // Coffee → コーヒーをどうぞ
    // Tea    → 紅茶をどうぞ
    // Juice  → ジュースをどうぞ
    match drink { // [!code ++]
        Drink::Coffee => println!("コーヒーをどうぞ"), // [!code ++]
        Drink::Tea => println!("紅茶をどうぞ"), // [!code ++]
        Drink::Juice => println!("ジュースをどうぞ"), // [!code ++]
    } // [!code ++]
}

fn main() {
    announce(Drink::Coffee);
    announce(Drink::Juice);
    announce(Drink::Tea);
}
```
[[match-expression]]は、対象の値を上から順にパターンと照合し、**最初に一致した1つ**の処理だけを実行する構文です。`パターン => 処理,`という形の行を**アーム**と呼びます。

<!-- rustc: skip -->
```rust:matchの形
match 対象の値 {
    パターン1 => 処理1,
    パターン2 => 処理2,
}
```

書き方で押さえておくところは3つです。

- アームの区切りは`,`（カンマ）。`{}`で囲んだブロックを書く場合はカンマを省略できます
- 矢印は`=>`（`->`ではありません）
- C言語の`switch`と違い、`break`は不要です。一致したアームだけが実行され、次のアームへ流れ落ちることはありません

`if`式で書けないのかというと、`if drink == Drink::Coffee`のような比較には別途準備が必要なうえ、選択肢が増えるほど`else if`が伸びていきます。列挙型の分岐は`match`式で書くのが基本形だと考えてください。

:::message{tip}
`match`のアームに書けるのはバリアント名だけではありません。数値や文字列のリテラル、範囲、複数パターンのまとめ書きなど、いろいろな「パターン」が書けます。この章の問題07・08で順に扱います。
:::
::::

## 03 - matchは式

[[match-expression]]と[[expression]]に関する問題です。
`let price = 0;`の行を`match`式に書き換えて、ドリンクに応じた価格を`price`に束縛してください。

```txt:期待する出力
お会計: 500円
お会計: 450円
お会計: 400円
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
enum Drink {
    Coffee,
    Tea,
    Juice,
}

fn checkout(drink: Drink) {
    // match式で価格を求めてpriceに束縛せよ
    // Coffee: 500円 / Tea: 450円 / Juice: 400円
    let price = 0;

    println!("お会計: {price}円");
}

fn main() {
    checkout(Drink::Coffee);
    checkout(Drink::Tea);
    checkout(Drink::Juice);
}
```

::::details[解答例と解説]
```rust playground
enum Drink {
    Coffee,
    Tea,
    Juice,
}

fn checkout(drink: Drink) {
    // match式で価格を求めてpriceに束縛せよ
    // Coffee: 500円 / Tea: 450円 / Juice: 400円
    let price = 0; // [!code --]
    let price = match drink { // [!code ++]
        Drink::Coffee => 500, // [!code ++]
        Drink::Tea => 450, // [!code ++]
        Drink::Juice => 400, // [!code ++]
    }; // [!code ++]

    println!("お会計: {price}円");
}

fn main() {
    checkout(Drink::Coffee);
    checkout(Drink::Tea);
    checkout(Drink::Juice);
}
```
`match`はその名のとおり**式**です。第3章で`let x = if ... { ... } else { ... };`と書けたのと同じで、一致したアームの値が`match`式全体の値になります。

`let`文の右辺に置いているので、末尾のセミコロンを忘れないでください。`};`の`;`は`let`文を終わらせるためのものです。

式として使うときの決まりが1つあります。**すべてのアームが同じ型の値を返すこと**です。

<!-- rustc: expect E0308 -->
```rust:これはコンパイルエラー（E0308）
let price = match drink {
    Drink::Coffee => 500,
    Drink::Tea => "450円", // エラー: 他のアームは整数なのに文字列を返している
    Drink::Juice => 400,
};
```

`price`の型は1つに決まらなければならないので、アームごとに違う型を返すことはできません。第3章の`if`式で分岐の型を揃える必要があったのと同じ理由です。

問題02のように`println!`を並べる書き方と比べると、式として使う書き方には利点があります。

- **値を返すことに集中できる**。「価格を決める」処理と「表示する」処理が分かれます
- **書き忘れをコンパイラが防いでくれる**。次の問題04で扱います

:::message{tip}
アームの処理が複数行になるときは`{}`で囲みます。ブロックの最後の式がそのアームの値です。

<!-- rustc: skip -->
```rust:ブロックを使うアーム
let price = match drink {
    Drink::Coffee => {
        println!("挽きたてです");
        500 // ブロックの最後の式がアームの値になる
    }
    Drink::Tea => 450,
    Drink::Juice => 400,
};
```
:::
::::

## 04 - 網羅性チェック

[[match-expression]]と[[enum]]に関する問題です。
次のコードはコンパイルエラー（E0004）になります。1つアームを足して修正してください。

```txt:期待する出力
お会計: 500円
お会計: 450円
お会計: 400円
```

<!-- rustc: expect E0004 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
enum Drink {
    Coffee,
    Tea,
    Juice,
}

fn checkout(drink: Drink) {
    let price = match drink {
        Drink::Coffee => 500,
        Drink::Tea => 450,
    };

    println!("お会計: {price}円");
}

fn main() {
    checkout(Drink::Coffee);
    checkout(Drink::Tea);
    checkout(Drink::Juice);
}
```

::::details[解答例と解説]
```rust playground
enum Drink {
    Coffee,
    Tea,
    Juice,
}

fn checkout(drink: Drink) {
    let price = match drink {
        Drink::Coffee => 500,
        Drink::Tea => 450,
        Drink::Juice => 400, // このアームを追加した [!code ++]
    };

    println!("お会計: {price}円");
}

fn main() {
    checkout(Drink::Coffee);
    checkout(Drink::Tea);
    checkout(Drink::Juice);
}
```
エラーメッセージは`non-exhaustive patterns: 'Drink::Juice' not covered`（E0004）です。「パターンが網羅的でない、`Drink::Juice`が処理されていない」と、**どのバリアントを書き忘れたのかまで名指しで**教えてくれます。

これが`match`式の最大の価値である**網羅性チェック**です。Rustの`match`は、対象の型が取りうる値をすべて処理していなければコンパイルを通しません。

なぜこれが重要なのでしょうか。列挙型は、開発を進める中でバリアントが増えていきます。

```rust:あとからバリアントが増えたとき
enum Drink {
    Coffee,
    Tea,
    Juice,
    Beer, // 新しく追加した
}
```

このとき、`Drink`を`match`しているコードが**すべてコンパイルエラーになります**。プログラムのどこかに対応漏れが残ったまま動いてしまう、ということが起こりません。他の言語の`switch`文なら「気付かないまま何も起こらない分岐」になっていたところを、コンパイラがすべて洗い出してくれます。

:::message{warning}
網羅性チェックを「とりあえず`_ => {}`を最後に足す」でごまかすと、この利点は失われます。バリアントが増えても新しい値は黙って`_`に吸い込まれ、エラーになりません。`_`をいつ使ってよいかは問題07で扱います。
:::
::::

## 05 - データを持つバリアント

[[enum]]と[[match-expression]]に関する問題です。
`Discounted`のアームを追加して、割引額を反映した金額を返してください。基本料金は500円です。

```txt:期待する出力
通常: 500円
割引: 380円
```

<!-- rustc: expect E0004 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
enum Order {
    Regular,
    Discounted(u32), // 割引額（円）
}

fn total(order: Order) -> u32 {
    match order {
        Order::Regular => 500,
        // Discountedのアームを追加せよ
        // 割引額を取り出し、500から引いた金額を返すこと
    }
}

fn main() {
    println!("通常: {}円", total(Order::Regular));
    println!("割引: {}円", total(Order::Discounted(120)));
}
```

::::details[解答例と解説]
```rust playground
enum Order {
    Regular,
    Discounted(u32), // 割引額（円）
}

fn total(order: Order) -> u32 {
    match order {
        Order::Regular => 500,
        // Discountedのアームを追加せよ
        // 割引額を取り出し、500から引いた金額を返すこと
        Order::Discounted(amount) => 500 - amount, // [!code ++]
    }
}

fn main() {
    println!("通常: {}円", total(Order::Regular));
    println!("割引: {}円", total(Order::Discounted(120)));
}
```
バリアントには**データを持たせられます**。`Discounted(u32)`のように括弧を付けて型を書くと、そのバリアントは`u32`の値を1つ抱えるようになります。第9章の[[tuple-struct]]と同じ書き方です。

値の作り方も[[tuple-struct]]と同じで、`Order::Discounted(120)`のように関数呼び出しの形で書きます。

そして取り出し方が`match`のパターンです。

<!-- rustc: skip -->
```rust:パターンで値を取り出す
Order::Discounted(amount) => 500 - amount,
//                 ^^^^^^ ここに書いた名前に、抱えている値が束縛される
```

`amount`は新しく作られる変数で、`Discounted`が持っている`u32`の値がそこに入ります。アームの右側（`=>`の後ろ）でだけ使えます。名前は自由に付けられるので、`Order::Discounted(x)`と書けば`x`という名前になります。

これが列挙型の強力なところです。「割引注文のときだけ割引額が存在する」という関係を型で表現できていて、しかも**割引額を使えるのは`Discounted`のアームの中だけ**です。`Regular`のアームで割引額を読もうとしても、そんな変数は存在しません。存在しない値をうっかり読むコードが書けない構造になっています。

各バリアントは、それぞれ違う個数・違う型のデータを持てます。

```rust:バリアントごとに持つデータは自由
enum Payment {
    Cash,               // データなし
    Card(String),       // カード番号
    Point(u32, String), // ポイント数と会員ID
}
```

:::message{tip}
今回は`500 - amount`という引き算をしているので、割引額が500円を超えると`u32`の範囲を下回って実行時に停止します。第10章の`withdraw`と同じ注意点です。実際のコードでは引く前に大小を比較するか、割引後の金額が0未満にならないようにする必要があります。
:::
::::

## 06 - 構造体的バリアント

[[enum]]と[[match-expression]]に関する問題です。
`Shipping`のアームを追加して、配送先と送料を出力してください。

```txt:期待する出力
店頭受け取りです
東京都渋谷区へ配送します（送料500円）
```

<!-- rustc: expect E0004 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
enum Delivery {
    Pickup,
    Shipping { address: String, fee: u32 },
}

fn announce(delivery: Delivery) {
    match delivery {
        Delivery::Pickup => println!("店頭受け取りです"),
        // Shippingのアームを追加せよ
        // 「〇〇へ配送します（送料〇〇円）」と出力すること
    }
}

fn main() {
    announce(Delivery::Pickup);
    announce(Delivery::Shipping {
        address: String::from("東京都渋谷区"),
        fee: 500,
    });
}
```

::::details[解答例と解説]
```rust playground
enum Delivery {
    Pickup,
    Shipping { address: String, fee: u32 },
}

fn announce(delivery: Delivery) {
    match delivery {
        Delivery::Pickup => println!("店頭受け取りです"),
        // Shippingのアームを追加せよ
        // 「〇〇へ配送します（送料〇〇円）」と出力すること
        Delivery::Shipping { address, fee } => { // [!code ++]
            println!("{address}へ配送します（送料{fee}円）"); // [!code ++]
        } // [!code ++]
    }
}

fn main() {
    announce(Delivery::Pickup);
    announce(Delivery::Shipping {
        address: String::from("東京都渋谷区"),
        fee: 500,
    });
}
```
バリアントは`{ ... }`で**名前付きフィールド**を持つこともできます。定義も値の作り方も構造体そのままで、`Delivery::Shipping { address: ..., fee: ... }`と書きます。

パターンでの分解も構造体の作り方に似た形です。

<!-- rustc: skip -->
```rust:名前付きフィールドを取り出す
Delivery::Shipping { address, fee } => { ... }
//                   ^^^^^^^  ^^^ フィールド名を書くと、同じ名前の変数に束縛される
```

第9章のフィールド初期化省略記法と同じく、`address: address`のような重複を書かずに済むようになっています。別の名前を付けたい場合は`Delivery::Shipping { address: to, fee: cost }`のように`フィールド名: 新しい名前`と書きます。

バリアントが持つデータの形は、これで3種類すべてがそろいました。

| 形 | 定義 | パターン |
| --- | --- | --- |
| データなし | `Pickup` | `Delivery::Pickup` |
| タプル的 | `Discounted(u32)` | `Order::Discounted(amount)` |
| 構造体的 | `Shipping { address: String, fee: u32 }` | `Delivery::Shipping { address, fee }` |

どれを選ぶかの目安は、データが1つか2つで意味が明らかなら括弧の形、フィールドが増えて名前がないと分からなくなってきたら`{}`の形です。

:::message{tip}
フィールドの一部だけを使いたいときは、`..`で残りを省略できます。

<!-- rustc: skip -->
```rust:必要なフィールドだけ取り出す
Delivery::Shipping { fee, .. } => println!("送料は{fee}円です"),
```

第9章の構造体更新記法で出てきた`..`と見た目は同じですが、こちらは「残りのフィールドには興味がない」という意味です。
:::
::::

## 07 - 包括パターン

[[catch-all-pattern]]・[[match-expression]]・[[range-expression]]に関する問題です。
2つの関数の`match`に、それぞれ最後のアームを追加してください。`describe`では貯まっているポイント数を出力し、`is_free_drink`ではポイント数を使いません。

```txt:期待する出力
ポイントはありません
あと少しで特典です
150ポイント貯まっています
無料ドリンク券は使えません
無料ドリンク券が使えます
```

<!-- rustc: expect E0004 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn describe(points: u32) {
    match points {
        0 => println!("ポイントはありません"),
        1..=99 => println!("あと少しで特典です"),
        // 100以上をまとめて処理するアームを追加せよ
        // 「〇〇ポイント貯まっています」と出力すること
    }
}

fn is_free_drink(points: u32) {
    match points {
        100 => println!("無料ドリンク券が使えます"),
        // それ以外をまとめて処理するアームを追加せよ
        // 「無料ドリンク券は使えません」と出力すること（ポイント数は使わない）
    }
}

fn main() {
    describe(0);
    describe(30);
    describe(150);

    is_free_drink(150);
    is_free_drink(100);
}
```

::::details[解答例と解説]
```rust playground
fn describe(points: u32) {
    match points {
        0 => println!("ポイントはありません"),
        1..=99 => println!("あと少しで特典です"),
        // 100以上をまとめて処理するアームを追加せよ
        // 「〇〇ポイント貯まっています」と出力すること
        other => println!("{other}ポイント貯まっています"), // [!code ++]
    }
}

fn is_free_drink(points: u32) {
    match points {
        100 => println!("無料ドリンク券が使えます"),
        // それ以外をまとめて処理するアームを追加せよ
        // 「無料ドリンク券は使えません」と出力すること（ポイント数は使わない）
        _ => println!("無料ドリンク券は使えません"), // [!code ++]
    }
}

fn main() {
    describe(0);
    describe(30);
    describe(150);

    is_free_drink(150);
    is_free_drink(100);
}
```
`u32`が取りうる値は約43億通りあるので、列挙型のようにすべてのアームを書き並べることはできません。そこで残り全部をまとめて引き受けるのが[[catch-all-pattern]]です。書き方は2通りあります。

| 書き方 | 呼び名 | 値 |
| --- | --- | --- |
| `other =>` | 識別子パターン | 変数`other`に束縛され、アームの中で使える |
| `_ =>` | ワイルドカードパターン | 捨てられる。アームの中では使えない |

**値を使うなら識別子パターン、使わないなら`_`** という単純な使い分けです。`_`のところに`other`と書いても動きますが、使っていない変数として警告が出ます。

`1..=99`は第3章で学んだ範囲の記法です。`match`のパターンとしても書けて、`1`から`99`までのどれかに一致します。

:::message{warning}
包括パターンは**必ず最後のアームに置いてください**。上から順に照合されるため、先頭に置くとすべての値がそこで吸い込まれ、以降のアームには何も届きません。この場合コンパイラが「到達不能パターン」の警告を出します。
:::

問題04で「`_`でごまかすと網羅性チェックの利点が失われる」と書いたことと、今回`_`を使ったことは矛盾していません。判断の基準は次のとおりです。

- **列挙型を`match`するとき**は、`_`を避けてバリアントを1つずつ書く。バリアントが増えたときにコンパイラが漏れを教えてくれます
- **数値や文字列のように値を列挙しきれない型**では、`_`や識別子パターンが必要です

:::message{tip}
`0`のような具体的な値も`match`のパターンです。`0`と`1..=99`のように、種類の違うパターンを同じ`match`の中に混ぜて書けます。
:::
::::

## 08 - 複数パターンをまとめる

[[match-expression]]に関する問題です。
次のコードは正しく動きますが、同じ処理が2回ずつ書かれています。`|`を使ってアームを2つにまとめてください。出力は変わりません。

```txt:期待する出力
ホットもご用意できます
ホットもご用意できます
冷たいドリンクのみです
冷たいドリンクのみです
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
enum Drink {
    Coffee,
    Tea,
    Juice,
    Water,
}

fn serve_hot(drink: Drink) {
    match drink {
        Drink::Coffee => println!("ホットもご用意できます"),
        Drink::Tea => println!("ホットもご用意できます"),
        Drink::Juice => println!("冷たいドリンクのみです"),
        Drink::Water => println!("冷たいドリンクのみです"),
    }
}

fn main() {
    serve_hot(Drink::Coffee);
    serve_hot(Drink::Tea);
    serve_hot(Drink::Juice);
    serve_hot(Drink::Water);
}
```

::::details[解答例と解説]
```rust playground
enum Drink {
    Coffee,
    Tea,
    Juice,
    Water,
}

fn serve_hot(drink: Drink) {
    match drink {
        Drink::Coffee => println!("ホットもご用意できます"), // [!code --]
        Drink::Tea => println!("ホットもご用意できます"), // [!code --]
        Drink::Juice => println!("冷たいドリンクのみです"), // [!code --]
        Drink::Water => println!("冷たいドリンクのみです"), // [!code --]
        Drink::Coffee | Drink::Tea => println!("ホットもご用意できます"), // [!code ++]
        Drink::Juice | Drink::Water => println!("冷たいドリンクのみです"), // [!code ++]
    }
}

fn main() {
    serve_hot(Drink::Coffee);
    serve_hot(Drink::Tea);
    serve_hot(Drink::Juice);
    serve_hot(Drink::Water);
}
```
1つのアームに複数のパターンを書きたいときは`|`（パイプ）で区切ります。「`Coffee`または`Tea`なら」という意味で、どれかに一致すればそのアームが実行されます。

`||`（論理和）ではなく`|`が1本である点に注意してください。第2章で学んだ論理演算子とは別物で、これは**パターンの区切り**です。

`_`で書いてしまうのとは何が違うのでしょうか。今回のコードは`_ => println!("冷たいドリンクのみです")`と書いても同じ出力になりますが、`|`で明示的に並べておくと**バリアントが増えたときにコンパイラが教えてくれます**。

```rust:あとからBeerを追加すると
enum Drink {
    Coffee,
    Tea,
    Juice,
    Water,
    Beer, // 追加
}
```

`|`で並べていればE0004になり、「ビールはホットで出すのか」を必ず判断させられます。`_`で書いていれば黙って「冷たいドリンクのみ」に分類され、誰も気付きません。問題07で触れた「列挙型では`_`を避ける」は、こういう場面のことです。

`|`は数値のパターンでも使えます。範囲と混ぜることもできます。

<!-- rustc: skip -->
```rust:数値でまとめる
match day {
    1 | 2 | 3 | 4 | 5 => println!("平日"),
    6 | 7 => println!("週末"),
    _ => println!("そんな曜日はありません"),
}
```

:::message{tip}
値を持つバリアントを`|`でまとめる場合、**すべてのパターンが同じ名前・同じ型の変数を束縛していなければなりません**。アームの中でその変数が使える保証が必要だからです。

<!-- rustc: skip -->
```rust:これはOK
Order::Discounted(amount) | Order::Coupon(amount) => println!("{amount}円引き"),
```
:::
::::

## 09 - 応用: 図形の面積

この章の総復習として、[[enum]]・[[method]]・[[match-expression]]を組み合わせた問題です。
図形を表す列挙型`Shape`と、そのメソッドを実装してテストに合格させてください。

| バリアント | 持つデータ | 面積 |
| --- | --- | --- |
| `Circle` | `f64`（半径） | 半径 × 半径 × 円周率 |
| `Rectangle` | `width`・`height`（`f64`） | 幅 × 高さ |
| `Triangle` | `base`・`height`（`f64`） | 底辺 × 高さ ÷ 2 |

メソッドは2つです。面積を返す`area`と、図形の名前（`円`・`長方形`・`三角形`）を`String`で返す`name`。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
use std::f64::consts::PI; // 円周率

// 図形を表す列挙型Shapeを定義せよ
//   Circle    … 半径をf64で1つ持つ（タプル的バリアント）
//   Rectangle … width・heightをf64で持つ（構造体的バリアント）
//   Triangle  … base・heightをf64で持つ（構造体的バリアント）

// implブロックにareaとnameの2つのメソッドを定義せよ

#[test]
fn test_circle() {
    let shape = Shape::Circle(2.0);
    assert_eq!(shape.area(), PI * 2.0 * 2.0);
    assert_eq!(shape.name(), "円");
}

#[test]
fn test_rectangle() {
    let shape = Shape::Rectangle {
        width: 3.0,
        height: 4.0,
    };
    assert_eq!(shape.area(), 12.0);
    assert_eq!(shape.name(), "長方形");
}

#[test]
fn test_triangle() {
    let shape = Shape::Triangle {
        base: 6.0,
        height: 4.0,
    };
    assert_eq!(shape.area(), 12.0);
    assert_eq!(shape.name(), "三角形");
}

#[test]
fn test_total_area() {
    let shapes = vec![
        Shape::Rectangle {
            width: 3.0,
            height: 4.0,
        },
        Shape::Triangle {
            base: 6.0,
            height: 4.0,
        },
    ];

    let mut total = 0.0;
    for shape in &shapes {
        total += shape.area();
    }

    assert_eq!(total, 24.0);
}
```

::::details[解答例と解説]
```rust playground
use std::f64::consts::PI; // 円周率

// 図形を表す列挙型Shapeを定義せよ
//   Circle    … 半径をf64で1つ持つ（タプル的バリアント）
//   Rectangle … width・heightをf64で持つ（構造体的バリアント）
//   Triangle  … base・heightをf64で持つ（構造体的バリアント）
enum Shape { // [!code ++]
    Circle(f64), // [!code ++]
    Rectangle { width: f64, height: f64 }, // [!code ++]
    Triangle { base: f64, height: f64 }, // [!code ++]
} // [!code ++]

// implブロックにareaとnameの2つのメソッドを定義せよ
impl Shape { // [!code ++]
    fn area(&self) -> f64 { // [!code ++]
        match self { // [!code ++]
            Shape::Circle(radius) => PI * radius * radius, // [!code ++]
            Shape::Rectangle { width, height } => width * height, // [!code ++]
            Shape::Triangle { base, height } => base * height / 2.0, // [!code ++]
        } // [!code ++]
    } // [!code ++]

    fn name(&self) -> String { // [!code ++]
        match self { // [!code ++]
            Shape::Circle(_) => String::from("円"), // [!code ++]
            Shape::Rectangle { .. } => String::from("長方形"), // [!code ++]
            Shape::Triangle { .. } => String::from("三角形"), // [!code ++]
        } // [!code ++]
    } // [!code ++]
} // [!code ++]

#[test]
fn test_circle() {
    let shape = Shape::Circle(2.0);
    assert_eq!(shape.area(), PI * 2.0 * 2.0);
    assert_eq!(shape.name(), "円");
}

#[test]
fn test_rectangle() {
    let shape = Shape::Rectangle {
        width: 3.0,
        height: 4.0,
    };
    assert_eq!(shape.area(), 12.0);
    assert_eq!(shape.name(), "長方形");
}

#[test]
fn test_triangle() {
    let shape = Shape::Triangle {
        base: 6.0,
        height: 4.0,
    };
    assert_eq!(shape.area(), 12.0);
    assert_eq!(shape.name(), "三角形");
}

#[test]
fn test_total_area() {
    let shapes = vec![
        Shape::Rectangle {
            width: 3.0,
            height: 4.0,
        },
        Shape::Triangle {
            base: 6.0,
            height: 4.0,
        },
    ];

    let mut total = 0.0;
    for shape in &shapes {
        total += shape.area();
    }

    assert_eq!(total, 24.0);
}
```
列挙型に`impl`ブロックを書けることに気付けたでしょうか。構造体とまったく同じ書き方で、メソッドも関連関数も定義できます。

「図形の種類ごとに面積の求め方が違う」という状況は、列挙型と`match`がぴったり合う典型例です。面積の計算式が3か所に散らばるのではなく、`area`メソッドの中の`match`に集まります。図形の種類が増えたら、`area`と`name`がコンパイルエラーになって「両方に追記が必要だ」と教えてくれます。

いくつか押さえておきたい点があります。

**`match self`と書けるのはなぜか**
`self`は`&Shape`（共有参照）なのに、パターンには`Shape::Circle(radius)`と参照でない形を書いています。これはコンパイラが自動で参照を辿ってくれるためで、束縛される`radius`のほうが`&f64`になります。`PI * radius * radius`のように、そのまま計算に使えます。

**`_`と`..`で「中身は見ない」と書く**
`name`メソッドでは、どのバリアントかだけが分かれば十分で、中のデータは使いません。タプル的バリアントは`Shape::Circle(_)`、構造体的バリアントは`Shape::Rectangle { .. }`と書いて「中身には興味がない」ことを示します。フィールド名を書いてしまうと、使っていない変数として警告が出ます。

**`assert_eq!(shape.name(), "円")`が通る理由**
`name`が返すのは`String`、比較相手は`&str`と、型が違います。それでも比較できるのは、標準ライブラリが`String`と`&str`の比較をあらかじめ用意しているからです。

**小数の比較には注意が必要**
`test_circle`が`assert_eq!(shape.area(), PI * 2.0 * 2.0)`と、答えを直接書かずに同じ式で書いてあるのは意図的です。第2章で触れたとおり`f64`は誤差を持つため、`3.14159265358979`のような数値を書いても一致するとは限りません。実務では`(a - b).abs() < 0.000001`のように「十分近いか」で判定します。

:::message{tip}
これで第11章は終わりです。列挙型で「どれか1つ」を表し、`match`式で漏れなく分岐できるようになりました。

次の第12章では、ここで学んだ道具がそのまま効いてくる`Option`型と`Result`型に進みます。どちらも標準ライブラリで定義された**ただの列挙型**です。「値があるかないか」「成功したか失敗したか」を列挙型で表すことで、Rustはnullも例外も使わずに安全性を確保しています。網羅性チェックがどれほど強力な仕組みなのか、次章で実感できるはずです。
:::
::::
