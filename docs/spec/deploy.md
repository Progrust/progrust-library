# デプロイ 仕様

## 1. 概要

GitHub ActionsでビルドしてCloudflare PagesへデプロイするDirect Upload方式（`wrangler-action`）の要件を定義する。

Pages組み込みビルドを使わない理由: mermaidのビルド時SVG化に使う`mermaid-isomorphic`がPlaywright（ヘッドレスブラウザ）を必要とするため、ビルド環境を制御できるGitHub Actionsを採用する（[`../markdown-pipeline/mermaid.md`](../markdown-pipeline/mermaid.md)）。

## 2. 要求仕様

### 前提条件（未準備・実装フェーズでセットアップする）

- **R-1**: 以下のCloudflare側セットアップを行う（独自ドメイン `progrust.com` はCloudflareで管理済み）。
  1. Cloudflare Pagesプロジェクトの作成（Direct Upload用）
  2. APIトークンの発行（Pages編集権限）とGitHub Secretsへの登録（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）
  3. Pagesプロジェクトへのカスタムドメイン `blog.progrust.com` の割当（apexの `progrust.com` は使わない）

### ワークフロー

- **R-2**: `main` ブランチへのpushをトリガーに、ビルドと本番デプロイを自動実行する。プレビューデプロイ（PR単位）は行わない。
- **R-3**: ビルドジョブの要件:
  - Node.jsとnpm依存のキャッシュを利用する
  - Playwright（Chromium）をインストールする（mermaidのSVG化に必要）。ブラウザバイナリはキャッシュする
  - `astro build` の成果物を `wrangler-action`（`wrangler pages deploy`）でDirect Uploadする
- **R-4**: リンクカードのOGP取得キャッシュ（[`../markdown-pipeline/link-card.md`](../markdown-pipeline/link-card.md)）はリポジトリにコミットしてビルド間で再利用する。CI上でのfetch失敗はビルドエラーにしない（簡易カードにフォールバック）。
- **R-5**: ビルド失敗（wikilinkリンク切れ等の検証エラー含む）時はデプロイせず、GitHub Actions上で失敗として通知される。
- **R-6**: ユニットテスト（vitest）をデプロイ前に実行し、失敗時はデプロイしない。

## 4. 受入基準

- **AC-1**: `main` へpushすると、テスト→ビルド→デプロイが自動実行され、`https://blog.progrust.com` に反映される。（R-1〜R-3）
- **AC-2**: wikilinkのリンク切れを含むコミットをpushすると、ワークフローが失敗しデプロイされない。（R-5）
- **AC-3**: vitestが失敗するコミットをpushすると、デプロイされない。（R-6）
- **AC-4**: PRを作成してもデプロイは実行されない。（R-2）

## 5. 実装時の決定事項（T6-4で確定）

- **OGPキャッシュの更新運用**: 更新（新規URLの取得・キャッシュ削除後の再取得）は**ローカルビルドで行い**、`.cache/link-card/ogp.json` の差分をコミットする。CIはコミット済みキャッシュを読むだけで書き戻さない（CI上で書かれた分は成果物に含まれず破棄される。fetch失敗時は簡易カードへフォールバック＝R-4）。
- **Playwrightキャッシュ**: `actions/cache` で `~/.cache/ms-playwright` を キー `{runner.os}-playwright-{hashFiles('package-lock.json')}` で保存する。キャッシュはブラウザバイナリのみ有効なため、OS依存ライブラリはヒット時も `npx playwright install-deps chromium` で毎回導入する（ミス時は `npx playwright install --with-deps chromium`）。
- **Analyticsトークンの注入**: `PUBLIC_CF_BEACON_TOKEN` はGitHub Actions Secretsに登録し、ビルドステップの環境変数として渡す（[feeds-meta.md](feeds-meta.md) §5）。
- Pagesプロジェクト名は `progrust-library`、デプロイは `wrangler pages deploy dist --project-name=progrust-library --branch=main`（`cloudflare/wrangler-action`）。
