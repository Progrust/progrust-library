---
title: 第10章 メソッドと関連関数
description: implブロックによるメソッド定義、&self・&mut self・selfの使い分け、自動参照とmut、型名::newによるコンストラクタ、implブロックの分割まで、自分の型に振る舞いを与える方法を手を動かして学ぶ8問。
created_at: 2026-08-08
updated_at: 2026-08-08
tags: ["複合型", "問題集"]
public: true
---

第9章では、自分で型を定義してデータをまとめられるようになりました。
この章では、その型に**振る舞い**を与える方法——`impl`ブロックによるメソッドと関連関数——を8問で身につけます。

ここまで`String::from("...")`や`vec.push(3)`のように、型に紐づいた関数をずっと使ってきました。`String::from`のように型名から呼ぶものを**関連関数**、`vec.push`のように値から呼ぶものを**メソッド**と呼びます。この章を終えれば、これらを自分の型にも定義できるようになります。

メソッドはただの関数と違い、第一引数に`self`を取ります。この`self`を`&self`・`&mut self`・`self`のどれで受け取るかは、第8章で学んだ「読むだけか、書き換えるか、所有権ごと消費するか」という判断そのものです。所有権と借用の知識がここで効いてきます。

進め方は[第9章](/books/rust-learning/structs)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - メソッドを定義する

[[impl-block]]と[[method]]に関する問題です。
在庫の合計金額（`price` × `stock`）を返すメソッド`total_price`を定義してください。

```txt:期待する出力
コーヒー豆の在庫金額: 3600円
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    price: u32,
    stock: u32,
}

impl Product {
    // 在庫の合計金額（price × stock）を返すメソッドtotal_priceを定義せよ

}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
        stock: 3,
    };

    println!("{}の在庫金額: {}円", product.name, product.total_price());
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    price: u32,
    stock: u32,
}

impl Product {
    // 在庫の合計金額（price × stock）を返すメソッドtotal_priceを定義せよ
    fn total_price(&self) -> u32 { // [!code ++]
        self.price * self.stock // [!code ++]
    } // [!code ++]
}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
        stock: 3,
    };

    println!("{}の在庫金額: {}円", product.name, product.total_price());
}
```
`impl 型名 { ... }`という形のブロックを[[impl-block]]と呼びます。この中に書いた関数はその型に紐づき、第一引数に`self`を取るものが[[method]]になります。

普通の関数との違いは2つだけです。

| | 普通の関数 | メソッド |
| --- | --- | --- |
| 書く場所 | どこでも | `impl`ブロックの中 |
| 第一引数 | 自由 | `self`（またはその参照） |
| 呼び出し方 | `total_price(&product)` | `product.total_price()` |

`&self`は「このメソッドを呼んだインスタンスへの共有参照」です。中では`self.price`のようにフィールドへアクセスできます。第9章の問題07で書いた`fn print_product(product: &Product)`とやっていることは同じで、引数名が`product`から`self`に変わり、`impl`ブロックの中に移っただけです。

では、なぜ関数ではなくメソッドにするのでしょうか。

- **その型に関する処理が1箇所にまとまる**。`Product`に何ができるのかは`impl Product`を見れば分かります
- **呼び出しが読みやすい**。`total_price(&product)`より`product.total_price()`のほうが「商品の在庫金額」と読めます
- **`&`を書かなくてよい**。メソッド呼び出しでは参照が自動で補われます（問題04で詳しく扱います）

:::message{tip}
`&self`は`self: &Self`の省略記法です。`Self`は`impl`の対象になっている型（ここでは`Product`）を指すエイリアスで、この章の問題06でも使います。省略しない形で`fn total_price(self: &Self) -> u32`と書いても同じ意味ですが、実際のコードではまず見かけません。
:::
::::

## 02 - selfを忘れると

[[method]]と[[impl-block]]に関する問題です。
次のコードはコンパイルエラー（E0424）になります。`with_tax`の定義を1箇所だけ直してください。

