// 対象spec: docs/spec/playground-project.md（R-7〜R-11 / AC-5・AC-8・AC-9）
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

import { syncPlaygroundGists } from "../../scripts/sync-playground-gists.mjs";

const FENCE = "```";

/** `:::project` を1つ含むmdソースを組み立てる（フェンス行は配列で書いてネストを避ける）。 */
function projectMd(lines: string[]): string {
  return [
    "---",
    "title: テスト",
    "---",
    "",
    ":::project[テスト]",
    ...lines,
    ":::",
    "",
  ].join("\n");
}

/** 正常なプロジェクト（src/main.rs + diffマーカー付き）のmdソース。 */
const VALID_MD = projectMd([
  `${FENCE}rust:src/main.rs`,
  "let x = 1; // [!code --]",
  "let x = 2; // [!code ++]",
  FENCE,
  "",
  "解説文。",
  "",
  `${FENCE}txt:src/data.txt`,
  "hello",
  FENCE,
]);

/** Gist作成POST（201相当）を返す fetch スタブ。 */
function stubCreateOk(id = "abc123") {
  const fn = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      id,
      url: `https://gist.github.com/rust-play/${id}`,
    }),
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("sync-playground-gists（:::project のGist同期・playground-project spec）", () => {
  let workDir: string;
  let mapPath: string;
  let logs: string[];
  let errors: string[];

  /** テスト用のIO（出力を配列へ収集する）。 */
  const io = () => ({
    mapPath,
    log: (message: string) => logs.push(message),
    logError: (message: string) => errors.push(message),
  });

  /** mdファイルをscratchへ書き、対象パスを返す。 */
  const writeMd = (name: string, source: string) => {
    const path = join(workDir, name);
    writeFileSync(path, source);
    return path;
  };

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "sync-playground-"));
    mapPath = join(workDir, "playground-gists.json");
    logs = [];
    errors = [];
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it("[AC-5] Gistへ送るコードはマーカー除去済みで、ファイル名がキーになる", async () => {
    const fetchMock = stubCreateOk();
    const targets = [writeMd("a.md", VALID_MD)];

    await syncPlaygroundGists({ targets, ...io() });

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { body: string },
    ];
    expect(JSON.parse(init.body)).toEqual({
      code: [
        { name: "src/data.txt", content: "hello" },
        { name: "src/main.rs", content: "let x = 2;" },
      ],
    });
  });

  it("[AC-8] 未登録のプロジェクトはGistを作成してマッピングへ追記する", async () => {
    const fetchMock = stubCreateOk("created1");
    const targets = [writeMd("a.md", VALID_MD)];

    const code = await syncPlaygroundGists({ targets, ...io() });

    expect(code).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const map = JSON.parse(readFileSync(mapPath, "utf8"));
    expect(Object.values(map)).toEqual([
      { id: "created1", url: "https://gist.github.com/rust-play/created1" },
    ]);
  });

  it("[AC-8] 2回連続で実行しても2回目はGistを作成せず正常終了する（冪等）", async () => {
    const targets = [writeMd("a.md", VALID_MD)];
    const first = stubCreateOk("created1");
    await syncPlaygroundGists({ targets, ...io() });
    const before = readFileSync(mapPath, "utf8");
    expect(first).toHaveBeenCalledTimes(1);

    const second = stubCreateOk("created2");
    const code = await syncPlaygroundGists({ targets, ...io() });

    expect(code).toBe(0);
    expect(second).not.toHaveBeenCalled();
    expect(readFileSync(mapPath, "utf8")).toBe(before);
    expect(logs.some((line) => line.startsWith("SKIP"))).toBe(true);
  });

  it("[AC-8] マッピングの旧エントリは実行後も削除されない", async () => {
    const stale = {
      old: { id: "old1", url: "https://gist.github.com/rust-play/old1" },
    };
    writeFileSync(mapPath, `${JSON.stringify(stale, null, 2)}\n`);
    stubCreateOk("created1");
    const targets = [writeMd("a.md", VALID_MD)];

    await syncPlaygroundGists({ targets, ...io() });

    const map = JSON.parse(readFileSync(mapPath, "utf8"));
    expect(map.old).toEqual(stale.old);
    expect(Object.keys(map)).toHaveLength(2);
  });

  it("入れ子ディレクティブ内の :::project も走査対象になる（spec R-1。ビルド側と両翼の回帰ガード）", async () => {
    const fetchMock = stubCreateOk("nested1");
    const source = [
      "---",
      "title: テスト",
      "---",
      "",
      "::::details[補足]",
      ":::project[入れ子]",
      `${FENCE}rust:src/main.rs`,
      "fn main() {}",
      FENCE,
      ":::",
      "::::",
      "",
    ].join("\n");
    const targets = [writeMd("a.md", source)];

    const code = await syncPlaygroundGists({ targets, ...io() });

    expect(code).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const map = JSON.parse(readFileSync(mapPath, "utf8"));
    expect(Object.values(map)).toEqual([
      { id: "nested1", url: "https://gist.github.com/rust-play/nested1" },
    ]);
  });

  it("Gist作成APIが失敗するとNG行を出して exit code 1 を返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 })),
    );
    const targets = [writeMd("a.md", VALID_MD)];

    const code = await syncPlaygroundGists({ targets, ...io() });

    expect(code).toBe(1);
    expect(errors.join("\n")).toMatch(/NG .*a\.md:5:1 .*HTTP 503/);
  });

  describe("不正な :::project（R-7 a〜d）はNG報告してGistを作らない", () => {
    /** 不正mdを1件処理し、exit code と fetch 呼び出し回数・出力を返す。 */
    const run = async (lines: string[]) => {
      const fetchMock = stubCreateOk();
      const targets = [writeMd("a.md", projectMd(lines))];
      const code = await syncPlaygroundGists({ targets, ...io() });
      return { code, fetchMock };
    };

    it("(a) ファイル名記法のないコードブロックがあるとNGになる", async () => {
      const { code, fetchMock } = await run([
        `${FENCE}rust:src/main.rs`,
        "fn main() {}",
        FENCE,
        "",
        `${FENCE}rust`,
        "fn other() {}",
        FENCE,
      ]);

      expect(code).toBe(1);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(errors.join("\n")).toMatch(
        /NG .*a\.md:10:1 .*ファイル名がありません/,
      );
    });

    it("(b) src/main.rs も src/lib.rs も無いとNGになる", async () => {
      const { code, fetchMock } = await run([
        `${FENCE}rust:src/greetings.rs`,
        "pub fn hello() {}",
        FENCE,
      ]);

      expect(code).toBe(1);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(errors.join("\n")).toMatch(
        /NG .*a\.md:5:1 .*src\/main\.rs も src\/lib\.rs もありません/,
      );
    });

    it("(c) ファイル名が重複しているとNGになる", async () => {
      const { code, fetchMock } = await run([
        `${FENCE}rust:src/main.rs`,
        "fn main() {}",
        FENCE,
        "",
        `${FENCE}rust:src/main.rs`,
        "fn main() {}",
        FENCE,
      ]);

      expect(code).toBe(1);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(errors.join("\n")).toMatch(/NG .*a\.md:10:1 .*重複しています/);
    });

    it("(d) コードブロックに playground メタを併用しているとNGになる", async () => {
      const { code, fetchMock } = await run([
        `${FENCE}rust:src/main.rs playground`,
        "fn main() {}",
        FENCE,
      ]);

      expect(code).toBe(1);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(errors.join("\n")).toMatch(
        /NG .*a\.md:6:1 .*playground メタは付けられません/,
      );
    });
  });

  describe("--verify（R-10）", () => {
    beforeEach(() => {
      writeFileSync(
        mapPath,
        `${JSON.stringify(
          {
            hash1: {
              id: "id1",
              url: "https://gist.github.com/rust-play/id1",
            },
            hash2: {
              id: "id2",
              url: "https://gist.github.com/rust-play/id2",
            },
          },
          null,
          2,
        )}\n`,
      );
    });

    it("[AC-9] 全エントリが生存していれば exit code 0 を返す", async () => {
      const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      const code = await syncPlaygroundGists({ verify: true, ...io() });

      expect(code).toBe(0);
      const calls = fetchMock.mock.calls as unknown as [string, unknown][];
      expect(calls.map(([url]) => url)).toEqual([
        "https://play.rust-lang.org/meta/gist/id1",
        "https://play.rust-lang.org/meta/gist/id2",
      ]);
    });

    it("[AC-9] 生存確認に失敗したエントリがあると失敗一覧を報告して exit code 1 を返す", async () => {
      // 存在しないGistはPlaygroundでは404ではなく500になるため、非2xxを失敗として扱う
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => ({
          ok: !url.endsWith("id2"),
          status: url.endsWith("id2") ? 500 : 200,
        })),
      );

      const code = await syncPlaygroundGists({ verify: true, ...io() });

      expect(code).toBe(1);
      expect(errors).toContain("失敗一覧:");
      expect(errors.join("\n")).toMatch(/hash2.*id2.*HTTP 500/s);
      expect(logs.at(-1)).toBe("確認 2 / 失敗 1");
    });

    it("[AC-9] --verify ではGistを作成しない", async () => {
      const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      const targets = [writeMd("a.md", VALID_MD)];

      await syncPlaygroundGists({ targets, verify: true, ...io() });

      // GETのみ（第2引数のinit＝POST指定なし）であることを確認する
      const calls = fetchMock.mock.calls as unknown as [string, unknown][];
      expect(calls.every(([, init]) => init === undefined)).toBe(true);
    });
  });
});
