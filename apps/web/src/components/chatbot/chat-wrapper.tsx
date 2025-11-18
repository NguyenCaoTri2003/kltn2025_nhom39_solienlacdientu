"use client";

import { usePathname } from "next/navigation";
import ChatWidget from "./chat-widget";

export default function ChatWrapper() {
  const pathname = usePathname();

  const hiddenPrefixes = [
    "/login",
    "/portal/login",
    "/lecturer/communications",
    "/portal/communications",
  ];

  const showChatWidget = !hiddenPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!showChatWidget) return null;

  return <ChatWidget />;
}