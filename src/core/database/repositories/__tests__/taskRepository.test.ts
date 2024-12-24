import { TaskRepository } from "../taskRepository";
import { UserRepository } from "../userRepository";
import { db } from "../../client";
import { PrismaClient } from "@prisma/client";
import { TASK_PRIORITY } from "../../../constants/task";

describe("TaskRepository", () => {
  let repository: TaskRepository;
  let userRepository: UserRepository;
  let prisma: PrismaClient;
  let userId: string;

  beforeAll(async () => {
    await db.connect();
    prisma = db.getClient();
    repository = new TaskRepository();
    userRepository = new UserRepository();

    // テスト用ユーザーを作成
    userId = "test-user-123";
    await userRepository.upsert(userId);
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await db.disconnect();
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  describe("create", () => {
    it("should create a task with default values", async () => {
      const task = await repository.create({
        userId,
        title: "Test Task",
      });

      expect(task).toBeDefined();
      expect(task.title).toBe("Test Task");
      expect(task.userId).toBe(userId);
      expect(task.priority).toBe("MEDIUM");
      expect(task.status).toBe("PENDING");
      expect(task.progress).toBe(0);
    });

    it("should create a task with custom values", async () => {
      const deadline = new Date();
      const task = await repository.create({
        userId,
        title: "Test Task",
        description: "Test Description",
        deadline,
        priority: TASK_PRIORITY.HIGH,
      });

      expect(task.description).toBe("Test Description");
      expect(task.deadline).toEqual(deadline);
      expect(task.priority).toBe("HIGH");
    });

    it("should throw error for invalid priority", async () => {
      await expect(
        repository.create({
          userId,
          title: "Test Task",
          priority: "INVALID" as any,
        })
      ).rejects.toThrow("Invalid priority");
    });
  });

  describe("updateProgress", () => {
    it("should update progress and status correctly", async () => {
      const task = await repository.create({
        userId,
        title: "Test Task",
      });

      // 進行中に更新
      const inProgress = await repository.updateProgress(task.id, 50);
      expect(inProgress.progress).toBe(50);
      expect(inProgress.status).toBe("IN_PROGRESS");

      // 完了に更新
      const completed = await repository.updateProgress(task.id, 100);
      expect(completed.progress).toBe(100);
      expect(completed.status).toBe("COMPLETED");
    });

    it("should throw error for invalid progress value", async () => {
      const task = await repository.create({
        userId,
        title: "Test Task",
      });

      await expect(repository.updateProgress(task.id, 101)).rejects.toThrow(
        "Progress must be between 0 and 100"
      );
    });
  });

  describe("findUpcoming", () => {
    it("should find upcoming tasks", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await repository.create({
        userId,
        title: "Tomorrow Task",
        deadline: tomorrow,
      });

      await repository.create({
        userId,
        title: "Next Week Task",
        deadline: nextWeek,
      });

      const upcomingTasks = await repository.findUpcoming(userId, 3);
      expect(upcomingTasks).toHaveLength(1);
      expect(upcomingTasks[0].title).toBe("Tomorrow Task");
    });
  });
});
