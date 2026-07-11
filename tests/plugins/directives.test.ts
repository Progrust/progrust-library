import { describe, it, expect } from "vitest";

import { compileWithDirectives } from "../helpers/directives";

describe("directives（:::記法のHTML変換・docs/markdown-pipeline/directives.md）", () => {
  describe("message", () => {
    it("種別なしのmessageをaside.messageに変換する", () => {
      const html = compileWithDirectives(":::message\n補足です。\n:::");
      expect(html).toContain('<aside class="message">');
      expect(html).toContain("補足です。");
    });

    it("各種別（info/tip/question/success/warning/danger）をmessage message-種別に変換する", () => {
      for (const type of [
        "info",
        "tip",
        "question",
        "success",
        "warning",
        "danger",
      ]) {
        const html = compileWithDirectives(`:::message{${type}}\n本文。\n:::`);
        expect(html).toContain(`<aside class="message message-${type}">`);
      }
    });

    it("[タイトル]付きmessageはmessage-titleのタイトル要素を持つ", () => {
      const html = compileWithDirectives(
        ":::message[大事な話]{info}\n本文。\n:::",
      );
      expect(html).toContain('<aside class="message message-info">');
      expect(html).toContain('<p class="message-title">大事な話</p>');
    });

    it("種別なし+[タイトル]のmessageもタイトル要素を持つ（種別クラスは付かない）", () => {
      const html = compileWithDirectives(":::message[お知らせ]\n本文。\n:::");
      expect(html).toContain('<aside class="message">');
      expect(html).toContain('<p class="message-title">お知らせ</p>');
    });

    it("種別あり・タイトルなしは種別名がデフォルトタイトルになる（rule.md: タイトルを指定する）", () => {
      const html = compileWithDirectives(":::message{info}\n本文。\n:::");
      expect(html).toContain('<p class="message-title">info</p>');
      // デフォルトタイトルは本文より前（先頭）に挿入される
      expect(html.indexOf("message-title")).toBeLessThan(
        html.indexOf("本文。"),
      );
    });

    it("種別なし・タイトルなしはタイトル要素を生成しない", () => {
      const html = compileWithDirectives(":::message\n本文。\n:::");
      expect(html).not.toContain("message-title");
    });
  });

  describe("details", () => {
    it("[タイトル]付きdetailsをdetails+summaryに変換する", () => {
      const html = compileWithDirectives(
        ":::details[詳細]\n折りたたみ内容。\n:::",
      );
      expect(html).toContain("<details>");
      expect(html).toContain("<summary>詳細</summary>");
      expect(html).toContain("折りたたみ内容。");
    });

    it("タイトルなしのdetailsはビルドエラーになる", () => {
      const call = () =>
        compileWithDirectives(":::details\n折りたたみ内容。\n:::");
      expect(call).toThrow(/タイトルがありません/);
    });
  });

  describe("figure", () => {
    it("[キャプション]{width}付きfigureをfigure+figcaptionに変換しwidthをimgへ反映する", () => {
      const html = compileWithDirectives(
        ":::figure[図1: キャプション]{width=480}\n![alt](/img.png)\n:::",
      );
      expect(html).toContain("<figure>");
      expect(html).toContain("<figcaption>図1: キャプション</figcaption>");
      expect(html).toContain('width="480"');
      expect(html).toContain('alt="alt"');
    });

    it("キャプションなしのfigureはfigcaptionなしのfigureになる（rule.md: キャプション省略可）", () => {
      const html = compileWithDirectives(
        ":::figure{width=480}\n![alt](/img.png)\n:::",
      );
      expect(html).toContain("<figure>");
      expect(html).not.toContain("<figcaption>");
      expect(html).toContain('width="480"');
    });
  });

  describe("ネスト", () => {
    it("message内にネストしたdetailsを正しく入れ子で変換する", () => {
      const html = compileWithDirectives(
        "::::message\n外側。\n:::details[中]\n中身。\n:::\n::::",
      );
      expect(html).toContain('<aside class="message">');
      expect(html).toContain("<details>");
      expect(html).toContain("<summary>中</summary>");
    });

    it("details内にネストしたmessage（rule.mdのネスト例）を正しく入れ子で変換する", () => {
      const html = compileWithDirectives(
        "::::details[外]\n:::message\nネストされた要素。\n:::\n::::",
      );
      expect(html).toContain("<details>");
      expect(html).toContain("<summary>外</summary>");
      expect(html).toContain('<aside class="message">');
    });

    it("details内にネストしたdetailsを正しく入れ子で変換する", () => {
      const html = compileWithDirectives(
        "::::details[外]\n:::details[内]\n内側の中身。\n:::\n::::",
      );
      expect(html).toContain("<summary>外</summary>");
      expect(html).toContain("<summary>内</summary>");
      // 内側detailsが外側details内に入れ子で出力される（</details>が2つ）
      expect(html.match(/<details>/g)).toHaveLength(2);
      expect(html.indexOf("<summary>外</summary>")).toBeLessThan(
        html.indexOf("<summary>内</summary>"),
      );
    });
  });

  describe("未知のディレクティブ", () => {
    it("未知のディレクティブ名はビルドエラーになる", () => {
      const call = () => compileWithDirectives(":::unknown\n本文。\n:::");
      expect(call).toThrow(/未知のディレクティブ/);
    });
  });

  describe("textDirective復元（directive: trueの副作用対策）", () => {
    it("本文中のx:y等（コロン直後に文字）が消えず原文どおり出力される", () => {
      const html = compileWithDirectives(
        "時刻は 12:30 です。x:y と キー:値 も残る。",
      );
      expect(html).toContain("12:30");
      expect(html).toContain("x:y");
      expect(html).toContain("キー:値");
    });
  });
});
