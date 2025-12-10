import ChangePassword from "@/components/profile/change-password";
import Navbar from "@/components/navbar";

export default function Page() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />
      <div className="flex-1 p-0 max-w-6xl mx-auto w-full">
        <ChangePassword />
      </div>
    </div>
  );
}


