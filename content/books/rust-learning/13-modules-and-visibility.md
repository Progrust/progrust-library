---
title: 第13章 モジュールと公開範囲
description: modによるモジュールの定義、::でたどる呼び出し、pubによる公開の指定、pubが1段しか開かないこと、構造体のフィールドと列挙型のバリアントの違い、子モジュールから見える祖先の非公開項目まで、コードを整理して内側を隠す仕組みを手を動かして学ぶ6問。
created_at: 2026-08-11
updated_at: 2026-08-11
tags: ["プロジェクト構成", "問題集"]
public: true
---

第12章までで、Rustの基本文法・所有権・構造体・列挙型・`Option`と`Result`を一通り学びました。ここからの第13章〜第16章は**プロジェクト構成編**です。書けるコードが増えてきたときに、それをどう整理し、どう分割し、どこまでを外に見せるかを扱います。

その出発点がこの章の**モジュール**です。関数や構造体が増えてくると、1つのファイルにただ並べるだけでは「どれとどれが関係しているのか」が読み取れなくなります。モジュールは関連するものをまとめて名前を付ける入れ物で、これがコードの整理の単位になります。

そしてモジュールにはもう1つ、より重要な役割があります。**外から触れる範囲を決める壁**になることです。Rustでは書いたものはすべて既定で非公開で、外に見せたいものだけを`pub`で1つずつ開けていきます。「この関数は内部の都合で作ったものだから外からは使わせない」という意図を、コメントではなくコンパイラが守るルールとして書けます。

この章はインラインモジュール（1つのファイルの中に`{}`で書くモジュール）だけを扱うので、これまでどおり1つのコードブロックで完結します。ファイルへの分割は第15章です。

進め方は[第12章](/books/rust-learning/option-and-result)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - モジュールを定義する

[[module]]に関する問題です。
`greeting`モジュールの中に`hello`と`bye`の2つの関数を定義して、`main`から呼び出せるようにしてください。

```txt:期待する出力
こんにちは、太郎さん
さようなら、太郎さん
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod greeting {
    // 次の2つの関数をこの中に定義せよ（どちらも引数は名前の&str）
    //   hello: 「こんにちは、〇〇さん」と出力する
    //   bye  : 「さようなら、〇〇さん」と出力する
    // どちらもfnの前にpubを付けること（pubの意味は問題02で扱う）

}

fn main() {
    greeting::hello("太郎");
    greeting::bye("太郎");
}
```

::::details[解答例と解説]
```rust playground
mod greeting {
    // 次の2つの関数をこの中に定義せよ（どちらも引数は名前の&str）
    //   hello: 「こんにちは、〇〇さん」と出力する
    //   bye  : 「さようなら、〇〇さん」と出力する
    // どちらもfnの前にpubを付けること（pubの意味は問題02で扱う）
    pub fn hello(name: &str) { // [!code ++]
        println!("こんにちは、{name}さん"); // [!code ++]
    } // [!code ++]

    pub fn bye(name: &str) { // [!code ++]
        println!("さようなら、{name}さん"); // [!code ++]
    } // [!code ++]
}

fn main() {
    greeting::hello("太郎");
    greeting::bye("太郎");
}
```
[[module]]は、`mod 名前 { ... }`と書いて作る入れ物です。中には関数・構造体・列挙型・定数など、これまで書いてきたものを何でも入れられます。そして中の項目を外から呼ぶときは、`greeting::hello("太郎")`のように`::`でモジュール名から順にたどります。

この`::`は初めて見る記号ではありません。第10章の`Inventory::new()`、第11章の`Drink::Coffee`、第12章の`String::from`と、ずっと使ってきた記号です。どれも「この名前の中にある、この名前」をたどる書き方で、モジュールの場合もまったく同じです。

**モジュールツリー**
モジュールはツリーを作ります。今回のコードなら次の形です。

```text
crate                // クレートルート（ファイルのいちばん外側）
├── greeting
│   ├── hello
│   └── bye
└── main
```

頂点にある`crate`はクレートルートと呼ばれ、モジュールで囲っていないコード（ここでは`mod greeting`と`fn main`）が置かれている場所です。第16章まで、このツリーの図が何度も出てきます。

