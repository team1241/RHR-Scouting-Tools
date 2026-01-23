import {
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import KeyboardShortcuts from "./KeyboardShortcuts";
import VideoSourceInputs from "./VideoSourceInputs";
import VideoSourceToggle from "./VideoSourceToggle";

type VideoPanelProps = {
  isHtml5: boolean;
  isYouTube: boolean;
  videoUrl: string;
  selectedSource: "youtube" | "local";
  onSourceChange: (value: "youtube" | "local") => void;
  onVideoUrlChange: (value: string) => void;
  onLoad: () => void;
  onLocalFileSelect: (file: File | null) => void;
  localVideoLabel: string;
  error: string;
  loadedUrl: string;
  onVideoKeyDown: (event: ReactKeyboardEvent<HTMLVideoElement>) => void;
  videoRef: RefObject<HTMLVideoElement>;
  youtubeContainerRef: RefObject<HTMLDivElement>;
};

export default function VideoPanel({
  isHtml5,
  isYouTube,
  videoUrl,
  selectedSource,
  onSourceChange,
  onVideoUrlChange,
  onLoad,
  onLocalFileSelect,
  localVideoLabel,
  error,
  loadedUrl,
  onVideoKeyDown,
  videoRef,
  youtubeContainerRef,
}: VideoPanelProps) {
  return (
    <section className="flex flex-col gap-5 rounded-[28px] border border-border bg-surface/90 p-6">
      <div className="rounded-2xl bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xl font-semibold text-ink">Video Player</label>
          <VideoSourceToggle value={selectedSource} onChange={onSourceChange} />
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <VideoSourceInputs
            key={selectedSource}
            selectedSource={selectedSource}
            videoUrl={videoUrl}
            onVideoUrlChange={onVideoUrlChange}
            onLoad={onLoad}
            onLocalFileSelect={onLocalFileSelect}
            localVideoLabel={localVideoLabel}
          />
        </div>
        {error ? (
          <p className="mt-3 text-sm font-medium text-danger">{error}</p>
        ) : null}
      </div>

      <div className="relative aspect-video overflow-hidden rounded-2xl bg-video-bg">
        {isHtml5 && loadedUrl ? (
          <video
            ref={videoRef}
            key={loadedUrl}
            src={loadedUrl}
            controls
            preload="metadata"
            className="h-full w-full object-contain"
            onKeyDown={onVideoKeyDown}
            tabIndex={0}
          />
        ) : isYouTube ? (
          <div ref={youtubeContainerRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-video-text">
            Load a clip to start stepping through frames.
          </div>
        )}
      </div>

      <KeyboardShortcuts />
    </section>
  );
}
