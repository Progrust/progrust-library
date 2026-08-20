---
title: 第22章 ライフタイム
description: 参照を返す関数に必要な'aのライフタイム注釈、「短い方に合わせる」という検査の仕組み、注釈を省略できる省略規則、参照を持つ構造体とimpl<'a>、文字列リテラルの'static、そしてジェネリクス・トレイト境界・ライフタイム注釈を1つの関数にまとめる応用まで、参照の有効期間をコンパイラに伝える方法を手を動かして学ぶ7問。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "問題集"]
public: true
---

第21章で、トレイトオブジェクトと関連型を扱い、トレイトを中心とした抽象化の道具がひととおり揃いました。トレイト編の最後となるこの章では、ここまでとは少し毛色の違う**ライフタイム**を7問で扱います。

第8章で、参照には「参照先の値より長く生きてはいけない」という規則があることを学びました。あのときはコンパイラが自動で検査してくれていて、私たちは書く位置を直すだけで済みました。1つの関数の中なら、コンパイラは参照がどこで作られ、どこまで使われるかをすべて見渡せるからです。ところが**関数の境界をまたぐ**と事情が変わります。参照を受け取って参照を返す関数や、参照をフィールドに持つ構造体では、「この参照はどの値から借りたものか」をコンパイラが決められない場面が出てきます。そこで登場するのが、`'a`と書くライフタイム注釈です。

なぜライフタイムがトレイト編に入っているのかというと、ライフタイム注釈が**ジェネリクスの一種**だからです。`<T>`が「どんな型でもよい」を表すのと同じように、`<'a>`は「どんな期間でもよい」を表します。宣言する場所も、関数名・構造体名・`impl`の直後と、型引数とまったく同じです。第17章からの知識がそのまま活きます。

進め方は[第21章](/books/rust-learning/trait-objects-and-associated-types)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - 参照を返す関数

[[lifetime-annotation]]・[[lifetime]]・[[reference]]に関する問題です。
次のコードはコンパイルエラー（E0106）になります。エラーメッセージとリンク先の辞書を手がかりに、関数`longest`の**シグネチャだけ**を直して修正してください。

```txt:期待する出力
長い方: プログルストア渋谷本店
```

<!-- rustc: expect E0106 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// 文字数の多い方の文字列を返す（同じなら a を返す）
fn longest(a: &str, b: &str) -> &str {
    if a.chars().count() >= b.chars().count() {
        a
    } else {
        b
    }
}

