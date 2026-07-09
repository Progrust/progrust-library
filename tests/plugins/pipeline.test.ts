import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

import type { DictIndexEntry } from "../../plugins/dict-index.mjs";
import { compileWithAllPlugins } from "../helpers/pipeline";
import { fakeRenderer } from "../helpers/mermaid";

const PUBLIC_PAGE = new URL("../fixtures/public-true.md", import.meta.url);

const dictIndex: DictIndexEntry[] = [
  { slug: "ownership", title: "所有権", public: true },
];

/** 成功レスポンスを返す fetch スタブ（tests/plugins/link-card.test.ts と同流儀）。 */
function stubFetchOk(): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async () => ({
    ok: true,
    text: async () =>
      '<html><head><meta property="og:title" content="外部サイト"></head><body></body></html>',
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** theme を data 属性に埋めた最小 SVG を返す fake mermaid レンダラ。 */
const renderer = fakeRenderer(
  (theme, prefix) => `<svg id="${prefix}" data-theme="${theme}"></svg>`,
);

describe("pipeline（全プラグイン同時登録の相互作用・markdown-pipeline/README.md）", () => {
  let cacheDir: URL;
  let cacheRoot: string;

  beforeEach(() => {
    cacheRoot = mkdtempSync(join(tmpdir(), "pipeline-test-"));
    cacheDir = pathToFileURL(join(cacheRoot, "link-card") + "/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(cacheRoot, { recursive: true, force: true });
  });

  it("単独段落のwikilinkはカード化されずfetchも呼ばれない", async () => {
    const fetchFn = stubFetchOk();
    const html = await compileWithAllPlugins("[[ownership]]", {
      dictIndex,
      fileURL: PUBLIC_PAGE,
      cacheDir,
      renderer,
    });
    expect(html).toContain('class="wikilink"');
    expect(html).toContain('href="/dict/ownership"');
    expect(html).not.toContain("link-card");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("同一文書でwikilinkとベアURLが併存してもカード化はベアURLの1件だけ", async () => {
    const fetchFn = stubFetchOk();
    const source = [
      "本文中の[[ownership]]です。",
      "",
      "[[ownership]]",
      "",
      "https://example.com/",
    ].join("\n");
    const html = await compileWithAllPlugins(source, {
      dictIndex,
      fileURL: PUBLIC_PAGE,
      cacheDir,
      renderer,
    });
    expect(html.match(/class="link-card"/g)).toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      "https://example.com/",
      expect.anything(),
    );
  });

  it("directive（:::message）内のwikilinkが全登録構成でも変換される", async () => {
    stubFetchOk();
    const html = await compileWithAllPlugins(
      ":::message{info}\n[[ownership]]を参照。\n:::",
      { dictIndex, fileURL: PUBLIC_PAGE, cacheDir, renderer },
    );
    expect(html).toContain('<aside class="message message-info">');
    expect(html).toContain('href="/dict/ownership"');
  });

  it("本文中のコロン付き文字列（12:30）が全登録構成でも消えない", async () => {
    stubFetchOk();
    const html = await compileWithAllPlugins("集合時刻は 12:30 です。", {
      dictIndex,
      fileURL: PUBLIC_PAGE,
      cacheDir,
      renderer,
    });
    expect(html).toContain("12:30");
  });

  it("mermaidブロックが全mdastプラグイン併存下でlight/dark2枚のSVGになる", async () => {
    stubFetchOk();
    const html = await compileWithAllPlugins(
      "```mermaid\ngraph TB\n  A --> B\n```\n\n```rust:main.rs\nfn main() {}\n```",
      { dictIndex, fileURL: PUBLIC_PAGE, cacheDir, renderer },
    );
    expect(html).toContain('<figure class="mermaid-diagram">');
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html).toContain('data-theme="default"');
    expect(html).toContain('data-theme="dark"');
    // codeFilename 前処理が併存してもmermaidブロックを巻き込まない（rustブロックは素通り）。
    expect(html).toContain("code-filename");
  });
});
