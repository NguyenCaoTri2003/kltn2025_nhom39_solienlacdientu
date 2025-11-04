import Navbar from "@/components/navbar";
import OfferingDetail from "@/components/portal/classes/offering-detail";

export default async function ClassDetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <OfferingDetail />
      </div>
    </div>
  );
}
