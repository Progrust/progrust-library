import { buildContentSearchIndex } from "../lib/search-index";

// 検索インデックス JSON エンドポイント（architecture §5/§7・search.md R-1/AC-1）。
// static 出力のためビルド時に prerender され dist/search-index.json として出力される。
// 検索ボックス（T5-3）・一覧絞込（T5-4）が初回操作時に遅延 fetch する（R-2）。
export async function GET() {
  const entries = await buildContentSearchIndex();
  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
}
