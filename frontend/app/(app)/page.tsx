import HomePageClient from "./HomePageClient";
import { getInitialHomeFeed } from "@/lib/server/api";

export default async function HomePage() {
  const initialFeed = await getInitialHomeFeed();

  return <HomePageClient initialFeed={initialFeed} />;
}
