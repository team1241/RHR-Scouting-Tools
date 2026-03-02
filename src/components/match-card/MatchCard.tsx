"use client";

import { useState } from "react";
import Hero from "@/components/common/Hero";
import MatchCardTabs from "@/components/match-card/components/header/MatchCardTabs";
import AutoMatchCard from "@/components/match-card/components/auto/AutoMatchCard";
import GeneralMatchCard from "@/components/match-card/components/general/GeneralMatchCard";
import MatchCardHeader from "@/components/match-card/components/header/MatchCardHeader";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MatchCard() {
  const [phase, setPhase] = useState<"auto" | "general">("general");
  const [isUpdating, setIsUpdating] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4 min-h-screen pb-12 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Hero text="Match Card" />
        <div className="flex flex-wrap items-center gap-3">
          <MatchCardTabs value={phase} onChange={setPhase} />
        </div>
      </div>
      <Card className="relative flex w-full flex-col gap-4 rounded-xl bg-white/80 p-4 shadow-sm">
        <MatchCardHeader onPendingChange={setIsUpdating} />
        <div
          className={cn(
            "transition-opacity duration-200",
            isUpdating && "pointer-events-none opacity-50"
          )}
          aria-busy={isUpdating}
          aria-live="polite"
        >
          {phase === "auto" ? <AutoMatchCard /> : <GeneralMatchCard />}
        </div>
        {isUpdating ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/35 backdrop-blur-[1px]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
