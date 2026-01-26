"use client";

import { useState } from "react";
import Hero from "@/components/common/Hero";
import MatchPhaseTabs from "@/components/match-card/components/MatchPhaseTabs";

export default function MatchCard() {
  const [phase, setPhase] = useState<"auto" | "teleop">("auto");

  return (
    <div className="flex w-full flex-col gap-4 min-h-screen pb-12 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Hero text="Match Card" />
        <MatchPhaseTabs value={phase} onChange={setPhase} />
      </div>
    </div>
  );
}
