import EmptyState from "@/components/empty-state";
import { MessageSquare } from "lucide-react";


export default function CommunicationPage() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <EmptyState
        icon={<MessageSquare className="w-10 h-10" />}
        text="Chọn một cuộc trò chuyện để bắt đầu"
        className="py-1"
      />
    </div>
  );
}