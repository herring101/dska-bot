// src/events/messageCreate.ts
import { Client, Message, TextChannel } from "discord.js";
import { LLMService } from "../core/llm/LLMService";
import { UserRepository } from "../core/database/repositories/userRepository";
import { ConversationService } from "../core/conversations/conversationService";
import { CharacterService } from "../core/characters/characterSService";
import { TaskService } from "../core/tasks/taskService";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import {
  isConversationEndFunction,
  shouldRespondFunction,
} from "../core/llm/functions/conversationFunctions";
import { ConversationStateManager } from "../core/conversations/conversationState";

export const name = "messageCreate";
export const once = false;

let llmService: LLMService;
let userRepository: UserRepository;
let conversationService: ConversationService;
let characterService: CharacterService;
let taskService: TaskService;
let discordClient: Client;

const stateManager = new ConversationStateManager();

// サービスの初期化
export function initializeServices(services: {
  llm: LLMService;
  user: UserRepository;
  conversation: ConversationService;
  character: CharacterService;
  task: TaskService;
  client: Client;
}) {
  llmService = services.llm;
  userRepository = services.user;
  conversationService = services.conversation;
  characterService = services.character;
  taskService = services.task;
  discordClient = services.client;
}

export async function execute(message: Message) {
  if (message.author.bot) return;

  const isMentioned = message.mentions.users.has(message.client.user!.id);
  const state = stateManager.getState(message.channelId);

  // メンションされた場合は新しい会話を開始
  if (isMentioned) {
    stateManager.startConversation(message.channelId);
  }

  // 会話状態の確認
  if (!state) {
    if (!isMentioned) return; // 会話状態がなく、メンションもない場合は無視
  } else {
    // タイムアウトチェック
    if (state.isActive && stateManager.checkTimeout(message.channelId)) {
      await endConversation(
        message.channelId,
        "タイムアウトにより会話を終了します。"
      );
      state.isActive = false;
    }

    stateManager.updateLastMessageTime(message.channelId);
  }

  const cleanContent = message.content
    .replace(new RegExp(`<@!?${message.client.user!.id}>`), "")
    .trim();

  // アクティブな会話中でない場合、応答判断
  if (!state?.isActive) {
    if (state?.isMonitoring) {
      const shouldRespond = await checkShouldRespond(cleanContent);
      if (!shouldRespond) return;
      // 応答する場合は会話を再開
      stateManager.startConversation(message.channelId);
    } else if (!isMentioned) {
      return; // モニタリング期間外かつメンションなしは無視
    }
  }

  // 以降は応答処理
  if (message.channel instanceof TextChannel) {
    await message.channel.sendTyping();
  }

  try {
    let user = await userRepository.findById(message.author.id);
    if (!user) {
      user = await userRepository.upsert(message.author.id);
    }

    if (!user.activeCharacterId) {
      user = await userRepository.updateActiveCharacter(
        message.author.id,
        "reina"
      );
    }

    let conversation = (
      await conversationService.findLatestByUserId(message.author.id)
    )[0];
    if (!conversation) {
      conversation = await conversationService.startConversation(
        message.author.id,
        user.activeCharacterId!
      );
    }

    await conversationService.addMessage(conversation.id, {
      role: "user",
      content: cleanContent,
    });

    const context = await conversationService.buildContext(conversation.id);

    const recentMessages: ChatCompletionMessageParam[] =
      context.recentMessages.map((msg) => {
        if (msg.role === "tool") {
          return {
            role: msg.role,
            content: msg.content,
            tool_call_id: "dummy_id",
          };
        }
        return {
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        };
      });

    let responseContent = "";
    await llmService.streamCharacterResponse(
      cleanContent,
      {
        characterId: user.activeCharacterId!,
        pressureLevel: conversation.pressureLevel,
        recentInteractions: recentMessages,
      },
      {
        onContent: (content) => {
          responseContent += content;
        },
        onEnd: async () => {
          await conversationService.addMessage(conversation.id, {
            role: "assistant",
            content: responseContent,
          });
        },
      }
    );

    // 通常のメッセージとして送信
    if (message.channel instanceof TextChannel) {
      await message.channel.send(responseContent);
    } else {
      console.error("メッセージを送信できないチャンネルタイプです。");
    }
    // 会話終了判定
    const shouldEnd = await checkConversationEnd(responseContent);
    if (shouldEnd) {
      await endConversation(
        message.channelId,
        "会話が自然な終わりを迎えました。また何かありましたらお声がけください。"
      );
    }
  } catch (error) {
    console.error("Error in messageCreate event:", error);
    if (message.channel instanceof TextChannel) {
      await message.channel.send("申し訳ありません。エラーが発生しました。");
    } else {
      console.error("メッセージを送信できないチャンネルタイプです。");
    }
  }
}

async function checkShouldRespond(content: string): Promise<boolean> {
  try {
    const result = await llmService.executeFunction(
      [
        {
          role: "system",
          content:
            "あなたはユーザーのメッセージに応答するべきかどうかを判断します。以下の点を考慮してください：\n" +
            "1. メッセージが直接的な質問や相談を含んでいるか\n" +
            "2. ユーザーが支援や励ましを必要としているか\n" +
            "3. タスクに関連する重要な情報が含まれているか",
        },
        {
          role: "user",
          content: `ユーザーのメッセージ: ${content}`,
        },
      ],
      [shouldRespondFunction]
    );

    const functionResponse = result.functionCalls[0]?.arguments;
    if (functionResponse) {
      const parsed = JSON.parse(functionResponse);
      return parsed.shouldRespond;
    }
    return false;
  } catch (error) {
    console.error("Error checking should respond:", error);
    return false;
  }
}

async function checkConversationEnd(responseContent: string): Promise<boolean> {
  try {
    const result = await llmService.executeFunction(
      [
        {
          role: "system",
          content:
            "直前の会話が自然な終わりを迎えているかどうかを判断します。以下の点を考慮してください：\n" +
            "1. 会話が論理的な結論に達しているか\n" +
            "2. 新しい話題が導入される可能性が低いか\n" +
            "3. ユーザーの質問や懸念に十分に対応できているか",
        },
        {
          role: "user",
          content: `アシスタントの最後の応答: ${responseContent}`,
        },
      ],
      [isConversationEndFunction]
    );

    const functionResponse = result.functionCalls[0]?.arguments;
    if (functionResponse) {
      const parsed = JSON.parse(functionResponse);
      return parsed.shouldEnd;
    }
    return false;
  } catch (error) {
    console.error("Error checking conversation end:", error);
    return false;
  }
}

async function endConversation(channelId: string, message: string) {
  stateManager.endConversation(channelId);
  const channel = discordClient.channels.cache.get(channelId);
  if (channel instanceof TextChannel) {
    await channel.send(message);
  }
}