fn main() {
    let shop = String::from("プログルストア新宿店");
    let branch = String::from("プログルストア渋谷本店");

    let result = longest(&shop, &branch);

    println!("長い方: {result}");
}
```

::::details[解答例と解説]
```rust playground
// 文字数の多い方の文字列を返す（同じなら a を返す）
fn longest(a: &str, b: &str) -> &str { // [!code --]
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str { // [!code ++]
    if a.chars().count() >= b.chars().count() {
        a
    } else {
        b
    }
}

fn main() {
    let shop = String::from("プログルストア新宿店");
    let branch = String::from("プログルストア渋谷本店");

    let result = longest(&shop, &branch);

    println!("長い方: {result}");
}
```
エラーメッセージは`missing lifetime specifier`（E0106）——「ライフタイムの指定がない」です。続けて`this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from 'a' or 'b'`（戻り値は借用した値だが、`a`と`b`のどちらから借りたのかシグネチャに書かれていない）と理由も教えてくれます。

**コンパイラが困っていること**
第8章の問題08で、引数で借りた値の一部を参照で返すのは問題ないと学びました。`longest`が返すのも引数`a`か`b`のどちらかなので、ダングリング参照にはなりません。それでもエラーになるのは、コンパイラが関数を**1つずつ別々に**検査するからです。

`main`側を検査するとき、コンパイラは`longest`の中身を見ません。見るのはシグネチャだけです。`fn longest(a: &str, b: &str) -> &str`というシグネチャからは、戻り値が`shop`を指しているのか`branch`を指しているのか、つまり戻り値を**いつまで使ってよいのか**が分かりません。`if`の結果で変わるのですから、中身を見たとしても決められません。

**ライフタイム注釈で関係を伝える**
そこで、[[lifetime-annotation]]を使って「戻り値の参照は、`a`と`b`の両方が生きている間だけ有効」という関係をシグネチャに書きます。

<!-- rustc: skip -->
```rust:注釈の読み方
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str
//         ^^^^ ① 'a というライフタイムパラメータを宣言する
//                  ^^^     ^^^         ^^^ ② 3つの参照を同じ 'a で結ぶ
```

書き方は第17章のジェネリクスとそっくりです。`<T>`で型引数を宣言してから`T`を使ったように、`<'a>`でライフタイムパラメータを宣言してから、`&'a str`のように`&`の直後に書いて使います。名前はアポストロフィで始まる短い小文字で、最初の1つは`'a`とするのが慣例です。

3つの参照を同じ`'a`で結んだことで、コンパイラは呼び出し側で「戻り値は`shop`と`branch`のどちらか短い方の寿命の範囲でしか使えない」と判断できるようになります。今回は2つとも`main`の終わりまで生きているので、そのまま通ります。

:::message{tip}
注釈を付けても、`shop`や`branch`が生きる長さは1ミリも変わりません。注釈は値の寿命を延ばしたり縮めたりするものではなく、「参照どうしの関係」をコンパイラに伝えるだけの情報です。型注釈が値を変えないのと同じです。
:::
::::

## 02 - ライフタイムは短い方に合わせる

[[lifetime]]・[[scope]]・[[borrow]]に関する問題です。
問題01で完成した`longest`を使ったコードですが、今度は`main`側でコンパイルエラー（E0597）になります。`longest`と変数の宣言はそのままに、`println!`の**位置**を動かして修正してください。

```txt:期待する出力
長い方: プログルストア渋谷本店
```

<!-- rustc: expect E0597 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.chars().count() >= b.chars().count() {
        a
    } else {
        b
    }
}

fn main() {
    let shop = String::from("プログルストア新宿店");
    let result;
    {
        let branch = String::from("プログルストア渋谷本店");
        result = longest(&shop, &branch);
    }

    println!("長い方: {result}");
}
```

::::details[解答例と解説]
```rust playground
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.chars().count() >= b.chars().count() {
        a
    } else {
        b
    }
}

fn main() {
    let shop = String::from("プログルストア新宿店");
    let result;
    {
        let branch = String::from("プログルストア渋谷本店");
        result = longest(&shop, &branch);
        println!("長い方: {result}"); // [!code ++]
    }

    println!("長い方: {result}"); // [!code --]
}
```
エラーメッセージは`'branch' does not live long enough`（E0597）——「`branch`は十分長く生きていない」です。`borrowed value does not live long enough`（借用された値が、参照より先に破棄される）という説明と、`branch`が破棄される位置（内側のブロックの閉じ波括弧）も示してくれます。

**'aは「短い方」になる**
問題01で、`longest`の戻り値は「`a`と`b`の両方が生きている間だけ有効」と宣言しました。両方が生きている期間とは、つまり**短い方に合わせた期間**です。

| 参照 | 参照先が生きている期間 |
| --- | --- |
| `&shop` | `main`の終わりまで |
| `&branch` | 内側のブロックの終わりまで |
| 戻り値`result` | 短い方＝内側のブロックの終わりまで |

ところが元のコードでは、`result`をブロックの外の`println!`で使っています。`result`が実際に指しているのは`branch`の方なので、これは第8章の問題08で学んだ**ダングリング参照**そのものです。コンパイラは`longest`の中身を見なくても、シグネチャの`'a`だけからこの危険を見抜いています。

**修正は「使う位置」を動かすだけ**
`result`を使ってよいのは`branch`が生きている間、つまり内側のブロックの中です。`println!`をブロックの中へ移せば、参照が使われている間は参照先も生きているので検査が通ります。第8章の問題07で学んだとおり、参照のライフタイムは「最後に使われる地点まで」で判定されるので、使う位置を変えるだけで結果が変わるのです。

