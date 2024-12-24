// src/commands/deployCommands.ts
import { REST, Routes } from "discord.js";
import * as dotenv from "dotenv";
import { taskCommands } from "./taskCommands";
import { llmCommands } from "./llmCommands";
dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId = process.env.TEST_GUILD_ID!;

// スラッシュコマンドの定義
const commands = [
  taskCommands,
  llmCommands, // 追加
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function deploy() {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error deploying commands:", error);
  }
}

deploy();
