import rss from "@astrojs/rss";

import { buildContentFeed } from "../lib/feed";
import { SITE } from "../lib/site";

// RSS フィードエンドポイント（feeds-meta R-1〜R-3 / AC-1）。
// static 出力のためビルド時に prerender され dist/rss.xml として出力される。
// フッターの RSS リンク（SITE_LINKS.rss = "/rss.xml"）の宛先。
// items は buildContentFeed が全タイプ混在・created_at 降順・最大20件・非公開除外で用意する。
export async function GET(context) {
  const items = await buildContentFeed();
  return rss({
    title: SITE.title,
    description: SITE.description,
    // link の相対 URL 解決に使うサイト URL（astro.config の site）。
    site: context.site,
    items,
  });
}
