type VideoSourceInputsProps = {
  selectedSource: "youtube" | "local";
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  onLoad: () => void;
  onLocalFileSelect: (file: File | null) => void;
  localVideoLabel: string;
};

export default function VideoSourceInputs({
  selectedSource,
  videoUrl,
  onVideoUrlChange,
  onLoad,
  onLocalFileSelect,
  localVideoLabel,
}: VideoSourceInputsProps) {
  if (selectedSource === "local") {
    return (
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center w-full">
        <input
          type="file"
          accept="video/*"
          className="w-full rounded-2xl border border-dashed border-border bg-surface-soft px-4 py-1.5 text-sm text-ink file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-surface cursor-pointer"
          onChange={(event) =>
            onLocalFileSelect(event.target.files?.[0] ?? null)
          }
        />
        {localVideoLabel ? (
          <span className="text-xs text-ink-muted lg:whitespace-nowrap">
            Loaded: {localVideoLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <input
        type="url"
        className="w-full rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none lg:flex-1"
        placeholder="Paste a YouTube link"
        value={videoUrl}
        onChange={(event) => onVideoUrlChange(event.target.value)}
      />
      <button
        type="button"
        onClick={onLoad}
        className="rounded-full bg-linear-to-br from-accent-strong to-accent px-5 py-2 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-w-fit"
      >
        Load video
      </button>
    </div>
  );
}
