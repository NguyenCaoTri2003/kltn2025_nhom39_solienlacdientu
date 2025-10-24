import { API_URL } from "../constants/config";
import { Message, Conversation } from "@packages/core/entities/Messages";
import { supabase } from "../lib/supabaseClient";
import HeicConverter from "react-native-heic-converter";
import * as ImageManipulator from "expo-image-manipulator";

function generateFileName(originalName: string) {
  const ext = originalName.split(".").pop();
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${unique}.${ext}`;
}

async function uriToUint8Array(uri: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", uri, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const arrayBuffer = xhr.response as ArrayBuffer;
        resolve(new Uint8Array(arrayBuffer));
      } else {
        reject(new Error(`Failed to load file: status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new TypeError("Network request failed"));
    xhr.send(null);
  });
}

export const messageService = {
  async getConversations(token: string): Promise<Conversation[]> {
    const res = await fetch(`${API_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  async getMessages(conversationId: number, token: string): Promise<Message[]> {
    const res = await fetch(`${API_URL}/api/messages?conversationId=${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  // async sendMessage(
  //   receiverId: number,
  //   content: string,
  //   token: string,
  //   type: "text" | "image" | "file" = "text",
  //   fileUri?: string,
  //   fileName?: string
  // ): Promise<Message> {
  //   let fileUrl = content;

  //   if ((type === "image" || type === "file") && fileUri) {
  //     let uploadExt = fileName?.split(".").pop()?.toLowerCase() || "bin";
  //     let uploadName = generateFileName(fileName || "upload.bin");
  //     let finalUri = fileUri;

  //     if (uploadExt === "heic") {
  //       const result = await HeicConverter.convert({ path: fileUri });
  //       if (result?.path) {
  //         finalUri = result.path;
  //         uploadExt = "jpg";
  //         uploadName = uploadName.replace(/\.heic$/i, ".jpg");
  //       }
  //     }

  //     const uint8 = await uriToUint8Array(finalUri);

  //     const { data, error } = await supabase.storage
  //       .from("chat-uploads")
  //       .upload(uploadName, uint8, {
  //         cacheControl: "3600",
  //         upsert: false,
  //       });

  //     if (error) throw error;

  //     const { data: publicUrl } = supabase.storage
  //       .from("chat-uploads")
  //       .getPublicUrl(data.path);

  //     fileUrl = publicUrl.publicUrl;
  //   }

  //   const res = await fetch(`${API_URL}/api/messages`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     },
  //     body: JSON.stringify({ receiverId, content: fileUrl, type }),
  //   });

  //   if (!res.ok) {
  //     const text = await res.text().catch(() => "");
  //     throw new Error("Failed to send message: " + text);
  //   }

  //   return res.json();
  // },

  async sendMessage(
    receiverId: number,
    content: string,
    token: string,
    type: "text" | "image" | "file" = "text",
    fileUri?: string,
    fileName?: string
  ): Promise<Message> {
    let fileUrl = content;

    if ((type === "image" || type === "file") && fileUri) {
      let uploadExt = fileName?.split(".").pop()?.toLowerCase() || "bin";
      let uploadName = generateFileName(fileName || "upload.bin");
      let finalUri = fileUri;

      // ✅ Chuyển HEIC sang JPEG bằng expo-image-manipulator
      if (uploadExt === "heic") {
        const manipulated = await ImageManipulator.manipulateAsync(
          fileUri,
          [],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
        finalUri = manipulated.uri;
        uploadExt = "jpg";
        uploadName = uploadName.replace(/\.heic$/i, ".jpg");
      }

      // ✅ Chuyển file thành Uint8Array để upload Supabase
      const uint8 = await uriToUint8Array(finalUri);

      const { data, error } = await supabase.storage
        .from("chat-uploads")
        .upload(uploadName, uint8, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("chat-uploads")
        .getPublicUrl(data.path);

      fileUrl = publicUrl.publicUrl;
    }

    // ✅ Gửi message qua API
    const res = await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiverId, content: fileUrl, type }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error("Failed to send message: " + text);
    }

    return res.json();
  },

  async markAsRead(conversationId: number, token: string) {
    await fetch(`${API_URL}/api/messages/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId }),
    });
  },

  async getUnreadCount(token: string): Promise<number> {
    const res = await fetch(`${API_URL}/api/messages/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.count || 0;
  },
};
