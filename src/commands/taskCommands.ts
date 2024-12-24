// src/commands/taskCommands.ts

import { SlashCommandBuilder } from "discord.js";
import { TASK_PRIORITY } from "../core/constants/task";

export const taskCommands = new SlashCommandBuilder()
  .setName("task")
  .setDescription("タスク管理コマンド")
  // タスク追加コマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("新しいタスクを追加")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("タスクのタイトル")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("deadline")
          .setDescription("締切日 (YYYY-MM-DD)")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("priority")
          .setDescription("優先度")
          .addChoices(
            { name: "高", value: TASK_PRIORITY.HIGH },
            { name: "中", value: TASK_PRIORITY.MEDIUM },
            { name: "低", value: TASK_PRIORITY.LOW }
          )
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("タスクの詳細説明")
          .setRequired(false)
      )
  )
  // タスク一覧表示コマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("タスク一覧を表示")
      .addStringOption((option) =>
        option
          .setName("filter")
          .setDescription("フィルター (all/pending/completed)")
          .addChoices(
            { name: "全て", value: "all" },
            { name: "未完了", value: "pending" },
            { name: "完了済み", value: "completed" }
          )
          .setRequired(false)
      )
  )
  // 進捗更新コマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName("progress")
      .setDescription("タスクの進捗を更新")
      .addStringOption((option) =>
        option.setName("task_id").setDescription("タスクID").setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("progress")
          .setDescription("進捗率 (0-100)")
          .setMinValue(0)
          .setMaxValue(100)
          .setRequired(true)
      )
  )
  // タスク完了コマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName("complete")
      .setDescription("タスクを完了にする")
      .addStringOption((option) =>
        option.setName("task_id").setDescription("タスクID").setRequired(true)
      )
  );

export default taskCommands;
