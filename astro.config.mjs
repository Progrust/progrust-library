// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Sätteri（Markdownパイプライン）の processor / カスタムプラグイン設定は P2 で追加する。
// 本設定は基盤（Tailwind + サイトURL）のみを持つ最小構成。
export default defineConfig({
  site: "https://progrust.com",
  vite: {
    plugins: [tailwindcss()],
  },
});
