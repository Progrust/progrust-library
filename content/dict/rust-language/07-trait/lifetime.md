---
title: ライフタイム
description: 参照が有効であり続ける期間。コンパイラは「参照が使われている間、参照先の値が生きているか」を追跡し、ダングリング参照をコンパイル時に防ぐ仕組み。
created_at: 2026-08-20
updated_at: 2026-08-20
tags: ["所有権", "型システム"]
public: true
---

ライフタイム（lifetime）は、[[reference]]が**有効であり続ける期間**です。Rustのすべての参照はライフタイムを持ち、その多くは型と同じように明示せずともコンパイラが推論します[^1]。[[borrow-checker]]は「参照が使われている間、参照先の値がまだ生きているか」をコンパイル時に検査し、参照先が先に破棄されるコードをエラーにします[^2]。

<!-- rustc: expect E0597 -->
```rust playground
fn main() {
    let store_name; // 参照を入れる変数（この時点では空）
    {
        let name = String::from("プログルストア新宿店");
        store_name = &name; // エラー: E0597（name は内側のブロックを抜けると破棄される）
    } // ← name はここで破棄されるが…
    println!("{store_name}"); // …参照はここでまだ使われている
}
```

## コンパイラが追跡しているもの

ライフタイムの検査は、次の2つの期間を突き合わせて行われます。

| 追跡対象 | 何で決まるか | 上の例では |
| --- | --- | --- |
| 参照先の値が生きている期間 | 値を所有する[[variable]]の[[scope]]。ブロックを抜けると破棄される[^3] | `name`は内側のブロックの終わりまで |
| 参照が使われている期間（ライフタイム） | 参照が作られてから、制御フロー上でその参照が**まだ使われうる地点**まで（概ね最後の使用地点まで）[^4] | `store_name`は`println!`まで |

参照のライフタイムは、参照先の値が生きている期間に**収まっていなければなりません**。上の例ではこの条件が崩れるため、「`name`は十分長く生きていない（does not live long enough）」という形でエラーになります[^5]。逆に言えば、[[borrow]]した参照を使い終えるより長く元の値を生かしておけば、検査はそのまま通ります。

```rust playground
fn main() {
    let name = String::from("プログルストア新宿店"); // name を外側のブロックへ移す
    let store_name = &name; // 参照は name より長く生きない
    println!("{store_name}"); // OK
}
```

## ダングリング参照・NLLとの関係

ライフタイムの主な目的は、破棄済みの値を指す[[dangling-reference]]を作らせないことです[^2]。「参照先の値が先に死ぬ」のが問題の本質で、上の例のように破棄前に検出されればE0597、[[function]]のローカルな値への参照を戻り値として返せばE0515になります（詳細は[[dangling-reference]]と[[borrow-checker]]を参照）。

また、参照のライフタイムは変数の字句上の[[scope]]ではなく、[[non-lexical-lifetimes]]により「制御フロー上でその参照が最後に使われる地点まで」として判定されます[^4]。そのため参照を保持する変数がまだスコープ内にあっても、使い終えた後なら元の値を書き換えられます。

:::message{info}
ライフタイムは値の寿命を**延ばしたり縮めたりするものではありません**。コンパイラが期間の整合性を検査するための情報であり、プログラマが`'a`のような注釈を書く場合も、複数の参照のライフタイムどうしの関係を伝えるだけで、値が生きる長さは変わりません[^6]。注釈の書き方は別項で扱います。<!-- TODO: [[lifetime-annotation]] 作成後にリンク -->
:::

## 補足

:::details[ライフタイムは推論されるのが基本]
ライフタイムが明示的な注釈なしで済むのは、1つの関数の中ではコンパイラが参照の作成地点と最後の使用地点をすべて見渡せるからです[^1]。関数の境界をまたぐ場合（参照を受け取って参照を返す関数や、参照を持つ[[struct]]）は、呼び出し元と呼び出し先を別々に検査するため、関係を伝える注釈が必要になることがあります[^9]。ただし典型的なパターンは省略規則でまかなえるため、多くの関数は注釈なしで書けます[^7]。<!-- TODO: [[lifetime-annotation]] 作成後にリンク -->
:::

