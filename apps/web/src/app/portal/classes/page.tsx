import Navbar from "@/components/navbar";
import OfferingsList from "@/components/student/classes/offering-list"; 

export default async function ClassesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <OfferingsList />
      </div>
    </div>
  );
}