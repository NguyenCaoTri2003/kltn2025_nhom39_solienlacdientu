import Navbar from "@/components/navbar";
import Dashboard from "@/components/portal/dashboard/dashboard-detail";

export default function PortalPage() {
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
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
