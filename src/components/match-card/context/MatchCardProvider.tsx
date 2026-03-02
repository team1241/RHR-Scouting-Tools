"use client";

import { ReactNode } from "react";
import { Event, TeamInMatch } from "@/lib/db/types";
import { MatchCardContext } from "@/components/match-card/context/MatchCardContext";

type MatchCardProviderProps = {
  value: {
    year?: number;
    teamsInMatch?: {
      redAlliance?: TeamInMatch[];
      blueAlliance?: TeamInMatch[];
    };
    events?: Event[];
  };
  children: ReactNode;
};

export default function MatchCardProvider({
  value,
  children,
}: MatchCardProviderProps) {
  return (
    <MatchCardContext.Provider value={value}>{children}</MatchCardContext.Provider>
  );
}
