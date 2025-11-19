import Navbar from "@/components/navbar"
import TuitionFeesList from "@/components/portal/tuition-fee/tuition-fees-list"

export default async function SchedulePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-8xl mx-auto w-full">
        <TuitionFeesList />
      </div>
    </div>
  )
}