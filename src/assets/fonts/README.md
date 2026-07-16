# コード用日本語等幅フォント（Progrust Code JP）

`progrust-code-jp-400.woff2` は [UDEV Gothic](https://github.com/yuru7/udev-gothic) v2.2.0 の
`UDEVGothic-Regular.ttf` から日本語グリフのみをサブセット化した派生フォント（OFL 1.1、全文は
`LICENSE-UDEVGothic.txt`）。OFLの Reserved Font Name（"UDEV Gothic"）を避けるため、
name table のファミリ名を **Progrust Code JP** に変更している。

- 収録範囲: `U+3000-303F, U+3041-309F, U+30A0-30FF, U+4E00-9FFF, U+FF01-FF60, U+FFE0-FFE6`
  （CJK記号・かな・カタカナ・CJK統合漢字・全角形。欧文グリフは含まない）
- 用途: `--font-mono` の日本語差し込み（欧文は JetBrains Mono。半角:全角=3:5）。
  配信設定は `astro.config.mjs` の fonts（local プロバイダ・unicodeRange 付き）
- 再現手順: fonttools でサブセット+リネーム（コマンドは
  [docs/plan/phase-6-launch.md](../../../docs/plan/phase-6-launch.md) の T6-3 実施履歴参照）
