// src/commands/handlers/llmCommandHandler.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionReplyOptions,
  Message,
} from "discord.js";
import { LLMService } from "../../core/llm/LLMService";
import { UserRepository } from "../../core/database/repositories/userRepository";
import { CharacterRepository } from "../../core/database/repositories/characterRepository";

export class LLMCommandHandler {
  constructor(
    private llmService: LLMService,
    private userRepository: UserRepository,
    private characterRepository: CharacterRepository,
    private taskService: any // Replace 'any' with the actual type of taskService if known
  ) {}

  async handle(interaction: ChatInputCommandInteraction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "talk":
          await this.handleTalk(interaction);
          break;
        case "character":
          await this.handleCharacterChange(interaction);
          break;
        case "pressure":
          await this.handlePressureChange(interaction);
          break;
        case "debug":
          await this.handleDebug(interaction);
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

  private async handleTalk(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true);

    // 一時応答を送信
    await interaction.deferReply();

    // ユーザー情報を取得
    const user = await this.userRepository.findById(interaction.user.id);
    if (!user || !user.activeCharacterId) {
      await interaction.editReply(
        "先にキャラクターを選択してください。 `/chat character` で選択できます。"
      );
      return;
    }

    // コンテキストを構築
    const context = {
      characterId: user.activeCharacterId,
      pressureLevel: user.pressureLevel,
      recentInteractions: await this.getRecentInteractions(interaction.user.id),
    };

    // ストリーミングハンドラーを設定
    let responseContent = "";
    const handler = {
      onContent: (content: string) => {
        responseContent += content;
      },
      onEnd: async () => {
        // レスポンスを整形して送信
        const embed = new EmbedBuilder()
          .setColor(this.getCharacterColor(user.activeCharacterId!))
          .setAuthor({
            name: this.getCharacterName(user.activeCharacterId!),
          })
          .setDescription(responseContent);

        await interaction.editReply({ embeds: [embed] });
      },
      onError: async (error: Error) => {
        await interaction.editReply("申し訳ありません。エラーが発生しました。");
      },
    };

    // ストリーミングレスポンスを開始
    await this.llmService.streamCharacterResponse(message, context, handler);

    // インタラクションを記録
    await this.characterRepository.recordInteraction({
      userId: interaction.user.id,
      characterId: user.activeCharacterId,
      interactionType: "GENERAL_CHAT",
      context: {
        currentMessage: message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private async handleCharacterChange(
    interaction: ChatInputCommandInteraction
  ) {
    const characterId = interaction.options.getString("character", true) as
      | "reina"
      | "saeki"
      | "kujo"
      | "tsukishiro";

    await this.userRepository.updateActiveCharacter(
      interaction.user.id,
      characterId
    );

    const embed = new EmbedBuilder()
      .setColor(this.getCharacterColor(characterId))
      .setAuthor({
        name: this.getCharacterName(characterId),
      })
      .setDescription(
        "キャラクターを変更しました。どのようなご用件でしょうか？"
      );

    await interaction.reply({ embeds: [embed] });
  }

  private async handlePressureChange(interaction: ChatInputCommandInteraction) {
    const level = interaction.options.getInteger("level", true);

    const user = await this.userRepository.updatePressureLevel(
      interaction.user.id,
      level
    );

    if (!user.activeCharacterId) {
      await interaction.reply({
        content: "先にキャラクターを選択してください。",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(this.getCharacterColor(user.activeCharacterId!))
      .setAuthor({
        name: this.getCharacterName(user.activeCharacterId),
      })
      .setDescription(`プレッシャーレベルを${level}に設定しました。`);

    await interaction.reply({ embeds: [embed] });
  }

  private async handleDebug(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true);
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await this.userRepository.findById(interaction.user.id);
      if (!user?.activeCharacterId) {
        await interaction.editReply(
          "キャラクターが選択されていません。先に `/chat character` でキャラクターを選択してください。"
        );
        return;
      }

      // Function Call解析の実行
      const result = await this.llmService.interpretTaskCommand(message, {
        characterId: user.activeCharacterId,
        pressureLevel: user.pressureLevel,
      });

      // 結果を整形して表示
      const responseEmbed = new EmbedBuilder()
        .setColor(this.getCharacterColor(user.activeCharacterId!))
        .setTitle("Function Call Debug")
        .addFields(
          { name: "入力メッセージ", value: message },
          { name: "解析されたコマンド", value: result.command },
          {
            name: "パラメータ",
            value:
              "```json\n" +
              JSON.stringify(result.parameters, null, 2) +
              "\n```",
          }
        );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("execute_command")
          .setLabel("このコマンドを実行")
          .setStyle(ButtonStyle.Primary)
      );

      const response = await interaction.editReply({
        embeds: [responseEmbed],
        components: [row],
        content: "解析結果:",
      });

      if (!(response instanceof Message)) {
        return;
      }

      // インタラクションコレクターを設定
      const collector = response.createMessageComponentCollector({
        filter: (i) =>
          i.customId === "execute_command" && i.user.id === interaction.user.id,
        time: 60000,
        max: 1,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();

        switch (result.command) {
          case "create_task":
            try {
              const task = await this.taskService.createTask({
                userId: interaction.user.id,
                title: result.parameters.title as string,
                description: result.parameters.description as string,
                deadline: result.parameters.deadline
                  ? new Date(result.parameters.deadline as string)
                  : undefined,
                priority: result.parameters.priority as any,
              });

              const taskEmbed = new EmbedBuilder()
                .setColor(this.getCharacterColor(user.activeCharacterId!))
                .setTitle("タスクを作成しました")
                .addFields(
                  { name: "タイトル", value: task.title },
                  { name: "ID", value: task.id },
                  {
                    name: "締切",
                    value: task.deadline?.toLocaleDateString() || "未設定",
                  },
                  { name: "優先度", value: task.priority }
                );

              await i.followUp({
                embeds: [taskEmbed],
                ephemeral: true,
              });
            } catch (error) {
              await i.followUp({
                content: `タスクの作成中にエラーが発生しました: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
                ephemeral: true,
              });
            }
            break;

          // 他のコマンドの実行処理も追加可能
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({
            content: "コマンドの実行がタイムアウトしました。",
            ephemeral: true,
          });
        }
      });
    } catch (error) {
      await interaction.editReply(
        `解析エラー: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async handleError(
    interaction: ChatInputCommandInteraction,
    error: unknown
  ) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const response: InteractionReplyOptions = {
      content: `エラーが発生しました: ${errorMessage}`,
      ephemeral: true,
    };

    if (interaction.deferred) {
      await interaction.editReply(response);
    } else {
      await interaction.reply(response);
    }
  }

  private getCharacterColor(characterId: string): number {
    const colors = {
      reina: 0x8b0000, // ワインレッド
      saeki: 0x000080, // ネイビー
      kujo: 0x2f4f4f, // ダークグレー
      tsukishiro: 0x98ff98, // ミントグリーン
    };
    return colors[characterId as keyof typeof colors] || 0x000000;
  }

  private getCharacterName(characterId: string): string {
    const names = {
      reina: "完璧主義お嬢様 レイナ",
      saeki: "フリーランス先輩 佐伯",
      kujo: "闇PM 九条",
      tsukishiro: "メンタリスト 月城",
    };
    return names[characterId as keyof typeof names] || "Unknown Character";
  }

  private async getRecentInteractions(
    userId: string,
    limit: number = 5
  ): Promise<{ role: "assistant" | "user"; content: string }[]> {
    const interactions = await this.characterRepository.getRecentInteractions(
      userId,
      limit
    );

    return interactions.map((interaction) => ({
      role: "assistant",
      content: JSON.parse(interaction.context).currentMessage || "",
    }));
  }
}
