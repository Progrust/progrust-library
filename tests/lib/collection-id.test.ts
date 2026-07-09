import { describe, it, expect } from "vitest";

import {
  dictId,
  articleId,
  bookId,
  chapterId,
} from "../../src/lib/collection-id";

describe("collection-id", () => {
  describe("dictId / articleId（ファイル名のみ・content-model R-5）", () => {
    it("[AC-3] サブフォルダ階層を捨ててファイル名のみを ID にする", () => {
      expect(dictId("basics/ownership.md")).toBe("ownership");
    });

    it("[AC-3] フォルダ無しの直下ファイルもファイル名のみになる", () => {
      expect(dictId("ownership.md")).toBe("ownership");
    });

    it("[AC-3] 記事も辞書と同一規則でファイル名のみになる", () => {
      expect(articleId("rust-ownership-deep-dive.md")).toBe(
        "rust-ownership-deep-dive",
      );
    });
  });

  describe("bookId（本ディレクトリ名）", () => {
    it("[AC-4] 本の index.md はディレクトリ名を ID にする", () => {
      expect(bookId("rust-web-app-book/index.md")).toBe("rust-web-app-book");
    });
  });

  describe("chapterId（本slug + 連番除去後・content-model R-7/R-8）", () => {
    it("[AC-4] 先頭のゼロ埋め2桁連番を除去し `本slug/slug` 形式にする", () => {
      expect(chapterId("rust-book/02-setup.md")).toBe("rust-book/setup");
    });

    it("[AC-4] 連番除去後にハイフンを含む章名も保持する", () => {
      expect(chapterId("rust-web-app-book/01-intro.md")).toBe(
        "rust-web-app-book/intro",
      );
    });
  });
});
