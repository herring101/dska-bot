// src/core/characters/__tests__/characterService.test.ts:
import {
  ConversationService,
  ConversationServiceError,
} from "../conversationService";
import { ConversationRepository } from "../../database/repositories/conversationRepository";
import { TaskRepository } from "../../database/repositories/taskRepository";
import { CharacterService } from "../../characters/characterSService";
import { Conversation, Task, ConversationMessage } from "@prisma/client";

describe("ConversationService", () => {
  let service: ConversationService;
  let conversationRepository: jest.Mocked<ConversationRepository>;
  let taskRepository: jest.Mocked<TaskRepository>;
  let characterService: jest.Mocked<CharacterService>;

  // 型を拡張してmessagesを含める
  const mockConversation: Conversation & { messages: ConversationMessage[] } = {
    id: "conv-1",
    userId: "user-1",
    characterId: "reina",
    startedAt: new Date(),
    lastInteractionAt: new Date(),
    pressureLevel: 3,
    relationshipScore: 0,
    taskId: null,
    messages: [], // 空の配列を追加
  };

  const mockTask: Task = {
    id: "task-1",
    userId: "user-1",
    title: "Test Task",
    description: null,
    deadline: null,
    priority: "MEDIUM",
    progress: 0,
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // リポジトリとサービスのモックを作成
    conversationRepository = {
      create: jest.fn(),
      addMessage: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateRelationshipScore: jest.fn(),
      deleteOldConversations: jest.fn(),
    } as unknown as jest.Mocked<ConversationRepository>;

    taskRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TaskRepository>;

    characterService = {
      getCharacterProfile: jest.fn().mockReturnValue({
        id: "reina",
        name: "完璧主義お嬢様 レイナ",
        defaultPressureLevel: 3,
      }),
    } as unknown as jest.Mocked<CharacterService>;

    service = new ConversationService(
      conversationRepository,
      taskRepository,
      characterService
    );
  });

  describe("startConversation", () => {
    it("should start a new conversation", async () => {
      conversationRepository.create.mockResolvedValue(mockConversation);

      const result = await service.startConversation(
        "user-1",
        "reina",
        undefined,
        3
      );

      expect(result).toEqual(mockConversation);
      expect(conversationRepository.create).toHaveBeenCalledWith({
        userId: "user-1",
        characterId: "reina",
        pressureLevel: 3,
        relationshipScore: 0,
      });
    });

    it("should validate character ID", async () => {
      // nullを返す代わりにundefinedを返す
      characterService.getCharacterProfile.mockReturnValue(undefined);

      await expect(
        service.startConversation("user-1", "invalid-character")
      ).rejects.toThrow(ConversationServiceError);
    });

    it("should validate task ID if provided", async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(
        service.startConversation("user-1", "reina", "invalid-task")
      ).rejects.toThrow(ConversationServiceError);
    });
  });

  describe("buildContext", () => {
    it("should throw error when character not found", async () => {
      const conversationWithInvalidChar = {
        ...mockConversation,
        characterId: "invalid-char",
        messages: [],
      };
      conversationRepository.findById.mockResolvedValue(
        conversationWithInvalidChar
      );
      characterService.getCharacterProfile.mockReturnValue(undefined);

      await expect(service.buildContext("conv-1")).rejects.toThrow(
        ConversationServiceError
      );
      await expect(service.buildContext("conv-1")).rejects.toThrow(
        "CHARACTER_NOT_FOUND"
      );
    });

    it("should build context with task information", async () => {
      const mockMessages: ConversationMessage[] = [
        {
          id: "msg-1",
          conversationId: "conv-1",
          role: "user",
          content: "こんにちは",
          timestamp: new Date(),
          toolCallId: null,
          toolCalls: null,
          metadata: null,
        },
        {
          id: "msg-2",
          conversationId: "conv-1",
          role: "assistant",
          content: "はい、こんにちは",
          timestamp: new Date(),
          toolCallId: null,
          toolCalls: null,
          metadata: null,
        },
      ];

      const mockConversationWithTask = {
        ...mockConversation,
        taskId: "task-1",
        messages: mockMessages,
      };

      conversationRepository.findById.mockResolvedValue(
        mockConversationWithTask
      );
      taskRepository.findById.mockResolvedValue(mockTask);

      const context = await service.buildContext("conv-1");

      expect(context.character).toBeDefined();
      expect(context.currentTask).toBeDefined();
      expect(context.currentTask?.title).toBe("Test Task");
      expect(context.recentMessages).toHaveLength(2);
    });

    it("should limit recent messages", async () => {
      const mockMessages = Array(20).fill({
        id: "msg-1",
        conversationId: "conv-1",
        role: "user",
        content: "test message",
        timestamp: new Date(),
        toolCallId: null,
        toolCalls: null,
        metadata: null,
      });

      conversationRepository.findById.mockResolvedValue({
        ...mockConversation,
        messages: mockMessages,
      });

      const context = await service.buildContext("conv-1");

      expect(context.recentMessages.length).toBeLessThanOrEqual(10);
    });
  });

  describe("updatePressureLevel", () => {
    it("should update pressure level within valid range", async () => {
      conversationRepository.findById.mockResolvedValue(mockConversation);
      const updatedConversation = {
        ...mockConversation,
        pressureLevel: 4,
      };
      conversationRepository.update.mockResolvedValue(updatedConversation);

      const result = await service.updatePressureLevel("conv-1", 4);
      expect(result.pressureLevel).toBe(4);
    });

    it("should reject invalid pressure levels", async () => {
      await expect(service.updatePressureLevel("conv-1", 6)).rejects.toThrow(
        ConversationServiceError
      );
    });
  });

  describe("updateRelationshipScore", () => {
    it("should update relationship score within bounds", async () => {
      conversationRepository.findById.mockResolvedValue(mockConversation);
      const updatedConversation = {
        ...mockConversation,
        relationshipScore: 50,
      };
      conversationRepository.updateRelationshipScore.mockResolvedValue(
        updatedConversation
      );

      const result = await service.updateRelationshipScore("conv-1", 50);
      expect(result.relationshipScore).toBe(50);
    });

    it("should clamp relationship score to 0-100", async () => {
      conversationRepository.findById.mockResolvedValue({
        ...mockConversation,
        relationshipScore: 90,
      });

      conversationRepository.updateRelationshipScore.mockImplementation(
        async (id, score) => ({
          ...mockConversation,
          relationshipScore: score,
          messages: [],
        })
      );

      const result = await service.updateRelationshipScore("conv-1", 20);
      expect(result.relationshipScore).toBeLessThanOrEqual(100);
      expect(result.relationshipScore).toBeGreaterThanOrEqual(0);
    });
  });
});
