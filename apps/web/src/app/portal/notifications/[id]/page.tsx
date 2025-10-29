import NotificationDetail from "@/components/notification/NotificationDetail";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";

interface NotificationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NotificationDetailPage({ params }: NotificationDetailPageProps) {
  const resolvedParams = await params;
  return (
    <>
      <Navbar />
      <NotificationDetail notificationId={resolvedParams.id} />
    </>
  );
}
