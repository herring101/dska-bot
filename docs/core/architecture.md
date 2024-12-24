# システム設計書

## システムアーキテクチャ

### 全体フロー図

```mermaid
flowchart TD
    subgraph "ユーザーからのイベント"
        U_MSG[ユーザーからのメッセージ]
        U_CALL[ユーザーからの通話]
        U_PROG[進捗報告]
        U_COMP[タスク完了報告]
    end

    subgraph "システムイベント"
        S_REMIND[リマインド時刻到達]
        S_DEADLINE[締切り接近検知]
        S_INACTIVE[長時間無活動検知]
    end

    subgraph "Function Calls"
        F_TASK[register_task]
        F_NEXT[schedule_next_contact]
        F_PROG[update_progress]
        F_COMP[complete_task]
        F_CHAR[generate_character_response]
    end

    subgraph "キャラクターアクション"
        C_MSG[キャラからメッセージ]
        C_CALL[キャラから通話]
    end

    subgraph "通話状態管理"
        CALL_START[通話開始処理]
        CALL_RESP[通話中レスポンス生成]
        CALL_END[通話終了処理]
    end

    subgraph "状態判断"
        CHECK_TASK[タスク状態確認]
        CHECK_TIME[時間帯判断]
        CHECK_CHAR[キャラクター状態確認]
    end

    %% ユーザーイベントのフロー
    U_MSG --> F_CHAR
    F_CHAR --> CHECK_TASK
    CHECK_TASK --> F_NEXT
    F_NEXT --> |状況に応じて|C_MSG
    F_NEXT --> |状況に応じて|C_CALL

    U_CALL --> CALL_START
    CALL_START --> CHECK_CHAR
    CHECK_CHAR --> CALL_RESP
    CALL_RESP --> F_NEXT
    CALL_END --> F_NEXT

    U_PROG --> F_PROG
    F_PROG --> CHECK_TASK
    
    U_COMP --> F_COMP
    F_COMP --> CHECK_TASK

    %% システムイベントのフロー
    S_REMIND --> CHECK_TIME
    CHECK_TIME --> CHECK_CHAR
    CHECK_CHAR --> |時間帯に応じて|C_MSG
    CHECK_CHAR --> |時間帯に応じて|C_CALL

    S_DEADLINE --> CHECK_TASK
    CHECK_TASK --> |緊急度に応じて|C_MSG
    CHECK_TASK --> |緊急度に応じて|C_CALL

    S_INACTIVE --> CHECK_TASK
    
    %% キャラクターアクションのフロー
    C_MSG --> F_NEXT
    C_CALL --> CALL_START

    %% 通話状態のフロー
    CALL_RESP --> |継続判断|CALL_END
    CALL_RESP --> |継続|CALL_RESP

    %% 状態判断の結果による分岐
    CHECK_TASK --> |タスク完了|F_COMP
    CHECK_TASK --> |進行中|F_PROG
    CHECK_TASK --> |新規タスク|F_TASK
```

### コンポーネント構成図

```mermaid
graph TD
    DC[Discord Client] --> Bot[Discord Bot]
    Bot --> TC[Task Controller]
    Bot --> CC[Character Controller]
    Bot --> LC[LLM Controller]
    
    TC --> TS[Task Service]
    CC --> CS[Character Service]
    LC --> LS[LLM Service]
    
    TS --> DB[(Database)]
    CS --> DB
    LS --> OAPI[OpenAI API]
```

## 主要コンポーネント

### 1. Discord Bot基盤
- discord.jsを使用
- イベントハンドリング
- コマンド管理

### 2. 機能別サービス
- TaskService: タスク管理ロジック
- CharacterService: キャラクター管理
- LLMService: OpenAI API連携

### 3. データストア
- 開発: SQLite
- 本番: PlanetScale

## API設計

### 内部API
```typescript
interface TaskService {
  createTask(data: TaskInput): Promise<Task>
  updateProgress(id: string, progress: number): Promise<Task>
  completeTask(id: string): Promise<Task>
}

interface CharacterService {
  getResponse(context: Context): Promise<Response>
  adjustPressure(level: number): void
}
```

### 外部API連携
- Discord API
- OpenAI API
- （将来）Slack API