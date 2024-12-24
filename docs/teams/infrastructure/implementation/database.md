# データベース実装ドキュメント

## 1. 現在の実装状況

### 1.1 データベースセットアップ
- SQLiteを使用した開発環境の構築完了
- Prismaによるスキーマ定義とマイグレーション設定完了
- リレーションモードの最適化（relationMode: "prisma"）

### 1.2 実装済みリポジトリ
1. **BaseRepository**
   - トランザクション管理
   - Prismaクライアントの共有

2. **UserRepository**
   - ユーザー作成・更新（upsert）
   - アクティブキャラクター管理
   - プレッシャーレベル制御

3. **TaskRepository**
   - タスクのCRUD操作
   - 進捗管理
   - ステータス制御
   - 優先度管理

4. **ReminderRepository**
   - リマインダー作成・管理
   - 時間ベースのリマインド取得
   - デフォルトリマインダー生成

5. **CharacterRepository**
   - インタラクション記録
   - 履歴管理
   - 統計情報生成
   - タスク関連インタラクション検索

### 1.3 テスト実装
- 各リポジトリの単体テスト
- トランザクション処理のテスト
- エラーケースの検証

## 2. 今後の実装予定

### 2.1 PlanetScale移行準備
- [ ] 本番用スキーマの最適化
- [ ] インデックス戦略の検討
- [ ] シャーディング計画の策定

### 2.2 パフォーマンス最適化
- [ ] N+1問題対策
- [ ] クエリの最適化
- [ ] インデックス追加

### 2.3 監視・運用
- [ ] メトリクス収集の実装
- [ ] アラート設定
- [ ] バックアップ戦略の実装

## 3. 使用方法

### 3.1 開発環境セットアップ
```bash
# データベースの初期化
pnpm prisma db push

# Prismaクライアントの生成
pnpm prisma generate

# テストの実行
pnpm test
```

### 3.2 リポジトリの使用例
```typescript
// ユーザーとタスクの作成
const userRepo = new UserRepository();
const taskRepo = new TaskRepository();

const user = await userRepo.upsert('discord-user-id');
const task = await taskRepo.create({
  userId: user.id,
  title: 'タスク例',
  priority: 'HIGH'
});
```

## 4. 注意点

### 4.1 トランザクション
- BaseRepositoryのtransactionメソッドを使用
- 複数の操作を伴う処理では必ずトランザクションを使用

### 4.2 バリデーション
- 入力値の検証は各リポジトリ層で実施
- カスタム型と検証関数を使用（例：TaskPriority, InteractionType）

### 4.3 エラーハンドリング
- 適切なエラーメッセージを提供
- 外部キー制約違反の適切な処理
- トランザクションのロールバック保証

## 5. 今後の課題
1. コネクションプールの最適化
2. キャッシュ戦略の実装
3. 大規模データセットでのパフォーマンステスト
4. バックアップ・リストア手順の確立
5. 監視・アラート体制の構築