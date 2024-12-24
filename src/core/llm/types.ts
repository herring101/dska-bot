// src/core/llm/types.ts

import { ChatCompletionMessageParam } from "openai/resources/chat";

export type LLMConfig = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
};

export type LLMResponse = {
  content: string;
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  toolCalls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
};

export interface StreamHandler {
  onContent: (content: string) => void;
  onFunctionCall?: (functionCall: {
    name: string;
    arguments: Record<string, unknown>;
  }) => void;
  onToolCall?: (toolCall: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
}

export type MessageHistory = ChatCompletionMessageParam[];

export class LLMError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "LLMError";
  }
}

// キャラクター関連の型定義
export interface CharacterContext {
  characterId: string;
  pressureLevel: number;
  recentInteractions?: MessageHistory;
  taskContext?: {
    currentTask?: {
      title: string;
      progress: number;
      deadline?: Date;
    };
    upcomingTasks?: Array<{
      title: string;
      deadline: Date;
    }>;
  };
}
