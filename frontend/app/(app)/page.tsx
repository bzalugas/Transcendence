import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { getInitialHomeFeed } from "@/lib/server/api";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Your personalized 42 Connect feed with updates from joined student channels.",
};

export default async function HomePage() {
  const initialFeed = await getInitialHomeFeed();

  return <HomePageClient initialFeed={initialFeed} />;
}
