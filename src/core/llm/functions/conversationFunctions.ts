export const shouldRespondFunction = {
  name: "should_respond",
  parameters: {
    type: "object",
    properties: {
      shouldRespond: {
        type: "boolean",
        description: "応答するべきかどうか",
      },
      reason: {
        type: "string",
        description: "判断の理由",
      },
    },
    required: ["shouldRespond"],
  },
};

export const isConversationEndFunction = {
  name: "is_conversation_end",
  parameters: {
    type: "object",
    properties: {
      shouldEnd: {
        type: "boolean",
        description: "会話を終了するべきかどうか",
      },
      reason: {
        type: "string",
        description: "判断の理由",
      },
    },
    required: ["shouldEnd"],
  },
};
