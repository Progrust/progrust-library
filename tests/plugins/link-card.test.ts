import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

import { compileWithLinkCard } from "../helpers/link-card";

/** OGP用の <html>。og:title 等を含める。 */
function ogpHtml({
  title,
  description,
  image,
}: {
  title?: string;
  description?: string;
  image?: string;
} = {}): string {
  const metas = [
    title ? `<meta property="og:title" content="${title}">` : "",
    description
      ? `<meta property="og:description" content="${description}">`
      : "",
    image ? `<meta property="og:image" content="${image}">` : "",
  ].join("");
  return `<html><head>${metas}</head><body></body></html>`;
}

/** 成功レスポンス（res.ok=true, res.text()=html）を返す fetch スタブを立てる。 */
function stubFetchOk(html: string) {
  const fn = vi.fn(async () => ({ ok: true, text: async () => html }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("link-card（単独ベアURLのOGPカード化・docs/markdown-pipeline/link-card.md）", () => {
  let cacheDir: URL;
  let cacheRoot: string;

  beforeEach(() => {
    // テストごとに scratch キャッシュディレクトリを用意し、実キャッシュ汚染とMap共有を避ける。
    cacheRoot = mkdtempSync(join(tmpdir(), "link-card-test-"));
    cacheDir = pathToFileURL(join(cacheRoot, "link-card") + "/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(cacheRoot, { recursive: true, force: true });
  });

  it("単独ベアURLをOGP情報付きのlink-cardに変換する", async () => {
    stubFetchOk(ogpHtml({ title: "サンプルタイトル", description: "説明文" }));
    const html = await compileWithLinkCard("https://example.com/", cacheDir);
    expect(html).toContain('<div class="link-card-wrap">');
    expect(html).toContain('class="link-card"');
    expect(html).toContain("サンプルタイトル");
    expect(html).toContain("説明文");
    expect(html).toContain('class="link-card__host">example.com');
    // block要素<div>開始でHTMLブロックとしてverbatim出力される（inline<a>開始だと
    // 再パースで<a>がエスケープ（&lt;a）され二重autolink化する。落とし穴1の回帰ガード）。
    expect(html).not.toContain("&lt;a");
  });

  it("文中URL（段落の子が複数）はカード化しない", async () => {
    const fetchFn = stubFetchOk(ogpHtml({ title: "x" }));
    const html = await compileWithLinkCard(
      "本文中に https://example.com/ を含む段落です。",
      cacheDir,
    );
    expect(html).not.toContain("link-card-wrap");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("通常リンク [表示名](url) は表示名≠urlのためカード化しない", async () => {
    const fetchFn = stubFetchOk(ogpHtml({ title: "x" }));
    const html = await compileWithLinkCard(
      "[表示名リンク](https://example.com/)",
      cacheDir,
    );
    expect(html).not.toContain("link-card-wrap");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("内部リンク [/about](/about) は http(s)でないためカード化せずfetchも呼ばない", async () => {
    const fetchFn = stubFetchOk(ogpHtml({ title: "x" }));
    const html = await compileWithLinkCard("[/about](/about)", cacheDir);
    expect(html).not.toContain("link-card-wrap");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("fetchが失敗してもthrowせず簡易カード（link-card--fallback）にフォールバックする", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const html = await compileWithLinkCard("https://example.com/", cacheDir);
    expect(html).toContain("link-card--fallback");
    expect(html).toContain("https://example.com/");
  });

  it("非200レスポンスでも簡易カードにフォールバックする", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 })),
    );
    const html = await compileWithLinkCard("https://example.com/", cacheDir);
    expect(html).toContain("link-card--fallback");
  });

  it("同一URLの2回目ビルドはキャッシュHITでfetchを呼ばない（ビルド跨ぎ再利用）", async () => {
    const fetchFn = stubFetchOk(ogpHtml({ title: "キャッシュ検証" }));
    // 1回目: MISS → fetch + ディスクへ保存
    await compileWithLinkCard("https://example.com/", cacheDir);
    // 2回目: 別ファクトリ呼び出しでも同一 cacheDir からロード → HIT
    const html = await compileWithLinkCard("https://example.com/", cacheDir);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(html).toContain("キャッシュ検証");
  });

  it("fetch失敗結果はキャッシュに書かれない（成功のみ保存）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await compileWithLinkCard("https://example.com/", cacheDir);
    // 失敗時はキャッシュファイルを生成しない
    expect(existsSync(join(cacheRoot, "link-card", "ogp.json"))).toBe(false);
  });
});
