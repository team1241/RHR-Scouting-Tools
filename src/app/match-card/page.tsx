import MatchCard from "@/components/match-card/MatchCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Card",
};

export default function MatchCardPage() {
  return <MatchCard />;
}
