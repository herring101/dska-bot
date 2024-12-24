export const TASK_PRIORITY = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const TASK_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const isValidPriority = (priority: string): priority is TaskPriority => {
  return Object.values(TASK_PRIORITY).includes(priority as TaskPriority);
};

export const isValidStatus = (status: string): status is TaskStatus => {
  return Object.values(TASK_STATUS).includes(status as TaskStatus);
};
