import Navbar from "@/components/navbar";
import CommunicationPanel from "@/components/lecturer/communications/communication-panel";
import { CommunicationProvider } from "@/context/message-provider";

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommunicationProvider>
      <div className="h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 py-1 px-6 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full overflow-hidden">
            <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
                {/* LEFT: danh sách */}
                <CommunicationPanel />
                {/* RIGHT: vùng thay đổi */}
                <div className="flex-1 overflow-hidden">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommunicationProvider>
  );
}
