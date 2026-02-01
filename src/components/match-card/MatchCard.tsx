"use client";

import { useMemo, useState } from "react";
import Hero from "@/components/common/Hero";
import MatchCardTabs from "@/components/match-card/components/header/MatchCardTabs";
import AutoMatchCard from "@/components/match-card/components/auto/AutoMatchCard";
import GeneralMatchCard from "@/components/match-card/components/general/GeneralMatchCard";
import MatchCardHeader from "@/components/match-card/components/header/MatchCardHeader";
import { Card } from "@/components/ui/card";

type AllianceTeam = {
  number: number;
  name: string;
};

const TEAM_POOL = [
  33, 67, 118, 125, 148, 167, 171, 195, 217, 233, 254, 359, 441, 469, 494, 610,
  716, 971, 1258, 1318, 1477, 1678, 2056, 2337, 2468, 2549, 2992, 3476, 3847,
  4911, 5436, 6328, 6940, 7056, 8708,
];

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

function generateAllianceTeams(
  eventId: string,
  matchNumber: number,
  alliance: "red" | "blue",
) {
  const seed = hashSeed(`${eventId}-${matchNumber}-${alliance}`) || 1;
  const used = new Set<number>();
  const teams: AllianceTeam[] = [];
  let cursor = seed;

  while (teams.length < 3) {
    cursor = (cursor * 48271) % 2147483647;
    const index = cursor % TEAM_POOL.length;
    const teamNumber = TEAM_POOL[index];
    if (used.has(teamNumber)) continue;
    used.add(teamNumber);
    teams.push({
      number: teamNumber,
      name: `Team ${teamNumber}`,
    });
  }

  return teams;
}

export default function MatchCard() {
  const [phase, setPhase] = useState<"auto" | "general">("general");
  const [eventId, setEventId] = useState("2026miket");
  const [matchNumber, setMatchNumber] = useState("1");

  const parsedMatchNumber = Number.parseInt(matchNumber, 10) || 1;
  const [redAlliance, blueAlliance] = useMemo(
    () => [
      generateAllianceTeams(
        eventId.trim() || "event",
        parsedMatchNumber,
        "red",
      ),
      generateAllianceTeams(
        eventId.trim() || "event",
        parsedMatchNumber,
        "blue",
      ),
    ],
    [eventId, parsedMatchNumber],
  );

  const redMediaTeams = useMemo(
    () =>
      redAlliance.map((team) => ({
        teamNumber: team.number,
        teamName: team.name,
        imageUrl: null,
      })),
    [redAlliance],
  );
  const blueMediaTeams = useMemo(
    () =>
      blueAlliance.map((team) => ({
        teamNumber: team.number,
        teamName: team.name,
        imageUrl: null,
      })),
    [blueAlliance],
  );

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
          eventId={eventId}
          matchNumber={matchNumber}
          onEventIdChange={setEventId}
          onMatchNumberChange={setMatchNumber}
          redAlliance={redAlliance}
          blueAlliance={blueAlliance}
          redMediaTeams={redMediaTeams}
          blueMediaTeams={blueMediaTeams}
        />
        {phase === "auto" ? (
          <AutoMatchCard
            redAlliance={redAlliance}
            blueAlliance={blueAlliance}
          />
        ) : (
          <GeneralMatchCard />
        )}
      </Card>
    </div>
  );
}
