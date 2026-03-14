import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}: VideoSourceInputsProps) {
  if (selectedSource === "local") {
    return (
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center w-full">
        <Input
          type="file"
          accept="video/*"
          onChange={(event) =>
            onLocalFileSelect(event.target.files?.[0] ?? null)
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <Input
        type="url"
        placeholder="Paste a YouTube video or live link"
        value={videoUrl}
        onChange={(event) => onVideoUrlChange(event.target.value)}
      />
      <Button type="button" onClick={onLoad} className="py-2 font-semibold">
        Load source
      </Button>
    </div>
  );
}
