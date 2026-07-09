import { markdownToHtml } from "satteri";

import { linkCard } from "../../plugins/link-card.mjs";

/**
 * link-card プラグインで markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 *
 * link-card の paragraph visitor は async（fetch）のため markdownToHtml は Promise を返す
 * （satteri-plugin-api.md）。await して解決する。
 *
 * cacheDir にテストごとの scratch ディレクトリを渡すことで、実キャッシュ
 * （.cache/link-card/）の汚染とテスト間の Map 共有を避ける。fetch は各テストで
 * vi.stubGlobal('fetch', …) によりスタブし、実ネットワークに出ない。
 */
export async function compileWithLinkCard(
  source: string,
  cacheDir: URL,
): Promise<string> {
  const result = await markdownToHtml(source, {
    mdastPlugins: [linkCard({ cacheDir })],
  });
  return result.html;
}
