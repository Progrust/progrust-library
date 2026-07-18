import { describe, it, expect } from "vitest";

import { compileWithSoftBreaks } from "../helpers/soft-breaks";

describe("soft-breaks（本文中の改行の<br>反映・docs/markdown-pipeline/soft-breaks.md）", () => {
  it("段落内の単一改行が <br> になる", () => {
    const html = compileWithSoftBreaks("1行目\n2行目");
    expect(html).toContain("1行目<br");
    expect(html).toContain("2行目");
  });

  it("3行以上の連続でも各改行が <br> になる", () => {
    const html = compileWithSoftBreaks("あ\nい\nう");
    expect(html.match(/<br\s*\/?>/g)).toHaveLength(2);
  });

  it("空行は段落区切りのままで <br> にならない", () => {
    const html = compileWithSoftBreaks("段落1\n\n段落2");
    expect(html).not.toContain("<br");
    expect(html.match(/<p>/g)).toHaveLength(2);
  });

  it("インライン要素（強調）をまたぐ改行も <br> になる", () => {
    const html = compileWithSoftBreaks("前**強調**\n次の行");
    expect(html).toContain("<strong>強調</strong><br");
    expect(html).toContain("次の行");
  });

  it("コードブロック内の改行は <br> にならない", () => {
    const html = compileWithSoftBreaks("```\nline1\nline2\n```");
    expect(html).not.toContain("<br");
    expect(html).toContain("line1\nline2");
  });

  it("インラインコードは変化しない", () => {
    const html = compileWithSoftBreaks("これは `a\\nb` です");
    expect(html).not.toContain("<br");
  });

  it("引用内の改行も <br> になる", () => {
    const html = compileWithSoftBreaks("> 引用1行目\n> 引用2行目");
    expect(html).toContain("引用1行目<br");
  });

  it("リスト項目内の改行も <br> になる", () => {
    const html = compileWithSoftBreaks("- 項目の1行目\n  項目の2行目");
    expect(html).toContain("項目の1行目<br");
  });

  it("手書きの <br> と併用しても二重にならない", () => {
    const html = compileWithSoftBreaks("1行目<br>\n2行目");
    expect(html.match(/<br\s*\/?>/g)).toHaveLength(2); // 手書き1 + 改行由来1
  });

  it("従来のハードブレーク（行末2スペース）も引き続き <br> になる", () => {
    const html = compileWithSoftBreaks("1行目  \n2行目");
    expect(html.match(/<br\s*\/?>/g)).toHaveLength(1);
  });

  it("改行を含まない段落は変化しない", () => {
    const html = compileWithSoftBreaks("ただの1行の段落");
    expect(html).not.toContain("<br");
    expect(html).toContain("ただの1行の段落");
  });
});
