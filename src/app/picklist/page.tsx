import Picklist from "@/components/picklist/Picklist";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Picklist",
};

export default function PicklistPage() {
  return (
    <Suspense fallback={null}>
      <Picklist />
    </Suspense>
  );
}
