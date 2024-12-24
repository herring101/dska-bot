# Function Calling実装仕様

## 1. タスク管理関数

### 1.1 タスク作成
```typescript
{
  name: "create_task",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "タスクのタイトル",
      },
      description: {
        type: "string",
        description: "タスクの詳細説明（オプション）",
      },
      deadline: {
        type: "string",
        description: "締切日（YYYY-MM-DD形式）",
      },
      priority: {
        type: "string",
        enum: ["HIGH", "MEDIUM", "LOW"],
        description: "タスクの優先度",
      },
    },
    required: ["title"],
  },
}
```

### 1.2 進捗更新
```typescript
{
  name: "update_progress",
  parameters: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "タスクのID",
      },
      progress: {
        type: "number",
        description: "進捗率（0-100）",
        minimum: 0,
        maximum: 100,
      },
    },
    required: ["taskId", "progress"],
  },
}
```

### 1.3 タスク完了
```typescript
{
  name: "complete_task",
  parameters: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "タスクのID",
      },
    },
    required: ["taskId"],
  },
}
```

## 2. キャラクター管理関数

### 2.1 プレッシャー調整
```typescript
{
  name: "adjust_pressure",
  parameters: {
    type: "object",
    properties: {
      characterId: {
        type: "string",
        description: "キャラクターのID",
      },
      pressureLevel: {
        type: "number",
        description: "プレッシャーレベル（1-5）",
        minimum: 1,
        maximum: 5,
      },
      reason: {
        type: "string",
        description: "プレッシャー調整の理由",
      },
    },
    required: ["characterId", "pressureLevel"],
  },
}
```

### 2.2 応答生成
```typescript
{
  name: "generate_character_response",
  parameters: {
    type: "object",
    properties: {
      characterId: {
        type: "string",
        description: "キャラクターのID",
      },
      responseType: {
        type: "string",
        enum: [
          "TASK_CREATION",
          "PROGRESS_UPDATE",
          "TASK_COMPLETION",
          "REMINDER",
          "ENCOURAGEMENT",
          "WARNING",
        ],
        description: "応答の種類",
      },
      context: {
        type: "object",
        description: "応答生成に必要なコンテキスト情報",
        properties: {
          taskTitle: { type: "string" },
          progress: { type: "number" },
          deadline: { type: "string" },
          previousInteractions: { 
            type: "array",
            items: { type: "string" }
          },
        },
      },
    },
    required: ["characterId", "responseType"],
  },
}
```

## 3. プロンプト例

### 3.1 タスク解釈
```text
あなたはタスク管理システムのコマンドインタープリターです。
ユーザーの自然な入力をタスク管理コマンドに変換してください。
現在の日付は{current_date}です。
「明日」は翌日、「今週」は今週の日曜日、「今月」は今月末を指します。

利用可能なコマンド：
- create_task: 新しいタスクを作成
- update_progress: 進捗を更新
- complete_task: タスクを完了にする

注意点：
1. 締切日付は常に現在日付以降
2. 相対的な日付は現在日付から計算
3. 優先度は期限の近さや表現の緊急性から判断
```

### 3.2 キャラクター応答
```text
あなたは「{character_name}」として振る舞ってください。
現在のプレッシャーレベルは{pressure_level}です（範囲: 1-5）。

キャラクター設定:
{character_specific_settings}

現在の状況:
- タスク: {task_details}
- 進捗: {progress}%
- 締切: {deadline}
```

## 4. エラー処理

### 4.1 エラーコード
| コード | 説明 | 対応 |
|--------|------|------|
| INVALID_COMMAND | 不正なコマンド | デフォルトアクション |
| INVALID_DATE | 不正な日付 | 現在日付を使用 |
| API_ERROR | API接続エラー | リトライ |

### 4.2 エラー応答
```typescript
interface ErrorResponse {
  code: string;
  message: string;
  suggestion?: string;
}
```