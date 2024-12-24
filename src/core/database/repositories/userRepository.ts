// src/core/database/repositories/userRepository.ts

import { User, PrismaClient } from "@prisma/client";
import { BaseRepository } from "../baseRepository";

export class UserRepository extends BaseRepository {
  /**
   * ユーザーを作成または更新する
   */
  async upsert(discordId: string, data?: Partial<User>): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: discordId },
      create: {
        id: discordId,
        pressureLevel: data?.pressureLevel ?? 3,
        notificationEnabled: data?.notificationEnabled ?? true,
        activeCharacterId: data?.activeCharacterId,
      },
      update: data || {},
    });
  }

  /**
   * ユーザーを取得する
   */
  async findById(discordId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: discordId },
    });
  }

  /**
   * アクティブなキャラクターを更新する
   */
  async updateActiveCharacter(
    discordId: string,
    characterId: string
  ): Promise<User> {
    return this.upsert(discordId, { activeCharacterId: characterId });
  }

  /**
   * プレッシャーレベルを更新する
   */
  async updatePressureLevel(discordId: string, level: number): Promise<User> {
    if (level < 1 || level > 5) {
      throw new Error("Pressure level must be between 1 and 5");
    }

    return this.upsert(discordId, { pressureLevel: level });
  }
}
