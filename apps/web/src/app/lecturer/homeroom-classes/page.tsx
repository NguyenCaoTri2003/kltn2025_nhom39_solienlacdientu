import Navbar from "@/components/navbar";
import HomeroomClassesList from "@/components/lecturer/homeroom-classes/homeroom-classes-list";

export default async function HomeroomClassesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý lớp chủ nhiệm</h1>
          <p className="text-muted-foreground">Danh sách lớp chủ nhiệm của giảng viên</p>
        </div>

        <HomeroomClassesList />
      </div>
    </div>
  );
}
