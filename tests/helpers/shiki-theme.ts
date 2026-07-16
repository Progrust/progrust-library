import { codeToHtml } from "shiki";

import {
  progrustCodeTheme,
  transformerCodeBg,
} from "../../plugins/shiki-theme.mjs";

/** カスタムテーマ + pre背景除去transformerでコードをハイライトする（本番configと同構成） */
export const highlight = (code: string, lang: string): Promise<string> =>
  codeToHtml(code, {
    lang,
    theme: progrustCodeTheme,
    transformers: [transformerCodeBg],
  });
