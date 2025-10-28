import NotificationDetail from "@/components/notification/NotificationDetail";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";

interface NotificationDetailPageProps {
  params: {
    id: string;
  };
}

export default function NotificationDetailPage({ params }: NotificationDetailPageProps) {
  return (
    <>
      <Navbar />
      <NotificationDetail notificationId={params.id} />
    </>
  );
}
