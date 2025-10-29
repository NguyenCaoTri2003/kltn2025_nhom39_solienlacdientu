// import Navbar from "@/components/navbar";
// import CommunicationClientPage from "@/components/lecturer/communications/communication-client-page";

// export default async function CommunicationDetailPage() {
//   return (
//     <div className="h-[725px] bg-background flex flex-col">
//       <Navbar />
//       <CommunicationClientPage />
//     </div>
//   );
// }

"use client";

import { useParams } from "next/navigation";
import ChatWindow from "@/components/lecturer/communications/chat-window";
import { useCommunicationContext } from "@/context/message-provider";

export default function CommunicationDetailPage() {
  const params = useParams();
  const conversationId = Number(params.id);
  const { conversations, setConversations, myId } = useCommunicationContext();

  const selected = conversations.find((c) => c.id === conversationId) || null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatWindow
        selectedConversation={selected}
        setSelectedConversation={() => {}}
        conversations={conversations}
        setConversations={setConversations}
        myId={myId}
      />
    </div>
  );
}