```txt:期待する出力
コーヒー豆: 税込み1320円
```

<!-- rustc: expect E0424 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    price: u32,
}

impl Product {
    fn with_tax() -> u32 {
        self.price * 110 / 100
    }
}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    println!("{}: 税込み{}円", product.name, product.with_tax());
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    price: u32,
}

impl Product {
    fn with_tax() -> u32 { // [!code --]
    fn with_tax(&self) -> u32 { // &selfを追加した [!code ++]
        self.price * 110 / 100
    }
}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        price: 1200,
    };

    println!("{}: 税込み{}円", product.name, product.with_tax());
}
```
エラーメッセージは`expected value, found module 'self'`（E0424）で、`self`を書いた箇所には`'self' value is a keyword only available in methods with a 'self' parameter`——「`self`は`self`引数を持つメソッドの中でしか使えないキーワードだ」と説明が付きます。ヒントには`add a 'self' receiver parameter to make the associated 'fn' a method`と、修正方法まで書かれています。

`impl`ブロックの中に書いただけではメソッドになりません。**第一引数に`self`を書いて初めてメソッドになります**。`self`を取らない関数も`impl`ブロックには書けますが、それは[[associated-function]]と呼ばれる別のもので、`product.with_tax()`というドット記法では呼べません（問題06で扱います）。

`self`は引数名であると同時に、Rustのキーワードでもあります。そのため、関数の引数リストに`self`がなければ「そんな値はない」ではなく「メソッドでないと使えないキーワードだ」という専用のエラーになります。

`impl`ブロックの中に書ける2種類を整理しておきます。

| 種類 | 第一引数 | 呼び出し方 |
| --- | --- | --- |
| メソッド | `self`あり | `product.with_tax()` |
| 関連関数 | `self`なし | `Product::with_tax()` |

:::message{tip}
`self`はインスタンスそのものを指すので、`self.price`のようにフィールドへアクセスできるほか、`self.total_price()`のように同じ型の別のメソッドを呼ぶこともできます。他の言語の`this`に近い存在ですが、Rustでは省略できず必ず`self.`を書きます。
:::
::::

## 03 - &mut selfで書き換える

[[method]]と[[reference]]に関する問題です。
在庫を`count`個増やすメソッド`restock`を定義してください。

```txt:期待する出力
コーヒー豆の在庫: 8個
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    stock: u32,
}

impl Product {
    // 在庫をcount個増やすメソッドrestockを定義せよ

}

fn main() {
    let mut product = Product {
        name: String::from("コーヒー豆"),
        stock: 3,
    };

    product.restock(5);

    println!("{}の在庫: {}個", product.name, product.stock);
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    stock: u32,
}

impl Product {
    // 在庫をcount個増やすメソッドrestockを定義せよ
    fn restock(&mut self, count: u32) { // [!code ++]
        self.stock += count; // [!code ++]
    } // [!code ++]
}

