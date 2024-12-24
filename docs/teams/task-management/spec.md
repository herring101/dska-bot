# タスク管理機能仕様書

## 1. 実装済み機能

### 1.1 Discordコマンド
| コマンド | 説明 | オプション |
|---------|------|-----------|
| `/task add` | タスク追加 | - title: タイトル（必須）<br>- deadline: 締切日（YYYY-MM-DD）<br>- priority: 優先度（高/中/低）<br>- description: 詳細説明 |
| `/task list` | タスク一覧 | - filter: フィルター（all/pending/completed） |
| `/task progress` | 進捗更新 | - task_id: タスクID（必須）<br>- progress: 進捗率（0-100）（必須） |
| `/task complete` | タスク完了 | - task_id: タスクID（必須） |

### 1.2 TaskService API
```typescript
class TaskService {
  // タスク作成
  async createTask(input: CreateTaskInput): Promise<TaskWithReminders>
  
  // タスク取得
  async getTask(id: string): Promise<TaskWithReminders>
  async getUserTasks(userId: string): Promise<Task[]>
  
  // タスク更新
  async updateTask(id: string, input: UpdateTaskInput): Promise<TaskWithReminders>
  async updateProgress(id: string, progress: number): Promise<Task>
  async completeTask(id: string): Promise<Task>
  
  // タスク削除
  async deleteTask(id: string): Promise<Task>
  
  // 締切管理
  async getUpcomingTasks(userId: string, days?: number): Promise<Task[]>
}
```

## 2. 他チームとの連携ポイント

### 2.1 LLMチーム（Cさん）
- 自然言語からのタスク情報抽出
- タスクの優先度推定
- コマンド解釈の拡張

### 2.2 キャラクターチーム（Bさん）
- タスク状態変更時の通知
  - タスク作成時
  - 進捗更新時
  - タスク完了時
- キャラクター別の応答生成

### 2.3 UIチーム（Eさん）
- タスク一覧の表示形式
- 進捗表示のビジュアル
- インタラクションコンポーネント

## 3. データモデル

```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline?: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

interface TaskReminder {
  id: string;
  taskId: string;
  reminderTime: Date;
  messageType: 'DEADLINE' | 'PROGRESS' | 'START' | 'FOLLOW_UP';
  createdAt: Date;
}
```

## 4. 次期開発項目

### 4.1 優先度高
- [ ] LLMチームとの統合
- [ ] キャラクター反応の実装
- [ ] UIの改善

### 4.2 将来的な拡張
- [ ] タグ機能
- [ ] 繰り返しタスク
- [ ] タスクの依存関係
- [ ] チーム機能

## 5. エラーハンドリング

```typescript
class TaskServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

// エラーコード
type ErrorCode = 
  | 'NOT_FOUND'      // タスクが見つからない
  | 'CREATE_FAILED'  // 作成失敗
  | 'UPDATE_FAILED'  // 更新失敗
  | 'DELETE_FAILED'  // 削除失敗
  | 'INVALID_PROGRESS'; // 不正な進捗値
```