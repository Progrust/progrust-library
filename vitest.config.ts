/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro の設定を引き継いだ上で vitest を構成する。
// テスト対象は純関数・Sätteriプラグイン（mdast/hast）なので environment は node。
export default getViteConfig({
  test: {
    environment: "node",
  },
});
