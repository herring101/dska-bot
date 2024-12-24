// src/commands/handlers/taskCommandHandler.ts

import { ChatInputCommandInteraction } from "discord.js";
import { TaskService, TaskServiceError } from "../../core/tasks/taskService";
import { TASK_PRIORITY } from "../../core/constants/task";

export class TaskCommandHandler {
  constructor(private taskService: TaskService) {}

  async handle(interaction: ChatInputCommandInteraction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "add":
          await this.handleAddTask(interaction);
          break;
        case "list":
          await this.handleListTasks(interaction);
          break;
        case "progress":
          await this.handleUpdateProgress(interaction);
          break;
        case "complete":
          await this.handleCompleteTask(interaction);
          break;
        default:
          await interaction.reply({
            content: "Unknown subcommand",
            ephemeral: true,
          });
      }
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  private async handleAddTask(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString("title", true);
    const deadlineStr = interaction.options.getString("deadline");
    const priority =
      (interaction.options.getString(
        "priority"
      ) as keyof typeof TASK_PRIORITY) || TASK_PRIORITY.MEDIUM;
    const description = interaction.options.getString("description");

    let deadline: Date | undefined;
    if (deadlineStr) {
      deadline = new Date(deadlineStr);
      if (isNaN(deadline.getTime())) {
        await interaction.reply({
          content: "無効な日付形式です。YYYY-MM-DD形式で入力してください。",
          ephemeral: true,
        });
        return;
      }
    }

    const task = await this.taskService.createTask({
      userId: interaction.user.id,
      title,
      description: description || undefined,
      deadline,
      priority,
    });

    await interaction.reply({
      content: `タスクを作成しました！\nID: ${task.id}\nタイトル: ${
        task.title
      }${deadline ? `\n締切: ${deadline.toLocaleDateString("ja-JP")}` : ""}`,
      ephemeral: true,
    });
  }

  private async handleListTasks(interaction: ChatInputCommandInteraction) {
    const filter = interaction.options.getString("filter") || "all";
    const tasks = await this.taskService.getUserTasks(interaction.user.id);

    const filteredTasks = tasks.filter((task) => {
      switch (filter) {
        case "pending":
          return task.status !== "COMPLETED";
        case "completed":
          return task.status === "COMPLETED";
        default:
          return true;
      }
    });

    if (filteredTasks.length === 0) {
      await interaction.reply({
        content: "タスクが見つかりませんでした。",
        ephemeral: true,
      });
      return;
    }

    const taskList = filteredTasks
      .map((task) => {
        const status =
          task.status === "COMPLETED"
            ? "✅"
            : task.progress > 0
            ? `🔄 ${task.progress}%`
            : "⏳";
        return `${status} ${task.id}: ${task.title}${
          task.deadline
            ? ` (締切: ${new Date(task.deadline).toLocaleDateString("ja-JP")})`
            : ""
        }`;
      })
      .join("\n");

    await interaction.reply({
      content: `あなたのタスク一覧:\n${taskList}`,
      ephemeral: true,
    });
  }

  private async handleUpdateProgress(interaction: ChatInputCommandInteraction) {
    const taskId = interaction.options.getString("task_id", true);
    const progress = interaction.options.getInteger("progress", true);

    const task = await this.taskService.updateProgress(taskId, progress);

    await interaction.reply({
      content: `タスク「${task.title}」の進捗を${progress}%に更新しました。`,
      ephemeral: true,
    });
  }

  private async handleCompleteTask(interaction: ChatInputCommandInteraction) {
    const taskId = interaction.options.getString("task_id", true);
    const task = await this.taskService.completeTask(taskId);

    await interaction.reply({
      content: `タスク「${task.title}」を完了しました！🎉`,
      ephemeral: true,
    });
  }

  private async handleError(
    interaction: ChatInputCommandInteraction,
    error: unknown
  ) {
    let message = "エラーが発生しました。";

    if (error instanceof TaskServiceError) {
      switch (error.code) {
        case "NOT_FOUND":
          message = "指定されたタスクが見つかりませんでした。";
          break;
        case "INVALID_PROGRESS":
          message = "進捗は0から100の間で指定してください。";
          break;
        // 他のエラーケースも追加
      }
    }

    await interaction.reply({
      content: message,
      ephemeral: true,
    });
  }
}
