# データベース設計・実装仕様書

## 1. アーキテクチャ

### 1.1 開発環境
- SQLite
- Prisma ORM
- リレーショナルモード: prisma

### 1.2 本番環境
- PlanetScale (MySQL)
- コネクションプール最適化
- 自動スケーリング対応

## 2. データモデル

### 2.1 Core Models

```prisma
model User {
  id                  String    @id
  activeCharacterId   String?
  pressureLevel       Int       @default(3)
  notificationEnabled Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  tasks               Task[]
  interactions        CharacterInteraction[]
}

model Task {
  id          String    @id @default(uuid())
  userId      String
  title       String
  description String?
  deadline    DateTime?
  priority    String    @default("MEDIUM")
  progress    Int       @default(0)
  status      String    @default("PENDING")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  reminders   TaskReminder[]
  user        User      @relation(fields: [userId], references: [id])

  @@index([userId])
}

model TaskReminder {
  id            String    @id @default(uuid())
  taskId        String
  reminderTime  DateTime
  messageType   String
  createdAt     DateTime  @default(now())
  task          Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

model CharacterInteraction {
  id              String    @id @default(uuid())
  userId          String
  characterId     String
  interactionType String
  context         String
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

## 3. リポジトリ層実装

### 3.1 Base Repository
- トランザクション管理
- Prismaクライアントのシングルトン化
- エラーハンドリング

### 3.2 機能別リポジトリ
- UserRepository: ユーザー管理、キャラクター設定
- TaskRepository: タスクCRUD、進捗管理
- ReminderRepository: リマインダー管理、時間ベース取得
- CharacterRepository: インタラクション記録、統計

## 4. マイグレーション戦略

### 4.1 開発環境
```bash
# スキーマ変更の適用
pnpm prisma db push

# クライアント生成
pnpm prisma generate
```

### 4.2 本番環境（予定）
1. PlanetScaleのDeploy Request作成
2. マイグレーションのレビュー
3. ステージング環境でのテスト
4. 本番デプロイ

## 5. バックアップ戦略

### 5.1 開発環境
- SQLiteファイルの定期バックアップ
- Git管理による変更履歴保持

### 5.2 本番環境（予定）
- PlanetScaleの自動バックアップ
- 手動バックアップのスケジュール
- リストア手順の整備

## 6. モニタリング計画

### 6.1 メトリクス
- クエリパフォーマンス
- コネクション使用率
- エラーレート

### 6.2 アラート
- スロークエリ検知
- 接続エラー通知
- ストレージ使用率警告

## 7. 今後の課題

### 7.1 短期
- [ ] インデックス最適化
- [ ] N+1問題対策
- [ ] クエリパフォーマンスチューニング

### 7.2 中期
- [ ] PlanetScale移行
- [ ] キャッシュ層の導入
- [ ] 監視体制の確立

### 7.3 長期
- [ ] シャーディング検討
- [ ] リードレプリカ構成
- [ ] バックアップ自動化