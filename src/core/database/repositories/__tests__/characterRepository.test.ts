// src/core/characters/__tests__/characterService.test.ts
import { CharacterRepository } from "../characterRepository";
import { UserRepository } from "../userRepository";
import { db } from "../../client";
import { PrismaClient } from "@prisma/client";
import { INTERACTION_TYPE } from "../../../constants/interaction";

describe("CharacterRepository", () => {
  let repository: CharacterRepository;
  let userRepository: UserRepository;
  let prisma: PrismaClient;
  let userId: string;
  const characterId = "reina";

  beforeAll(async () => {
    prisma = db.getClient();
    repository = new CharacterRepository();
    userRepository = new UserRepository();
  });

  afterAll(async () => {
    await prisma.characterInteraction.deleteMany();
    await prisma.user.deleteMany();
    await db.disconnect();
  });

  beforeEach(async () => {
    await prisma.characterInteraction.deleteMany();
    await prisma.user.deleteMany();

    // テストの前にユーザーを作成
    userId = "test-user-123";
    await userRepository.upsert(userId);
  });

  describe("recordInteraction", () => {
    it("should record a new interaction", async () => {
      const interaction = await repository.recordInteraction({
        userId,
        characterId,
        interactionType: INTERACTION_TYPE.TASK_CREATION,
        context: {
          taskId: "test-task-123",
          mood: "positive",
        },
      });

      expect(interaction).toBeDefined();
      expect(interaction.userId).toBe(userId);
      expect(interaction.characterId).toBe(characterId);
      expect(interaction.interactionType).toBe(INTERACTION_TYPE.TASK_CREATION);

      const context = JSON.parse(interaction.context);
      expect(context.taskId).toBe("test-task-123");
      expect(context.mood).toBe("positive");
    });

    it("should throw error for invalid interaction type", async () => {
      await expect(
        repository.recordInteraction({
          userId,
          characterId,
          interactionType: "INVALID" as any,
          context: {},
        })
      ).rejects.toThrow("Invalid interaction type");
    });

    it("should throw error when user not found", async () => {
      await expect(
        repository.recordInteraction({
          userId: "non-existent-user",
          characterId,
          interactionType: INTERACTION_TYPE.TASK_CREATION,
          context: {},
        })
      ).rejects.toThrow("User not found");
    });
  });

  describe("getRecentInteractions", () => {
    it("should return recent interactions in correct order", async () => {
      // 複数のインタラクションを作成
      await repository.recordInteraction({
        userId,
        characterId,
        interactionType: INTERACTION_TYPE.TASK_CREATION,
        context: { sequence: 1 },
      });

      // 時間差を作るために少し待つ
      await new Promise((resolve) => setTimeout(resolve, 100));

      await repository.recordInteraction({
        userId,
        characterId,
        interactionType: INTERACTION_TYPE.PROGRESS_UPDATE,
        context: { sequence: 2 },
      });

      const recentInteractions = await repository.getRecentInteractions(
        userId,
        2
      );
      expect(recentInteractions).toHaveLength(2);
      expect(JSON.parse(recentInteractions[0].context).sequence).toBe(2);
      expect(JSON.parse(recentInteractions[1].context).sequence).toBe(1);
    });
  });

  describe("getCharacterStats", () => {
    it("should calculate character interaction statistics", async () => {
      // 複数のインタラクションを記録
      await Promise.all([
        repository.recordInteraction({
          userId,
          characterId,
          interactionType: INTERACTION_TYPE.TASK_CREATION,
          context: {},
        }),
        repository.recordInteraction({
          userId,
          characterId,
          interactionType: INTERACTION_TYPE.TASK_CREATION,
          context: {},
        }),
        repository.recordInteraction({
          userId,
          characterId,
          interactionType: INTERACTION_TYPE.PRAISE,
          context: {},
        }),
      ]);

      const stats = await repository.getCharacterStats(userId, characterId);
      expect(stats.totalInteractions).toBe(3);
      expect(stats.mostCommonInteractionType).toBe(
        INTERACTION_TYPE.TASK_CREATION
      );
      expect(stats.averageInteractionsPerDay).toBeGreaterThan(0);
    });

    it("should return default values for no interactions", async () => {
      const stats = await repository.getCharacterStats(userId, "non-existent");
      expect(stats.totalInteractions).toBe(0);
      expect(stats.averageInteractionsPerDay).toBe(0);
      expect(stats.mostCommonInteractionType).toBe(
        INTERACTION_TYPE.GENERAL_CHAT
      );
    });
  });
});
