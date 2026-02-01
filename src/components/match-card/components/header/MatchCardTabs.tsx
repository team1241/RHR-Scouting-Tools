"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MatchPhaseTabsProps = {
  value: "auto" | "general";
  onChange: (value: "auto" | "general") => void;
};

const options = [
  { value: "general", label: "General" },
  { value: "auto", label: "Auto" },
] as const;

export default function MatchCardTabs({
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
