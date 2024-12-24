// src/index.ts
import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// イベントファイルを読み込んで登録する
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  // 動的import
  import(filePath).then((eventModule) => {
    const { name, once, execute } = eventModule;
    if (once) {
      client.once(name, (...args: any[]) => execute(...args));
    } else {
      client.on(name, (...args: any[]) => execute(...args));
    }
  });
}

client
  .login(token)
  .then(() => {
    console.log("Botがログインしました!");
  })
  .catch(console.error);
