# インフラ構成仕様書

## 1. 概要

プロジェクトのインフラ構成、デプロイメント、データベース設計の実装仕様です。

## 2. 構成要素

### 2.1 開発環境
- Node.js v18+
- pnpm
- SQLite (ローカル開発用)
- Docker (オプション)

### 2.2 本番環境
- Vercel (サーバーレス)
- PlanetScale (MySQL)
- Discord API
- OpenAI API

## 3. データベース設計

### 3.1 スキーマ
```sql
-- ユーザー設定
CREATE TABLE user_settings (
  user_id VARCHAR(255) PRIMARY KEY,
  character_id VARCHAR(255),
  pressure_level INT,
  created_at DATETIME,
  updated_at DATETIME
);

-- タスク
CREATE TABLE tasks (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  deadline DATETIME,
  priority VARCHAR(50),
  progress INT,
  status VARCHAR(50),
  created_at DATETIME,
  updated_at DATETIME
);

-- その他必要なテーブル
```

### 3.2 マイグレーション
- Prismaを使用
- スキーマ変更の履歴管理
- ロールバック手順

## 4. デプロイメントフロー

### 4.1 CI/CD (GitHub Actions)
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: vercel/actions@v1
```

### 4.2 環境変数管理
- Vercelの環境変数設定
- PlanetScaleの接続情報
- APIキーの管理

## 5. モニタリング

### 5.1 メトリクス
- APIレスポンスタイム
- DBクエリパフォーマンス
- エラーレート
- リソース使用率

### 5.2 ログ管理
- エラーログ
- アクセスログ
- パフォーマンスログ

## 6. バックアップ戦略

- DBの定期バックアップ
- 設定ファイル