fn main() {
    let mut product = Product {
        name: String::from("コーヒー豆"),
        stock: 3,
    };

    product.restock(5);

    println!("{}の在庫: {}個", product.name, product.stock);
}
```
フィールドを書き換えるメソッドは`&mut self`で受け取ります。第8章で学んだ排他参照がそのまま出てきただけで、`&self`のままでは`self.stock += count`が「共有参照から書き換えようとしている」ことになりエラーです。

`self`の後ろには、普通の関数と同じように追加の引数を並べられます。`self`は必ず**第一引数**でなければならない、という点だけが決まりです。

`self`の3つの形式を整理します。この章の問題05で3つめを扱います。

| 記法 | 受け取り方 | 用途 |
| --- | --- | --- |
| `&self` | 共有参照 | フィールドを読むだけ（最も多い） |
| `&mut self` | 排他参照 | フィールドを書き換える |
| `self` | 所有権ごと | インスタンスを消費・変換する |

迷ったらまず`&self`で書き、書き換えが必要になった時点で`&mut self`にする、という順で考えると自然に選べます。

:::message{tip}
第6章で使った`text.push_str("...")`や`numbers.push(3)`も、標準ライブラリの型に定義された`&mut self`メソッドです。「`push`を使うには変数に`mut`が必要」だったのは、排他参照を作るためだったわけです。
:::
::::

## 04 - 自動参照とmut

[[auto-deref]]・[[method]]・[[borrow]]に関する問題です。
次のコードはコンパイルエラー（E0596）になります。`main`の中の**1行に1単語だけ**足して修正してください。

```txt:期待する出力
コーヒー豆の在庫: 10個
```

<!-- rustc: expect E0596 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    stock: u32,
}

impl Product {
    fn restock(&mut self, count: u32) {
        self.stock += count;
    }
}

fn main() {
    let product = Product {
        name: String::from("コーヒー豆"),
        stock: 3,
    };

    product.restock(7);

    println!("{}の在庫: {}個", product.name, product.stock);
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    stock: u32,
}

impl Product {
    fn restock(&mut self, count: u32) {
        self.stock += count;
    }
}

fn main() {
    let product = Product { // [!code --]
    let mut product = Product { // mutを追加した [!code ++]
        name: String::from("コーヒー豆"),
        stock: 3,
    };

    product.restock(7);

    println!("{}の在庫: {}個", product.name, product.stock);
}
```
エラーメッセージは`cannot borrow 'product' as mutable, as it is not declared as mutable`（E0596）です。第8章の問題05とまったく同じ文面ですが、あちらでは`&mut balance`と自分で書いていたのに対し、今回のコードには`&mut`がどこにも見当たりません。

`product.restock(7)`と書いたとき、コンパイラは`restock`の第一引数が`&mut self`であることを見て、**レシーバ（ドットの左側）に`&mut`を自動で補います**。

<!-- rustc: skip -->
```rust:この2行はまったく同じ意味
product.restock(7);
Product::restock(&mut product, 7);
```

この仕組みを[[auto-deref]]と呼びます。メソッドが`&self`を取るなら`&`が、`&mut self`を取るなら`&mut`が自動的に付き、レシーバが参照であれば逆に`*`が補われます。おかげで、どのメソッドを呼ぶときも同じドット記法で書けます。

便利な反面、**借用が起きていることが見た目に現れません**。`product.restock(7)`はただの呼び出しに見えて、実際には`product`を排他借用しています。だからこそ所有者の宣言に`mut`が必要になります。

第8章の問題03で挙げた「3箇所の`mut`」を、メソッド呼び出しの場合に置き換えると次のようになります。

| 場所 | 関数呼び出しの場合 | メソッド呼び出しの場合 |
| --- | --- | --- |
| 所有者の宣言 | `let mut product` | `let mut product`（必要） |
| 参照を作る側 | `&mut product` | 自動で補われる（不要） |
| 受け取る側 | `product: &mut Product` | `&mut self` |

自分で書く`&mut`が消えただけで、借用そのものは起きています。

:::message{tip}
自動参照が働くのは**メソッド呼び出しのときだけ**です。自分で定義した普通の関数に渡すときは`restock(&mut product, 7)`のように`&mut`を書く必要があります。第8章の最後で触れたとおりです。
:::
::::

## 05 - selfで所有権を消費する

[[method]]と[[move]]に関する問題です。
次のコードはコンパイルエラー（E0382）になります。**行の順番を入れ替えるだけ**で、下の出力になるよう修正してください。

```txt:期待する出力
注文内容: コーヒー ×2
レシート: コーヒー ×2
```

<!-- rustc: expect E0382 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Order {
    item: String,
    quantity: u32,
}

impl Order {
    fn into_receipt(self) -> String {
        format!("{} ×{}", self.item, self.quantity)
    }
}

