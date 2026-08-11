// 対象spec: docs/spec/playground-project.md（§3 プロジェクトのハッシュ / R-4 / R-12）
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, it, expect } from "vitest";

import {
  projectHash,
  readGistMap,
  toGistFiles,
  writeGistMap,
} from "../../plugins/project-gist.mjs";

describe("project-gist（:::project のハッシュ・Gistペイロード・playground-project spec）", () => {
  describe("toGistFiles", () => {
    it("[AC-5] Gistへ送る内容はコード記法マーカーを除去したものになる", () => {
      const files = [
        {
          name: "src/main.rs",
          code: 'let x = 1; // [!code --]\nlet x = 2; // [!code ++]\nprintln!("{x}");',
        },
      ];

      expect(toGistFiles(files)).toEqual([
        { name: "src/main.rs", content: 'let x = 2;\nprintln!("{x}");' },
      ]);
    });

    it("ファイル名の昇順（コードポイント順）に並べ替える", () => {
      const files = [
        { name: "src/main.rs", code: "" },
        { name: "Cargo.toml", code: "" },
        { name: "src/greetings.rs", code: "" },
      ];

      expect(toGistFiles(files).map((file) => file.name)).toEqual([
        "Cargo.toml",
        "src/greetings.rs",
        "src/main.rs",
      ]);
    });
  });

  describe("projectHash", () => {
    const files = [
      { name: "src/main.rs", code: "fn main() {}" },
      { name: "src/lib.rs", code: "pub fn hello() {}" },
    ];

    it("SHA-256の16進小文字（64桁）を返す", () => {
      expect(projectHash(files)).toMatch(/^[0-9a-f]{64}$/);
    });

    it("ファイルの並び順が違っても同じハッシュになる", () => {
      expect(projectHash([...files].reverse())).toBe(projectHash(files));
    });

    it("diffマーカーだけの差分ではハッシュが変わらない（Gistの送信内容が同じため）", () => {
      const withMarkers = [
        { name: "src/main.rs", code: "fn main() {} // [!code highlight]" },
        { name: "src/lib.rs", code: "pub fn hello() {}" },
      ];

      expect(projectHash(withMarkers)).toBe(projectHash(files));
    });

    it("コード内容が変わるとハッシュが変わる", () => {
      const changed = [
        { name: "src/main.rs", code: "fn main() { println!(); }" },
        { name: "src/lib.rs", code: "pub fn hello() {}" },
      ];

      expect(projectHash(changed)).not.toBe(projectHash(files));
    });

    it("ファイル名が変わるとハッシュが変わる", () => {
      const renamed = [
        { name: "src/main.rs", code: "fn main() {}" },
        { name: "src/greetings.rs", code: "pub fn hello() {}" },
      ];

      expect(projectHash(renamed)).not.toBe(projectHash(files));
    });
  });

  describe("マッピングファイルの入出力", () => {
    let workDir: string;
    let mapPath: string;

    beforeEach(() => {
      workDir = mkdtempSync(join(tmpdir(), "project-gist-"));
      mapPath = join(workDir, "playground-gists.json");
    });

    afterEach(() => {
      rmSync(workDir, { recursive: true, force: true });
    });

    it("マッピングファイルが無ければ空マッピングを返す（初回実行）", () => {
      expect(readGistMap(mapPath)).toEqual({});
    });

    it("Prettier既定のJSON整形（2スペース + 末尾改行）で書き出す", () => {
      writeGistMap(mapPath, {
        abc: { id: "1", url: "https://gist.github.com/rust-play/1" },
      });

      expect(readFileSync(mapPath, "utf8")).toBe(
        '{\n  "abc": {\n    "id": "1",\n    "url": "https://gist.github.com/rust-play/1"\n  }\n}\n',
      );
    });

    it("書き出した内容をそのまま読み戻せる", () => {
      const map = {
        abc: { id: "1", url: "https://gist.github.com/rust-play/1" },
      };

      writeGistMap(mapPath, map);

      expect(readGistMap(mapPath)).toEqual(map);
    });

    it("壊れたJSONは握りつぶさずthrowする", () => {
      writeFileSync(mapPath, "{ broken");

      expect(() => readGistMap(mapPath)).toThrow();
    });
  });
});