**もし人間には安全だと分かっていても**
このコードは、文字数の関係から実際には`branch`の方が返ります。しかし仮に`shop`の方が返るような値だったとしても、コンパイラはやはりエラーにします。`'a`の宣言は「どちらが返るか分からないので、短い方に合わせる」という意味だからです。コンパイラが見ているのは実際の値ではなくシグネチャに書かれた関係であり、その関係の範囲で安全が保証されるコードだけが通ります。

:::message{tip}
「参照を返すから面倒なことになる」のであって、戻り値を`String`（所有権ごと返す）にすれば、第8章の問題08と同じようにライフタイムの問題は起きません。参照を返すのは、コピーを避けたい場面での最適化です。迷ったら所有権を返す設計にして、必要になってから参照に変えるのが無理のない進め方です。
:::
::::

## 03 - 注釈が省略できる場合

[[lifetime-annotation]]と[[function]]に関する問題です。
次の関数`item_number`はライフタイム注釈を付けて書かれていますが、この形なら注釈を**すべて取り除いても**コンパイルが通ります。`<'a>`と`'a`をすべて削除し、出力が変わらないことを確認してください。

```txt:期待する出力
商品番号: 1234
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// 商品コード "PRG-1234" から先頭の "PRG-" を除いた番号部分を返す
fn item_number<'a>(code: &'a str) -> &'a str {
    &code[4..]
}

fn main() {
    let code = String::from("PRG-1234");

    let number = item_number(&code);

    println!("商品番号: {number}");
}
```

::::details[解答例と解説]
```rust playground
// 商品コード "PRG-1234" から先頭の "PRG-" を除いた番号部分を返す
fn item_number<'a>(code: &'a str) -> &'a str { // [!code --]
fn item_number(code: &str) -> &str { // [!code ++]
    &code[4..]
}

fn main() {
    let code = String::from("PRG-1234");

    let number = item_number(&code);

    println!("商品番号: {number}");
}
```
問題01の`longest`と同じく参照を受け取って参照を返す関数なのに、こちらは注釈なしで通ります。実は、第8章の問題09や第10章以降で書いてきた参照を返す関数の多くがこの形でした。

**ライフタイム省略規則**
引数の参照が1つしかなければ、戻り値の参照が「どこから借りたものか」は考えるまでもなくその引数です。このような決まりきったパターンについて、コンパイラは次の3つの**ライフタイム省略規則**で注釈を補ってくれます。

1. 引数側の省略されたライフタイムは、それぞれ**別の**ライフタイムパラメータになる
2. 引数側のライフタイムが**ちょうど1つ**なら、それが戻り値のライフタイムになる
3. メソッドで受け手が`&self`または`&mut self`なら、そのライフタイムが戻り値のライフタイムになる

`item_number`に当てはめると、規則1で`code`に`'a`が付き、引数のライフタイムは1つだけなので規則2で戻り値も`'a`になります。つまり、コンパイラの中では元のコードとまったく同じ`fn item_number<'a>(code: &'a str) -> &'a str`として扱われています。省略は「注釈が不要」なのではなく、「書かなくてもコンパイラが同じものを補える」ということです。

一方、問題01の`longest`は、規則1で`a`と`b`に**別々の**`'a`・`'b`が付いた後、引数のライフタイムが2つあるので規則2が使えず、メソッドでもないので規則3も使えません。戻り値のライフタイムが決まらないので、E0106になっていたわけです。

| シグネチャ | 規則 | 結果 |
| --- | --- | --- |
| `fn item_number(code: &str) -> &str` | 1 → 2 | 省略できる |
| `fn longest(a: &str, b: &str) -> &str` | 1のみ | 決められない（E0106） |

**省略できるなら省略する**
省略規則で書ける関数にわざわざ注釈を付けるのは、読み手に「何か特別な事情があるのか」と思わせるだけなので、Rustでは省略するのが一般的です。注釈を書くのは、問題01のように規則では決められない場合に限られます。

:::message{tip}
3つ目の「`&self`があれば戻り値は`self`から借りたことになる」という規則は、問題05で参照を持つ構造体にメソッドを定義するときに効いてきます。第10章で書いてきた`&self`のメソッドが`&str`を返せていたのも、この規則のおかげです。
:::
::::

