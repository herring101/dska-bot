// src/core/database/repositories/__tests__/conversationRepository.test.ts
import { ConversationRepository } from "../conversationRepository";
import { UserRepository } from "../userRepository";
import { db } from "../../client";
import { PrismaClient } from "@prisma/client";

describe("ConversationRepository", () => {
  let repository: ConversationRepository;
  let userRepository: UserRepository;
  let prisma: PrismaClient;
  let userId: string;
  const characterId = "reina";

  beforeAll(async () => {
    await db.connect();
    prisma = db.getClient();
    repository = new ConversationRepository();
    userRepository = new UserRepository();

    // テスト用ユーザーを作成
    userId = "test-user-123";
    await userRepository.upsert(userId);
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await prisma.conversationMessage.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();
    await db.disconnect();
  });

  beforeEach(async () => {
    // 各テストの前にメッセージをクリーンアップ
    await prisma.conversationMessage.deleteMany();
    await prisma.conversation.deleteMany();
  });

  describe("create", () => {
    it("should create a new conversation", async () => {
      const conversation = await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
        relationshipScore: 0,
      });

      expect(conversation).toBeDefined();
      expect(conversation.userId).toBe(userId);
      expect(conversation.characterId).toBe(characterId);
      expect(conversation.pressureLevel).toBe(3);
    });
  });

  describe("addMessage", () => {
    it("should add a message to conversation", async () => {
      // 会話を作成
      const conversation = await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
      });

      // メッセージを追加
      const message = await repository.addMessage(conversation.id, {
        role: "user",
        content: "こんにちは",
      });

      expect(message).toBeDefined();
      expect(message.role).toBe("user");
      expect(message.content).toBe("こんにちは");
      expect(message.conversationId).toBe(conversation.id);
    });

    it("should store tool calls as JSON string", async () => {
      const conversation = await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
      });

      const toolCalls = [
        {
          id: "call-123",
          name: "create_task",
          arguments: JSON.stringify({ title: "テストタスク" }),
        },
      ];

      const message = await repository.addMessage(conversation.id, {
        role: "assistant",
        content: "タスクを作成します",
        toolCalls,
      });

      expect(message.toolCalls).toBeDefined();
      expect(JSON.parse(message.toolCalls!)).toEqual(toolCalls);
    });
  });

  describe("findById", () => {
    it("should retrieve conversation with messages", async () => {
      // 会話とメッセージを作成
      const conversation = await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
      });

      await repository.addMessage(conversation.id, {
        role: "user",
        content: "こんにちは",
      });

      await repository.addMessage(conversation.id, {
        role: "assistant",
        content: "はい、こんにちは",
      });

      // 会話を取得
      const retrieved = await repository.findById(conversation.id);
      expect(retrieved.messages).toHaveLength(2);
      expect(retrieved.messages[0].role).toBe("user");
      expect(retrieved.messages[1].role).toBe("assistant");
    });

    it("should throw error for non-existent conversation", async () => {
      await expect(repository.findById("non-existent")).rejects.toThrow(
        "Conversation not found"
      );
    });
  });

  describe("findLatestByUserId", () => {
    it("should retrieve latest conversations", async () => {
      // 複数の会話を作成
      await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
      });

      await new Promise((resolve) => setTimeout(resolve, 100)); // タイムスタンプの差を確実にするため

      const latestConversation = await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
      });

      const conversations = await repository.findLatestByUserId(userId, 1);
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe(latestConversation.id);
    });
  });

  describe("deleteOldConversations", () => {
    it("should delete conversations older than specified date", async () => {
      // 古い会話を作成
      await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
      });

      const cutoffDate = new Date();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 新しい会話を作成
      await repository.create({
        userId,
        characterId,
        pressureLevel: 3,
      });

      const deletedCount = await repository.deleteOldConversations(cutoffDate);
      expect(deletedCount).toBe(1);

      const remaining = await repository.findLatestByUserId(userId);
      expect(remaining).toHaveLength(1);
    });
  });
});
