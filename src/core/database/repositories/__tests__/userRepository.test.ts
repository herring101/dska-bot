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

  describe("upsert", () => {
    it("should create a new user when user does not exist", async () => {
      const discordId = "123456789";
      const user = await repository.upsert(discordId);

      expect(user).toBeDefined();
      expect(user.id).toBe(discordId);
      expect(user.pressureLevel).toBe(3); // デフォルト値
    });

    it("should update existing user", async () => {
      const discordId = "123456789";
      await repository.upsert(discordId);

      const updated = await repository.upsert(discordId, {
        pressureLevel: 4,
        activeCharacterId: "reina",
      });

      expect(updated.pressureLevel).toBe(4);
      expect(updated.activeCharacterId).toBe("reina");
    });
  });

  describe("updatePressureLevel", () => {
    it("should update pressure level", async () => {
      const discordId = "123456789";
      await repository.upsert(discordId);

      const updated = await repository.updatePressureLevel(discordId, 5);
      expect(updated.pressureLevel).toBe(5);
    });

    it("should throw error for invalid pressure level", async () => {
      const discordId = "123456789";
      await repository.upsert(discordId);

      await expect(
        repository.updatePressureLevel(discordId, 6)
      ).rejects.toThrow("Pressure level must be between 1 and 5");
    });
  });
});
