import MatchCard from "@/components/match-card/MatchCard";
import { EventResponse } from "@/lib/db/types";
import { getQueryClient } from "@/lib/queries/query-client";
import { QueryKeys } from "@/lib/queries/query-keys";
import { fetchScoutingApi } from "@/lib/scouting-api";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Card",
};

export default async function MatchCardPage() {
  const queryClient = getQueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: [QueryKeys.ActiveSeasonEvents],
      queryFn: async () => {
        const events = await fetchScoutingApi<EventResponse>("/events");
        return events;
      },
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MatchCard />
    </HydrationBoundary>
  );
}
