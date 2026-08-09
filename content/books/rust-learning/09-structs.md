---
title: 第9章 構造体
description: 構造体の定義とインスタンス作成、フィールドの書き換え、初期化省略記法、derive(Debug)による出力、構造体更新記法とムーブ、参照渡し、タプル構造体とニュータイプパターン、ユニット様構造体まで、自分で型を作る第一歩を手を動かして学ぶ10問。
created_at: 2026-08-08
updated_at: 2026-08-08
tags: ["複合型", "問題集"]
public: true
---

ここからは、**自分で型を作る**話に入ります。
この章では、関連する値をひとまとめにして名前を付ける**構造体**を10問で身につけます。

第5章のタプルでも複数の値をまとめられましたが、`.0`・`.1`という番号でしか要素を区別できず、何番目が何なのかはコードを書いた本人しか分かりませんでした。構造体を使えば、それぞれの値に名前を付けたうえで、まとまり自体にも型としての名前を与えられます。

そして構造体は、第7章・第8章で学んだ所有権や借用のルールがそのまま適用される場所でもあります。「フィールドがムーブする」「構造体を借用する」といった話が何度も出てくるので、前の章の内容を思い出しながら進めてください。

進め方は[第8章](/books/rust-learning/references-and-borrowing)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - 構造体を定義する

[[struct]]に関する問題です。
商品を表す構造体`Product`を定義し、インスタンスを作って各フィールドを出力してください。フィールドは次の3つです。

| フィールド名 | 型 | 値 |
| --- | --- | --- |
| `name` | `String` | `コーヒー豆` |
| `price` | `u32` | `1200` |
| `in_stock` | `bool` | `true` |

```txt:期待する出力
商品名: コーヒー豆
価格: 1200円
在庫あり: true
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// 上の表のフィールド名と型で構造体Productを定義せよ

fn main() {
    // 上の表の値でProductのインスタンスを作り、変数productに束縛せよ

    println!("商品名: {}", product.name);
    println!("価格: {}円", product.price);
    println!("在庫あり: {}", product.in_stock);
}
```

::::details[解答例と解説]
```rust playground
// 上の表のフィールド名と型で構造体Productを定義せよ
struct Product { // [!code ++]
    name: String, // [!code ++]
    price: u32, // [!code ++]
    in_stock: bool, // [!code ++]
} // [!code ++]

fn main() {
    // 上の表の値でProductのインスタンスを作り、変数productに束縛せよ
    let product = Product { // [!code ++]
        name: String::from("コーヒー豆"), // [!code ++]
        price: 1200, // [!code ++]
        in_stock: true, // [!code ++]
    }; // [!code ++]

    println!("商品名: {}", product.name);
    println!("価格: {}円", product.price);
    println!("在庫あり: {}", product.in_stock);
}
```
`struct`キーワードで[[struct]]を定義します。書くのは**フィールドの名前と型**だけで、値はまだ入れません。定義は「こういう形の型を作る」という設計図にあたるもので、実際のデータは持ちません。

<!-- rustc: skip -->
```rust:定義の書き方
struct 構造体名 {
    フィールド名: 型,
    フィールド名: 型,
}
```

インスタンス（実際の値）を作るときは`構造体名 { フィールド名: 値, ... }`と書き、**全フィールドに値を渡します**。1つでも欠けるとコンパイルエラーです。値を取り出すときは`product.name`のようにドットでフィールド名を指定します。

第5章のタプルと比べると、構造体の利点がはっきりします。

| | タプル | 構造体 |
| --- | --- | --- |
| 型の書き方 | `(String, u32, bool)` | `Product` |
| 要素の指定 | `product.0` | `product.name` |
| 定義の必要 | 不要 | 必要 |

タプルは定義なしですぐ使える手軽さがありますが、`product.2`が在庫の有無だと分かるのは書いた本人だけです。構造体はあらかじめ定義する手間がかかるかわりに、`product.in_stock`と書けば誰が読んでも意味が分かります。

:::message{tip}
構造体の名前は`Product`のように大文字始まりのキャメルケース、フィールド名は`in_stock`のようにスネークケースで書くのが慣習です。小文字始まりの構造体名でもコンパイルは通りますが、警告が出ます。
:::
::::

## 02 - フィールドを書き換える

[[struct]]と[[variable]]に関する問題です。
次のコードはコンパイルエラー（E0594）になります。`main`の中の**1行に1単語だけ**足して修正してください。

