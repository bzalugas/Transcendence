import ProfilePageClient from "./ProfilePageClient";
import { getInitialProfile } from "@/lib/server/api";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const initialProfile = await getInitialProfile(username);

  return <ProfilePageClient username={username} initialProfile={initialProfile} />;
}
