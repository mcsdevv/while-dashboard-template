import { WebhookLogDetail } from "@/components/webhooks/webhook-log-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <WebhookLogDetail logId={id} />;
}
