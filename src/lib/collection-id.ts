// コレクションエントリの ID（= URL slug）導出ロジック。
// content.config.ts の generateId から呼ぶが、このモジュールは astro:content を
// import しない純関数のみで構成する。理由: (a) config 評価段階で astro:content を
// 巻き込む load-order リスクを避ける、(b) ID 規則（content-model R-5〜R-8）を
// vitest で直接検証できるようにする。
// 引数 entry は glob loader の GenerateIdOptions.entry（base 相対パス）。

/** base 相対パスから拡張子を除いたファイル名のみを取り出す（フォルダ階層を捨てる） */
function fileNameWithoutExt(entry: string): string {
  const base = entry.split("/").pop() ?? entry;
  return base.replace(/\.md$/, "");
}

/** 辞書エントリの ID: ファイル名のみ（フォルダ階層に依らない。content-model R-5） */
export function dictId(entry: string): string {
  return fileNameWithoutExt(entry);
}

/** 記事エントリの ID: ファイル名のみ（辞書と同一規則。content-model R-5） */
export function articleId(entry: string): string {
  return fileNameWithoutExt(entry);
}

/** 本エントリの ID: 本ディレクトリ名（entry は `[本slug]/index.md`） */
export function bookId(entry: string): string {
  return entry.split("/")[0];
}

/**
 * 章エントリの ID: `[本slug]/[連番除去後のファイル名]`（content-model R-7/R-8）。
 * 例: `rust-web-app-book/01-intro.md` → `rust-web-app-book/intro`
 */
export function chapterId(entry: string): string {
  const [book] = entry.split("/");
  const slug = fileNameWithoutExt(entry).replace(/^\d{2}-/, "");
  return `${book}/${slug}`;
}
