import SuggestionsPageClient from "./SuggestionsPageClient";
import { getInitialSuggestions } from "@/lib/server/api";

export default async function SuggestionsPage() {
  const initialSuggestions = await getInitialSuggestions();

  return <SuggestionsPageClient initialSuggestions={initialSuggestions} />;
}
