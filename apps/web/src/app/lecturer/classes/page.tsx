import Navbar from "@/components/navbar";
import OfferingsList from "@/components/lecturer/classes/offerings-list";

export default async function ClassesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý lớp học</h1>
          <p className="text-muted-foreground">Điểm danh, theo dõi và đánh giá sinh viên</p>
        </div>

        {/* Client component */}
        <OfferingsList />
      </div>
    </div>
  );
}
