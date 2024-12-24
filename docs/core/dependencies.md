# チーム間依存関係

## 1. 依存関係図

```mermaid
graph TB
    subgraph UI["UIチーム (Eさん)"]
        UI_COMP[コンポーネント設計]
        UI_CHAR[キャラクターUI]
        UI_TASK[タスク表示UI]
    end

    subgraph TASK["タスク管理チーム (Aさん)"]
        TASK_CORE[タスク管理機能]
        TASK_DB[データモデル]
        TASK_API[APIエンドポイント]
    end

    subgraph CHAR["キャラクターチーム (Bさん)"]
        CHAR_CORE[キャラクター管理]
        CHAR_TEXT[テキスト生成]
        CHAR_LOGIC[性格ロジック]
    end

    subgraph LLM["LLMチーム (Cさん)"]
        LLM_API[OpenAI連携]
        LLM_FUNC[Function Calling]
        LLM_PROMPT[プロンプト管理]
    end

    subgraph INFRA["インフラチーム (Dさん)"]
        INFRA_DB[DB設計・管理]
        INFRA_DEP[デプロイ環境]
        INFRA_MON[監視・ログ]
    end

    %% UIチームの依存
    UI_TASK --> TASK_CORE
    UI_CHAR --> CHAR_CORE
    
    %% タスク管理チームの依存
    TASK_CORE --> INFRA_DB
    TASK_API --> LLM_FUNC
    
    %% キャラクターチームの依存
    CHAR_TEXT --> LLM_API
    CHAR_CORE --> INFRA_DB
    
    %% LLMチームの依存
    LLM_FUNC --> TASK_API
    LLM_FUNC --> CHAR_CORE
    
    %% インフラチームは他に依存しない
```

## 2. チーム間連携ポイント

### 2.1 UI ⇔ タスク管理
- タスク表示コンポーネントのデータ構造
- 進捗更新時のUI更新
- フォームバリデーション

### 2.2 UI ⇔ キャラクター
- キャラクターの視覚表現
- メッセージ表示フォーマット
- アニメーション・エフェクト

### 2.3 タスク管理 ⇔ LLM
- タスクコマンドの解釈
- 自然言語からのタスク抽出
- Function Callingインターフェース

### 2.4 キャラクター ⇔ LLM
- キャラクター口調の生成
- プロンプトテンプレート
- 文脈理解と応答生成

### 2.5 全チーム ⇔ インフラ
- データベースアクセス
- 環境変数管理
- ログ収集・モニタリング

## 3. 開発優先順位

1. **フェーズ1: 基盤構築**
   - インフラチーム: DB設計、基本環境構築
   - タスク管理チーム: コアロジック実装
   - UIチーム: 基本コンポーネント

2. **フェーズ2: 機能拡張**
   - キャラクターチーム: 基本キャラ実装
   - LLMチーム: OpenAI連携基盤
   - UIチーム: インタラクション追加

3. **フェーズ3: 統合・最適化**
   - 全チーム: 機能統合
   - パフォーマンス最適化
   - UX改善

## 4. コミュニケーションガイドライン

### 4.1 定例ミーティング
- 週次進捗報告
- チーム間同期
- 技術的な課題の共有

### 4.2 ドキュメント更新
- 仕様変更時の共有
- APIドキュメントの更新
- 依存関係の変更通知

### 4.3 コードレビュー
- チームを跨ぐレビュー体制
- インターフェース変更時の確認
- パフォーマンスレビュー

## 5. リスク管理

### 5.1 依存関係によるリスク
- チーム間のブロッカー発生
- インターフェース不整合
- パフォーマンスボトルネック

### 5.2 対策
- 早期のインターフェース定義
- モックの活用
- 定期的な依存関係の見直し

## 6. チーム間連携の詳細

### 6.1 LLMチーム ⇔ タスク管理チーム

#### 6.1.1 Function Calling
- タスクコマンドの解釈
- 日付・優先度の解析
- タスク管理APIの呼び出し

#### 6.1.2 データフロー
```mermaid
sequenceDiagram
    participant User
    participant LLM
    participant Task
    participant DB
    
    User->>LLM: 自然言語入力
    LLM->>LLM: Function Call解析
    LLM->>Task: コマンド実行
    Task->>DB: データ操作
    DB-->>Task: 結果
    Task-->>LLM: 実行結果
    LLM-->>User: フォーマット済み応答
```

### 6.2 LLMチーム ⇔ キャラクターチーム

#### 6.2.1 キャラクター応答生成
- キャラクター設定の反映
- プレッシャーレベルの調整
- 応答の一貫性管理

#### 6.2.2 インタラクションフロー
```mermaid
sequenceDiagram
    participant User
    participant LLM
    participant Character
    participant DB
    
    User->>LLM: メッセージ
    LLM->>Character: コンテキスト取得
    Character->>DB: 履歴取得
    DB-->>Character: データ
    Character-->>LLM: キャラクター設定
    LLM-->>User: キャラクター応答
```

### 6.3 LLMチーム ⇔ UIチーム

#### 6.3.1 メッセージ表示
- ストリーミング応答の表示
- エラーメッセージの整形
- デバッグ情報の表示

#### 6.3.2 インタラクション管理
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant LLM
    participant Task
    
    User->>UI: コマンド入力
    UI->>LLM: メッセージ送信
    LLM->>Task: コマンド実行
    Task-->>LLM: 実行結果
    LLM-->>UI: ストリーミング応答
    UI-->>User: 段階的表示
```