## 04 - 参照を持つ構造体

[[lifetime-annotation]]・[[struct]]・[[reference]]に関する問題です。
次のコードはコンパイルエラー（E0106）になります。構造体`Receipt`の**定義だけ**を直して修正してください。

```txt:期待する出力
プログルストア新宿店 合計: 1500円
```

<!-- rustc: expect E0106 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Receipt {
    shop_name: &str,
    total: u32,
}

fn main() {
    let shop = String::from("プログルストア新宿店");

    let receipt = Receipt {
        shop_name: &shop,
        total: 1500,
    };

    println!("{} 合計: {}円", receipt.shop_name, receipt.total);
}
```

::::details[解答例と解説]
```rust playground
struct Receipt { // [!code --]
    shop_name: &str, // [!code --]
struct Receipt<'a> { // [!code ++]
    shop_name: &'a str, // [!code ++]
    total: u32,
}

fn main() {
    let shop = String::from("プログルストア新宿店");

    let receipt = Receipt {
        shop_name: &shop,
        total: 1500,
    };

    println!("{} 合計: {}円", receipt.shop_name, receipt.total);
}
```
エラーメッセージは問題01と同じ`missing lifetime specifier`（E0106）で、今度は`expected named lifetime parameter`（名前付きのライフタイムパラメータが必要）と指摘されます。

**構造体では省略できない**
参照をフィールドに持つ[[struct]]では、ライフタイム注釈は常に**必須**です。関数の省略規則のような仕組みはありません。構造体のインスタンスは関数の引数と違って、作られてからどこまで持ち運ばれるかが定義の時点では分からないためです。

書き方は第17章のジェネリック構造体`Point<T>`とそっくりです。構造体名の直後に`<'a>`で宣言し、フィールドの型で`&'a str`として使います。

**`Receipt<'a>`が表していること**
`Receipt<'a>`という型は「`'a`の期間だけ有効な参照を中に持っている構造体」です。言い換えると、**`Receipt`のインスタンスは`shop_name`の参照先より長くは生きられない**という制約を、型そのものが背負っています。

```rust playground
struct Receipt<'a> {
    shop_name: &'a str,
    total: u32,
}

fn main() {
    let receipt;
    {
        let shop = String::from("プログルストア新宿店");
        receipt = Receipt {
            shop_name: &shop,
            total: 1500,
        };
        println!("{} 合計: {}円", receipt.shop_name, receipt.total);
    } // shop はここで破棄される。receipt もここまでしか使えない
}
```

この`println!`をブロックの外に出すと、問題02と同じE0597になります。`Receipt`の中に参照があることを、コンパイラは`<'a>`から知っているからです。

:::message{tip}
参照を持つ構造体は「借りている間だけ使う一時的なデータ」を表すのに向いています。一方、長く持ち回るデータなら、`shop_name: String`のように所有権ごと持たせる方が扱いやすいことがほとんどです。第9章からここまで構造体のフィールドを`String`にしてきたのは、そのためでもあります。どちらにするかは「この構造体は借りた値より長生きする必要があるか」で決めてください。
:::
::::

## 05 - implブロックとライフタイム

[[lifetime-annotation]]・[[impl-block]]・[[method]]に関する問題です。
構造体`Receipt`に、コメントで指示した2つのメソッドを定義してください。

```txt:期待する出力
プログルストア新宿店
プログルストア新宿店 合計: 1500円
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Receipt<'a> {
    shop_name: &'a str,
    total: u32,
}

// Receiptに次の2つのメソッドを定義せよ
//   header  : shop_name をそのまま参照（&str）で返す
//   summary : 「〇〇 合計: 〇〇円」の形の String を返す


fn main() {
    let shop = String::from("プログルストア新宿店");

    let receipt = Receipt {
        shop_name: &shop,
        total: 1500,
    };

    println!("{}", receipt.header());
    println!("{}", receipt.summary());
}
```

