// src/events/interactionCreate.ts
import { Interaction } from "discord.js";

export const name = "interactionCreate";
export const once = false; // イベントが一度だけではなく、毎回呼ばれる

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("Pong!");
  }

  // 例: /task add "タイトル"
  if (commandName === "task") {
    const sub = interaction.options.getSubcommand();
    if (sub === "add") {
      const title = interaction.options.getString("title");
      // ここでタスクを登録する処理を呼び出す
      await interaction.reply(`タスク登録: ${title}`);
    }
  }
}
