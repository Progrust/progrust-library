---
title: 文字型（Char Type）
description: 1つのUnicodeスカラー値を表すプリミティブ型。常に4バイト固定長。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法", "プリミティブ型"]
public: false
---

1つの文字を表すプリミティブ型です。`char`型は常に4バイト（32ビット）固定長で、1バイトを表す型ではなく「Unicodeスカラー値」1つを表します。[[integer-type]]や[[boolean-type]]と同様に`Copy`を実装しており、リテラルはシングルクォートで`'あ'`のように書きます。

:::message{warning}
`char`が表すのは「Unicodeスカラー値」であり、範囲はU+0000〜U+D7FFとU+E000〜U+10FFFFに限られます（サロゲートペア用のU+D800〜U+DFFFは除外）。UTF-8で可変長にエンコードされる文字列（`&str`・`String`）とは異なり、`char`単体は常に固定長4バイトです。
:::

## コード例

```rust playground
fn main() {
    let grade: char = 'A'; // 成績評価
    println!("評価: {}, サイズ: {}バイト", grade, std::mem::size_of::<char>());
}
```

## 補足

:::details[整数とcharの相互変換]
`char`へ`as`キャストできる整数型は`u8`のみです（0〜255はすべて有効なUnicodeスカラー値のため常に成功します）。`u32`など他の整数型を`char`へ`as`キャストすることはコンパイルエラーになり、代わりに無効な値（サロゲート範囲など）を`None`として弾く`char::from_u32`を使います。

<!-- rustc: expect E0604 -->
```rust playground
fn main() {
    let valid: char = 65u8 as char; // u8 -> charは常に成功
    println!("{}", valid);

    let code: u32 = 0xD800; // サロゲート範囲（無効なスカラー値）
    let invalid = code as char; // エラー: E0604（u32はcharへasキャスト不可）
    println!("{:?}", invalid);
}
```

```rust playground
fn main() {
    let code: u32 = 0xD800; // サロゲート範囲（無効なスカラー値）
    println!("{:?}", char::from_u32(code)); // None
    println!("{:?}", char::from_u32(0x3042)); // Some('あ')
}
```
:::

## 関連項目

- [[floating-point-type]]

<!-- TODO: [[type-inference]] 作成後にリンク -->
