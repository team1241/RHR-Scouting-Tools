"use client";

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
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Match phase">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              isActive
                ? "border-accent bg-accent text-surface"
                : "border-border bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
