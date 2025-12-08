"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import Image from "next/image";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tin nhắn mở đầu
  useEffect(() => {
    setMessages([
      {
        role: "bot",
        text: "Xin chào, tôi là trợ lý Sổ Liên Lạc. Tôi có thể giúp gì cho bạn?"
      }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    setBotTyping(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "bot", text: data.text }]);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "Lỗi server, thử lại sau" }]);
    } finally {
      setLoading(false);
      setBotTyping(false);
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer fixed bottom-5 right-5 w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-[9999] transform transition-all duration-200 hover:scale-110 hover:shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #4FC3F7, #00CFFF)",
          padding: "8px",
        }}
      >
        <Image
          src="/smart-chatbot.png"
          alt="Chatbot"
          width={48}
          height={48}
          className="object-contain"
        />
        <span
          className="absolute w-20 h-20 rounded-full opacity-30 animate-ping"
          style={{ background: "radial-gradient(circle, #4FC3F7 0%, transparent 70%)" }}
        />
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 w-80 h-96 bg-white dark:bg-gray-900 text-black dark:text-white shadow-xl rounded-lg border dark:border-gray-700 flex flex-col overflow-hidden z-[9999]">
          
          {/* Header */}
          <div className="bg-[#4FC3F7] dark:bg-[#2196F3] text-white p-3 font-semibold flex justify-between items-center rounded-t-lg">
            <span>Trợ lý Sổ Liên Lạc Điện Tử</span>
            <button onClick={() => setOpen(false)} className="text-lg cursor-pointer">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`
                    px-4 py-2 rounded-lg max-w-[75%] break-words text-[0.95rem]
                    ${m.role === "user"
                      ? "bg-blue-500 text-white dark:bg-blue-600"
                      : "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                    }
                  `}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Bot đang gõ */}
            {botTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-lg max-w-[75%] bg-gray-200 dark:bg-gray-700 text-black dark:text-white flex gap-1 font-bold">
                  <span className="dot dot-1">.</span>
                  <span className="dot dot-2">.</span>
                  <span className="dot dot-3">.</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-900">
            <input
              className="flex-1 border rounded px-3 py-2 text-base bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`cursor-pointer p-2 rounded text-white flex items-center justify-center 
                ${loading
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                }
              `}
            >
              <Send size={18} className="stroke-white" />
            </button>
          </div>
        </div>
      )}

      {/* Animation */}
      <style jsx>{`
        .dot {
          animation: blink 1.4s infinite both;
        }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }

        @keyframes blink {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
