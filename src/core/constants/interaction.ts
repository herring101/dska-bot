export const INTERACTION_TYPE = {
  TASK_CREATION: "TASK_CREATION", // タスク作成時
  TASK_COMPLETION: "TASK_COMPLETION", // タスク完了時
  PROGRESS_UPDATE: "PROGRESS_UPDATE", // 進捗更新時
  DEADLINE_REMINDER: "DEADLINE_REMINDER", // 締切リマインド時
  ENCOURAGEMENT: "ENCOURAGEMENT", // 励まし
  PRESSURE: "PRESSURE", // プレッシャー
  PRAISE: "PRAISE", // 褒める
  GENERAL_CHAT: "GENERAL_CHAT", // 一般的な会話
} as const;

export type InteractionType =
  (typeof INTERACTION_TYPE)[keyof typeof INTERACTION_TYPE];

export const isValidInteractionType = (
  type: string
): type is InteractionType => {
  return Object.values(INTERACTION_TYPE).includes(type as InteractionType);
};

export interface InteractionContext {
  taskId?: string;
  progress?: number;
  mood?: "positive" | "neutral" | "negative";
  previousInteractions?: string[];
  customData?: Record<string, unknown>;
  sequence?: number; // テスト用に追加
}

export type InteractionTypeCount = {
  [K in InteractionType]: number;
};
