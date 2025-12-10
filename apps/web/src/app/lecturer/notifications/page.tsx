import NotificationList from "@/components/notification/NotificationList";
import Navbar from "@/components/navbar";

export default function NotificationsPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <NotificationList />
      </div>
    </div>
  );
}
