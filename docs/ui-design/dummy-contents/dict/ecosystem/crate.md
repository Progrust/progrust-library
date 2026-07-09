---
title: クレート
description: Rustの再利用可能なコード単位。ライブラリ（lib）またはバイナリ（bin）。
created_at: 2024-04-02
updated_at: 2024-06-10
tags: ["Rust基礎", "ツール", "モジュール"]
public: true
---

# クレート

クレートは、Rust の再利用可能なコード単位です。[[cargo]] でダウンロード・管理できる外部のライブラリも、自分が作成するプロジェクトもクレートです。

## ライブラリクレート

```bash
cargo new my-lib --lib
```

```rust
// src/lib.rs
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_add() {
        assert_eq!(add(2, 2), 4);
    }
}
```

## バイナリクレート

```bash
cargo new my-bin
```

バイナリクレートには `main()` 関数を含む `src/main.rs` が必要です。

:::message
1つの [[cargo]] プロジェクト内に複数のバイナリクレートを持つこともできます。`src/bin/` ディレクトリに追加の実行可能ファイルを置くことで実現します。
:::

## クレートの公開

`crates.io` にクレートを公開するには、`Cargo.toml` に適切なメタデータを設定します：

```toml
[package]
name = "my-awesome-crate"
version = "0.1.0"
authors = ["Your Name <you@example.com>"]
license = "MIT"
description = "A brief description"
```

詳細は [[cargo]] を参照してください。
