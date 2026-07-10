import { describe, it, expect } from "vitest";

import { resolvePreviewPlacement } from "../../src/scripts/dict-preview";

// ホバープレビュー小窓の配置（wikilink-ui AC-3 / R-7: リンク下・下端反転）の純ロジックを
// 検証する。ホバー発火・小窓内リンク除外（R-8）・タッチ無効（R-9）は DOM/E2E 領域のため
// ビルド + 目視で確認する（architecture §10）。
describe("resolvePreviewPlacement", () => {
  const preview = { width: 320, height: 288 };
  const viewport = { width: 1280, height: 800 };

  it("[AC-3] リンクが画面上部にあるとき小窓はリンク下に配置される", () => {
    const link = { top: 100, bottom: 116, left: 200 };
    const placement = resolvePreviewPlacement(link, preview, viewport);
    expect(placement.flipped).toBe(false);
    expect(placement.top).toBeGreaterThan(link.bottom);
  });

  it("[AC-3] リンクが画面下端付近で小窓が下にはみ出すと上へ反転する", () => {
    const link = { top: 760, bottom: 776, left: 200 };
    const placement = resolvePreviewPlacement(link, preview, viewport);
    expect(placement.flipped).toBe(true);
    // 反転時は小窓の下端がリンク上端を超えない。
    expect(placement.top + preview.height).toBeLessThanOrEqual(link.top);
  });

  it("[AC-3] 小窓が右端をはみ出す位置では left をビューポート内にクランプする", () => {
    const link = { top: 100, bottom: 116, left: 1200 };
    const placement = resolvePreviewPlacement(link, preview, viewport);
    expect(placement.left + preview.width).toBeLessThanOrEqual(viewport.width);
  });
});
