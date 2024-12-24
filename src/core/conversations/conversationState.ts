interface ConversationState {
  channelId: string;
  lastMessageTime: Date;
  isActive: boolean;
  isMonitoring: boolean;
}

export class ConversationStateManager {
  private states: Map<string, ConversationState> = new Map();
  private readonly CONVERSATION_TIMEOUT = 10 * 60 * 1000; // 10分
  private readonly MONITORING_DURATION = 10 * 60 * 1000; // 10分

  startConversation(channelId: string) {
    this.states.set(channelId, {
      channelId,
      lastMessageTime: new Date(),
      isActive: true,
      isMonitoring: false,
    });
  }

  updateLastMessageTime(channelId: string) {
    const state = this.states.get(channelId);
    if (state) {
      state.lastMessageTime = new Date();
      this.states.set(channelId, state);
    }
  }

  endConversation(channelId: string) {
    const state = this.states.get(channelId);
    if (state) {
      state.isActive = false;
      state.isMonitoring = true;
      this.states.set(channelId, state);

      // モニタリング期間後に監視を終了
      setTimeout(() => {
        const currentState = this.states.get(channelId);
        if (currentState) {
          currentState.isMonitoring = false;
          this.states.set(channelId, currentState);
        }
      }, this.MONITORING_DURATION);
    }
  }

  getState(channelId: string): ConversationState | undefined {
    return this.states.get(channelId);
  }

  checkTimeout(channelId: string): boolean {
    const state = this.states.get(channelId);
    if (state?.isActive) {
      const elapsed = new Date().getTime() - state.lastMessageTime.getTime();
      return elapsed >= this.CONVERSATION_TIMEOUT;
    }
    return false;
  }
}