**名前がぶつからなくなる**
モジュールに分けるいちばん分かりやすい利点は、名前の衝突がなくなることです。同じファイルに`fn hello`を2つ書くとコンパイルエラーになりますが、別々のモジュールに入っていれば共存できます。

<!-- rustc: skip -->
```rust:別のモジュールなら同名でも共存できる
mod greeting {
    pub fn hello() {}
}

mod farewell {
    pub fn hello() {} // greeting::helloとは別物
}
```

呼ぶ側は`greeting::hello()`と`farewell::hello()`で区別します。プログラムが大きくなるほど、この「名前の置き場所を分けられる」という性質が効いてきます。

:::message{tip}
`{}`で中身をその場に書くモジュールを**インラインモジュール**と呼びます。`mod greeting;`とセミコロンで終える書き方もあり、その場合は中身を別のファイルから読み込みます。第15章で扱います。
:::
::::

## 02 - モジュールの中は非公開

[[pub]]と[[module]]に関する問題です。
次のコードはコンパイルエラー（E0603）になります。エラーメッセージを読み、1語だけ足して修正してください。

```txt:期待する出力
本店 10:00-20:00
```

<!-- rustc: expect E0603 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    fn open() {
        println!("本店 10:00-20:00");
    }
}

fn main() {
    shop::open();
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    fn open() { // [!code --]
    pub fn open() { // [!code ++]
        println!("本店 10:00-20:00");
    }
}

fn main() {
    shop::open();
}
```
エラーメッセージは`function 'open' is private`（E0603）です。「`open`は非公開だ」と言われています。

Rustでは、モジュールの中に書いた項目は**すべて既定で非公開**です。パスが正しく書けていても、非公開のものには外から触れません。外に見せたいものには[[pub]]を付けます。

これは他の多くの言語と逆向きの既定値です。何も指定しなければ外から使えてしまう言語では、「外から使われては困るもの」を隠す作業が必要になります。Rustは逆で、既定で全部隠れているところから、公開したいものだけを足し算で開けていきます。

なお、`open`には`pub`が必要なのに、それを囲む`shop`のほうには付けなくても`main`から見えています。この理由は次の問題03で扱います。

**なぜ既定が非公開なのか**
非公開だと分かっている関数は、いつでも自由に書き換えられます。名前を変えても、引数を増やしても、消してしまっても、影響が及ぶのはそのモジュールの中だけだからです。一方、`pub`を付けた瞬間にそれは外との約束になり、変更すると外側のコードが壊れます。既定が非公開であることで、`pub`を書いた場所がそのまま「ここが外との境界です」という宣言になります。

**エラーの読み方**
Playgroundのエラー出力には、非公開である事実に加えて`private function defined here`のように定義位置も示されます。E0603が出たら、まず`pub`の付け忘れを疑ってください。

:::message{warning}
`pub`を付けたということは「外から使われても構わない」と宣言したということです。とりあえず全部に`pub`を付けて回るとエラーは消えますが、モジュールに分けた意味がなくなります。外から呼びたいものにだけ付けるのが原則です。
:::
::::

## 03 - pubが開けるのは1段だけ

[[pub]]と[[module]]に関する問題です。
次のコードは`pub mod cart`と書いてあるのにコンパイルエラー（E0603）になります。エラーメッセージを読んで修正してください。

```txt:期待する出力
合計: 2230円
```

<!-- rustc: expect E0603 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    pub mod cart {
        fn total(prices: &[u32]) -> u32 {
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

fn main() {
    let prices = [980, 1250];
    println!("合計: {}円", shop::cart::total(&prices));
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    pub mod cart {
        fn total(prices: &[u32]) -> u32 { // [!code --]
        pub fn total(prices: &[u32]) -> u32 { // [!code ++]
            let mut sum = 0;
            for price in prices {
                sum += price;
            }
            sum
        }
    }
}

fn main() {
    let prices = [980, 1250];
    println!("合計: {}円", shop::cart::total(&prices));
}
```
エラーは今回も`function 'total' is private`（E0603）で、指されているのは`cart`ではなく`total`です。

[[pub]]が開けるのは**常に1段だけ**です。`pub mod cart`は「`cart`というモジュールの存在を外から見えるようにする」だけで、その中身までは公開しません。中の`total`を使わせたいなら、`total`にも`pub`が要ります。

```text
crate
└── shop            // 非公開（でもmainと同じ場所にあるので見える。後述）
    └── cart        // pub → 見える
        └── total   // 非公開 → ここで止まる
```

**パスは1セグメントずつ検査される**
`shop::cart::total`というパスは、`shop`・`cart`・`total`の3つのセグメントに分かれます。可視性はこの**1つずつ**について確認され、どこか1つでも見えなければアクセスできません。ドアを1枚開けても、その奥にもう1枚閉まったドアがあれば通れないのと同じです。

**`mod shop`に`pub`が要らない理由**
問題02から持ち越した疑問がここで解けます。`shop`には`pub`が付いていないのに、`main`からは見えています。非公開の項目にアクセスできるのは「それを定義したモジュールとその子孫」で、`shop`を定義しているのはクレートルート、`main`がいるのもクレートルートだからです。同じ場所にいるものからは、非公開でも見えます。

見えなくなるのは、外側から内側をのぞこうとしたときです。`cart`から見て`total`は内側にあるので`shop`からは見えず、`shop`から見て`cart`の中身も内側なので見えません。この「内側は隠れる」という一方通行の関係を、問題06でもう一度確かめます。

:::message{tip}
`pub`には`pub(crate)`という書き方もあり、こう書くと「同じクレートの中でだけ公開」になります。クレートを越えて外部に見せたいわけではないが、自分のクレートの別のモジュールからは使いたい、という場面で使います。クレートについては第15章で扱います。
:::
::::

## 04 - 構造体のフィールドは非公開のまま

[[pub]]と[[struct]]と[[method]]に関する問題です。
次のコードはコンパイルエラー（E0616）になります。`issuer`フィールドには`pub`を付けずに（非公開のままにして）、その値を外から読み取れるように修正してください。

```txt:期待する出力
合計: 2230円
発行: レジ1
```

<!-- rustc: expect E0616 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    pub struct Receipt {
        pub total: u32,
        issuer: String, // issuerフィールドにpubを付けて解決してはならない
    }

    impl Receipt {
        // 必要ならここにメソッドを足してよい
    }

    pub fn checkout(prices: &[u32]) -> Receipt {
        let mut total = 0;
        for price in prices {
            total += price;
        }

        Receipt {
            total,
            issuer: String::from("レジ1"),
        }
    }
}