```txt:期待する出力
コーヒー豆: 1320円
```

<!-- rustc: expect E0594 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    price: u32,
}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    product.price = 1320;

    println!("{}: {}円", product.name, product.price);
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    price: u32,
}

fn main() {
    let product = Product { // [!code --]
    let mut product = Product { // mutを追加した [!code ++]
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    product.price = 1320;

    println!("{}: {}円", product.name, product.price);
}
```
エラーメッセージは`cannot assign to 'product.price', as 'product' is not declared as mutable`（E0594）——「`product`は可変として宣言されていないので、`product.price`に代入できない」です。

第1章で学んだ「変数はデフォルトで不変」というルールは、構造体のフィールドにもそのまま効きます。フィールドを書き換えたければ、**インスタンスを束縛する変数**に`mut`を付けます。

ここで注意したいのは、`mut`が付くのは**インスタンス単位**だという点です。「`price`だけ可変にする」といった指定はできません。

<!-- rustc: skip -->
```rust:こう書くことはできない
struct Product {
    name: String,
    mut price: u32, // フィールドごとにmutは付けられない
}
```

`let mut product`と書いた時点で、`name`も`price`もどちらも書き換え可能になります。逆に`mut`を付けなければ、どのフィールドも書き換えられません。

:::message{tip}
第8章の借用規則を思い出すと、この仕様には理由があります。`&mut product`という排他参照を作れば、その参照からはどのフィールドも書き換えられます。フィールド単位で可変性が違うと、この「インスタンスへの排他参照」が何を許可しているのか決まらなくなってしまいます。
:::
::::

## 03 - フィールド初期化省略記法

[[struct]]と[[function]]に関する問題です。
引数から`Product`を作って返す関数`build_product`の中身を書いてください。引数名とフィールド名が同じであることを活かした書き方があります。

```txt:期待する出力
紅茶: 420円
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    price: u32,
}

fn build_product(name: String, price: u32) -> Product {
    // 引数nameとpriceからProductを作って返せ

}

fn main() {
    let product = build_product(String::from("紅茶"), 420);

    println!("{}: {}円", product.name, product.price);
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    price: u32,
}

fn build_product(name: String, price: u32) -> Product {
    // 引数nameとpriceからProductを作って返せ
    Product { name, price } // name: name, price: price の省略形 [!code ++]
}

fn main() {
    let product = build_product(String::from("紅茶"), 420);

    println!("{}: {}円", product.name, product.price);
}
```
`Product { name: name, price: price }`と書いても正解ですが、**フィールド名と同じ名前の変数がその場にある**とき、`フィールド名: 変数名`を`フィールド名`だけに省略できます。これを**フィールド初期化省略記法**と呼びます。

| 書き方 | 意味 |
| --- | --- |
| `Product { name: name, price: price }` | 省略しない形 |
| `Product { name, price }` | 省略記法（同じ意味） |

省略できるのは名前が完全に一致するときだけです。`Product { name, price: price * 2 }`のように、一部だけ省略して残りは普通に書く、という混在もできます。

関数の引数名をフィールド名に合わせておくと、この記法がそのまま使えるため、構造体を作る関数では引数名をフィールド名と揃えるのが定番です。第10章で学ぶコンストラクタでも、この書き方が頻繁に登場します。

:::message{tip}
今回の関数は`Product`を戻り値として返しているので、第7章で学んだとおり所有権ごと呼び出し元へムーブします。引数で受け取った`name`（`String`）の所有権も、構造体のフィールドへ移動しています。構造体は、フィールドに入れた値の所有者になります。
:::
::::

## 04 - 構造体のDebug出力

[[struct]]と[[console-output]]に関する問題です。
次のコードはコンパイルエラー（E0277）になります。構造体の定義に**1行足すだけ**で修正できます。

```txt:期待する出力
Product { name: "コーヒー豆", price: 1200 }
```

<!-- rustc: expect E0277 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    price: u32,
}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    println!("{:?}", product);
}
```

::::details[解答例と解説]
```rust playground
#[derive(Debug)] // この1行を追加した [!code ++]
struct Product {
    name: String,
    price: u32,
}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    println!("{:?}", product);
}
```
エラーメッセージは`'Product' doesn't implement 'Debug'`（E0277）です。続けて`add '#[derive(Debug)]' to 'Product' or manually 'impl Debug for Product'`と、直し方まで書かれています。

`{}`はユーザーに見せるための表示、`{:?}`はプログラマがデバッグのために中身を覗くための表示です。第5章で配列やタプルを`{:?}`で出力したときは何もせずに使えましたが、**自分で定義した構造体は、そのままでは`{}`でも`{:?}`でも出力できません**。どう表示すべきかをコンパイラが知らないためです。

そこで定義の直前に`#[derive(Debug)]`と書きます。`derive`は「導出する」という意味で、構造体の定義内容からデバッグ表示のコードをコンパイラに自動生成させる指定です。これで`{:?}`が使えるようになります。

`{:#?}`と書くと、フィールドごとに改行した見やすい形になります。フィールドの多い構造体ではこちらが便利です。

```rust playground
#[derive(Debug)]
struct Product {
    name: String,
    price: u32,
}

fn main() {
    let product = Product { name: String::from("コーヒー豆"), price: 1200 };

    println!("{product:?}");  // Product { name: "コーヒー豆", price: 1200 }
    println!("{product:#?}"); // 改行して整形表示
}
```

:::message{tip}
`#[derive(Debug)]`を付けても`{}`では出力できないままです。`{}`での表示は「ユーザーに見せる文字列」なので、`price`を「1200」と出すか「1,200円」と出すかといった判断は自動生成できません。`{}`を使いたい場合は表示方法を自分で書く必要があります。まずは`{:?}`で中身を確認する、と覚えておいてください。
:::
::::

## 05 - 構造体更新記法

[[struct-update-syntax]]と[[struct]]に関する問題です。
`standard`をもとに、`price`だけを`1980`に変えたインスタンス`premium`を作ってください。他のフィールドは`standard`と同じ値です。

```txt:期待する出力
Plan { price: 980, days: 30, auto_renew: true }
Plan { price: 1980, days: 30, auto_renew: true }
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
#[derive(Debug)]
struct Plan {
    price: u32,
    days: u32,
    auto_renew: bool,
}

fn main() {
    let standard = Plan {
        price: 980,
        days: 30,
        auto_renew: true,
    };

    // standardをもとに、priceだけ1980にしたインスタンスpremiumを作れ

    println!("{:?}", standard);
    println!("{:?}", premium);
}
```

::::details[解答例と解説]
```rust playground
#[derive(Debug)]
struct Plan {
    price: u32,
    days: u32,
    auto_renew: bool,
}

fn main() {
    let standard = Plan {
        price: 980,
        days: 30,
        auto_renew: true,
    };

    // standardをもとに、priceだけ1980にしたインスタンスpremiumを作れ
    let premium = Plan { // [!code ++]
        price: 1980, // [!code ++]
        ..standard // 残りのフィールドはstandardから引き継ぐ [!code ++]
    }; // [!code ++]

    println!("{:?}", standard);
    println!("{:?}", premium);
}
```
`..standard`と書くと、**明示的に指定しなかったフィールドを`standard`から引き継ぎます**。これを[[struct-update-syntax]]と呼びます。今回は`days`と`auto_renew`が引き継がれました。

フィールドが3つ程度なら全部書いてもさほど変わりませんが、フィールドが10個あって1つだけ違うインスタンスを作りたい、という場面では書く量が大きく変わります。

書く場所には決まりがあり、**`..base`は必ずフィールド列の最後**に置きます。

| 書き方 | 可否 |
| --- | --- |
| `Plan { price: 1980, ..standard }` | ○ |
| `Plan { ..standard, price: 1980 }` | ×（構文エラー） |

引き継ぐフィールドを個別に選ぶことはできません。`..base`は常に「まだ埋まっていないフィールドすべて」を担当します。

:::message{tip}
`..`という記号は第3章の[[range-expression]]（`0..5`）でも使いましたが、まったくの別物です。構造体のインスタンス作成の中に出てくる`..`は範囲ではなく「残りのフィールド」を意味します。
:::
::::

## 06 - 更新記法とムーブ

[[struct-update-syntax]]と[[move]]に関する問題です。
次のコードはコンパイルエラー（E0382）になります。`..regular`という書き方は残したまま、`large`を作った後も`regular`を使えるように修正してください。

```txt:期待する出力
コーヒー 250ml: 480円
コーヒー 400ml: 580円
```

<!-- rustc: expect E0382 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Drink {
    name: String,
    price: u32,
    size_ml: u32,
    iced: bool,
}

fn main() {
    let regular = Drink {
        name: String::from("コーヒー"),
        price: 480,
        size_ml: 250,
        iced: false,
    };

    let large = Drink {
        price: 580,
        size_ml: 400,
        ..regular
    };

    println!("{} {}ml: {}円", regular.name, regular.size_ml, regular.price);
    println!("{} {}ml: {}円", large.name, large.size_ml, large.price);
}
```

::::details[解答例と解説]
```rust playground
struct Drink {
    name: String,
    price: u32,
    size_ml: u32,
    iced: bool,
}

fn main() {
    let regular = Drink {
        name: String::from("コーヒー"),
        price: 480,
        size_ml: 250,
        iced: false,
    };

    let large = Drink {
        name: regular.name.clone(), // Stringのフィールドだけ明示してクローンする [!code ++]
        price: 580,
        size_ml: 400,
        ..regular // 残りのiced（bool）はコピーで引き継がれる
    };

    println!("{} {}ml: {}円", regular.name, regular.size_ml, regular.price);
    println!("{} {}ml: {}円", large.name, large.size_ml, large.price);
}
```
エラーメッセージは`borrow of moved value: 'regular.name'`（E0382）です。第7章で見たムーブのエラーですが、ムーブされたものが`regular`ではなく`regular.name`という**フィールド単位**で示されているところに注目してください。

`..regular`で引き継がれるフィールドは、第7章で学んだムーブの規則にそのまま従います。フィールドの型によって挙動が分かれるところがポイントです。

| フィールド | 型 | `..regular`での挙動 | `regular`側のその後 |
| --- | --- | --- | --- |
| `name` | `String` | ムーブ | 使用不可 |
| `iced` | `bool` | コピー | 使用可 |

つまり`..regular`は「`regular`まるごと」をムーブするのではなく、**実際に引き継いだフィールドだけ**をムーブします。今回は`name`がムーブしてしまったため、後から`regular.name`を読もうとしてエラーになりました。`regular.price`や`regular.size_ml`は明示的に指定していて引き継がれていないので、そのまま読めます。

修正方法は、**ムーブされて困るフィールドだけを明示的に指定する**ことです。`name: regular.name.clone()`と書けば`name`は`..regular`の担当から外れ、ムーブは起きません。残った`iced`は`bool`なのでコピーされ、`regular`は無傷のまま残ります。

`..regular`を消して4フィールド全部を書いても動きますが、フィールドが増えたときに効いてくるのは今回の書き方です。「引き継ぎたいものは`..base`に任せ、ムーブされると困るものだけ手前で処理する」と覚えてください。

:::message{tip}
`regular`を作った後にもう使わないのであれば、クローンは不要です。`..regular`でムーブさせてしまって構いません。クローンには複製のコストがかかるので、「エラーが出たらとりあえずclone」ではなく、**移動元を後で使うかどうか**で判断してください。
:::
::::

## 07 - 構造体を参照で渡す

[[struct]]・[[reference]]・[[borrow]]に関する問題です。
商品を借りて`商品名: 価格円`の形式で表示する関数`print_product`を定義してください。所有権は奪わず、何度でも呼び出せるようにします。

```txt:期待する出力
コーヒー豆: 1200円
コーヒー豆: 1200円
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    price: u32,
}

