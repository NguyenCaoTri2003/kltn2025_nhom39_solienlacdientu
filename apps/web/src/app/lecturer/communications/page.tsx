import CommunicationPanel from "@/components/lecturer/communications/communication-panel" 
import Navbar from "@/components/navbar"

export default async function CommunicationPage() {
  return (
    <div className="h-[725px] bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CommunicationPanel />
      </div>
    </div>
  )
}