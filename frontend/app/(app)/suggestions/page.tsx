import type { Metadata } from "next";
import SuggestionsPageClient from "./SuggestionsPageClient";
import { getInitialSuggestions } from "@/lib/server/api";

export const metadata: Metadata = {
  title: "Suggestions",
  description:
    "Discover classmates with shared interests and manage friend requests on 42 Connect.",
};

export default async function SuggestionsPage() {
  const initialSuggestions = await getInitialSuggestions();

  return <SuggestionsPageClient initialSuggestions={initialSuggestions} />;
}
