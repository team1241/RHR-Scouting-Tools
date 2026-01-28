"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MatchPhaseTabsProps = {
  value: "auto" | "teleop";
  onChange: (value: "auto" | "teleop") => void;
};

const options = [
  { value: "auto", label: "Auto" },
  { value: "teleop", label: "Teleop" },
] as const;

export default function MatchPhaseTabs({
  value,
  onChange,
}: MatchPhaseTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) =>
        onChange(nextValue as MatchPhaseTabsProps["value"])
      }
      className="w-fit"
    >
      <TabsList
        variant="line"
        className="flex flex-wrap gap-2"
        aria-label="Match phase"
      >
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
