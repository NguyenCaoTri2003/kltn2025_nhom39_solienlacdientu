import Navbar from "@/components/navbar";
import React from "react";

// Admin layout: adds left margin to accommodate the fixed vertical sidebar (md:ml-60)
// Mobile: sidebar becomes top bar so no margin on small screens.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed sidebar / topbar */}
      <Navbar />
      {/* Content area with left offset on md+, flex column to allow full-height sections */}
      <div className="md:ml-60">
        <main className="min-h-[calc(100vh-4rem)] flex flex-col p-4 md:p-8">
          <div className="flex-1 flex flex-col items-center w-full">
            <div className="w-full max-w-8xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
