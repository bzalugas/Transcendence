import type { Metadata } from "next";
import ChannelPageClient from "./ChannelPageClient";
import { getInitialChannel } from "@/lib/server/api";
import { absoluteUrl } from "@/lib/seo";

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ChannelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { channel } = await getInitialChannel(slug);
  const channelName = channel?.label ?? decodeURIComponent(slug);
  const description =
    channel?.description ||
    `Follow the ${channelName} channel on 42 Connect and join student discussions.`;

  return {
    title: `${channelName} Channel`,
    description,
    alternates: {
      canonical: absoluteUrl(`/channels/${encodeURIComponent(slug)}`),
    },
    openGraph: {
      title: `${channelName} Channel | 42 Connect`,
      description,
      url: absoluteUrl(`/channels/${encodeURIComponent(slug)}`),
    },
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { slug } = await params;
  const initialChannel = await getInitialChannel(slug);

  return <ChannelPageClient slug={slug} initialChannel={initialChannel} />;
}
