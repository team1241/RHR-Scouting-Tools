'use client';

import { Event, TeamInMatch } from "@/lib/db/types";
import { createContext } from "react";

export const MatchCardContext = createContext<{
  year?: number;
  teamsInMatch?: {
    redAlliance?: TeamInMatch[],
    blueAlliance?: TeamInMatch[]
  };
  events?: Event[];
}>({ year: undefined, teamsInMatch: undefined, events: undefined });