:::details[ジェネリックパラメータとしてのライフタイム]
ライフタイムは[[generics]]のパラメータの一種で、型引数`T`が「どんな型でもよい」のと同じように、ライフタイムパラメータ`'a`は「どんな期間でもよい」を表します[^1]。[[trait-bound]]と同様に、`'a: 'b`（`'a`は少なくとも`'b`と同じ長さ生きる。慣用的に「`'a`は`'b`をoutliveする」と読みます）という**ライフタイム境界**で期間どうしの関係を制約することもできます[^8]。
:::

:::details[値が破棄される時点との対応]
参照先の値が「生きている期間」は、その値を所有する変数がドロップスコープを抜ける時点で終わります。同じスコープの変数は**宣言と逆順**に破棄されるため[^3]、後から宣言した変数が先に宣言した変数を参照する分には問題になりません。逆向き（先に宣言した変数に、後から宣言した値への参照を入れる）は、上の例のように`E0597`になります。また、**参照を保持している側の値**（参照を含む[[struct]]など）が`Drop`<!-- TODO: [[drop]] 作成後にリンク -->を実装している場合は、その値が破棄される時点も「参照の使用」とみなされ、借用の期間がそこまで延びます[^4]（[[borrow]]の「借用はいつまで続くか」を参照）。
:::

[^1]: [The Rust Programming Language - Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) "every reference in Rust has a lifetime, which is the scope for which that reference is valid. Most of the time, lifetimes are implicit and inferred, just like most of the time, types are inferred." / "Lifetimes are another kind of generic that we've already been using."
[^2]: [The Rust Programming Language - Preventing Dangling References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#preventing-dangling-references-with-lifetimes) "The main aim of lifetimes is to prevent dangling references" / "The Rust compiler has a borrow checker that compares scopes to determine whether all borrows are valid."
[^3]: [The Rust Reference - Destructors](https://doc.rust-lang.org/reference/destructors.html) "When an initialized variable or temporary goes out of scope, its destructor is run or it is dropped." / "When control flow leaves a drop scope all variables associated to that scope are dropped in reverse order of declaration"
[^4]: [RFC 2094 - Non-lexical lifetimes](https://rust-lang.github.io/rfcs/2094-nll.html) "these are lifetimes that are based on the control-flow graph, rather than lexical scopes." / "we will consider lifetimes as a set of points in the control-flow graph" / "a variable is live if the current value that it holds may be used later." / drop-liveness: "indicates when a variable's value may be dropped in the future … requiring only those lifetimes to be live that are not marked as may-dangle"
[^5]: [Error code E0597](https://doc.rust-lang.org/error_codes/E0597.html) "This error occurs because a value was dropped while it was still borrowed."
[^6]: [The Rust Programming Language - Lifetime Annotation Syntax](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#lifetime-annotation-syntax) "Lifetime annotations don't change how long any of the references live. Rather, they describe the relationships of the lifetimes of multiple references to each other without affecting the lifetimes."
[^7]: [The Rust Reference - Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html) "Rust has rules that allow lifetimes to be elided in various places where the compiler can infer a sensible default choice."
[^8]: [The Rust Reference - Lifetime bounds](https://doc.rust-lang.org/reference/trait-bounds.html#lifetime-bounds) "The bound 'a: 'b is usually read as 'a outlives 'b. 'a: 'b means that 'a lasts at least as long as 'b, so a reference &'a () is valid whenever &'b () is valid."
[^9]: [The Rust Programming Language - Generic Lifetimes in Functions](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#generic-lifetimes-in-functions) "we don't know the concrete lifetimes of the references that will be passed in, so we can't look at the scopes" / "The borrow checker can't determine this either, because it doesn't know how the lifetimes of x and y relate to the lifetime of the return value."
