# キャラクター機能仕様書

## 1. 概要

キャラクターの管理、対話生成、プレッシャー制御を行う機能の実装仕様です。

## 2. キャラクター定義

```typescript
interface Character {
  id: string;
  name: string;
  basePersonality: string;
  pressureLevel: number;
  specialAbility?: string;
  messagePatterns: MessagePattern[];
}

interface MessagePattern {
  type: 'morning' | 'evening' | 'deadline' | 'praise' | 'warning';
  templates: string[];
  conditions?: Record<string, any>;
}
```

## 3. 主要機能実装

### 3.1 キャラクター管理
```typescript
class CharacterService {
  async getCharacter(id: string): Promise<Character>
  async setUserCharacter(userId: string, characterId: string): Promise<void>
  async adjustPressure(userId: string, level: number): Promise<void>
}
```

### 3.2 メッセージ生成
```typescript
class MessageService {
  async generateResponse(context: Context): Promise<string>
  async generateReminder(task: Task): Promise<string>
  async generatePraise(achievement: Achievement): Promise<string>
}
```

## 4. キャラクター設定

### レイナ（完璧主義お嬢様）
- プレッシャーレベル: 3/5
- 特殊能力: 完璧な進捗管理
- メッセージパターン: 高飛車、完璧主義

### 佐伯（フリーランス先輩）
- プレッシャーレベル: 4/5
- 特殊能力: 業界アドバイス
- メッセージパターン: 実践的、厳しめ

### 九条（闇PM）
- プレッシャーレベル: 5/5
- 特殊能力: ガントチャート生成
- メッセージパターン: 威圧的、冷静

### 月城（メンタリスト）
- プレッシャーレベル: 3/5
- 特殊能力: 心理分析
- メッセージパターン: 洞察的、導くような

## 5. 状態管理

- キャラクター選択状態
- プレッシャーレベル
- ユーザーとの関係性進展度
- 特殊能力の使用回数

## 6. テスト要件

- キャラクター切り替えテスト
- メッセージ生成パターンテスト
- プレッシャーレベル調整テスト
- 特殊能力発動条件テスト