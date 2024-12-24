import { Task, PrismaClient } from "@prisma/client";
import { BaseRepository } from "../baseRepository";
import {
  isValidPriority,
  isValidStatus,
  TaskPriority,
  TaskStatus,
} from "../../constants/task";

export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  deadline?: Date;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  deadline?: Date | null;
  priority?: TaskPriority;
  progress?: number;
  status?: TaskStatus;
}

export class TaskRepository extends BaseRepository {
  /**
   * タスクを作成する
   */
  async create(input: CreateTaskInput): Promise<Task> {
    if (input.priority && !isValidPriority(input.priority)) {
      throw new Error(`Invalid priority: ${input.priority}`);
    }

    return this.prisma.task.create({
      data: {
        ...input,
        priority: input.priority || "MEDIUM",
        status: "PENDING",
        progress: 0,
      },
    });
  }

  /**
   * タスクを更新する
   */
  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    if (input.priority && !isValidPriority(input.priority)) {
      throw new Error(`Invalid priority: ${input.priority}`);
    }
    if (input.status && !isValidStatus(input.status)) {
      throw new Error(`Invalid status: ${input.status}`);
    }
    if (
      input.progress !== undefined &&
      (input.progress < 0 || input.progress > 100)
    ) {
      throw new Error("Progress must be between 0 and 100");
    }

    return this.prisma.task.update({
      where: { id },
      data: input,
    });
  }

  /**
   * タスクを削除する
   */
  async delete(id: string): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  /**
   * タスクを取得する
   */
  async findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
    });
  }

  /**
   * ユーザーの全タスクを取得する
   */
  async findByUserId(userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * 締切が近いタスクを取得する
   */
  async findUpcoming(userId: string, days: number): Promise<Task[]> {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    return this.prisma.task.findMany({
      where: {
        userId,
        deadline: {
          lte: deadline,
          gt: new Date(),
        },
        status: {
          not: "COMPLETED",
        },
      },
      orderBy: {
        deadline: "asc",
      },
    });
  }

  /**
   * 進捗を更新する
   */
  async updateProgress(id: string, progress: number): Promise<Task> {
    if (progress < 0 || progress > 100) {
      throw new Error("Progress must be between 0 and 100");
    }

    return this.transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id } });
      if (!task) {
        throw new Error("Task not found");
      }

      let status = task.status;
      if (progress >= 100) {
        status = "COMPLETED";
      } else if (progress > 0) {
        status = "IN_PROGRESS";
      }

      return tx.task.update({
        where: { id },
        data: {
          progress,
          status,
        },
      });
    });
  }

  /**
   * タスクを完了にする
   */
  async complete(id: string): Promise<Task> {
    return this.update(id, {
      status: "COMPLETED",
      progress: 100,
    });
  }
}
