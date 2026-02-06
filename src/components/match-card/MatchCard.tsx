"use client";

import { useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import Hero from "@/components/common/Hero";
import MatchCardTabs from "@/components/match-card/components/header/MatchCardTabs";
import AutoMatchCard from "@/components/match-card/components/auto/AutoMatchCard";
import GeneralMatchCard from "@/components/match-card/components/general/GeneralMatchCard";
import MatchCardHeader from "@/components/match-card/components/header/MatchCardHeader";
import { Card } from "@/components/ui/card";

export default function MatchCard() {
  const [phase, setPhase] = useState<"auto" | "general">("general");
  const [eventId, setEventId] = useQueryState("eventId", parseAsString);
  const [matchNumber, setMatchNumber] = useQueryState(
    "matchNumber",
    parseAsString,
  );
  const eventIdValue = eventId ?? "";
  const matchNumberValue = matchNumber ?? "";

  return (
    <div className="flex w-full flex-col gap-4 min-h-screen pb-12 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Hero text="Match Card" />
        <div className="flex flex-wrap items-center gap-3">
          <MatchCardTabs value={phase} onChange={setPhase} />
        </div>
      </div>
      <Card className="flex w-full flex-col gap-4 rounded-xl bg-white/80 p-4 shadow-sm">
        <MatchCardHeader
          eventId={eventIdValue}
          matchNumber={matchNumberValue}
          onEventIdChange={(nextValue) => setEventId(nextValue || null)}
          onMatchNumberChange={(nextValue) => setMatchNumber(nextValue || null)}
        />
        {phase === "auto" ? (
          <AutoMatchCard />
        ) : (
          <GeneralMatchCard eventId={eventId} matchNumber={matchNumber} />
        )}
      </Card>
    </div>
  );
}
