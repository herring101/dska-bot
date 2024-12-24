// src/events/interactionCreate.ts
import { Interaction } from "discord.js";
import { TaskCommandHandler } from "../commands/handlers/taskCommandHandler";
import { LLMCommandHandler } from "../commands/handlers/llmCommandHandler";
import { TaskService } from "../core/tasks/taskService";
import { TaskRepository } from "../core/database/repositories/taskRepository";
import { ReminderRepository } from "../core/database/repositories/reminderRepository";
import { UserRepository } from "../core/database/repositories/userRepository";
import { CharacterRepository } from "../core/database/repositories/characterRepository";
import { LLMService } from "../core/llm/LLMService";
import { db } from "../core/database/client";
import { CharacterService } from "../core/characters/characterSService";

// リポジトリの初期化
const taskRepository = new TaskRepository();
const reminderRepository = new ReminderRepository();
const userRepository = new UserRepository();
const characterRepository = new CharacterRepository();

// サービスの初期化
const taskService = new TaskService(taskRepository, reminderRepository);
const characterService = new CharacterService();
const llmService = new LLMService(
  process.env.OPENAI_API_KEY!,
  taskService,
  characterService
);

// ハンドラーの初期化
const taskCommandHandler = new TaskCommandHandler(taskService);
const llmCommandHandler = new LLMCommandHandler(
  llmService,
  userRepository,
  characterRepository,
  taskService
);

export const name = "interactionCreate";
export const once = false;

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case "task":
        await taskCommandHandler.handle(interaction);
        break;
      case "chat": // 追加
        await llmCommandHandler.handle(interaction);
        break;
      default:
        console.log(`Unknown command: ${commandName}`);
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "コマンドの実行中にエラーが発生しました。",
        ephemeral: true,
      });
    }
  }
}
