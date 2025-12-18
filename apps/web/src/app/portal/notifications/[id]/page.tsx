import NotificationDetail from "@/components/notification/NotificationDetail";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";

export default async function NotificationDetailPage() {
  return (
    <>
      <Navbar />
      <NotificationDetail />
    </>
  );
}
