// src/core/database/repositories/__tests__/userRepository.test.ts

import { UserRepository } from "../userRepository";
import { db } from "../../client";
import { PrismaClient } from "@prisma/client";

describe("UserRepository", () => {
  let repository: UserRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    await db.connect();
    prisma = db.getClient();
    repository = new UserRepository();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await db.disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe("updateActiveCharacter", () => {
    it("should create user and update character if user does not exist", async () => {
      const discordId = "test-user-1";
      const characterId = "reina";

      const user = await repository.updateActiveCharacter(
        discordId,
        characterId
      );

      expect(user.id).toBe(discordId);
      expect(user.activeCharacterId).toBe(characterId);
    });

    it("should update existing user's character", async () => {
      const discordId = "test-user-2";
      // 先にユーザーを作成
      await repository.upsert(discordId);

      const characterId = "saeki";
      const user = await repository.updateActiveCharacter(
        discordId,
        characterId
      );

      expect(user.id).toBe(discordId);
      expect(user.activeCharacterId).toBe(characterId);
    });
  });

  describe("upsert", () => {
    it("should create new user with default values", async () => {
      const discordId = "test-user-3";
      const user = await repository.upsert(discordId);

      expect(user.id).toBe(discordId);
      expect(user.pressureLevel).toBe(3);
      expect(user.notificationEnabled).toBe(true);
    });

    it("should update existing user with new values", async () => {
      const discordId = "test-user-4";
      await repository.upsert(discordId);

      const updatedUser = await repository.upsert(discordId, {
        pressureLevel: 4,
        activeCharacterId: "kujo",
      });

      expect(updatedUser.pressureLevel).toBe(4);
      expect(updatedUser.activeCharacterId).toBe("kujo");
    });
  });
});
