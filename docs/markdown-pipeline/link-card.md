# リンクカード（ベアURLのOGPカード化）

段落に単独で置かれたベアURLを、ビルド時にOGP情報をfetchしてリンクカードHTMLへ変換するmdastプラグイン。ビルドを跨ぐローカルキャッシュ付き。fetch失敗時は簡易カードへフォールバックし、**ビルドは落とさない**（mermaidが失敗でthrowするのと方針が逆な点に注意）。

前提知識: [satteri-plugin-api.md](satteri-plugin-api.md)（asyncビジター / `{ rawHtml }` / ファクトリ形式）

## 記法

執筆記法は `../markdown-notation/rule.md` の「リンクカード」参照。段落の唯一の子がベアURLの場合のみカード化。文中URL・通常リンク`[表示名](url)`は対象外。

## 実装方式

1. **検出**: GFM autolink-literal（デフォルト有効）がベアURLを`link`ノード化するため、`paragraph` visitorで「**意味のある子が`link`1個だけ、かつその`link`の唯一の`text`子の値が`link.url`と一致**」を判定するだけでよい（textの自前URL検出は不要）
   - 文中URLは`[text, link, text]`の3子 → 対象外
   - 通常リンクはtext子（表示名）≠ url → 対象外
   - `inlineCode`/`code`内は元々`link`にならない → 誤検出なし
2. **取得**: async `paragraph` visitor内で`fetch`し、OGP（`og:title`/`og:description`/`og:image`、無ければ`<title>`）を正規表現抽出
3. **埋め込み**: `ctx.replaceNode(node, { rawHtml })`。**カードHTMLは必ずblock要素（`<div>`）で開始する**（最重要。下記「落とし穴」1参照）。カードの `<a>` には `target="_blank" rel="noopener noreferrer"` を直書きし別タブで開く（spec [pages.md](../spec/pages.md) R-24。段落ごとrawHtml化されるため [external-links.md](external-links.md) プラグインの対象外になる）
4. **キャッシュ**: `.cache/link-card/ogp.json`（リポジトリ直下・**gitignore対象外＝コミット可**）にビルドを跨いで保存。ファクトリ呼び出し時に`Map`へロードし、成功fetchのたびにディスクへ書き出す。コミット運用は spec [deploy.md](../spec/deploy.md) R-4（T2-3で本番化）
5. **失敗時**: try/catchで捕捉し、throwせず簡易カード（`link-card--fallback`）へフォールバック。非200も同様。**失敗結果はキャッシュに書かない**（成功のみ保存。コミット運用で失敗が永続化＝恒久フォールバックになるのを避ける。T2-3の決定）
6. **内部リンク除外ガード**: fetch直前に`/^https?:\/\//`を満たさないURLはカード化せず素通り（内部パス`/…`を除外。T2-3で追加）

## 雛形コード（動作確認済み）

> **本番実装との差分（T2-3で確定）**: 雛形は `dLinkCard`/`d-linkcard.mjs`・キャッシュ `node_modules/.cache/`・失敗もキャッシュだが、本番は
> **`linkCard`/`plugins/link-card.mjs`**（既定名は [architecture.md](../architecture.md) §1）・キャッシュ **`.cache/link-card/`（コミット可）**・**成功のみキャッシュ**・**内部リンク除外ガード**・**キャッシュを`Map`ではなくファクトリ閉包に保持**（テスト隔離のため `cacheDir` を受ける）に変更している。実装は `plugins/link-card.mjs` を正とする。

### astro.config.mjs

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { linkCard } from './plugins/link-card.mjs';

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [linkCard()], // ★ ファクトリ形式（キャッシュはファクトリ閉包に保持）
      hastPlugins: [],
    }),
  },
});
```

### 変換プラグイン（`plugins/link-card.mjs`）

```js
// リンクカード（段落に単独で置かれたベアURL → OGPカード化）
// - 検出: paragraph の子が link 1つだけ かつ link の唯一の text 子の値が link.url と一致（GFM autolink-literal）
//   → 文中URL（前後に text 兄弟がある）や通常リンク [表示名](url)（text ≠ url）は対象外
// - 取得: async visitor 内で fetch し OGP 抽出。ctx.replaceNode(node, { rawHtml }) で埋め込み
//   ★ rawHtml は mdast 段階では「生の markdown ソース」として再パースされる。カードを inline 要素（<a>）で
//     始めると markdown 段落扱いになり、内部の URL テキストが GFM autolink-literal で二重リンク化される。
//     → カードは必ず block 要素（<div>）で開始し、CommonMark の HTML ブロックとして verbatim 出力させる
// - キャッシュ: node_modules/.cache/link-card/ogp.json にビルドを跨いで保存
// - 失敗: throw せず簡易カードへフォールバック
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';

