import type { Metadata } from "next";
import ProfilePageClient from "./ProfilePageClient";
import { getInitialProfile } from "@/lib/server/api";
import { absoluteUrl } from "@/lib/seo";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const initialProfile = await getInitialProfile(username);
  const user = initialProfile.viewedUser;
  const displayName = user?.username ?? decodeURIComponent(username);
  const description =
    user?.bio?.trim() ||
    `View ${displayName}'s profile, interests, friends, and student activity on 42 Connect.`;

  return {
    title: `${displayName}'s Profile`,
    description,
    alternates: {
      canonical: absoluteUrl(`/profile/${encodeURIComponent(username)}`),
    },
    openGraph: {
      title: `${displayName}'s Profile | 42 Connect`,
      description,
      url: absoluteUrl(`/profile/${encodeURIComponent(username)}`),
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const initialProfile = await getInitialProfile(username);

  return <ProfilePageClient username={username} initialProfile={initialProfile} />;
}
