import React, { createContext, useContext } from "react";
import { useConversations } from "../hooks/useMessages";
import { useAuth } from "../context/AuthContext";

const MessageContext = createContext<any>(null);

export const MessageProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();
  const convState = useConversations(token ?? undefined, user?.id);

  return (
    <MessageContext.Provider value={convState}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => useContext(MessageContext);