::::details[解答例と解説]
```rust playground
struct Receipt<'a> {
    shop_name: &'a str,
    total: u32,
}

// Receiptに次の2つのメソッドを定義せよ
//   header  : shop_name をそのまま参照（&str）で返す
//   summary : 「〇〇 合計: 〇〇円」の形の String を返す
impl<'a> Receipt<'a> { // [!code ++]
    fn header(&self) -> &str { // [!code ++]
        self.shop_name // [!code ++]
    } // [!code ++]

    fn summary(&self) -> String { // [!code ++]
        format!("{} 合計: {}円", self.shop_name, self.total) // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let shop = String::from("プログルストア新宿店");

    let receipt = Receipt {
        shop_name: &shop,
        total: 1500,
    };

    println!("{}", receipt.header());
    println!("{}", receipt.summary());
}
```
**`impl<'a> Receipt<'a>`と書く理由**
ポイントは`impl`ブロックの書き出しです。`Receipt<'a>`のライフタイムは構造体の型の一部なので、第17章で`impl<T> Point<T>`と書いたのと同じように、`impl<'a> Receipt<'a>`と宣言し直します。`impl Receipt {`と書くと、「ライフタイムパラメータが足りない」という別のエラー（E0726）になります。

`impl<'a>`の`'a`は、構造体定義の`'a`と同じ名前である必要はありません。`impl<'r> Receipt<'r>`でも同じ意味です。型引数の`T`を好きな名前にできるのと同じです。

**メソッドの戻り値に注釈がいらない理由**
`header`は参照を返していますが、`fn header(&self) -> &str`と注釈なしで書けています。これは問題03の省略規則3のおかげです。受け手が`&self`なので、戻り値の参照は`self`から借りたものとして扱われます。実際に返している`self.shop_name`は`'a`の参照ですが、`&self`の期間は必ず`'a`の範囲に収まるので、`self`の期間として返しても安全です。

`summary`の方は`String`を返すので、ライフタイムは関係ありません。`format!`で新しい文字列を組み立てて所有権ごと返しています。

:::message{tip}
`impl`ブロックの中で`'a`という名前を一度も使わないなら、`impl Receipt<'_> {`と書くこともできます。`'_`は「ここにライフタイムがあるが、名前を付ける必要はない」というプレースホルダーです。今回の2つのメソッドは`'a`をシグネチャに書いていないので、この短い形にしても同じように動きます。
:::
::::

## 06 - 'staticライフタイム

[[lifetime-annotation]]と[[string-literal]]に関する問題です。
次のコードはコンパイルエラー（E0106）になります。関数`shop_name`は引数を受け取らないのに参照を返そうとしています。エラーメッセージの提案を参考に**戻り値の型**を直し、さらに`main`の後半が問題02と似た形なのにエラーにならない理由を考えてください。

```txt:期待する出力
プログルストア: いらっしゃいませ
渋谷本店
```

<!-- rustc: expect E0106 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn shop_name() -> &str {
    "プログルストア"
}

fn main() {
    let greeting = "いらっしゃいませ";
    println!("{}: {}", shop_name(), greeting);

    let branch;
    {
        let name = "渋谷本店";
        branch = name;
    }
    println!("{branch}");
}
```

::::details[解答例と解説]
```rust playground
fn shop_name() -> &str { // [!code --]
fn shop_name() -> &'static str { // [!code ++]
    "プログルストア"
}

fn main() {
    let greeting = "いらっしゃいませ";
    println!("{}: {}", shop_name(), greeting);

    let branch;
    {
        let name = "渋谷本店";
        branch = name;
    }
    println!("{branch}");
}
```
エラーメッセージは`missing lifetime specifier`（E0106）です。今度は`this function's return type contains a borrowed value, but there is no value for it to be borrowed from`（借用した値を返しているが、借りる元になる値がない）と言われ、`consider using the 'static lifetime`（`'static`ライフタイムの使用を検討せよ）と提案されます。

**`'static`はプログラム全体で有効なライフタイム**
`'static`は、「プログラムが動いている間ずっと有効」という意味の特別なライフタイムです。宣言せずに使える唯一の名前で、自分で`<'static>`と宣言することはできません。

