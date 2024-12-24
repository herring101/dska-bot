# キャラクター特殊能力概要

## 1. レイナの完璧な進捗管理
タスクの進捗状況を分析し、最適な改善案を提示する機能。

```typescript
interface TaskAnalysis {
  taskId: string;
  analysis: {
    progressRate: number;
    qualityScore: number;
    timeEfficiency: number;
  };
  suggestions: string[];
}
```

## 2. 佐伯の業界アドバイス
タスクの種類や状況に応じた実践的なアドバイスを提供する機能。

```typescript
interface IndustryAdvice {
  taskId: string;
  advice: {
    bestPractices: string[];
    timeEstimate: number;
    toolSuggestions?: string[];
  };
}
```

## 3. 九条のガントチャート生成
タスクの依存関係と進捗状況を可視化する機能。

```typescript
interface GanttChart {
  taskId: string;
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: Array<{
      date: Date;
      description: string;
    }>;
  };
}
```

## 4. 月城の心理分析
タスクへの取り組み方や進捗状況から心理状態を分析する機能。

```typescript
interface PsychologicalAnalysis {
  taskId: string;
  analysis: {
    motivationLevel: number;
    stressFactors: string[];
    suggestions: string[];
  };
}
```

注：これらの機能は基本的な分析と提案に留め、必要に応じて段階的に拡張していく予定。