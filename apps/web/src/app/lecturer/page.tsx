import LecturerDashboard from "@/components/lecturer/dashboard/lecturer-dashboard";
import Navbar from "@/components/navbar";

export default function LecturerProfilePage() {
  return (
    <div
      className="min-h-screen flex flex-col relative bg-fixed bg-cover bg-center transition-all duration-700"
      style={{
        backgroundImage: "url('/backgroud.png')", 
      }}
    >
      <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm"></div>

      <div className="relative z-10 flex flex-col min-h-screen animate-fadeIn">
        <Navbar />

        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <LecturerDashboard />
        </main>
      </div>
    </div>
  );
}