第6章で、文字列リテラルの型は`&str`だと学びました。正確に書くと`&'static str`です。リテラルの文字データは実行ファイルの中に直接埋め込まれていて、プログラムの開始から終了まで消えることがありません。だから「借りる元の値」がなくても、リテラルへの参照は常に有効であり、`'static`として返せます。

**`main`の後半がエラーにならない理由**
`branch`と`name`の形は問題02とそっくりですが、決定的な違いがあります。問題02の`branch`は`String::from`で作った値で、内側のブロックを抜けるときに破棄されました。今回の`name`は文字列リテラルへの参照、つまり`&'static str`です。破棄されるのは参照を入れていた変数`name`だけで、参照先の文字データはプログラムが終わるまで生きています。参照先が生きている限り参照は有効なので、ブロックの外で使っても問題ありません。

| 値 | 参照先が生きている期間 |
| --- | --- |
| `String::from("...")`（問題02） | 所有する変数のスコープの終わりまで |
| `"..."`（文字列リテラル） | プログラムの終了まで（`'static`） |

:::message{tip}
コンパイラが`'static`を提案してくるのは、今回のように本当にリテラルだけを返す場合に限りません。問題01の`longest`のような関数で注釈を忘れたときにも同じ提案が出ることがあります。そこで`&'static str`と書いてしまうと、今度は「`String`から借りた参照は`'static`ではない」という別のエラーになります。提案を見たら、まず「本当にプログラム全体で有効な値を返しているか」を考え、そうでなければ`'a`で引数との関係を書くのが正しい直し方です。
:::
::::

## 07 - 応用: 最長の告知文

[[generics]]・[[trait-bound]]・[[lifetime-annotation]]・[[display-trait]]に関する問題です。
トレイト編のまとめとして、ジェネリクス・トレイト境界・ライフタイム注釈を1つのシグネチャにまとめた関数`longest_with_announcement`を実装し、テストに合格させてください。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
use std::fmt::Display;

// 関数 longest_with_announcement を定義せよ
//   引数  : x: &str, y: &str, ann: T（T は Display を実装する任意の型）
//   動作  : 「お知らせ: 〇〇」の形で ann を出力した後、
//           x と y のうち文字数（chars().count()）の多い方を返す（同じなら x）
//   戻り値: &str

struct Sale {
    rate: u32,
}

impl Display for Sale {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "全品{}%オフ", self.rate)
    }
}

#[test]
fn test_returns_longer() {
    assert_eq!(
        longest_with_announcement("りんご", "グレープフルーツ", "本日のセール"),
        "グレープフルーツ"
    );
    assert_eq!(
        longest_with_announcement("コーヒー豆", "紅茶", 20260821),
        "コーヒー豆"
    );
}

#[test]
fn test_same_length_returns_first() {
    assert_eq!(
        longest_with_announcement("紅茶", "緑茶", Sale { rate: 20 }),
        "紅茶"
    );
}

#[test]
fn test_accepts_string_reference() {
    let shop = String::from("プログルストア新宿店");
    let branch = String::from("渋谷本店");
    let result = longest_with_announcement(&shop, &branch, Sale { rate: 30 });
    assert_eq!(result, "プログルストア新宿店");
}
```

::::details[解答例と解説]
```rust playground
use std::fmt::Display;

// 関数 longest_with_announcement を定義せよ
//   引数  : x: &str, y: &str, ann: T（T は Display を実装する任意の型）
//   動作  : 「お知らせ: 〇〇」の形で ann を出力した後、
//           x と y のうち文字数（chars().count()）の多い方を返す（同じなら x）
//   戻り値: &str
fn longest_with_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str // [!code ++]
where // [!code ++]
    T: Display, // [!code ++]
{ // [!code ++]
    println!("お知らせ: {ann}"); // [!code ++]
    if x.chars().count() >= y.chars().count() { // [!code ++]
        x // [!code ++]
    } else { // [!code ++]
        y // [!code ++]
    } // [!code ++]
} // [!code ++]

struct Sale {
    rate: u32,
}

