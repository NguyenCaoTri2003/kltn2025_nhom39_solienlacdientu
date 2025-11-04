import Navbar from "@/components/navbar";
import AttendanceList from "@/components/portal/attendance/attendance-list";

export default async function AttendancesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* <h1 className="text-3xl font-bold mb-6">Điểm danh học phần</h1> */}
        <AttendanceList />
      </div>
    </div>
  );
}

