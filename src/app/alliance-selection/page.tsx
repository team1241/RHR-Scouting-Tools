import AllianceSelection from "@/components/alliance-selection/AllianceSelection";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Alliance Selection",
};

export default function AllianceSelectionPage() {
  return (
    <Suspense fallback={null}>
      <AllianceSelection />
    </Suspense>
  );
}
