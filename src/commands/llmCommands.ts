// src/commands/llmCommands.ts
import { SlashCommandBuilder } from "discord.js";

export const llmCommands = new SlashCommandBuilder()
  .setName("chat")
  .setDescription("キャラクターと会話する")
  // サブコマンド: 通常の会話
  .addSubcommand((subcommand) =>
    subcommand
      .setName("talk")
      .setDescription("キャラクターと会話する")
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("送信するメッセージ")
          .setRequired(true)
      )
  )
  // サブコマンド: キャラクター変更
  .addSubcommand((subcommand) =>
    subcommand
      .setName("character")
      .setDescription("話すキャラクターを変更する")
      .addStringOption((option) =>
        option
          .setName("character")
          .setDescription("キャラクターを選択")
          .setRequired(true)
          .addChoices(
            { name: "完璧主義お嬢様 レイナ", value: "reina" },
            { name: "フリーランス先輩 佐伯", value: "saeki" },
            { name: "闇PM 九条", value: "kujo" },
            { name: "メンタリスト 月城", value: "tsukishiro" }
          )
      )
  )
  // サブコマンド: プレッシャーレベル調整
  .addSubcommand((subcommand) =>
    subcommand
      .setName("pressure")
      .setDescription("プレッシャーレベルを調整する")
      .addIntegerOption((option) =>
        option
          .setName("level")
          .setDescription("プレッシャーレベル (1-5)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(5)
      )
  )
  // サブコマンド: デバッグモード
  .addSubcommand((subcommand) =>
    subcommand
      .setName("debug")
      .setDescription("テスト用のコマンド")
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("解析するメッセージ")
          .setRequired(true)
      )
  );

export default llmCommands;
