// @ts-check
// 段落に単独で置かれたベアURLを、ビルド時にOGP情報をfetchしてリンクカードHTMLへ変換する
// mdastプラグイン（docs/markdown-pipeline/link-card.md）。記法は rule.md「リンクカード」に従う。
// - 失敗時はthrowせず簡易カード（link-card--fallback）へフォールバックしビルドを落とさない
//   （mermaidが失敗でthrowするのと方針が逆）。
// - キャッシュはリポジトリにコミットしてビルド間で再利用する（spec deploy.md R-4）。
//   成功結果のみ保存する（失敗を保存するとコミット運用で恒久フォールバック化するため）。
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineMdastPlugin } from "satteri";

// キャッシュ既定パス: node_modules/.cache/ ではなく .cache/（gitignore対象外＝コミット可）。
// spec deploy.md R-4「キャッシュはリポジトリにコミットしてビルド間で再利用」に従う。
const DEFAULT_CACHE_DIR = new URL("../.cache/link-card/", import.meta.url);

// fetchのタイムアウト（ミリ秒）。応答を返さずコネクションを保持するサーバに当たると
// visitorがawaitのまま進まずビルドがハング（フォールバック経路にも入らない）するため上限を設ける。
// タイムアウトはAbortErrorとしてthrowされ、既存のcatch→フォールバックがそのまま効く。
const FETCH_TIMEOUT_MS = 10_000;

// mdast段階の {rawHtml} は生markdownとして再パースされるためHTML属性値はエスケープ必須。
/** @param {unknown} s */
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * <meta property="og:xxx" content="..."> / name="..." 両対応・属性順不同でcontentを抽出する。
 * @param {string} html
 * @param {string} prop
 * @returns {string | undefined}
 */
function extractMeta(html, prop) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  return tag?.match(/content=["']([^"']*)["']/i)?.[1];
}

/**
 * URLをfetchしOGP（og:title/description/image、無ければ<title>）を抽出する。
 * 非200はthrowして呼び出し側のフォールバックに委ねる。
 * @param {string} url
 * @returns {Promise<{ ok: true, title: string | null, description: string | null, image: string | null }>}
 */
async function fetchOgp(url) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // trim + 内部空白（改行含む）を単一スペースへ正規化する。og:content内の空行（連続改行）が
  // rawHtml再パース時にHTMLブロックを分断しカード後半が生markdown化するのを防ぐ（落とし穴1の防御）。
  /** @param {string | null | undefined} s */
  const nonEmpty = (s) => {
    const v = s?.replace(/\s+/g, " ").trim();
    return v ? v : null;
  };
  const title =
    nonEmpty(extractMeta(html, "og:title")) ??
    nonEmpty(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  return {
    ok: true,
    title: title ?? null,
    description: nonEmpty(extractMeta(html, "og:description")),
    image: nonEmpty(extractMeta(html, "og:image")),
  };
}

/**
 * OGPカードHTML。★block要素<div>で開始する（inline<a>開始は再パースで壊れる。落とし穴1）。
 * @param {string} url
 * @param {{ title: string | null, description: string | null, image: string | null }} ogp
 * @returns {string}
 */
function fullCard(url, ogp) {
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  })();
  const img = ogp.image
    ? `<img class="link-card__image" src="${escapeHtml(ogp.image)}" alt="">`
    : "";
  const desc = ogp.description
    ? `<span class="link-card__desc">${escapeHtml(ogp.description)}</span>`
    : "";
  return (
    `<div class="link-card-wrap"><a class="link-card" href="${escapeHtml(url)}">` +
    `<span class="link-card__body">` +
    `<span class="link-card__title">${escapeHtml(ogp.title ?? url)}</span>` +
    desc +
    `<span class="link-card__host">${escapeHtml(host)}</span>` +
    `</span>${img}</a></div>`
  );
}

/**
 * fetch失敗時の簡易カード。★同じくblock要素<div>で開始する。
 * @param {string} url
 * @returns {string}
 */
function fallbackCard(url) {
  return `<div class="link-card-wrap"><a class="link-card link-card--fallback" href="${escapeHtml(url)}">${escapeHtml(url)}</a></div>`;
}

/**
 * 段落が「単独ベアURL」ならそのURLを返す。そうでなければ undefined。
 * GFM autolink-literalはベアURLをlinkノード化し表示テキスト===urlになる。
 * - 文中URL（前後にtext兄弟）→ 子が複数 → 対象外
 * - 通常リンク [表示名](url)（text !== url）→ 対象外
 * @param {import('satteri').MdastContent} node
 * @returns {string | undefined}
 */
function soleBareUrl(node) {
  const kids = (("children" in node && node.children) || []).filter(
    (c) => !(c.type === "text" && c.value.trim() === ""),
  );
  if (kids.length !== 1) return undefined;
  const link = kids[0];
  if (link.type !== "link") return undefined;
  const linkKids = link.children ?? [];
  if (linkKids.length !== 1 || linkKids[0].type !== "text") return undefined;
  if (linkKids[0].value !== link.url) return undefined;
  return link.url;
}

/**
 * リンクカードプラグインのファクトリ。キャッシュ（文書横断・ビルド跨ぎ）を閉包に持つため
 * ファクトリ形式にする（wikilink.mjs の状態保持パターンに倣う）。cacheDir を差し替え可能に
 * することで、テストは scratch ディレクトリを渡し実キャッシュの汚染・実ディスク書き込みを避ける。
 *
 * @param {{ cacheDir?: URL }} [options]
 */
export function linkCard({ cacheDir = DEFAULT_CACHE_DIR } = {}) {
  const cacheFile = new URL("ogp.json", cacheDir);

  const cache = (() => {
    try {
      const json = readFileSync(fileURLToPath(cacheFile), "utf8");
      return new Map(Object.entries(JSON.parse(json)));
    } catch {
      return new Map(); // 初回はファイルなし
    }
  })();

  function saveCache() {
    mkdirSync(fileURLToPath(cacheDir), { recursive: true });
    writeFileSync(
      fileURLToPath(cacheFile),
      JSON.stringify(Object.fromEntries(cache), null, 2),
    );
  }

  return defineMdastPlugin({
    name: "link-card",
    async paragraph(node, ctx) {
      const url = soleBareUrl(node);
      if (!url) return;
      // 内部リンク除外ガード: fetch対象は絶対http(s)のみ。内部パス（/dict/… 等）は素通り。
      // wikilink出力は text!==url で既に soleBareUrl 時点で除外されるため、これは
      // [/about](/about) のような text===url かつ内部パスを塞ぐ defense-in-depth。
      // スキームは大文字（HTTPS://。URLとして有効）も外部リンクなので i フラグで拾う。
      if (!/^https?:\/\//i.test(url)) return;

      let ogp = cache.get(url);
      if (!ogp) {
        try {
          ogp = await fetchOgp(url);
          // 成功結果のみキャッシュする（失敗を保存するとコミット運用で恒久フォールバック化）。
          cache.set(url, ogp);
          saveCache();
        } catch {
          // 失敗してもビルドを落とさず簡易カードへフォールバック（キャッシュには書かない）。
          ogp = { ok: false };
        }
      }

      const html = ogp.ok ? fullCard(url, ogp) : fallbackCard(url);
      ctx.replaceNode(node, { rawHtml: html });
    },
  });
}
