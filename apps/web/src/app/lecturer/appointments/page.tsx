import AppointmentList from "@/components/lecturer/appointment/appointment-list"
import Navbar from "@/components/navbar"

export default async function AppointmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
         <AppointmentList />
      </div>
    </div>
  )
}