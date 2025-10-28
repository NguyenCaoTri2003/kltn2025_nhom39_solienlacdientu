import NotificationList from "@/components/notification/NotificationList";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <>
      <Navbar />
      <NotificationList />
    </>
  );
}