fn main() {
    let receipt = shop::checkout(&[980, 1250]);

    println!("合計: {}円", receipt.total);
    println!("発行: {}", receipt.issuer);
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    pub struct Receipt {
        pub total: u32,
        issuer: String, // issuerフィールドにpubを付けて解決してはならない
    }

    impl Receipt {
        // 必要ならここにメソッドを足してよい
        pub fn issuer(&self) -> &str { // [!code ++]
            &self.issuer // [!code ++]
        } // [!code ++]
    }

    pub fn checkout(prices: &[u32]) -> Receipt {
        let mut total = 0;
        for price in prices {
            total += price;
        }

        Receipt {
            total,
            issuer: String::from("レジ1"),
        }
    }
}

fn main() {
    let receipt = shop::checkout(&[980, 1250]);

    println!("合計: {}円", receipt.total);
    println!("発行: {}", receipt.issuer); // [!code --]
    println!("発行: {}", receipt.issuer()); // [!code ++]
}
```
エラーは`field 'issuer' of struct 'Receipt' is private`（E0616）です。

問題03の「1段だけ」は、モジュールだけの話ではありません。`pub struct Receipt`が公開したのは**構造体そのもの**、つまり「`Receipt`という型が外にあります」ということだけで、フィールドは1つずつ`pub`を付けない限り非公開のままです。だから`total`は読めて`issuer`は読めない、という状態になります。

**なぜフィールドに`pub`を付けさせなかったのか**
`issuer`にも`pub`を付ければエラー自体は消えます。それを禁止してメソッドを書かせたのは、フィールドを公開すると**構造体の中身がそのまま外との約束になってしまう**からです。`pub`なフィールドは外から読めるだけでなく、`mut`な変数なら書き換えもできます。後から`issuer: String`を`issuer: Vec<String>`に変えたくなったとき、公開していたら外側のコードがすべて壊れます。

メソッド経由なら、外との約束は「`issuer()`を呼ぶと`&str`が返る」という1点だけです。中の持ち方を変えても、メソッドの中身を直せば外は無傷で済みます。

**メソッド名とフィールド名は同じでよい**
`issuer`というフィールドと`issuer()`というメソッドは共存できます。フィールドとメソッドは別の名前空間にあり、`receipt.issuer`（フィールド）と`receipt.issuer()`（メソッド呼び出し）は書き方で区別が付くためです。読み取り用メソッドにフィールドと同じ名前を付けるのは、Rustでよく使われる書き方です。

**戻り値が`&str`である理由**
`fn issuer(&self) -> String`にすると`String`のクローンが必要になります。第8章で学んだとおり、読み取るだけなら参照を返せば十分です。`&self.issuer`は`&String`ですが、`&str`を返す関数の中に書けば自動で`&str`に変換されます。

:::message{tip}
「フィールドは非公開にして、必要なものだけメソッドで見せる」というのは、Rustに限らず広く使われている設計です。第10章の`Inventory`は同じファイル内で使っていたので`items`をそのまま触れましたが、モジュールの外に公開する型では、こちらの形が基本になります。
:::
::::

## 05 - 列挙型のバリアントは全部公開

[[pub]]と[[enum]]に関する問題です。
`shop`モジュールの中に、支払い方法を表す列挙型`Payment`を定義してください。

```txt:期待する出力
支払い方法: 現金
支払い方法: カード
支払い方法: QR決済
```

<!-- rustc: expect E0433 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    // Cash・Card・QrCodeの3つのバリアントを持つ列挙型Paymentを定義せよ
    // モジュールの外から使えるようにすること

    pub fn label(payment: &Payment) -> &str {
        match payment {
            Payment::Cash => "現金",
            Payment::Card => "カード",
            Payment::QrCode => "QR決済",
        }
    }
}

fn main() {
    println!("支払い方法: {}", shop::label(&shop::Payment::Cash));
    println!("支払い方法: {}", shop::label(&shop::Payment::Card));
    println!("支払い方法: {}", shop::label(&shop::Payment::QrCode));
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    // Cash・Card・QrCodeの3つのバリアントを持つ列挙型Paymentを定義せよ
    // モジュールの外から使えるようにすること
    pub enum Payment { // [!code ++]
        Cash, // [!code ++]
        Card, // [!code ++]
        QrCode, // [!code ++]
    } // [!code ++]

    pub fn label(payment: &Payment) -> &str {
        match payment {
            Payment::Cash => "現金",
            Payment::Card => "カード",
            Payment::QrCode => "QR決済",
        }
    }
}

fn main() {
    println!("支払い方法: {}", shop::label(&shop::Payment::Cash));
    println!("支払い方法: {}", shop::label(&shop::Payment::Card));
    println!("支払い方法: {}", shop::label(&shop::Payment::QrCode));
}
```
`pub`は`enum`の前に1つ書くだけで、`Cash`・`Card`・`QrCode`のそれぞれに`pub`は要りません。書こうとしても「不要だ」と警告されます。

