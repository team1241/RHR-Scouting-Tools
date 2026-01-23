type VideoSourceToggleProps = {
  value: "youtube" | "local";
  onChange: (value: "youtube" | "local") => void;
};

export default function VideoSourceToggle({
  value,
  onChange,
}: VideoSourceToggleProps) {
  const options = [
    { value: "youtube", label: "YouTube" },
    { value: "local", label: "Local" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer ${
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