// Productを借りて「名前: 価格円」を表示する関数print_productを定義せよ

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    print_product(&product);
    print_product(&product); // 借りているだけなので何度でも渡せる
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    price: u32,
}

// Productを借りて「名前: 価格円」を表示する関数print_productを定義せよ
fn print_product(product: &Product) { // [!code ++]
    println!("{}: {}円", product.name, product.price); // [!code ++]
} // [!code ++]

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    print_product(&product);
    print_product(&product); // 借りているだけなので何度でも渡せる
}
```
第8章で`&String`を受け取ったときとまったく同じです。自分で定義した型でも、参照の型は元の型に`&`を付けた`&Product`になります。

もし引数を`product: Product`にしていたら、1回目の`print_product(product)`で所有権がムーブして、2回目の呼び出しがE0382になっていました。読むだけの関数は共有参照で受け取る、というRustの基本形は構造体でも変わりません。

注目したいのは**関数の中身が変わらない**点です。`product.name`という書き方は、`product`が`Product`でも`&Product`でも同じように使えます。

```rust:参照でもドットの書き方は変わらない playground
struct Product {
    name: String,
    price: u32,
}

fn main() {
    let product = Product { name: String::from("コーヒー豆"), price: 1200 };
    let borrowed = &product;

    println!("{}", borrowed.name);    // *を書かなくてよい
    println!("{}", (*borrowed).name); // これと同じ意味
}
```

第8章の問題04で「メソッド呼び出しやフィールドアクセスでは参照外しが自動で行われる」と説明したのがこれです。参照越しにフィールドへアクセスするときは、`*`を自分で書く必要がありません。

:::message{tip}
フィールドを書き換える関数を書きたければ`&mut Product`を受け取ります。第8章の`&mut String`と同じで、呼び出し側は`print_product(&mut product)`、所有者は`let mut product`にする必要があります。
:::
::::

## 08 - タプル構造体

[[tuple-struct]]に関する問題です。
お店の位置を表すタプル構造体`Position`を定義してください。フィールドは`i32`が2つ（x座標・y座標）です。

```txt:期待する出力
x座標: 3
y座標: 5
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// i32を2つ持つタプル構造体Positionを定義せよ

