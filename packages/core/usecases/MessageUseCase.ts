import { MessageRepository } from "@packages/data/repositories/MessageRepository";
import { supabase } from "@packages/data/supabaseClient";

export class MessageUseCase {
  constructor(private repo: MessageRepository) {}

  async sendMessage(sender: any, receiverId: number | null, content: string) {
    // if (sender.role === "admin") {
    //   if (!receiverId) {
    //     return this.repo.createMessage({
    //       sender_id: sender.id,
    //       receiver_id: null,
    //       content,
    //       channel: "chat",
    //     });
    //   }
    //   throw new Error("Admin chỉ được gửi broadcast, không gửi cá nhân");
    // }

    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", receiverId)
      .maybeSingle();

    if (receiverError) throw receiverError;
    if (!receiver) throw new Error("Receiver not found");

    if (sender.role === "lecturer" && receiver.role === "student") {
      const { data: offerings } = await supabase
        .from("course_offerings")
        .select("id")
        .eq("lecturer_id", sender.id);

      const offeringIds = offerings?.map(o => o.id) || [];

      const { data: enrollment } = await supabase
        .from("enrollment")
        .select("id")
        .eq("student_id", receiver.id)
        .in("offering_id", offeringIds);

      if (!enrollment || enrollment.length === 0)
        throw new Error("Không cùng lớp, không được nhắn");
    }

    if (sender.role === "lecturer" && receiver.role === "parent") {
      const { data: children } = await supabase
        .from("student_parent")
        .select("student_id")
        .eq("parent_id", receiver.id);

      const childIds = children?.map(c => c.student_id) || [];

      if (childIds.length === 0)
        throw new Error("Phụ huynh không có con trong hệ thống");

      const { data: offerings } = await supabase
        .from("course_offerings")
        .select("id")
        .eq("lecturer_id", sender.id);

      const offeringIds = offerings?.map(o => o.id) || [];

      const { data: teaches } = await supabase
        .from("enrollment")
        .select("id")
        .in("student_id", childIds)
        .in("offering_id", offeringIds);

      if (!teaches || teaches.length === 0)
        throw new Error("Giảng viên không dạy con của phụ huynh này");
    }

    if (sender.role === "parent" && receiver.role === "lecturer") {
      const { data: children } = await supabase
        .from("student_parent")
        .select("student_id")
        .eq("parent_id", sender.id);

      const childIds = children?.map(c => c.student_id) || [];

      const { data: offerings } = await supabase
        .from("course_offerings")
        .select("id")
        .eq("lecturer_id", receiver.id);

      const offeringIds = offerings?.map(o => o.id) || [];

      const { data: teaches } = await supabase
        .from("enrollment")
        .select("id")
        .in("student_id", childIds)
        .in("offering_id", offeringIds);

      if (!teaches || teaches.length === 0)
        throw new Error("Không phải giảng viên của con bạn");
    }

    if (sender.role === "student" && receiver.role === "lecturer") {
      const { data: offerings } = await supabase
        .from("course_offerings")
        .select("id")
        .eq("lecturer_id", receiver.id);

      const offeringIds = offerings?.map(o => o.id) || [];

      const { data: enrollment } = await supabase
        .from("enrollment")
        .select("id")
        .eq("student_id", sender.id)
        .in("offering_id", offeringIds);

      if (!enrollment || enrollment.length === 0)
        throw new Error("Không được nhắn giảng viên không dạy mình");
    }

    if (
      (sender.role === "student" && receiver.role === "student") ||
      (sender.role === "parent" && receiver.role === "parent")
    ) {
      throw new Error("Không được nhắn tin riêng ngoài phạm vi");
    }

    return this.repo.createMessage({
      sender_id: sender.id,
      receiver_id: receiverId,
      content,
      channel: "chat",
    });
  }

  async getConversation(user: any, otherUserId: number) {
    return this.repo.getConversation(user.id, otherUserId);
  }

  async getInbox(user: any) {
    return this.repo.getInbox(user.id);
  }
}
