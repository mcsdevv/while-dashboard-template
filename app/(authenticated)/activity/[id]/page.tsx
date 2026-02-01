import { SyncLogDetail } from "@/components/activity/sync-log-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <SyncLogDetail logId={id} />;
}
