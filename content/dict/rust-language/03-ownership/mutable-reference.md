---
title: 可変参照
description: 参照先の値を読み書きできる&mut T型の参照。同時にただ1つしか存在できない排他性が特徴。
created_at: 2026-07-20
updated_at: 2026-07-20
tags: ["所有権", "型システム"]
public: true
---

可変参照`&mut T`は、参照先の値を書き換えられる[[reference]]です。`mut`付きで宣言された[[variable]]に対して`&mut x`で作成します。可変参照を作る行為は[[mutable-borrow]]と呼ばれ、その借用が有効な間はほかの参照と同時には使えない**排他性**が保証されます。書き換えは`*`（デリファレンス）を通して行います。

```rust playground
fn deposit(balance: &mut i32, amount: i32) {
    *balance += amount; // 参照先の値を書き換える
}

fn main() {
    let mut balance = 1000; // 変数を可変借用するには、その変数自体がmutであることが必要
    deposit(&mut balance, 500);
    println!("入金後の残高: {balance}円");
}
```

読み取り専用の共有参照`&T`との違いは[[reference]]の比較表を、「同時にただ1つ」という規則の詳細は[[borrow]]と[[mutable-borrow]]を参照してください。

## 補足

:::details[mutでない変数からは作れない（E0596）]
可変参照は「書き換えてよい」という許可を借りるものなので、そもそも書き換えを許していない（`mut`なしで宣言された）変数からは作れません。

<!-- rustc: expect E0596 -->
```rust playground
fn main() {
    let balance = 1000; // mutが付いていない
    let r = &mut balance; // エラー: E0596（不変の変数は可変借用できない）
    *r += 500;
}
```
:::
