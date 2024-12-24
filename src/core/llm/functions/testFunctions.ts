// src/core/llm/functions/taskFunctions.ts

export const taskFunctions = {
  createTask: {
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
  },

  updateProgress: {
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
  },

  completeTask: {
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
  },
};

// src/core/llm/functions/characterFunctions.ts

export const characterFunctions = {
  adjustPressure: {
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
  },

  generateResponse: {
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
              items: { type: "string" },
            },
          },
        },
      },
      required: ["characterId", "responseType"],
    },
  },
};

// Export all functions
export const llmFunctions = {
  ...taskFunctions,
  ...characterFunctions,
};
