// src/core/llm/LLMService.ts

import { LLMClient } from "./client";
import { CharacterContext, LLMConfig, StreamHandler } from "./types";
import { TaskService } from "../tasks/taskService";
import { CharacterService } from "../characters/characterSService";
import { llmFunctions } from "./functions/testFunctions";
import { ChatCompletionMessageParam } from "openai/resources";

export class LLMService {
  private client: LLMClient;
  private characterConfig: Record<string, LLMConfig> = {
    reina: { model: "gpt-4o", temperature: 0.7, presencePenalty: 0.1 },
    saeki: { model: "gpt-4o", temperature: 0.8, presencePenalty: 0.2 },
    kujo: { model: "gpt-4o", temperature: 0.6, presencePenalty: 0.1 },
    tsukishiro: { model: "gpt-4o", temperature: 0.9, presencePenalty: 0.3 },
  };

  constructor(
    apiKey: string,
    private taskService: TaskService,
    private characterService: CharacterService
  ) {
    this.client = new LLMClient(apiKey);
  }

  // キャラクター応答の生成
  async generateCharacterResponse(
    input: string,
    context: CharacterContext
  ): Promise<string> {
    const characterConfig = this.characterConfig[context.characterId] || {};

    const systemPrompt = this.buildCharacterSystemPrompt(context);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(context.recentInteractions || []),
      { role: "user" as const, content: input },
    ];

    const response = await this.client.chat(
      messages,
      undefined,
      characterConfig
    );
    return response.content;
  }

  // キャラクター応答のストリーミング生成
  async streamCharacterResponse(
    input: string,
    context: CharacterContext,
    handler: StreamHandler
  ): Promise<void> {
    const characterConfig = this.characterConfig[context.characterId] || {};

    const systemPrompt = this.buildCharacterSystemPrompt(context);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(context.recentInteractions || []),
      { role: "user" as const, content: input },
    ];

    await this.client.streamChat(messages, handler, undefined, characterConfig);
  }

  // 自然言語からのタスク操作の解釈
  async interpretTaskCommand(
    input: string,
    context: CharacterContext
  ): Promise<{
    command: string;
    parameters: Record<string, unknown>;
  }> {
    const systemPrompt = `
あなたはタスク管理システムのコマンドインタープリターです。
ユーザーの自然な入力をタスク管理コマンドに変換してください。
現在の日付は${new Date().toISOString().split("T")[0]}です。
「明日」は翌日、「今週」は今週の日曜日、「今月」は今月末を指します。

利用可能なコマンド：
- create_task: 新しいタスクを作成
- update_progress: 進捗を更新
- complete_task: タスクを完了にする

タスクの作成時は以下の点に注意してください：
1. 締切日付は常に現在日付以降になるようにしてください
2. 「明日」「今週」「来週」などの相対的な日付は、現在日付から計算してください
3. 優先度は期限の近さや表現の緊急性から判断してください
`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: input },
    ];

    const response = await this.client.executeFunction(
      messages,
      Object.values(llmFunctions)
    );

    if (response.functionCalls.length === 0) {
      throw new Error("No command interpreted from input");
    }

    const functionCall = response.functionCalls[0];
    // パラメータを処理して日付を適切に変換
    const parameters = this.processParameters(functionCall.arguments);
    return {
      command: functionCall.name,
      parameters,
    };
  }

  // パラメータの後処理
  private processParameters(
    params: Record<string, unknown>
  ): Record<string, unknown> {
    if (params.deadline) {
      // 現在の日付を基準に相対的な日付を解決
      const deadline = new Date(params.deadline as string);
      if (isNaN(deadline.getTime())) {
        // 無効な日付の場合、現在日付を設定
        params.deadline = new Date().toISOString().split("T")[0];
      } else if (deadline < new Date()) {
        // 過去の日付の場合、現在日付を設定
        params.deadline = new Date().toISOString().split("T")[0];
      }
    }
    return params;
  }

  async executeFunction(
    messages: ChatCompletionMessageParam[],
    functions: Array<{
      name: string;
      parameters: Record<string, unknown>;
    }>
  ): Promise<{
    content: string;
    functionCalls: Array<{
      name: string;
      arguments: string;
    }>;
  }> {
    const response = await this.client.executeFunction(messages, functions, {
      temperature: 0.7,
      maxTokens: 500,
    });
    return {
      content: response.content,
      functionCalls: response.functionCalls.map((call) => ({
        name: call.name,
        arguments: JSON.stringify(call.arguments),
      })),
    };
  }

  // キャラクターのシステムプロンプト生成
  private buildCharacterSystemPrompt(context: CharacterContext): string {
    const character = this.characterService.getCharacterProfile(
      context.characterId as any
    );
    if (!character) {
      throw new Error(`Character not found: ${context.characterId}`);
    }

    let prompt = `
あなたは「${character.name}」として振る舞ってください。
現在のプレッシャーレベルは${context.pressureLevel}です（範囲: 1-5）。

キャラクター設定:
`;

    switch (context.characterId) {
      case "reina":
        prompt += `
- 完璧主義のお嬢様キャラクター
- 上品で丁寧な言葉遣い
- 時折フランス語を交えて話す
- 高い期待を持ってタスクの完璧な遂行を求める
`;
        break;
      case "saeki":
        prompt += `
- フリーランス歴5年のベテラン
- タメ口で親しみやすい
- 実践的なアドバイスを好む
- 締切と報酬を重視する傾向
`;
        break;
      case "kujo":
        prompt += `
- 闇のプロジェクトマネージャー
- 威圧的で冷静な口調
- 効率と結果を重視
- プロジェクト管理の専門用語を好んで使う
`;
        break;
      case "tsukishiro":
        prompt += `
- メンタリストとして活動
- 柔らかく導くような話し方
- 心理学的な観点からアドバイス
- ユーザーの感情に寄り添う
`;
        break;
    }

    if (context.taskContext) {
      prompt += `\n現在の状況:`;
      if (context.taskContext.currentTask) {
        prompt += `
- 現在のタスク: ${context.taskContext.currentTask.title}
- 進捗: ${context.taskContext.currentTask.progress}%
${
  context.taskContext.currentTask.deadline
    ? `- 締切: ${context.taskContext.currentTask.deadline}`
    : ""
}`;
      }

      if (context.taskContext.upcomingTasks?.length) {
        prompt += `\n直近の締切タスク:`;
        context.taskContext.upcomingTasks.forEach((task) => {
          prompt += `\n- ${task.title} (締切: ${task.deadline})`;
        });
      }
    }

    return prompt;
  }
}
