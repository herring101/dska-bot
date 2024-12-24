# 開発環境セットアップガイド

## 必要条件

- Node.js v18以上
- pnpm
- Discord開発者アカウント
- （オプション）OpenAI APIキー

## セットアップ手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-org/dska-bot.git
cd dska-bot
```

2. **依存関係のインストール**
```bash
pnpm install
```

3. **環境変数の設定**
```bash
cp .env.example .env
```
`.env`ファイルを編集し、以下の項目を設定：
- `DISCORD_TOKEN`: Discordボットトークン
- `CLIENT_ID`: DiscordアプリケーションのClient ID
- `OPENAI_API_KEY`: OpenAI APIキー（オプション）

4. **Discordボットの設定**
- Discord Developer Portalでボットを作成
- 必要な権限を付与
- トークンを取得し`.env`に設定

5. **開発サーバー起動**
```bash
# スラッシュコマンドの登録
pnpm run deploy-commands

# 開発サーバー起動
pnpm run dev
```

## トラブルシューティング

- ボットがオフライン: トークンの確認
- コマンドが登録されない: CLIENT_IDの確認
- その他の問題: Issueを作成してください