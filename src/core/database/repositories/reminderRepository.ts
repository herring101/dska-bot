import { TaskReminder, PrismaClient } from "@prisma/client";
import { BaseRepository } from "../baseRepository";
import { isValidReminderType, ReminderType } from "../../constants/reminder";

export interface CreateReminderInput {
  taskId: string;
  reminderTime: Date;
  messageType: ReminderType;
}

export class ReminderRepository extends BaseRepository {
  /**
   * リマインダーを作成する
   */
  async create(input: CreateReminderInput): Promise<TaskReminder> {
    if (!isValidReminderType(input.messageType)) {
      throw new Error(`Invalid reminder type: ${input.messageType}`);
    }

    return this.transaction(async (tx) => {
      // タスクの存在確認
      const task = await tx.task.findUnique({
        where: { id: input.taskId },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      return tx.taskReminder.create({
        data: input,
      });
    });
  }

  /**
   * リマインダーを削除する
   */
  async delete(id: string): Promise<TaskReminder> {
    return this.prisma.taskReminder.delete({
      where: { id },
    });
  }

  /**
   * タスクの全リマインダーを削除する
   */
  async deleteByTaskId(taskId: string): Promise<number> {
    const result = await this.prisma.taskReminder.deleteMany({
      where: { taskId },
    });
    return result.count;
  }

  /**
   * 指定時間範囲内のリマインダーを取得する
   */
  async findDueReminders(
    startTime: Date,
    endTime: Date
  ): Promise<TaskReminder[]> {
    return this.prisma.taskReminder.findMany({
      where: {
        reminderTime: {
          gte: startTime,
          lt: endTime,
        },
      },
      include: {
        task: true,
      },
      orderBy: {
        reminderTime: "asc",
      },
    });
  }

  /**
   * タスクの全リマインダーを取得する
   */
  async findByTaskId(taskId: string): Promise<TaskReminder[]> {
    return this.prisma.taskReminder.findMany({
      where: { taskId },
      orderBy: {
        reminderTime: "asc",
      },
    });
  }

  /**
   * リマインド時間を更新する
   */
  async updateReminderTime(id: string, newTime: Date): Promise<TaskReminder> {
    return this.prisma.taskReminder.update({
      where: { id },
      data: {
        reminderTime: newTime,
      },
    });
  }

  /**
   * タスクの締切に基づいて自動でリマインダーを設定する
   */
  async createDefaultReminders(taskId: string): Promise<TaskReminder[]> {
    return this.transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
      });

      if (!task || !task.deadline) {
        throw new Error("Task not found or has no deadline");
      }

      const deadline = new Date(task.deadline);
      const now = new Date();
      const reminders = [];

      // 締切日の前日にリマインド
      const dayBefore = new Date(deadline);
      dayBefore.setDate(dayBefore.getDate() - 1);
      if (dayBefore > now) {
        reminders.push(
          await tx.taskReminder.create({
            data: {
              taskId,
              reminderTime: dayBefore,
              messageType: "DEADLINE",
            },
          })
        );
      }

      // 締切日の1週間前にリマインド
      const weekBefore = new Date(deadline);
      weekBefore.setDate(weekBefore.getDate() - 7);
      if (weekBefore > now) {
        reminders.push(
          await tx.taskReminder.create({
            data: {
              taskId,
              reminderTime: weekBefore,
              messageType: "PROGRESS",
            },
          })
        );
      }

      return reminders;
    });
  }
}
