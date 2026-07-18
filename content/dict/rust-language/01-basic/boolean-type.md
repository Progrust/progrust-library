---
title: 論理値型
description: 真偽を表すプリミティブ型。`true`・`false`の2値のみを取る1バイトの型。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法", "プリミティブ型", "スカラー型"]
public: true
---

真偽値を表す[[primitive-type]]です。
取りうる値は`true`と`false`の2つのみで、メモリ上は1バイト（8ビット）で表現されます。

```rust playground
fn main() {
    let stock: u32 = 0;
    let in_stock: bool = stock > 0; // 在庫があるかどうか
    if in_stock {
        println!("購入可能です");
    } else {
        println!("売り切れです");
    }
}
```

:::message{warning}
`bool`の有効なビットパターンは`false`を表す`0x00`と`true`を表す`0x01`の2つのみです。それ以外のビットパターンを持つ`bool`値が存在すると未定義動作になります（例: 検証されていないメモリから`transmute`で強引に生成した場合など）。
:::

## 補足

:::details[数値への変換と大小比較]
`bool`は`Ord`を実装しており、`false < true`として順序付けられます。
整数型への変換は`as`による[[type-cast]]または`From<bool>`で行え、`false`は`0`、`true`は`1`になります。逆方向（整数から`bool`）への変換は、Rust 1.95.0で`TryFrom<u8>`等が安定化されましたが、それ以前のバージョンとの互換性も考え、ここでは`match`で`0`・`1`以外の値を明示的に扱う例を示します。

```rust playground
fn main() {
    assert!(false < true);
    assert_eq!(true as i32, 1);
    assert_eq!(i32::from(false), 0);

    let raw: u8 = 2;
    let parsed = match raw {
        0 => Ok(false),
        1 => Ok(true),
        _ => Err("0/1以外は無効な値"),
    };
    assert!(parsed.is_err());
}
```
:::
