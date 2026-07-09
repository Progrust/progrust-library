import { defineCollection } from "astro:content";
import { z } from "astro:schema";
import { glob } from "astro/loaders";

import { dictId, articleId, bookId, chapterId } from "./lib/collection-id";

// frontmatter.md のフィールド定義を zod に落とす。スキーマ違反はビルドエラー
// （content-model R-2）。全コンテンツ共通のフィールドを一箇所に定義し再利用する。
const commonFields = {
  title: z.string(),
  description: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  tags: z.array(z.string()),
  public: z.boolean(),
};

// 記事・本のヘッダ画像。ダミーは remote URL のため astro:assets の image() は使わず
// 文字列で受ける（画像最適化 R-16/R-17 は後続タスクの対象）。
const imageField = z.object({
  url: z.string(),
  alt: z.string(),
});

const dict = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./content/dict",
    generateId: ({ entry }) => dictId(entry),
  }),
  schema: z.object(commonFields),
});

const articles = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./content/articles",
    generateId: ({ entry }) => articleId(entry),
  }),
  schema: z.object({ ...commonFields, image: imageField }),
});

const books = defineCollection({
  loader: glob({
    pattern: "*/index.md",
    base: "./content/books",
    generateId: ({ entry }) => bookId(entry),
  }),
  schema: z.object({ ...commonFields, image: imageField }),
});

const chapters = defineCollection({
  // index.md（本メタ）は books コレクション側で扱うため章からは除外する。
  loader: glob({
    pattern: ["*/*.md", "!*/index.md"],
    base: "./content/books",
    generateId: ({ entry }) => chapterId(entry),
  }),
  schema: z.object(commonFields),
});

export const collections = { dict, articles, books, chapters };