fn main() {
    let shop = Position(3, 5);

    println!("x座標: {}", shop.0);
    println!("y座標: {}", shop.1);
}
```

::::details[解答例と解説]
```rust playground
// i32を2つ持つタプル構造体Positionを定義せよ
struct Position(i32, i32); // [!code ++]

fn main() {
    let shop = Position(3, 5);

    println!("x座標: {}", shop.0);
    println!("y座標: {}", shop.1);
}
```
フィールドに名前を付けず、型だけを並べて定義する構造体を[[tuple-struct]]と呼びます。波括弧ではなく丸括弧で書き、末尾にセミコロンが必要です。

インスタンスの作り方が独特で、`Position(3, 5)`という**関数呼び出しの形**になります。タプル構造体を定義すると、型名と同じ名前のコンストラクタが自動的に作られるためです。フィールドへのアクセスは、[[tuple]]と同じく`.0`・`.1`と番号で行います。

第5章のタプル、この問題のタプル構造体、問題01からの構造体を並べると違いがはっきりします。

| | フィールド名 | 型としての名前 |
| --- | --- | --- |
| タプル `(i32, i32)` | なし（位置） | なし |
| タプル構造体 `Position(i32, i32)` | なし（位置） | あり |
| 構造体 `Position { x: i32, y: i32 }` | あり | あり |

タプル構造体は、この2つのちょうど中間にあたります。「フィールド名を付けるほどでもないけれど、値のまとまりに型としての名前は与えたい」という場面で使います。座標のように`x`・`y`と書いても情報が増えない場合が典型例です。

:::message{tip}
`let Position(x, y) = shop;`と書くと、第5章のタプルと同じように分解できます。タプルと違って型名`Position`を書く必要がある点だけ異なります。
:::
::::

## 09 - ニュータイプパターン

[[tuple-struct]]に関する問題です。
次のコードはコンパイルエラー（E0308）になります。`main`の中を1箇所だけ変えて修正してください。

```txt:期待する出力
華氏: 77度
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Celsius(f64);   // 摂氏
struct Fahrenheit(f64); // 華氏

