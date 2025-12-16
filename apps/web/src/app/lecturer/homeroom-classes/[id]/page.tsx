import Navbar from "@/components/navbar";
import ClassDetail from "@/components/lecturer/classes/class-detail";

export default async function HomeroomClassDetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <ClassDetail />
      </div>
    </div>
  );
}
