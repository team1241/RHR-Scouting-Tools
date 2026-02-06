import MatchCard from "@/components/match-card/MatchCard";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Match Card",
};

export default function MatchCardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <MatchCard />
    </Suspense>
  );
}
