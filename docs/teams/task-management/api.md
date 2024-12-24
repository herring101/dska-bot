# タスク管理API仕様

## 1. サービスAPI

### 1.1 タスク作成
```typescript
async createTask(input: CreateTaskInput): Promise<TaskWithReminders>

interface CreateTaskInput {
  userId: string;      // Discord ユーザーID
  title: string;       // タスクのタイトル
  description?: string; // タスクの詳細説明
  deadline?: Date;     // 締切日
  priority?: TaskPriority; // 優先度（デフォルト: MEDIUM）
}
```

### 1.2 タスク取得
```typescript
async getTask(id: string): Promise<TaskWithReminders>
async getUserTasks(userId: string): Promise<Task[]>
```

### 1.3 タスク更新
```typescript
async updateTask(id: string, input: UpdateTaskInput): Promise<TaskWithReminders>

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  deadline?: Date | null;
  priority?: TaskPriority;
  progress?: number;
  status?: TaskStatus;
}
```

### 1.4 進捗管理
```typescript
async updateProgress(id: string, progress: number): Promise<Task>
async completeTask(id: string): Promise<Task>
```

### 1.5 タスク削除
```typescript
async deleteTask(id: string): Promise<Task>
```

### 1.6 締切管理
```typescript
async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]>
```

## 2. Discordコマンド

### 2.1 タスク追加
```
/task add <title> [deadline] [priority] [description]

Parameters:
- title: string (required)
- deadline: string (YYYY-MM-DD)
- priority: "高" | "中" | "低"
- description: string
```

### 2.2 タスク一覧
```
/task list [filter]

Parameters:
- filter: "all" | "pending" | "completed"
```

### 2.3 進捗更新
```
/task progress <task_id> <progress>

Parameters:
- task_id: string (required)
- progress: number (0-100) (required)
```

### 2.4 タスク完了
```
/task complete <task_id>

Parameters:
- task_id: string (required)
```

## 3. エラー処理

### 3.1 エラーコード
| コード | 説明 | 対応方法 |
|--------|------|----------|
| NOT_FOUND | タスクが見つからない | タスクIDを確認 |
| CREATE_FAILED | タスク作成失敗 | 入力値を確認 |
| UPDATE_FAILED | タスク更新失敗 | 入力値とタスクの状態を確認 |
| DELETE_FAILED | タスク削除失敗 | タスクIDと権限を確認 |
| INVALID_PROGRESS | 不正な進捗値 | 0-100の範囲で指定 |

### 3.2 エラーレスポンス
```typescript
class TaskServiceError extends Error {
  code: string;
  message: string;
}
```

## 4. 他チーム向けインターフェース

### 4.1 キャラクターチーム向け
```typescript
interface TaskStateChange {
  taskId: string;
  userId: string;
  type: 'CREATE' | 'UPDATE' | 'COMPLETE';
  oldState?: Partial<Task>;
  newState: Task;
}
```

### 4.2 LLMチーム向け
```typescript
interface TaskCommand {
  action: 'CREATE' | 'UPDATE' | 'COMPLETE';
  parameters: Record<string, unknown>;
}
```

### 4.3 UIチーム向け
```typescript
interface TaskDisplay {
  task: Task;
  reminders: TaskReminder[];
  progress: number;
  daysUntilDeadline?: number;
}
```