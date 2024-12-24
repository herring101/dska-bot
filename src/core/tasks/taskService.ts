// src/core/tasks/taskService.ts

import { Task, TaskReminder } from "@prisma/client";
import {
  TaskRepository,
  CreateTaskInput,
  UpdateTaskInput,
} from "../database/repositories/taskRepository";
import { ReminderRepository } from "../database/repositories/reminderRepository";
import { TaskStatus, TaskPriority } from "../constants/task";

export class TaskServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "TaskServiceError";
  }
}

export interface TaskWithReminders extends Task {
  reminders?: TaskReminder[];
}

export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private reminderRepository: ReminderRepository
  ) {}

  /**
   * タスクを作成する
   */
  async createTask(input: CreateTaskInput): Promise<TaskWithReminders> {
    try {
      const task = await this.taskRepository.create(input);

      // 締切が設定されている場合はリマインダーを作成
      let reminders: TaskReminder[] = [];
      if (input.deadline) {
        reminders = await this.reminderRepository.createDefaultReminders(
          task.id
        );
      }

      return {
        ...task,
        reminders,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskServiceError(error.message, "CREATE_FAILED");
      }
      throw error;
    }
  }

  /**
   * タスクを取得する
   */
  async getTask(id: string): Promise<TaskWithReminders> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new TaskServiceError("Task not found", "NOT_FOUND");
    }

    const reminders = await this.reminderRepository.findByTaskId(id);
    return {
      ...task,
      reminders,
    };
  }

  /**
   * ユーザーのタスク一覧を取得する
   */
  async getUserTasks(userId: string): Promise<Task[]> {
    return this.taskRepository.findByUserId(userId);
  }

  /**
   * タスクを更新する
   */
  async updateTask(
    id: string,
    input: UpdateTaskInput
  ): Promise<TaskWithReminders> {
    try {
      const task = await this.taskRepository.update(id, input);

      // 締切日が変更された場合、リマインダーを再設定
      if ("deadline" in input) {
        await this.reminderRepository.deleteByTaskId(id);
        if (input.deadline) {
          await this.reminderRepository.createDefaultReminders(id);
        }
      }

      const reminders = await this.reminderRepository.findByTaskId(id);
      return {
        ...task,
        reminders,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskServiceError(error.message, "UPDATE_FAILED");
      }
      throw error;
    }
  }

  /**
   * タスクの進捗を更新する
   */
  async updateProgress(id: string, progress: number): Promise<Task> {
    if (progress < 0 || progress > 100) {
      throw new TaskServiceError(
        "Progress must be between 0 and 100",
        "INVALID_PROGRESS"
      );
    }

    return this.taskRepository.updateProgress(id, progress);
  }

  /**
   * タスクを完了にする
   */
  async completeTask(id: string): Promise<Task> {
    return this.taskRepository.complete(id);
  }

  /**
   * タスクを削除する
   */
  async deleteTask(id: string): Promise<Task> {
    try {
      // リマインダーは CASCADE 設定により自動的に削除される
      return await this.taskRepository.delete(id);
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskServiceError(error.message, "DELETE_FAILED");
      }
      throw error;
    }
  }

  /**
   * 締切が近いタスクを取得する
   */
  async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
    return this.taskRepository.findUpcoming(userId, days);
  }
}
