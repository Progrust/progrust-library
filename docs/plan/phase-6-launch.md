# P6: 周辺機能とリリース

フィード・メタ情報・残デザイン課題を仕上げ、CI/CDを構築して本番公開する。

参照spec: [feeds-meta.md](../spec/feeds-meta.md) / [deploy.md](../spec/deploy.md)

依存: P4・P5完了

## タスク

- [ ] **T6-1: RSS・sitemap**
  `@astrojs/rss`（全タイプ混在・直近20件・概要のみ）と`@astrojs/sitemap`。フッターからRSSへリンク。
  完了条件: feeds-meta AC-1 / AC-2 を満たす。
- [ ] **T6-2: OGP・meta・favicon・Analytics**
  BaseLayoutのmeta/OGP出力（タイトル形式・共通OGP画像・canonical）・favicon・Cloudflare Web Analyticsタグ。OGP画像とfaviconの素材を用意する。
  完了条件: feeds-meta AC-3 / AC-4 を満たす。
- [ ] **T6-3: コードフォント・Shikiテーマ確定（デザイン残課題）**
  全角対応等幅フォント（UDEV Gothic / Moralerspace等）を実表示で比較して選定・差し替える（基本3フォントはP5でAstro Fonts APIによるセルフホスト済み。ui-design-spec「タイポグラフィ」参照）。Shiki dual themeを確定配色（[ui-design-spec.md](../ui-design/ui-design-spec.md)のコードブロック配色）に合わせる（既成テーマ選定 or カスタム）。
  完了条件: 決定内容がui-design-spec.mdの「未確定・本実装時の課題」から本文へ反映され、実表示で確認済み。
- [ ] **T6-4: Cloudflareセットアップ + GitHub Actions**
  Pagesプロジェクト作成・APIトークン発行・Secrets登録・カスタムドメイン割当（[deploy.md](../spec/deploy.md) R-1）。`.github/workflows/deploy.yml`（test → build → wrangler-action、Playwright/依存キャッシュ、OGPキャッシュのコミット運用）。
  完了条件: deploy.md AC-1〜AC-4 を満たす。
- [ ] **T6-5: リリース前総点検** 〔Fable 5〕
  全specの受入基準を通しで確認し、ダミーコンテンツを実コンテンツ運用に切り替える方針（削除 or 非公開化）を決めて適用する。Lighthouse等でパフォーマンス・アクセシビリティの大きな問題がないか確認する。
  完了条件: 全spec受入基準のチェックリストが埋まり、`https://progrust.com` で公開されている。

## 実施履歴

### T6-1

### T6-2

### T6-3

### T6-4

### T6-5

## フェーズ完了条件

progrust.comで本番公開され、mainへのpushで自動デプロイされる。全specの受入基準を満たす。

完了後: [plan運用ルール7](README.md) に従い、planディレクトリを凍結して`docs/archive/`へ移動する。
