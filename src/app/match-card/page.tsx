import { loadMatchCardParams } from "@/app/match-card/search-params";
import MatchCardProvider from "@/components/match-card/context/MatchCardProvider";
import MatchCard from "@/components/match-card/MatchCard";
import { EventResponse, TeamsInMatchResponse } from "@/lib/db/types";
import { fetchScoutingApi } from "@/lib/scouting-api";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Card",
};

export default async function MatchCardPage({
  searchParams,
}: PageProps<"/match-card">) {
  const { eventId, matchNumber } = await loadMatchCardParams(searchParams);
  const params = new URLSearchParams();
  params.set("eventId", eventId);
  params.set("matchNumber", matchNumber);

  let teamsData;
  const eventData = await fetchScoutingApi<EventResponse>("/events");
  try {
    teamsData = await fetchScoutingApi<TeamsInMatchResponse>(
      "/teams?" + params.toString()
    );
  } catch (error) {}
  return (
    <MatchCardProvider
      value={{
        year: eventData?.year,
        events: eventData?.events,
        teamsInMatch: {
          redAlliance: teamsData?.redAlliance,
          blueAlliance: teamsData?.blueAlliance,
        },
      }}
    >
      <MatchCard />
    </MatchCardProvider>
  );
}
