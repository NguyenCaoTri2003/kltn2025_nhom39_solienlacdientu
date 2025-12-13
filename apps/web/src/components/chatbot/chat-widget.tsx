"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Moon, Sun } from "lucide-react";
import Image from "next/image";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([
      {
        role: "bot",
        text: "Xin chào 👋 Tôi là Trợ lý Sổ liên lạc điện tử IUH. Tôi có thể giúp gì cho bạn?",
      },
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "bot", text: data.text }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Lỗi server, vui lòng thử lại sau" },
      ]);
    } finally {
      setLoading(false);
      setBotTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999] group">
        <div
          className={`
            absolute bottom-full right-0 translate-x-0 mb-3
            px-4 py-2 rounded-xl text-sm text-white
            bg-black/80 backdrop-blur
            opacity-0 scale-95 translate-y-2
            group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
            transition-all duration-300
            pointer-events-none shadow-xl whitespace-nowrap cursor-pointer
            dark:bg-gray-800/80 dark:text-gray-200
          `}
        >
          🤖 Xin chào, tôi là <b>Trợ lý Sổ liên lạc điện tử IUH</b>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center
            bg-gradient-to-br from-sky-400 via-cyan-400 to-blue-500
            shadow-xl hover:shadow-2xl
            transition-all duration-300 ease-out
            hover:scale-110 cursor-pointer
          `}
        >
          <Image
            src="/smart-chatbot.png"
            alt="Chatbot"
            width={40}
            height={40}
            className="transition-transform duration-300 group-hover:rotate-6"
          />

          <span className="absolute inset-0 rounded-full bg-sky-400 blur-xl opacity-40 animate-pulse -z-10" />
        </button>
      </div>

      {open && (
        <div
          className={`
            fixed bottom-24 right-6 w-80 h-[420px]
            bg-white dark:bg-gray-900
            text-black dark:text-white
            rounded-2xl shadow-2xl border dark:border-gray-700
            flex flex-col overflow-hidden z-[9999]
            animate-chat-open
          `}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white">
            <div className="font-semibold flex items-center gap-2">
              🤖 Trợ lý Sổ Liên Lạc Điện Tử IUH
            </div>
            <button
              onClick={() => setOpen(false)}
              className="hover:scale-110 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 px-3 py-4 space-y-3 overflow-y-auto scrollbar-hide">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`
                    max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed
                    animate-message
                    ${m.role === "user"
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-gray-200 dark:bg-gray-700 rounded-bl-md"
                    }
                  `}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {botTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 flex gap-1">
                  <span className="dot" />
                  <span className="dot delay-1" />
                  <span className="dot delay-2" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
              className={`
                flex-1 px-4 py-2 rounded-xl
                border dark:border-gray-600
                bg-white dark:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-500
                text-sm
              `}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                bg-blue-500 hover:bg-blue-600 text-white
                transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed
              `}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes chatOpen {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-chat-open {
          animation: chatOpen 0.25s ease-out;
        }

        @keyframes message {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-message {
          animation: message 0.2s ease-out;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0;
          animation: blink 1.4s infinite both;
        }

        .delay-1 {
          animation-delay: 0.2s;
        }
        .delay-2 {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0%,
          80%,
          100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
