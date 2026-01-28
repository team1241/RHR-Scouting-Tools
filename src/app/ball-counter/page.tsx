import BallCounterApp from "@/components/ball-counter/BallCounter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ball Counter",
};

export default function BallCounter() {
  return <BallCounterApp />;
}
