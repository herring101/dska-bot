import { ReminderRepository } from "../reminderRepository";
import { TaskRepository } from "../taskRepository";
import { UserRepository } from "../userRepository";
import { db } from "../../client";
import { PrismaClient } from "@prisma/client";
import { REMINDER_TYPE } from "../../../constants/reminder";

describe("ReminderRepository", () => {
  let repository: ReminderRepository;
  let taskRepository: TaskRepository;
  let userRepository: UserRepository;
  let prisma: PrismaClient;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    await db.connect();
    prisma = db.getClient();
    repository = new ReminderRepository();
    taskRepository = new TaskRepository();
    userRepository = new UserRepository();

    // テスト用ユーザーとタスクを作成
    userId = "test-user-123";
    await userRepository.upsert(userId);
  });

  beforeEach(async () => {
    await prisma.taskReminder.deleteMany();
    await prisma.task.deleteMany();

    // 各テストの前に新しいタスクを作成
    const task = await taskRepository.create({
      userId,
      title: "Test Task",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.taskReminder.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await db.disconnect();
  });

  describe("create", () => {
    it("should create a reminder", async () => {
      const reminderTime = new Date();
      const reminder = await repository.create({
        taskId,
        reminderTime,
        messageType: REMINDER_TYPE.DEADLINE,
      });

      expect(reminder).toBeDefined();
      expect(reminder.taskId).toBe(taskId);
      expect(reminder.messageType).toBe(REMINDER_TYPE.DEADLINE);
      expect(reminder.reminderTime).toEqual(reminderTime);
    });

    it("should throw error for invalid reminder type", async () => {
      const reminderTime = new Date();
      await expect(
        repository.create({
          taskId,
          reminderTime,
          messageType: "INVALID" as any,
        })
      ).rejects.toThrow("Invalid reminder type");
    });

    it("should throw error for non-existent task", async () => {
      const reminderTime = new Date();
      await expect(
        repository.create({
          taskId: "non-existent-task",
          reminderTime,
          messageType: REMINDER_TYPE.DEADLINE,
        })
      ).rejects.toThrow("Task not found");
    });
  });

  describe("findDueReminders", () => {
    it("should find reminders within time range", async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 1000 * 60 * 60); // 1時間後

      await repository.create({
        taskId,
        reminderTime: new Date(now.getTime() + 1000 * 60 * 30), // 30分後
        messageType: REMINDER_TYPE.PROGRESS,
      });

      const reminders = await repository.findDueReminders(now, later);
      expect(reminders).toHaveLength(1);
      expect(reminders[0].messageType).toBe(REMINDER_TYPE.PROGRESS);
    });
  });

  describe("createDefaultReminders", () => {
    it("should create default reminders for task with deadline", async () => {
      // 2週間後の締切を持つタスクを作成
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const task = await taskRepository.create({
        userId,
        title: "Future Task",
        deadline: twoWeeksLater,
      });

      const reminders = await repository.createDefaultReminders(task.id);

      expect(reminders).toHaveLength(2); // 1日前と1週間前
      expect(reminders.map((r) => r.messageType)).toContain(
        REMINDER_TYPE.DEADLINE
      );
      expect(reminders.map((r) => r.messageType)).toContain(
        REMINDER_TYPE.PROGRESS
      );
    });

    it("should throw error for task without deadline", async () => {
      const taskWithoutDeadline = await taskRepository.create({
        userId,
        title: "Task without deadline",
      });

      await expect(
        repository.createDefaultReminders(taskWithoutDeadline.id)
      ).rejects.toThrow("Task not found or has no deadline");
    });
  });
});
