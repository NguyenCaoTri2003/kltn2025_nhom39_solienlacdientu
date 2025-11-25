import { GoogleGenAI } from '@google/genai';
import { authenticate } from '@packages/utils/auth';
import fs from "fs";
import path from "path";

import { NextRequest, NextResponse } from 'next/server'; 

const chatSessions = new Map(); 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const guidePath = path.join(
  process.cwd(), 
  "src", 
  "app", 
  "data", 
  "ai-guide.txt"
);
const SYSTEM_INSTRUCTION = fs.readFileSync(guidePath, "utf-8");

export async function POST(req: NextRequest) {
  let userPayload;
  console.log("Received chat request");
  try {
    userPayload = await authenticate(req); 
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = String(userPayload.id); 
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Thiếu message" }, { status: 400 });
  }
  
  try {
    let chat = chatSessions.get(userId);
    
    if (!chat) {
      chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + `\n Bạn hiện đang trò chuyện với một người dùng có vai trò là: ${userPayload.role}.`,
        },
      });
      chatSessions.set(userId, chat);
    }

    const response = await chat.sendMessage({ message });

    return NextResponse.json({ text: response.text });

  } catch (error) {
    console.error("Lỗi Gemini API:", error);
    return NextResponse.json({ error: "Lỗi nội bộ server khi xử lý chat" }, { status: 500 });
  }
}