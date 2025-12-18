import Navbar from "@/components/navbar";
import LecturerWeeklySchedule from "@/components/lecturer/schedule/lecturer-weekly-schedule";

export default function LecturerSchedulePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <LecturerWeeklySchedule />
      </div>
    </div>
  );
}


