import Navbar from "@/components/navbar";
import AttendanceSummary from "@/components/lecturer/attendance/attendance-summary";

export default async function AttendancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Danh sách điểm danh</h1>
          <p className="text-muted-foreground">Danh sách điểm danh chi tiết theo lớp học phần</p>
        </div>

        <AttendanceSummary />
      </div>
    </div>
  );
}