fn main() {
    let order = Order {
        item: String::from("コーヒー"),
        quantity: 2,
    };

    println!("レシート: {}", order.into_receipt());
    println!("注文内容: {} ×{}", order.item, order.quantity);
}
```

::::details[解答例と解説]
```rust playground
struct Order {
    item: String,
    quantity: u32,
}

impl Order {
    fn into_receipt(self) -> String {
        format!("{} ×{}", self.item, self.quantity)
    }
}

fn main() {
    let order = Order {
        item: String::from("コーヒー"),
        quantity: 2,
    };

    println!("レシート: {}", order.into_receipt()); // [!code --]
    println!("注文内容: {} ×{}", order.item, order.quantity); // 先に読んでおく
    println!("レシート: {}", order.into_receipt()); // ここでorderを消費する [!code ++]
}
```
エラーメッセージは`borrow of moved value: 'order'`（E0382）です。第7章で何度も見たムーブのエラーが、メソッド呼び出しで起きています。

`into_receipt`の第一引数は`&self`でも`&mut self`でもなく、参照の付かない`self`です。これは**インスタンスの所有権ごと受け取る**という宣言で、呼び出した時点で`order`の所有権はメソッドへムーブします。メソッドを抜けると`self`は破棄されるので、呼び出し元の`order`は二度と使えません。

つまり`order.into_receipt()`は、第7章で見た`consume(order)`という関数呼び出しとまったく同じことをしています。ドット記法で書かれていると見落としやすいので、`self`を取るメソッドは要注意です。

| 記法 | 呼び出し後のインスタンス |
| --- | --- |
| `&self` | そのまま使える |
| `&mut self` | そのまま使える（中身は変わっているかもしれない） |
| `self` | **もう使えない** |

修正は、`order`を読む行を消費する前に持ってくることです。`into_receipt`を呼んだ後は`order`が存在しないので、それより後に`order.item`を読むことはできません。

`self`を取るメソッドは、**インスタンスを別の形に変換して、元の形はもう使わない**という場面で使います。標準ライブラリでも`String`から`Vec<u8>`を作る`into_bytes`など、`into_`で始まる名前のメソッドがこの形になっているのが慣習です。

:::message{tip}
「消費されるくらいなら全部`&self`にすればよいのでは」と思うかもしれませんが、`self`を取る形にはメリットがあります。所有権を受け取っているのでフィールドをそのまま取り出して使い回せ、複製のコストがかかりません。今回のように「元のインスタンスはもう不要」と分かっているなら、`self`を取るほうが素直です。
:::
::::

## 06 - 関連関数でコンストラクタ

[[associated-function]]と[[impl-block]]に関する問題です。
商品名と価格を受け取り、在庫0の`Product`を返す関連関数`new`を定義し、`main`から呼び出してください。

```txt:期待する出力
コーヒー豆: 1200円 / 在庫0個
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Product {
    name: String,
    price: u32,
    stock: u32,
}

impl Product {
    // 商品名と価格を受け取り、在庫0のProductを返す関連関数newを定義せよ
    // 戻り値の型にはSelfを使うこと

}

fn main() {
    // 関連関数newを呼び出して、商品名「コーヒー豆」・価格1200の商品をproductに束縛せよ

    println!(
        "{}: {}円 / 在庫{}個",
        product.name, product.price, product.stock
    );
}
```

::::details[解答例と解説]
```rust playground
struct Product {
    name: String,
    price: u32,
    stock: u32,
}

impl Product {
    // 商品名と価格を受け取り、在庫0のProductを返す関連関数newを定義せよ
    // 戻り値の型にはSelfを使うこと
    fn new(name: String, price: u32) -> Self { // [!code ++]
        Product { // [!code ++]
            name, // [!code ++]
            price, // [!code ++]
            stock: 0, // [!code ++]
        } // [!code ++]
    } // [!code ++]
}

