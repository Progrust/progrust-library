import { describe, it, expect } from "vitest";

import { compileWithTableWrap } from "../helpers/table-wrap";

const TABLE = `| 型 | 用途 |
| --- | --- |
| Box | ヒープ確保 |
| Rc | 複数所有 |`;

describe("table-wrap（GFMテーブルの横スクロールラッパ・spec/pages.md R-22）", () => {
  it("[AC-9] GFMテーブルが div.table-wrap で包まれる", () => {
    const html = compileWithTableWrap(TABLE);
    expect(html).toContain('<div class="table-wrap"><table>');
    expect(html).toContain("</table></div>");
  });

  it("[AC-9] 複数のテーブルはそれぞれ個別に包まれる", () => {
    const html = compileWithTableWrap(`${TABLE}\n\n間の段落\n\n${TABLE}`);
    const wrapperCount = html.split('<div class="table-wrap">').length - 1;
    expect(wrapperCount).toBe(2);
  });

  it("thead/tbody構造とセル内容が保持される", () => {
    const html = compileWithTableWrap(TABLE);
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<th>型</th>");
    expect(html).toContain("<td>ヒープ確保</td>");
  });

  it("テーブルを含まない文書では table-wrap を出力しない", () => {
    const html = compileWithTableWrap("ただの段落。\n\n- リスト項目");
    expect(html).not.toContain("table-wrap");
  });
});