問題04の構造体と並べると、違いがはっきりします。

| | `pub`を付ける場所 | 中身 |
| --- | --- | --- |
| 構造体 | 型とフィールドに1つずつ | フィールドは非公開のまま |
| 列挙型 | 型に1つだけ | バリアントはすべて公開 |

**なぜ列挙型だけ違うのか**
バリアントを隠した列挙型には、そもそも使い道がないためです。第11章で学んだとおり、列挙型は`match`で分岐して使うものであり、`match`は網羅性チェックのために全バリアントを知っている必要があります。一部のバリアントが見えない列挙型は、外から`match`できません。

構造体は逆で、フィールドの一部だけを見せる形に意味があります。「合計金額は見せるが、どのレジで発行したかは見せない」という設計が成立するからです。`pub`の効き方の違いは、この使われ方の違いから来ています。

**`&Payment`で受け取っている理由**
`label`は表示名を返すだけで、値を消費する必要がありません。第8章で学んだとおり、読み取るだけなら参照で借りるのが基本です。所有権を取る`payment: Payment`にすると、`main`側で同じ値を2回使えなくなります。

なお、`match payment`の`payment`は`&Payment`なのに、パターンには`Payment::Cash`と参照でない形を書いています。第11章の応用問題と同じで、コンパイラが自動で参照をたどってくれます。

