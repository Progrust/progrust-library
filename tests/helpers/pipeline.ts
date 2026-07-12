import type { MermaidRenderer } from "mermaid-isomorphic";
import { markdownToHtml } from "satteri";

import { codeFilename } from "../../plugins/code-filename.mjs";
import { wikilink } from "../../plugins/wikilink.mjs";
import type { DictIndexEntry } from "../../plugins/dict-index.mjs";
import { directives } from "../../plugins/directives.mjs";
import { linkCard } from "../../plugins/link-card.mjs";
import { mermaid } from "../../plugins/mermaid.mjs";
import { tableWrap } from "../../plugins/table-wrap.mjs";

/**
 * 本番と同一構成（astro.config.mjs / markdown-pipeline/README.md の登録順）で
 * 全プラグインを同時登録して markdown をコンパイルするテスト用ヘルパ。
 *
 * プラグイン間相互作用（wikilink×linkCard 併存等）の回帰ガード用。
 * Shiki は satteri 外（Astro 側）のため本ヘルパでは走らない — Shiki 絡みの
 * 同時動作は実 `astro build` の dist で確認する（tests/helpers/code-filename.ts と同方針）。
 *
 * 各プラグインのテスト部品は単体ヘルパと同じ流儀:
 * - wikilink: インライン dictIndex + fileURL（公開判定は fileURL の frontmatter で決まる）
 * - linkCard: scratch cacheDir + `vi.stubGlobal('fetch', …)`（呼び出し側で用意）
 * - mermaid: fake レンダラ注入（tests/helpers/mermaid.ts）で Chromium 非起動
 *
 * linkCard の paragraph visitor が async のため await して解決する。
 */
export async function compileWithAllPlugins(
  source: string,
  options: {
    dictIndex: DictIndexEntry[];
    fileURL: URL;
    cacheDir: URL;
    renderer: unknown;
  },
): Promise<string> {
  const result = await markdownToHtml(source, {
    mdastPlugins: [
      codeFilename,
      wikilink(options.dictIndex),
      directives,
      linkCard({ cacheDir: options.cacheDir }),
    ],
    // fake レンダラは本物の MermaidRenderer の使う部分集合のみ実装するため unknown 経由で橋渡し。
    hastPlugins: [
      mermaid({ renderer: options.renderer as MermaidRenderer }),
      tableWrap,
    ],
    // directive 有効化なしでは `:::message` 等が素通りしテストが無意味（誤ってgreen）になる。
    features: { directive: true },
    fileURL: options.fileURL,
  });
  return result.html;
}