fn main() {
    // 関連関数newを呼び出して、商品名「コーヒー豆」・価格1200の商品をproductに束縛せよ
    let product = Product::new(String::from("コーヒー豆"), 1200); // [!code ++]

    println!(
        "{}: {}円 / 在庫{}個",
        product.name, product.price, product.stock
    );
}
```
`impl`ブロックの中に書いた、`self`を取らない関数を[[associated-function]]と呼びます。呼び出しはドット記法ではなく`型名::関数名()`の形です。インスタンスがまだ存在しない状態でも呼べるので、**インスタンスを作る「コンストラクタ」として**使われます。

`String::from("...")`や`Vec::new()`も、まさにこの形の関連関数です。第6章から使ってきた`::`の正体がこれでした。

戻り値の`Self`は、`impl`の対象になっている型（ここでは`Product`）を指すエイリアスです。`-> Product`と書いても同じ意味ですが、`Self`と書いておけば型名を変更したときに直す箇所が減るため、こちらが一般的です。

問題03の`build_product`と比べてみてください。やっていることはほぼ同じですが、関連関数にすると次の利点があります。

- `Product`の作り方が`impl Product`の中にまとまる
- `Product::new`という名前で、何を作る関数なのかが明確になる
- `stock: 0`のような**初期値のルールを1箇所に閉じ込められる**

3つめが特に重要です。「新しい商品の在庫は0から始まる」という決まりを`new`の中に書いておけば、インスタンスを作るたびに書き手が気にする必要がなくなります。

:::message{tip}
`new`という名前はRustの予約語ではなく、単なる命名の慣習です。コンパイラが特別扱いすることはありません。引数の組み合わせが複数あるときは`Product::with_stock(...)`のように別の名前を付けて、いくつでも用意できます。
:::
::::

## 07 - implブロックは分割できる

[[impl-block]]に関する問題です。
残高を増やすメソッド`deposit`と、残高を表示するメソッド`show`を定義してください。ただし、**すでに書かれている`impl`ブロックには手を加えないこと**。

```txt:期待する出力
田中さんの残高: 5000円
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct BankAccount {
    owner: String,
    balance: u32,
}

// このimplブロックには手を加えないこと
impl BankAccount {
    fn new(owner: String) -> Self {
        BankAccount { owner, balance: 0 }
    }
}

// 残高をamount円増やすメソッドdepositを定義せよ
// 「〇〇さんの残高: 〇〇円」を表示するメソッドshowを定義せよ


fn main() {
    let mut account = BankAccount::new(String::from("田中"));

    account.deposit(5000);
    account.show();
}
```

::::details[解答例と解説]
```rust playground
struct BankAccount {
    owner: String,
    balance: u32,
}

// このimplブロックには手を加えないこと
impl BankAccount {
    fn new(owner: String) -> Self {
        BankAccount { owner, balance: 0 }
    }
}

// 残高をamount円増やすメソッドdepositを定義せよ
// 「〇〇さんの残高: 〇〇円」を表示するメソッドshowを定義せよ
impl BankAccount { // [!code ++]
    fn deposit(&mut self, amount: u32) { // [!code ++]
        self.balance += amount; // [!code ++]
    } // [!code ++]

