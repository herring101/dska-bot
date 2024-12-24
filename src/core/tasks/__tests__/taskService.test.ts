// src/core/tasks/__tests__/taskService.test.ts

import { TaskService, TaskServiceError } from "../taskService";
import { TaskRepository } from "../../database/repositories/taskRepository";
import { ReminderRepository } from "../../database/repositories/reminderRepository";
import { Task, TaskReminder } from "@prisma/client";

// モックの型定義
jest.mock("../../database/repositories/taskRepository");
jest.mock("../../database/repositories/reminderRepository");

describe("TaskService", () => {
  let taskService: TaskService;
  let taskRepository: jest.Mocked<TaskRepository>;
  let reminderRepository: jest.Mocked<ReminderRepository>;

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

  const mockReminder: TaskReminder = {
    id: "reminder-1",
    taskId: "task-1",
    reminderTime: new Date(),
    messageType: "DEADLINE",
    createdAt: new Date(),
  };

  beforeEach(() => {
    // モックのリセットとインスタンス作成
    jest.clearAllMocks();
    taskRepository = new TaskRepository() as jest.Mocked<TaskRepository>;
    reminderRepository =
      new ReminderRepository() as jest.Mocked<ReminderRepository>;
    taskService = new TaskService(taskRepository, reminderRepository);
  });

  describe("createTask", () => {
    it("should create a task without deadline", async () => {
      const input = {
        userId: "user-1",
        title: "New Task",
      };

      taskRepository.create.mockResolvedValue(mockTask);
      reminderRepository.createDefaultReminders.mockResolvedValue([]);

      const result = await taskService.createTask(input);

      expect(taskRepository.create).toHaveBeenCalledWith(input);
      expect(reminderRepository.createDefaultReminders).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockTask,
        reminders: [],
      });
    });

    it("should create a task with deadline and reminders", async () => {
      const input = {
        userId: "user-1",
        title: "New Task with Deadline",
        deadline: new Date(),
      };

      const taskWithDeadline = { ...mockTask, deadline: input.deadline };
      taskRepository.create.mockResolvedValue(taskWithDeadline);
      reminderRepository.createDefaultReminders.mockResolvedValue([
        mockReminder,
      ]);

      const result = await taskService.createTask(input);

      expect(taskRepository.create).toHaveBeenCalledWith(input);
      expect(reminderRepository.createDefaultReminders).toHaveBeenCalledWith(
        taskWithDeadline.id
      );
      expect(result).toEqual({
        ...taskWithDeadline,
        reminders: [mockReminder],
      });
    });

    it("should throw TaskServiceError on creation failure", async () => {
      taskRepository.create.mockRejectedValue(new Error("DB Error"));

      await expect(
        taskService.createTask({
          userId: "user-1",
          title: "Failed Task",
        })
      ).rejects.toThrow(TaskServiceError);
    });
  });

  describe("getTask", () => {
    it("should get a task with reminders", async () => {
      taskRepository.findById.mockResolvedValue(mockTask);
      reminderRepository.findByTaskId.mockResolvedValue([mockReminder]);

      const result = await taskService.getTask("task-1");

      expect(taskRepository.findById).toHaveBeenCalledWith("task-1");
      expect(reminderRepository.findByTaskId).toHaveBeenCalledWith("task-1");
      expect(result).toEqual({
        ...mockTask,
        reminders: [mockReminder],
      });
    });

    it("should throw TaskServiceError when task not found", async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(taskService.getTask("non-existent")).rejects.toThrow(
        new TaskServiceError("Task not found", "NOT_FOUND")
      );
    });
  });

  describe("updateTask", () => {
    it("should update task without changing deadline", async () => {
      const input = { title: "Updated Title" };
      taskRepository.update.mockResolvedValue({ ...mockTask, ...input });
      reminderRepository.findByTaskId.mockResolvedValue([mockReminder]);

      const result = await taskService.updateTask("task-1", input);

      expect(taskRepository.update).toHaveBeenCalledWith("task-1", input);
      expect(reminderRepository.deleteByTaskId).not.toHaveBeenCalled();
      expect(reminderRepository.createDefaultReminders).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockTask,
        ...input,
        reminders: [mockReminder],
      });
    });

    it("should update task and reset reminders when deadline changes", async () => {
      const input = { deadline: new Date() };
      taskRepository.update.mockResolvedValue({ ...mockTask, ...input });
      reminderRepository.deleteByTaskId.mockResolvedValue(1);
      reminderRepository.createDefaultReminders.mockResolvedValue([
        mockReminder,
      ]);
      reminderRepository.findByTaskId.mockResolvedValue([mockReminder]);

      const result = await taskService.updateTask("task-1", input);

      expect(taskRepository.update).toHaveBeenCalledWith("task-1", input);
      expect(reminderRepository.deleteByTaskId).toHaveBeenCalledWith("task-1");
      expect(reminderRepository.createDefaultReminders).toHaveBeenCalledWith(
        "task-1"
      );
      expect(result.reminders).toEqual([mockReminder]);
    });
  });

  describe("updateProgress", () => {
    it("should update task progress", async () => {
      const updatedTask = { ...mockTask, progress: 50, status: "IN_PROGRESS" };
      taskRepository.updateProgress.mockResolvedValue(updatedTask);

      const result = await taskService.updateProgress("task-1", 50);

      expect(taskRepository.updateProgress).toHaveBeenCalledWith("task-1", 50);
      expect(result).toEqual(updatedTask);
    });

    it("should throw error for invalid progress value", async () => {
      await expect(taskService.updateProgress("task-1", 101)).rejects.toThrow(
        new TaskServiceError(
          "Progress must be between 0 and 100",
          "INVALID_PROGRESS"
        )
      );
      expect(taskRepository.updateProgress).not.toHaveBeenCalled();
    });
  });

  describe("deleteTask", () => {
    it("should delete task and associated reminders", async () => {
      taskRepository.delete.mockResolvedValue(mockTask);

      const result = await taskService.deleteTask("task-1");

      expect(taskRepository.delete).toHaveBeenCalledWith("task-1");
      expect(result).toEqual(mockTask);
    });

    it("should throw TaskServiceError on deletion failure", async () => {
      taskRepository.delete.mockRejectedValue(new Error("DB Error"));

      await expect(taskService.deleteTask("task-1")).rejects.toThrow(
        TaskServiceError
      );
    });
  });

  describe("getUpcomingTasks", () => {
    it("should get upcoming tasks within specified days", async () => {
      const upcomingTasks = [mockTask];
      taskRepository.findUpcoming.mockResolvedValue(upcomingTasks);

      const result = await taskService.getUpcomingTasks("user-1", 7);

      expect(taskRepository.findUpcoming).toHaveBeenCalledWith("user-1", 7);
      expect(result).toEqual(upcomingTasks);
    });
  });
});
