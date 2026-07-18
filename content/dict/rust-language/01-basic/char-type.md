---
title: 文字型
description: 1つのUnicodeスカラー値を表すプリミティブ型。常に4バイト固定長。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法", "プリミティブ型", "スカラー型"]
public: true
---

1つの文字を表す[[primitive-type]]です。
`char`型は常に4バイト（32ビット）固定長で、1バイトを表す型ではなく「Unicodeスカラー値」1つを表します。
リテラルはシングルクォートで`'あ'`のように書きます。

```rust playground
fn main() {
    let grade: char = 'A'; // 成績評価
    println!("評価: {}, サイズ: {}バイト", grade, std::mem::size_of::<char>());
}
```

:::message{warning}
`char`が表すのは「Unicodeスカラー値」であり、範囲はU+0000〜U+D7FFとU+E000〜U+10FFFFに限られます。（サロゲートペア用のU+D800〜U+DFFFは除外）。
UTF-8で可変長にエンコードされる文字列（`&str`・`String`）とは異なり、`char`単体は常に固定長4バイトです。
:::
