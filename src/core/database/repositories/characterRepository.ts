// src/core/database/repositories/characterRepository.ts

import { CharacterInteraction, PrismaClient } from "@prisma/client";
import { BaseRepository } from "../baseRepository";
import {
  INTERACTION_TYPE,
  InteractionType,
  isValidInteractionType,
  InteractionContext,
  InteractionTypeCount,
} from "../../constants/interaction";

export type InteractionContextInput = {
  currentMessage?: string;
  taskId?: string;
  progress?: number;
  mood?: "positive" | "neutral" | "negative";
  previousInteractions?: string[];
  customData?: Record<string, unknown>;
  sequence?: number;
  timestamp?: string;
};

export interface CreateInteractionInput {
  userId: string;
  characterId: string;
  interactionType: InteractionType;
  context: InteractionContextInput;
}

export interface InteractionHistory {
  interactions: CharacterInteraction[];
  summary: {
    totalInteractions: number;
    lastInteraction: Date | null;
    interactionTypes: InteractionTypeCount;
  };
}

export class CharacterRepository extends BaseRepository {
  /**
   * インタラクションを記録する
   */
  async recordInteraction(
    input: CreateInteractionInput
  ): Promise<CharacterInteraction> {
    if (!isValidInteractionType(input.interactionType)) {
      throw new Error(`Invalid interaction type: ${input.interactionType}`);
    }

    return this.transaction(async (tx) => {
      // ユーザーの存在確認
      const user = await tx.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return tx.characterInteraction.create({
        data: {
          userId: input.userId,
          characterId: input.characterId,
          interactionType: input.interactionType,
          context: JSON.stringify(input.context),
        },
      });
    });
  }

  /**
   * 最近のインタラクションを取得する
   */
  async getRecentInteractions(
    userId: string,
    limit: number = 10
  ): Promise<CharacterInteraction[]> {
    return this.prisma.characterInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * インタラクション履歴のサマリーを取得する
   */
  async getInteractionHistory(userId: string): Promise<InteractionHistory> {
    const interactions = await this.prisma.characterInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const interactionTypes = Object.values(
      INTERACTION_TYPE
    ).reduce<InteractionTypeCount>(
      (acc, type) => ({
        ...acc,
        [type]: interactions.filter((i) => i.interactionType === type).length,
      }),
      {
        TASK_CREATION: 0,
        TASK_COMPLETION: 0,
        PROGRESS_UPDATE: 0,
        DEADLINE_REMINDER: 0,
        ENCOURAGEMENT: 0,
        PRESSURE: 0,
        PRAISE: 0,
        GENERAL_CHAT: 0,
      }
    );

    return {
      interactions,
      summary: {
        totalInteractions: interactions.length,
        lastInteraction: interactions[0]?.createdAt || null,
        interactionTypes,
      },
    };
  }

  /**
   * 特定のタスクに関連するインタラクションを取得する
   */
  async getTaskRelatedInteractions(
    taskId: string
  ): Promise<CharacterInteraction[]> {
    return this.prisma.characterInteraction.findMany({
      where: {
        context: {
          contains: taskId,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * キャラクターごとのインタラクション統計を取得する
   */
  async getCharacterStats(
    userId: string,
    characterId: string
  ): Promise<{
    totalInteractions: number;
    averageInteractionsPerDay: number;
    mostCommonInteractionType: InteractionType;
  }> {
    const interactions = await this.prisma.characterInteraction.findMany({
      where: {
        userId,
        characterId,
      },
    });

    if (interactions.length === 0) {
      return {
        totalInteractions: 0,
        averageInteractionsPerDay: 0,
        mostCommonInteractionType: INTERACTION_TYPE.GENERAL_CHAT,
      };
    }

    // インタラクションタイプの集計
    const typeCounts = interactions.reduce<Record<string, number>>(
      (acc, interaction) => {
        acc[interaction.interactionType] =
          (acc[interaction.interactionType] || 0) + 1;
        return acc;
      },
      {}
    );

    // 最も多いインタラクションタイプを取得
    const mostCommonType = Object.entries(typeCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as InteractionType;

    // 日数の計算
    const firstInteraction = new Date(
      Math.min(...interactions.map((i) => i.createdAt.getTime()))
    );
    const lastInteraction = new Date(
      Math.max(...interactions.map((i) => i.createdAt.getTime()))
    );
    const daysDiff = Math.max(
      1,
      Math.ceil(
        (lastInteraction.getTime() - firstInteraction.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    return {
      totalInteractions: interactions.length,
      averageInteractionsPerDay: Number(
        (interactions.length / daysDiff).toFixed(2)
      ),
      mostCommonInteractionType: mostCommonType,
    };
  }
}
