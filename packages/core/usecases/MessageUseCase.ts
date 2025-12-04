import { MessageRepository } from "@packages/data/repositories/MessageRepository";
import { supabase } from "@packages/data/supabaseClient";

export class MessageUseCase {
  private repo = new MessageRepository();

  async startConversation(
    senderId: number,
    receiverId: number,
    content: string,
    type: "text" | "image" | "file" | "system" = "text"
  ) {
    if (senderId === receiverId) {
      throw new Error("Cannot send message to yourself");
    }

    const conversationId = await this.repo.getOrCreateConversation(senderId, receiverId);
    const message = await this.repo.sendMessage(conversationId, senderId, content, type);
    return { conversationId, message };
  }

  async getConversationMessages(conversationId: number, userId: number) {
    const conversation = await this.repo.getConversationById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const isParticipant =
      conversation.user1_id === userId || conversation.user2_id === userId;
    if (!isParticipant) throw new Error("Forbidden: not your conversation");

    await this.repo.markMessagesAsRead(conversationId, userId);

    return await this.repo.getMessages(conversationId);
  }

  async getUserConversations(userId: number) {
    return await this.repo.listConversations(userId);
  }

  async getConversationWith(userId: number, otherUserId: number) {
    return await this.repo.getConversationWith(userId, otherUserId);
  }

  async markAsRead(conversationId: number, userId: number) {
    return await this.repo.markMessagesAsRead(conversationId, userId);
  }

  async recallMessage(messageId: number, userId: number) {
    return await this.repo.recallMessage(messageId, userId);
  }

  async deleteMessage(messageId: number, userId: number) {
    return await this.repo.deleteMessage(messageId, userId);
  }

  async createConversation(userA: number, userB: number) {
    if (userA === userB) throw new Error("Cannot create conversation with yourself");
    const conversationId = await this.repo.getOrCreateConversation(userA, userB);
    return { id: conversationId };
  }
}