impl Display for Sale {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "全品{}%オフ", self.rate)
    }
}

#[test]
fn test_returns_longer() {
    assert_eq!(
        longest_with_announcement("りんご", "グレープフルーツ", "本日のセール"),
        "グレープフルーツ"
    );
    assert_eq!(
        longest_with_announcement("コーヒー豆", "紅茶", 20260821),
        "コーヒー豆"
    );
}

#[test]
fn test_same_length_returns_first() {
    assert_eq!(
        longest_with_announcement("紅茶", "緑茶", Sale { rate: 20 }),
        "紅茶"
    );
}

#[test]
fn test_accepts_string_reference() {
    let shop = String::from("プログルストア新宿店");
    let branch = String::from("渋谷本店");
    let result = longest_with_announcement(&shop, &branch, Sale { rate: 30 });
    assert_eq!(result, "プログルストア新宿店");
}
```
この関数は、Rust公式ドキュメント「The Rust Programming Language」がジェネリクス・トレイト・ライフタイムの章の締めくくりに挙げている例と同じ形です。シグネチャ1行に、トレイト編で学んだ3つの要素がすべて入っています。

<!-- rustc: skip -->
```rust:シグネチャの分解
fn longest_with_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str
//                          ^^     ライフタイムパラメータ（第22章）
//                              ^  型引数（第17章）
where
    T: Display, // トレイト境界（第20章）
```

**`<'a, T>`の順序**
ライフタイムパラメータと型引数を両方宣言するときは、**ライフタイムを先**に書きます。`<T, 'a>`の順はコンパイルエラーです。

**それぞれの役割**
`'a`は問題01と同じく、戻り値が`x`と`y`のどちらから借りたものか分からないので、両方と結んでいます。`T: Display`は第20章で学んだトレイト境界で、`ann`を`{ann}`で出力するために必要です。テストでは`&str`・整数・自作の`Sale`と3種類の型を渡していますが、どれも`Display`を実装しているので同じ関数で受け取れます。`Sale`の`Display`実装は第19章で学んだ手動実装そのものです。

境界は`where`句ではなく`fn longest_with_announcement<'a, T: Display>(...)`のように書いても同じ意味です。

**テストでは`println!`が見えない**
`test_accepts_string_reference`は、`&String`を渡しても`&str`として受け取れること（第8章で学んだ参照の自動変換）と、戻り値が`shop`の寿命の範囲で使えることを確認しています。なお、テスト実行時は成功したテストの標準出力が表示されないため、「お知らせ: ...」の出力は画面に出ません。テストが失敗したときだけまとめて表示されます。

:::message{tip}
これで第22章、そしてトレイト編（第17章〜第22章）は終わりです。この章では、関数の境界をまたぐ参照の関係を`'a`で伝える方法、省略規則、参照を持つ構造体と`impl<'a>`、`'static`まで押さえました。ライフタイム注釈は難しそうに見えますが、やっていることは第8章の借用規則をシグネチャに書き出しているだけです。「注釈は寿命を変えない、関係を伝えるだけ」という一点を忘れなければ、エラーメッセージを読んで直せるようになります。

第17章のジェネリクスから始めて、トレイトによる共通の振る舞いの定義、deriveと標準トレイト、トレイト境界と`impl Trait`、トレイトオブジェクトと関連型、そしてライフタイムまで、Rustの抽象化の道具を一通り歩いてきました。`Option`や`Vec`のような標準ライブラリの型がなぜどんな型でも受け入れられるのか、`{}`で表示できる型とできない型の違いは何なのか、振り返ってみると最初の章より見通しよく読めるはずです。おつかれさまでした。

続きの章は順次追加していきます。Rustにはこの先も、クロージャとイテレータ、スマートポインタ、並行処理といった重要な話題があります。どれもトレイトの上に組み立てられている仕組みなので、ここまでの知識がそのまま土台になります。次の章が追加されるまでの間は、この章の`Receipt`を所有権版と参照版の両方で書いてみたり、トレイト編の問題を自分なりに組み合わせたりして、手を動かしてみてください。
:::
::::