// --- キャッシュ（モジュールレベル: ビルド内の全文書 + ディスク経由で次ビルドと共有）---
const CACHE_DIR = fileURLToPath(new URL('../node_modules/.cache/link-card/', import.meta.url));
const CACHE_FILE = `${CACHE_DIR}ogp.json`;

function loadCache() {
  try {
    return new Map(Object.entries(JSON.parse(readFileSync(CACHE_FILE, 'utf8'))));
  } catch {
    return new Map(); // 初回はファイルなし
  }
}

const cache = loadCache();

function saveCache() {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache), null, 2));
}

// --- OGP 取得 ---
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function extractMeta(html, prop) {
  // <meta property="og:title" content="..."> / name="..." 両方、属性順不同に対応
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`,
    'i',
  );
  const tag = html.match(re)?.[0];
  return tag?.match(/content=["']([^"']*)["']/i)?.[1];
}

async function fetchOgp(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const nonEmpty = (s) => (s && s.trim() ? s.trim() : null);
  const title =
    nonEmpty(extractMeta(html, 'og:title')) ??
    nonEmpty(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  return {
    ok: true,
    title: title ?? null,
    description: nonEmpty(extractMeta(html, 'og:description')),
    image: nonEmpty(extractMeta(html, 'og:image')),
  };
}

// --- カードHTML（★ block 要素 <div> で開始する。inline <a> 開始は再パースで壊れる）---
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
    : '';
  const desc = ogp.description
    ? `<span class="link-card__desc">${escapeHtml(ogp.description)}</span>`
    : '';
  return (
    `<div class="link-card-wrap"><a class="link-card" href="${escapeHtml(url)}">` +
    `<span class="link-card__body">` +
    `<span class="link-card__title">${escapeHtml(ogp.title ?? url)}</span>` +
    desc +
    `<span class="link-card__host">${escapeHtml(host)}</span>` +
    `</span>${img}</a></div>`
  );
}

function fallbackCard(url) {
  return `<div class="link-card-wrap"><a class="link-card link-card--fallback" href="${escapeHtml(url)}">${escapeHtml(url)}</a></div>`;
}

// --- 検出: 段落が「単独ベアURL」か ---
function soleBareUrl(node) {
  const kids = (node.children ?? []).filter(
    (c) => !(c.type === 'text' && c.value.trim() === ''),
  );
  if (kids.length !== 1) return undefined;
  const link = kids[0];
  if (link.type !== 'link') return undefined;
  const linkKids = link.children ?? [];
  if (linkKids.length !== 1 || linkKids[0].type !== 'text') return undefined;
  // ベアURL autolink は表示テキスト === url。通常リンク [表示名](url) はここで弾かれる
  if (linkKids[0].value !== link.url) return undefined;
  return link.url;
}

// ※ ファクトリ形式（キャッシュ自体はモジュールレベルで共有）
export function dLinkCard() {
  return defineMdastPlugin({
    name: 'd-linkcard',
    async paragraph(node, ctx) {
      const url = soleBareUrl(node);
      if (!url) return;

      let ogp;
      if (cache.has(url)) {
        console.log('[link-card] cache HIT', url);
        ogp = cache.get(url);
      } else {
        console.log('[link-card] MISS -> fetch', url);
        try {
          ogp = await fetchOgp(url);
        } catch (err) {
          // 失敗してもビルドを落とさない。簡易カードへフォールバック
          console.log('[link-card] fetch FAILED (fallback)', url, err.message);
          ogp = { ok: false };
        }
        cache.set(url, ogp);
        saveCache();
      }

      const html = ogp.ok ? fullCard(url, ogp) : fallbackCard(url);
      ctx.replaceNode(node, { rawHtml: html });
    },
  });
}
```

## 検出判定のノード構造（実測）

```text
入力（ベアURL単独）: https://example.com/
paragraph
  link url='https://example.com/' title=null
    text value='https://example.com/'           ← text.value === link.url（＝ベアURL）→ 対象

入力（文中URL）: 本文中に https://example.com/ を含む段落です。
paragraph
  text value='本文中に '
  link url='https://example.com/' > text value='https://example.com/'
  text value=' を含む段落です。'                 ← 子が3つ → 対象外

入力（通常リンク単独）: [表示名リンク](https://example.com/)
paragraph
  link url='https://example.com/' > text value='表示名リンク'   ← text.value ≠ url → 対象外

入力（画像単独）: ![alt](...)
paragraph
  image url=... alt=...                          ← link ではない → 対象外
```

※autolink-literalの`link`ノードにも`position`は付いていた（型定義の「no source range」の記述に反し、少なくとも本ケースでは付与。キャッシュキーはURLなので影響なし）。

## キャッシュ動作（実測）

- 1回目ビルド: 全URL `MISS -> fetch`（到達不能URLは`fetch FAILED (fallback)`）→ exit 0
- 2回目ビルド: 全URL `cache HIT`、**fetchは一切走らない** → exit 0
- キャッシュ形式: `{ "<url>": { ok, title, description, image } }`のJSON。**失敗結果（`{ ok: false }`）もキャッシュされる**（下記「制約」参照）
- CIではこのキャッシュディレクトリを跨ビルドで永続化（actions/cache等）すると再取得を避けられる

## 落とし穴と回避策

1. **mdastの`{ rawHtml }`は「生のmarkdownソース」として再パースされる（本機能の本丸）**
   - カードをinline要素`<a>`で開始すると、出力が`<p>`で包まれ、さらにカード内部のURL風テキストがGFM autolink-literalで二重リンク化されて壊れる（`www.rust-lang.org`に`http://`が付与される、フォールバックカードのURL文字列が`"` `>`ごとURLに飲み込まれ`%22`/`%3E`化する等を実測）
   - 原因: CommonMarkでは行頭が**blockレベルのHTMLタグ**（`div`/`p`/`table`等）なら「HTMLブロック」として中身を素通しするが、**inlineタグ（`a`等）で始まる文字列は段落（markdownテキスト）扱い**になり内部がinline解析（autolink含む）される
   - 回避策: **カードをblock要素で開始**（`<div class="link-card-wrap">…</div>`）。HTMLブロックとしてverbatim出力され、`<p>`包みもautolink二重化も起きない（実測で`&lt;a`混入0件）
   - 代替方式: `{ rawHtml }`を避け、mdastノード構築（`data.hName`方式）またはhastプラグインの`{ type:'raw', value }`で組むこともできる。最小実装は「block開始のrawHtml」で足りる
2. **キャッシュキーのURL正規化をしていない**: URL文字列そのものがキーのため、末尾スラッシュ・大文字小文字・クエリ順の表記揺れで別エントリになる（本番で正規化を検討）
3. **fetch失敗結果もキャッシュされ再試行しない**: 一時的なネットワーク障害でもキャッシュ削除まで恒久フォールバックになる。失敗をキャッシュしない/TTLを付ける等は本番の要件で決める

## 制約・残課題

- キャッシュキーのURL正規化は未実装（落とし穴2）
- ~~失敗キャッシュのTTL等の方針は未決定（落とし穴3）~~ → T2-3で**成功のみキャッシュ**に決定（失敗は保存せず次ビルドで再取得）。落とし穴3は解消
- **wikilinkとの相互作用**: wikilink生成の`link`（`/dict/…`、テキスト=title）は`text !== url`なのでカード化されない。~~同一パイプラインでの同時動作は未検証~~ → **T2-5で検証済み**（統合テスト `tests/plugins/pipeline.test.ts` でカード化されず`/dict/…`へのfetchも発生しないこと、実ビルドdistで`/dict/`アンカーの`link-card`クラス0件・`ogp.json`に`/dict/`キー0件を確認）。順序は wikilink→…→linkCard（[architecture.md](../architecture.md) §4）。内部リンク（`http(s)`以外）をfetch対象から除外するガードはT2-3で追加済み（`text === url`かつ内部パスの`[/about](/about)`のようなケースを塞ぐdefense-in-depth）
- OGPパーサ（正規表現）は最小実装。非UTF-8文字コード・リダイレクト・`<meta>`属性バリエーション・巨大HTML等のエッジケースは本番で強化する。**取得値のHTML実体参照デコードも未対応**（T2-3レビューR-2: ソース側でエスケープ済みの`&amp;`等を`escapeHtml`に通すと二重エスケープ`&amp;amp;`になる。パーサ強化時に合わせてデコードを入れる）
- fetchタイムアウトはT2-3で対応済み（`AbortSignal.timeout`。応答を保持するサーバによるビルドハングを防ぐ。T2-3レビューR-1）。OGP値の連続改行はfetch時に単一スペースへ正規化しrawHtmlブロック分断を防ぐ（同R-4）
- 並行fetch時のキャッシュJSON書き込み競合は未検証（現状はvisitor逐次のため実害なし。将来並列化する場合はread-modify-writeの原子性を要検討）
- 多数のカードがある場合の並列度チューニングは本番で（現状はvisitor逐次＋URLごとに1 fetch）
- ~~コンテンツコレクション経由の実ビルドは未検証~~ → T2-3で解消。実 `astro build` の dist（debug-render）で、到達可能URLが `class="link-card"`（実OGP title/host付き）にカード化され `.cache/link-card/ogp.json` が生成されること、到達不能URLが `link-card--fallback` かつ build exit 0（＝ビルドを落とさない）になること、失敗URLがキャッシュに書かれないことを確認済み
