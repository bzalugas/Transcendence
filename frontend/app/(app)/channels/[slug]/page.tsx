import ChannelPageClient from "./ChannelPageClient";
import { getInitialChannel } from "@/lib/server/api";

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { slug } = await params;
  const initialChannel = await getInitialChannel(slug);

  return <ChannelPageClient slug={slug} initialChannel={initialChannel} />;
}
