# Discord 管理Bot

多機能なDiscordサーバー管理用Botです。

## 機能一覧
- オートモデレーション（NGワード、スパム対策）
- ログ機能
- チケットサポート
- 認証システム
- 警告・タイムアウト・Kick・Ban管理
- メッセージ予約送信
- 自動ロール
- 募集チャンネル管理
- サーバー統計
- メモ帳、ToDo、タイマー
- 地震速報通知

## ローカルでの起動方法

1. リポジトリをクローンまたはダウンロード
2. `npm install`
3. `.env.example` をコピーして `.env` を作成し、`DISCORD_TOKEN` などを設定
4. `npx prisma db push` でデータベースを初期化
5. `npm run dev` (または `npm start`) で起動

## Railwayへのデプロイ
GitHubとRailwayを連携することで、リポジトリにPushするだけで自動デプロイが完了します。
デプロイ後、Railwayの管理画面から以下の設定を行ってください。

1. **Variables**に `.env` の内容を設定（`DISCORD_TOKEN` 等）
2. **Volumes** を追加し、マウントパスを `/app/prisma` 等に設定してSQLiteデータファイルを保護（PostgreSQLを利用する場合は不要）

## ライセンス
MIT License
