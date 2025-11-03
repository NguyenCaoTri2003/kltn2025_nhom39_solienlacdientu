import Navbar from "@/components/navbar"
import ScheduleDetail from "@/components/portal/schedule/schedule-detail"

export default async function SchedulePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <ScheduleDetail />
      </div>
    </div>
  )
}