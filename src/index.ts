// src/index.ts
import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { db } from "./core/database/client";
import { TaskRepository } from "./core/database/repositories/taskRepository";
import { ReminderRepository } from "./core/database/repositories/reminderRepository";
import { UserRepository } from "./core/database/repositories/userRepository";
import { CharacterRepository } from "./core/database/repositories/characterRepository";
import { ConversationRepository } from "./core/database/repositories/conversationRepository";
import { TaskService } from "./core/tasks/taskService";
import { CharacterService } from "./core/characters/characterSService";
import { LLMService } from "./core/llm/LLMService";
import { ConversationService } from "./core/conversations/conversationService";
import { initializeServices } from "./events/messageCreate";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// リポジトリの初期化
const taskRepository = new TaskRepository();
const reminderRepository = new ReminderRepository();
const userRepository = new UserRepository();
const characterRepository = new CharacterRepository();
const conversationRepository = new ConversationRepository();

// サービスの初期化
const taskService = new TaskService(taskRepository, reminderRepository);
const characterService = new CharacterService();
const llmService = new LLMService(
  process.env.OPENAI_API_KEY!,
  taskService,
  characterService
);
const conversationService = new ConversationService(
  conversationRepository,
  taskRepository,
  characterService
);

// メッセージイベントにサービスを注入
initializeServices({
  llm: llmService,
  user: userRepository,
  conversation: conversationService,
  character: characterService,
  task: taskService,
  client: client, // clientを追加
});

// イベントファイルを読み込んで登録する
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  import(filePath).then((eventModule) => {
    const { name, once, execute } = eventModule;
    if (once) {
      client.once(name, (...args: any[]) => execute(...args));
    } else {
      client.on(name, (...args: any[]) => execute(...args));
    }
  });
}

// データベースに接続してからBotを起動
db.connect()
  .then(() => {
    return client.login(process.env.DISCORD_TOKEN!);
  })
  .then(() => {
    console.log("Botがログインしました!");
  })
  .catch(console.error);