    fn show(&self) { // [!code ++]
        println!("{}さんの残高: {}円", self.owner, self.balance); // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let mut account = BankAccount::new(String::from("田中"));

    account.deposit(5000);
    account.show();
}
```
既存の`impl BankAccount`に手を加えられないなら、`impl BankAccount`をもう1つ書けばよい——というのが答えです。

1つの型に対する[[impl-block]]は、**1つにまとめる必要がありません**。今回のように「関連関数のブロック」「メソッドのブロック」と役割で分けたり、ファイルが長くなったときに関心ごとに分けたりできます。分けても呼び出し方は何も変わりません。

もちろん1つのブロックにまとめても正しく動きます。数が増えたときの整理手段として使えると覚えておいてください。

分割しても守られる決まりが1つあります。**同じ名前の関連関数・メソッドは、ブロックをまたいでも重複して定義できません**。

<!-- rustc: skip -->
```rust:これはコンパイルエラー（E0592）
impl BankAccount {
    fn show(&self) {}
}

impl BankAccount {
    fn show(&self) {} // エラー: E0592（重複した定義）
}
```

ブロックが違えば別物として扱われる、ということはありません。あくまで「`BankAccount`に定義されている名前」の一覧が1つあるだけです。

また、`impl`ブロックを書けるのは**その型を定義しているのと同じクレート内**に限られます。標準ライブラリの`Vec`や`String`に、自分のコードから直接メソッドを追加することはできません。

:::message{tip}
`new`の中の`BankAccount { owner, balance: 0 }`では、第9章で学んだフィールド初期化省略記法を使っています。引数名を`owner`にしておいたので`owner: owner`と書かずに済みました。コンストラクタの引数名をフィールド名に揃えるのが定番なのは、このためです。
:::
::::

## 08 - 応用: 銀行口座を作る

第9章からの総復習として、[[struct]]・[[impl-block]]・[[method]]・[[associated-function]]を組み合わせた問題です。
銀行口座を表す構造体`BankAccount`と、その関連関数・メソッドを実装してテストに合格させてください。

| 名前 | 種類 | 内容 |
| --- | --- | --- |
| `new(owner: String)` | 関連関数 | 残高0の口座を作って返す |
| `deposit(amount)` | メソッド | 残高を`amount`円増やす |
| `withdraw(amount)` | メソッド | 残高が足りれば引き出して`true`、足りなければ何もせず`false`を返す |
| `balance()` | メソッド | 現在の残高を返す |
| `summary()` | メソッド | `田中さんの残高は5000円です`の形式の文字列を返す。呼び出した後は、その口座を二度と使えなくすること |

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// 構造体BankAccountを定義せよ（フィールド: owner（String）, balance（u32））

// implブロックにnew・deposit・withdraw・balance・summaryを定義せよ

#[test]
fn test_new_account() {
    let account = BankAccount::new(String::from("田中"));
    assert_eq!(account.balance(), 0);
}

#[test]
fn test_deposit() {
    let mut account = BankAccount::new(String::from("田中"));
    account.deposit(5000);
    account.deposit(3000);
    assert_eq!(account.balance(), 8000);
}

#[test]
fn test_withdraw() {
    let mut account = BankAccount::new(String::from("田中"));
    account.deposit(5000);
    assert_eq!(account.withdraw(2000), true);
    assert_eq!(account.balance(), 3000);
}

#[test]
fn test_withdraw_insufficient() {
    let mut account = BankAccount::new(String::from("田中"));
    account.deposit(1000);
    assert_eq!(account.withdraw(2000), false);
    assert_eq!(account.balance(), 1000); // 失敗しても残高は変わらない
}

#[test]
fn test_summary() {
    let mut account = BankAccount::new(String::from("鈴木"));
    account.deposit(5000);
    assert_eq!(account.summary(), "鈴木さんの残高は5000円です");
}
```

::::details[解答例と解説]
```rust playground
// 構造体BankAccountを定義せよ（フィールド: owner（String）, balance（u32））
struct BankAccount { // [!code ++]
    owner: String, // [!code ++]
    balance: u32, // [!code ++]
} // [!code ++]

// implブロックにnew・deposit・withdraw・balance・summaryを定義せよ
impl BankAccount { // [!code ++]
    fn new(owner: String) -> Self { // [!code ++]
        BankAccount { owner, balance: 0 } // [!code ++]
    } // [!code ++]

    fn deposit(&mut self, amount: u32) { // [!code ++]
        self.balance += amount; // [!code ++]
    } // [!code ++]

    fn withdraw(&mut self, amount: u32) -> bool { // [!code ++]
        if amount > self.balance { // [!code ++]
            return false; // [!code ++]
        } // [!code ++]

        self.balance -= amount; // [!code ++]
        true // [!code ++]
    } // [!code ++]

    fn balance(&self) -> u32 { // [!code ++]
        self.balance // [!code ++]
    } // [!code ++]

    fn summary(self) -> String { // [!code ++]
        format!("{}さんの残高は{}円です", self.owner, self.balance) // [!code ++]
    } // [!code ++]
} // [!code ++]

#[test]
fn test_new_account() {
    let account = BankAccount::new(String::from("田中"));
    assert_eq!(account.balance(), 0);
}

#[test]
fn test_deposit() {
    let mut account = BankAccount::new(String::from("田中"));
    account.deposit(5000);
    account.deposit(3000);
    assert_eq!(account.balance(), 8000);
}

#[test]
fn test_withdraw() {
    let mut account = BankAccount::new(String::from("田中"));
    account.deposit(5000);
    assert_eq!(account.withdraw(2000), true);
    assert_eq!(account.balance(), 3000);
}

#[test]
fn test_withdraw_insufficient() {
    let mut account = BankAccount::new(String::from("田中"));
    account.deposit(1000);
    assert_eq!(account.withdraw(2000), false);
    assert_eq!(account.balance(), 1000); // 失敗しても残高は変わらない
}

#[test]
fn test_summary() {
    let mut account = BankAccount::new(String::from("鈴木"));
    account.deposit(5000);
    assert_eq!(account.summary(), "鈴木さんの残高は5000円です");
}
```
この章で学んだ`self`の3つの形式が、すべて登場しています。

| 名前 | `self`の形 | 理由 |
| --- | --- | --- |
| `new` | なし（関連関数） | インスタンスがまだ存在しない |
| `deposit` | `&mut self` | 残高を書き換える |
| `withdraw` | `&mut self` | 残高を書き換える |
| `balance` | `&self` | 残高を読むだけ |
| `summary` | `self` | 口座を消費して文字列に変換する |

いくつか押さえておきたい点があります。

**`withdraw`は引き算する前に判定する**
`u32`は負の値を表せないので、残高より多い額を引くと実行時にプログラムが停止します（オーバーフロー）。第2章で学んだ整数型の範囲がここで効いてきます。先に`amount > self.balance`を確認し、足りなければ`return false`で早期リターンして、残高には一切触れません。テストの`test_withdraw_insufficient`は、まさにここを確認しています。

**フィールドとメソッドは同じ名前を付けられる**
`balance`というフィールドと`balance()`というメソッドが共存しています。Rustではフィールド名とメソッド名は別々に管理されるため衝突しません。`self.balance`はフィールド、`self.balance()`はメソッドと、括弧の有無で区別されます。読み取り用のメソッドにフィールドと同じ名前を付けるのは、よくある書き方です。

**`summary`が`self`を取る意味**
`format!`でフィールドを読むだけなら`&self`でも書けます。あえて`self`にしているのは「口座の内容をまとめたら、その口座はもう使わない」という意図を型で表すためです。テストでも`account.summary()`が最後の行になっていて、それ以降`account`は使えません。

**`balance`メソッドを用意する理由**
テストは`account.balance`と直接フィールドを読まず、`account.balance()`というメソッドを通しています。今は同じ結果ですが、メソッドを窓口にしておけば、後から「残高の表示だけ手数料を差し引く」といった変更をしたくなったときに`impl`の中だけで対応できます。

:::message{tip}
これで第10章、そして構造体編は終わりです。データをまとめる**構造体**と、そこに振る舞いを与える**メソッド・関連関数**がそろい、自分の型を一通り作れるようになりました。

次の第11章では、もう1つのユーザー定義型である**列挙型**に進みます。構造体が「AもBもCも持つ」型だったのに対し、列挙型は「AかBかCのどれか」を表す型です。そして列挙型を安全に扱うための`match`式は、Rustで最もよく使う道具のひとつになります。
:::
::::
