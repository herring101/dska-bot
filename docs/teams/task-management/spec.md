# タスク管理機能仕様書

## 1. 概要

タスクの登録、管理、進捗追跡を行う中核機能の実装仕様です。

## 2. 技術スタック

- TypeScript
- discord.js v14
- Prisma (DB ORM)
- Jest (テスト)

## 3. データモデル

```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. 主要機能実装

### 4.1 タスク管理
```typescript
class TaskService {
  async createTask(input: TaskInput): Promise<Task>
  async updateTask(id: string, input: Partial<TaskInput>): Promise<Task>
  async deleteTask(id: string): Promise<void>
  async getTask(id: string): Promise<Task>
  async listTasks(userId: string): Promise<Task[]>
}
```

### 4.2 進捗管理
```typescript
class ProgressService {
  async updateProgress(taskId: string, progress: number): Promise<Task>
  async completeTask(taskId: string): Promise<Task>
  async getTaskProgress(taskId: string): Promise<number>
}
```

## 5. Discord Commands

| コマンド | 説明 | 引数 |
|---------|------|------|
| /task add | タスク追加 | title, deadline, priority |
| /task list | タスク一覧 | [filter] |
| /task progress | 進捗更新 | task_id, progress |
| /task complete | タスク完了 | task_id |

## 6. 留意点

- タスクのバリデーション
- 締切日の時間帯処理
- 進捗率の範囲チェック（0-100）
- 不正なタスクIDへの対応

## 7. テスト要件

- 単体テスト
  - TaskService
  - ProgressService
- 統合テスト
  - Discord Command処理
  - DB操作
- E2Eテスト
  - 主要フロー