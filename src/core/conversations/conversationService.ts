// src/core/conversations/conversationService.ts
import {
  ConversationRepository,
  CreateMessageInput,
} from "../database/repositories/conversationRepository";
import { TaskRepository } from "../database/repositories/taskRepository";
import { CharacterService } from "../characters/characterSService";
import { Conversation, ConversationMessage, Task } from "@prisma/client";

export class ConversationServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ConversationServiceError";
  }
}

export interface ConversationContext {
  character: {
    id: string;
    name: string;
    pressureLevel: number;
    relationshipScore: number;
  };
  currentTask?: {
    title: string;
    progress: number;
    deadline?: Date;
  };
  recentMessages: {
    role: "user" | "assistant" | "tool" | "system";
    content: string;
  }[];
}

export class ConversationService {
  private readonly MAX_RECENT_MESSAGES = 10;

  constructor(
    private conversationRepository: ConversationRepository,
    private taskRepository: TaskRepository,
    private characterService: CharacterService
  ) {}

  /**
   * 新しい会話を開始する
   */
  async startConversation(
    userId: string,
    characterId: string,
    taskId?: string,
    pressureLevel: number = 3
  ): Promise<Conversation> {
    // キャラクター情報の検証
    const character = this.characterService.getCharacterProfile(
      characterId as any
    );
    if (!character) {
      throw new ConversationServiceError(
        "Invalid character ID",
        "INVALID_CHARACTER"
      );
    }

    // タスクの検証（指定されている場合）
    if (taskId) {
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new ConversationServiceError("Task not found", "TASK_NOT_FOUND");
      }
    }

    return this.conversationRepository.create({
      userId,
      characterId,
      taskId,
      pressureLevel,
      relationshipScore: 0,
    });
  }

  /**
   * 会話にメッセージを追加する
   */
  async addMessage(
    conversationId: string,
    input: CreateMessageInput
  ): Promise<ConversationMessage> {
    // 会話の存在確認
    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    if (!conversation) {
      throw new ConversationServiceError("Conversation not found", "NOT_FOUND");
    }

    return this.conversationRepository.addMessage(conversationId, input);
  }

  /**
   * LLM用のコンテキストを構築する
   */
  async buildContext(conversationId: string): Promise<ConversationContext> {
    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    if (!conversation) {
      throw new ConversationServiceError("Conversation not found", "NOT_FOUND");
    }

    // キャラクター情報
    const character = this.characterService.getCharacterProfile(
      conversation.characterId as any
    );
    if (!character) {
      throw new ConversationServiceError(
        "Character not found",
        "CHARACTER_NOT_FOUND"
      );
    }

    // 関連タスク情報
    let currentTask: ConversationContext["currentTask"] | undefined;
    if (conversation.taskId) {
      const task = await this.taskRepository.findById(conversation.taskId);
      if (task) {
        currentTask = {
          title: task.title,
          progress: task.progress,
          deadline: task.deadline ?? undefined,
        };
      }
    }

    // 直近のメッセージを取得
    const recentMessages = conversation.messages
      .slice(-this.MAX_RECENT_MESSAGES)
      .map((msg) => ({
        role: msg.role as "user" | "assistant" | "tool" | "system",
        content: msg.content,
      }));

    return {
      character: {
        id: character.id,
        name: character.name,
        pressureLevel: conversation.pressureLevel,
        relationshipScore: conversation.relationshipScore,
      },
      currentTask,
      recentMessages,
    };
  }

  /**
   * 会話のプレッシャーレベルを更新
   */
  async updatePressureLevel(
    conversationId: string,
    newLevel: number
  ): Promise<Conversation> {
    if (newLevel < 1 || newLevel > 5) {
      throw new ConversationServiceError(
        "Pressure level must be between 1 and 5",
        "INVALID_PRESSURE_LEVEL"
      );
    }

    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    if (!conversation) {
      throw new ConversationServiceError("Conversation not found", "NOT_FOUND");
    }

    return this.conversationRepository.update(conversationId, {
      pressureLevel: newLevel,
    });
  }

  /**
   * 関係性スコアを更新
   */
  async updateRelationshipScore(
    conversationId: string,
    delta: number
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(
      conversationId
    );
    if (!conversation) {
      throw new ConversationServiceError("Conversation not found", "NOT_FOUND");
    }

    const newScore = Math.max(
      0,
      Math.min(100, conversation.relationshipScore + delta)
    );
    return this.conversationRepository.updateRelationshipScore(
      conversationId,
      newScore
    );
  }

  /**
   * 指定日時より古い会話を削除（データ管理用）
   */
  async cleanupOldConversations(maxAgeInDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
    return this.conversationRepository.deleteOldConversations(cutoffDate);
  }

  async findLatestByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepository.findLatestByUserId(
      userId
    );
    if (!conversations) {
      return [];
    }
    return conversations;
  }
}
