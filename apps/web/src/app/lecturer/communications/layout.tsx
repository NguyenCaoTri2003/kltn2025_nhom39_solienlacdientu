import Navbar from "@/components/navbar";
import CommunicationPanel from "@/components/lecturer/communications/communication-panel";
import { CommunicationProvider } from "@/context/message-provider";

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommunicationProvider>
      <div className="h-[725px] bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: danh sách */}
          <CommunicationPanel />
          {/* RIGHT: vùng thay đổi */}
          {children}
        </div>
      </div>
    </CommunicationProvider>
  );
}