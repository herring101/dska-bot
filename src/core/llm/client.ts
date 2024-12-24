// src/core/llm/client.ts

import OpenAI from "openai";
import {
  LLMConfig,
  LLMResponse,
  StreamHandler,
  LLMError,
  MessageHistory,
} from "./types";

export class LLMClient {
  private client: OpenAI;
  private defaultConfig: LLMConfig = {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 1000,
    presencePenalty: 0,
    frequencyPenalty: 0,
  };

  constructor(apiKey: string, config?: Partial<LLMConfig>) {
    this.client = new OpenAI({ apiKey });
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  async chat(
    messages: MessageHistory,
    tools?: Array<{
      type: "function";
      function: {
        name: string;
        parameters: Record<string, unknown>;
      };
    }>,
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: (config?.model || this.defaultConfig.model) as string,
        messages,
        temperature: config?.temperature || this.defaultConfig.temperature,
        max_tokens: config?.maxTokens || this.defaultConfig.maxTokens,
        presence_penalty:
          config?.presencePenalty || this.defaultConfig.presencePenalty,
        frequency_penalty:
          config?.frequencyPenalty || this.defaultConfig.frequencyPenalty,
        tools: tools,
      });

      const message = response.choices[0].message;

      return {
        content: message.content || "",
        toolCalls: message.tool_calls,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new LLMError(error.message, "CHAT_ERROR");
      }
      throw error;
    }
  }

  async streamChat(
    messages: MessageHistory,
    handler: StreamHandler,
    tools?: Array<{
      type: "function";
      function: {
        name: string;
        parameters: Record<string, unknown>;
      };
    }>,
    config?: Partial<LLMConfig>
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: (config?.model || this.defaultConfig.model) as string & {},
        messages,
        temperature: config?.temperature || this.defaultConfig.temperature,
        max_tokens: config?.maxTokens || this.defaultConfig.maxTokens,
        presence_penalty:
          config?.presencePenalty || this.defaultConfig.presencePenalty,
        frequency_penalty:
          config?.frequencyPenalty || this.defaultConfig.frequencyPenalty,
        tools: tools,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0].delta;

        if (delta.content) {
          handler.onContent(delta.content);
        }

        if (delta.tool_calls) {
          delta.tool_calls.forEach((toolCall) => {
            if (handler.onToolCall && toolCall.function && toolCall.id) {
              handler.onToolCall({
                id: toolCall.id,
                type: toolCall.type || "function",
                function: {
                  name: toolCall.function.name || "",
                  arguments: toolCall.function.arguments || "{}",
                },
              });
            }
          });
        }
      }

      if (handler.onEnd) {
        handler.onEnd();
      }
    } catch (error) {
      if (handler.onError && error instanceof Error) {
        handler.onError(error);
      }
      throw new LLMError(
        error instanceof Error ? error.message : "Unknown error",
        "STREAM_ERROR"
      );
    }
  }

  // Function Calling用のユーティリティメソッド
  async executeFunction(
    messages: MessageHistory,
    functions: Array<{
      name: string;
      parameters: Record<string, unknown>;
    }>,
    config?: Partial<LLMConfig>
  ): Promise<{
    content: string;
    functionCalls: Array<{
      name: string;
      arguments: Record<string, unknown>;
    }>;
  }> {
    const tools = functions.map((func) => ({
      type: "function" as const,
      function: func,
    }));

    const response = await this.chat(messages, tools, config);

    const functionCalls =
      response.toolCalls?.map((toolCall) => ({
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
      })) || [];

    return {
      content: response.content,
      functionCalls,
    };
  }
}
