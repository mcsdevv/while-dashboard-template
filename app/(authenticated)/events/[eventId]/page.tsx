import { EventDetail } from "@/components/events/event-detail";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;

  return <EventDetail eventId={decodeURIComponent(eventId)} />;
}