:::message{tip}
外に公開する列挙型には注意点もあります。バリアントを1つ足すと、その列挙型を`match`しているすべてのコードが網羅性チェックで壊れます。第16章で扱う「公開API」の設計では、この性質が重要になります。
:::
::::

## 06 - 子は祖先の非公開が見える

[[module]]と[[pub]]に関する問題です。
`cart::checkout`の中身を書いて、税込価格を返してください。

```txt:期待する出力
お支払い金額: 2200円
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
mod shop {
    const TAX_RATE: u32 = 10;

    fn with_tax(price: u32) -> u32 {
        price * (100 + TAX_RATE) / 100
    }

    pub mod cart {
        pub fn checkout(price: u32) -> u32 {
            // 親モジュールshopの非公開関数with_taxを呼び出し、税込価格を返せ
            // shopの中の項目は crate::shop::項目名 でたどれる
            // （パスの書き方そのものは第14章で詳しく扱う）

        }
    }
}

fn main() {
    println!("お支払い金額: {}円", shop::cart::checkout(2000));
}
```

::::details[解答例と解説]
```rust playground
mod shop {
    const TAX_RATE: u32 = 10;

    fn with_tax(price: u32) -> u32 {
        price * (100 + TAX_RATE) / 100
    }

    pub mod cart {
        pub fn checkout(price: u32) -> u32 {
            // 親モジュールshopの非公開関数with_taxを呼び出し、税込価格を返せ
            // shopの中の項目は crate::shop::項目名 でたどれる
            // （パスの書き方そのものは第14章で詳しく扱う）
            crate::shop::with_tax(price) // [!code ++]
        }
    }
}

fn main() {
    println!("お支払い金額: {}円", shop::cart::checkout(2000));
}
```
`with_tax`にも`TAX_RATE`にも`pub`は付いていません。それでも`cart`の中からは呼べます。

非公開の項目にアクセスできるのは、**それを定義したモジュールとその子孫**です。`with_tax`を定義しているのは`shop`で、`cart`はその子なので、`shop`の非公開の項目がすべて見えます。

```text
crate
└── shop
    ├── TAX_RATE  // 非公開 ┐
    ├── with_tax  // 非公開 ┼─ cart からは全部見える
    └── cart      // pub   ┘
```

**逆向きは見えない**
親から子の非公開の項目は見えません。`shop`の中から`cart`の非公開の関数を呼ぼうとすると、外から呼んだときと同じE0603になります。

<!-- rustc: expect E0603 -->
```rust:親からは子の非公開が見えない
mod shop {
    pub mod cart {
        fn secret() -> u32 {
            42
        }
    }

    pub fn call() -> u32 {
        // エラー: E0603（親でも子の非公開には触れない）
        cart::secret()
    }
}

fn main() {
    println!("{}", shop::call());
}
```

つまり可視性は**外から内へは閉じていて、内から外へは開いている**という一方通行の関係になっています。ファイルシステムの権限のように上下対称ではないので、そこだけ注意してください。

**この性質が効く場面**
モジュールの中に補助的な処理をまとめて隠しておき、子モジュールからは自由に使う、という書き方ができます。今回の`with_tax`と`TAX_RATE`がまさにそれで、税率の計算は`shop`の内部事情なので外には見せず、`shop`の中では`cart`からも`checkout`からも使えます。

そしてこの性質は、第14章の最後で扱うテストモジュールの土台でもあります。`#[cfg(test)] mod tests`という子モジュールを作れば、そこから親の非公開の関数をテストできます。「非公開のものはテストできない」という制約がRustにないのは、この規則のおかげです。

:::message{tip}
これで第13章は終わりです。`mod`でコードをまとめ、`pub`で公開範囲を1つずつ決められるようになりました。

次の第14章は、この章で毎回書いていた`shop::cart::total`という**パス**そのものが主役です。`crate::`から書き始める形と現在地から書き始める形の違い、親をたどる`super`、そして長いパスを短く書くための`use`宣言を扱います。この章で「見えるかどうか」を学んだので、次は「どう指すか」です。
:::
::::