fn to_fahrenheit(temperature: Celsius) -> Fahrenheit {
    Fahrenheit(temperature.0 * 9.0 / 5.0 + 32.0)
}

fn main() {
    let temperature = Fahrenheit(25.0);

    let result = to_fahrenheit(temperature);

    println!("華氏: {}度", result.0);
}
```

::::details[解答例と解説]
```rust playground
struct Celsius(f64);   // 摂氏
struct Fahrenheit(f64); // 華氏

fn to_fahrenheit(temperature: Celsius) -> Fahrenheit {
    Fahrenheit(temperature.0 * 9.0 / 5.0 + 32.0)
}

fn main() {
    let temperature = Fahrenheit(25.0); // [!code --]
    let temperature = Celsius(25.0); // 摂氏25度に修正した [!code ++]

    let result = to_fahrenheit(temperature);

    println!("華氏: {}度", result.0);
}
```
エラーメッセージは`mismatched types`（E0308）で、引数の位置に`expected 'Celsius', found 'Fahrenheit'`——「`Celsius`を期待したのに`Fahrenheit`が来た」と示されます。摂氏を華氏に変換する関数に、華氏の値を渡してしまっていました。

`Celsius`も`Fahrenheit`も、中身は同じ`f64`が1つです。それでもRustは**別の型として完全に区別**します。フィールドが1つだけのタプル構造体で既存の型を包み、意味の違いを型として表すこの書き方を**ニュータイプパターン**と呼びます。

第4章の問題08でも温度変換の関数を書きましたが、あのときの引数は素の`f64`でした。

<!-- rustc: skip -->
```rust:第4章の書き方
fn to_fahrenheit(celsius: f64) -> f64 { ... }

