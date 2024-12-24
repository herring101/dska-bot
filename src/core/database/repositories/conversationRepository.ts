// src/core/database/repositories/conversationRepository.ts
import { BaseRepository } from "../baseRepository";
import { Conversation, ConversationMessage } from "@prisma/client";

export interface CreateConversationInput {
  userId: string;
  characterId: string;
  taskId?: string;
  pressureLevel: number;
  relationshipScore?: number;
}

export interface CreateMessageInput {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolCallId?: string;
  toolCalls?: {
    id: string;
    name: string;
    arguments: string;
  }[];
  metadata?: Record<string, any>;
}

export class ConversationRepository extends BaseRepository {
  /**
   * 新しい会話を作成
   */
  async create(input: CreateConversationInput): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: {
        userId: input.userId,
        characterId: input.characterId,
        taskId: input.taskId,
        pressureLevel: input.pressureLevel,
        relationshipScore: input.relationshipScore ?? 0,
      },
    });
  }

  /**
   * 会話にメッセージを追加
   */
  async addMessage(
    conversationId: string,
    input: CreateMessageInput
  ): Promise<ConversationMessage> {
    const toolCallsString = input.toolCalls
      ? JSON.stringify(input.toolCalls)
      : null;

    const metadataString = input.metadata
      ? JSON.stringify(input.metadata)
      : null;

    return this.transaction(async (tx) => {
      // メッセージを追加
      const message = await tx.conversationMessage.create({
        data: {
          conversationId,
          role: input.role,
          content: input.content,
          toolCallId: input.toolCallId,
          toolCalls: toolCallsString,
          metadata: metadataString,
        },
      });

      // 会話の最終更新時刻を更新
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastInteractionAt: new Date() },
      });

      return message;
    });
  }

  /**
   * 会話の取得（メッセージ込み）
   */
  async findById(
    id: string
  ): Promise<Conversation & { messages: ConversationMessage[] }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  /**
   * ユーザーの最新の会話を取得
   */
  async findLatestByUserId(
    userId: string,
    limit: number = 1
  ): Promise<(Conversation & { messages: ConversationMessage[] })[]> {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { lastInteractionAt: "desc" },
      take: limit,
    });
  }

  /**
   * タスクに関連する会話を取得
   */
  async findByTaskId(
    taskId: string
  ): Promise<(Conversation & { messages: ConversationMessage[] })[]> {
    return this.prisma.conversation.findMany({
      where: { taskId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { lastInteractionAt: "desc" },
    });
  }

  /**
   * 会話の関係性スコアを更新
   */
  async updateRelationshipScore(
    id: string,
    score: number
  ): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { id },
      data: { relationshipScore: score },
    });
  }

  /**
   * 古い会話の削除（データ管理用）
   */
  /**
   * 会話を更新する
   */
  async update(
    id: string,
    data: {
      pressureLevel?: number;
      relationshipScore?: number;
      taskId?: string | null;
    }
  ): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { id },
      data,
    });
  }

  /**
   * 古い会話を削除する
   */
  async deleteOldConversations(beforeDate: Date): Promise<number> {
    const result = await this.prisma.conversation.deleteMany({
      where: {
        lastInteractionAt: {
          lt: beforeDate,
        },
      },
    });
    return result.count;
  }
}
