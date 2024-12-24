// src/commands/deployCommands.ts
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!; // 自分のBot(アプリ)のクライアントID
const guildId = process.env.TEST_GUILD_ID!; // テスト用のDiscordサーバーID

// スラッシュコマンドの定義例
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  new SlashCommandBuilder()
    .setName("task")
    .setDescription("Manage tasks")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a new task")
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Task title").setRequired(true)
        )
    ),
  // 他のコマンドも追加...
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function deploy() {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

deploy();
