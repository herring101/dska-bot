export const REMINDER_TYPE = {
  DEADLINE: "DEADLINE", // 締切り期限
  PROGRESS: "PROGRESS", // 進捗確認
  START: "START", // 開始リマインド
  FOLLOW_UP: "FOLLOW_UP", // フォローアップ
} as const;

export type ReminderType = (typeof REMINDER_TYPE)[keyof typeof REMINDER_TYPE];

export const isValidReminderType = (type: string): type is ReminderType => {
  return Object.values(REMINDER_TYPE).includes(type as ReminderType);
};