let temperature = 25.0; // 摂氏なのか華氏なのか、値だけでは分からない
let result = to_fahrenheit(temperature);
```

この形では、華氏の値を渡してもコンパイラは何も言いません。数値としてはどちらも`f64`だからです。間違いに気づけるのは、出力を見て「なんだかおかしい」と思ったときになります。ニュータイプパターンで包んでおけば、**取り違えた時点でコンパイルエラーになります**。

単位・IDの種類・税抜きと税込みの価格など、「同じ型だけれど混ぜてはいけない値」がコード上に複数あるときに効く手法です。実行時のコストはかからないので、迷ったら包んでおく価値があります。

:::message{tip}
包んだ値を計算に使うには`temperature.0`のように中身を取り出す必要があり、そのぶん記述は少し増えます。この手間を減らすために、第10章で学ぶメソッドを定義して`temperature.to_fahrenheit()`のように書けるようにするのが一般的です。
:::
::::

## 10 - ユニット様構造体

[[unit-like-struct]]に関する問題です。
フィールドを1つも持たない構造体`Guest`を定義してください。`{:?}`で出力できるようにもしてください。

```txt:期待する出力
Guest
会員登録なしでもご利用いただけます
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// フィールドを持たない構造体Guestを定義せよ（{:?}で出力できるようにすること）

fn main() {
    let visitor = Guest;

    println!("{:?}", visitor);
    println!("会員登録なしでもご利用いただけます");
}
```

::::details[解答例と解説]
```rust playground
// フィールドを持たない構造体Guestを定義せよ（{:?}で出力できるようにすること）
#[derive(Debug)] //  [!code ++]
struct Guest; //  [!code ++]

fn main() {
    let visitor = Guest;

    println!("{:?}", visitor);
    println!("会員登録なしでもご利用いただけます");
}
```
`struct Guest;`のようにフィールドリストごと省略した構造体を[[unit-like-struct]]と呼びます。保持する値がない点が、第4章で学んだ[[unit-type]]`()`に似ているためこの名前が付いています。

インスタンスの作り方も独特で、**型名をそのまま書くだけ**です。`Guest { }`とも`Guest()`とも書きません。定義すると型名と同じ名前の定数が暗黙に作られるため、`let visitor = Guest;`でインスタンスが得られます。

ここまでで、`struct`キーワードで定義できる3つの形がそろいました。

| 定義 | 呼び名 | インスタンスの作り方 |
| --- | --- | --- |
| `struct Product { name: String }` | 構造体 | `Product { name: ... }` |
| `struct Position(i32, i32);` | タプル構造体 | `Position(3, 5)` |
| `struct Guest;` | ユニット様構造体 | `Guest` |

値を1つも持たない型に何の意味があるのか、と思うかもしれません。使いどころは**振る舞いだけを持たせたい型**です。次の章で学ぶメソッドはフィールドがなくても定義できるので、「状態は持たないが処理はまとめたい」という型をユニット様構造体で作れます。

```rust:サイズは0バイト playground
#[derive(Debug)]
struct Guest;

fn main() {
    println!("{}バイト", size_of::<Guest>()); // 0バイト
}
```

フィールドを持たないので、実行時のメモリを1バイトも消費しません。型としての区別だけがコンパイル時に存在し、実行時には何も残らない、という使い方ができます。

:::message{tip}
これで第9章は終わりです。自分で型を定義して、値をまとめたり意味の違いを表したりできるようになりました。

ただし今の構造体は、データを入れる箱でしかありません。次の第10章では、その型に**振る舞い**を与える方法——`impl`ブロックによるメソッドと関連関数——を学びます。`String::from`や`vec.push()`のように、ここまで使ってきた「型に紐づいた関数」を自分の型にも定義できるようになります。
:::
::::
