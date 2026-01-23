"use client";

import { useRef } from "react";
import Hero from "@/components/Hero";
import StatsPanel from "@/components/ball-counter/components/StatsPanel";
import VideoPanel from "@/components/ball-counter/components/VideoPanel";
import useGlobalShortcuts from "@/components/ball-counter/hooks/useGlobalShortcuts";
import usePlaybackControls from "@/components/ball-counter/hooks/usePlaybackControls";
import useShotTracking from "@/components/ball-counter/hooks/useShotTracking";
import useVideoKeyHandler from "@/components/ball-counter/hooks/useVideoKeyHandler";
import useVideoSource from "@/components/ball-counter/hooks/useVideoSource";
import useYouTubePlayer from "@/components/ball-counter/hooks/useYouTubePlayer";
import { calculateAverageBps } from "@/components/ball-counter/utils/cycleStats";
import { pickCycleTagColor } from "@/components/ball-counter/utils/cycleTags";

export default function BallCounterApp() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    error,
    loadedUrl,
    loadedVideoLabel,
    loadedVideoUrl,
    loadFromFile,
    loadFromUrl,
    handleSourceChange,
    handleVideoUrlChange,
    selectedSource,
    sourceType,
    videoUrl,
    youtubeId,
  } = useVideoSource();

  const isYouTube = sourceType === "youtube";
  const isHtml5 = sourceType === "html5";

  const { youtubeContainerRef, youtubePlayerRef } = useYouTubePlayer({
    isYouTube,
    youtubeId,
  });

  const { getCurrentTime, jumpSeconds, stepFrame } = usePlaybackControls({
    isHtml5,
    isYouTube,
    videoRef,
    youtubePlayerRef,
  });

  const {
    activeCycleStart,
    clearAll,
    cycles,
    endCycle,
    markShot,
    marks,
    removeCycle,
    removeMark,
    setShotType,
    shotType,
    startCycle,
    undoLastMark,
  } = useShotTracking({ getCurrentTime, pickCycleTagColor });

  useGlobalShortcuts({
    isHtml5,
    isYouTube,
    jumpSeconds,
    markShot,
    endCycle,
    setShotType,
    startCycle,
    stepFrame,
    undoLastMark,
    videoRef,
  });

  const handleVideoKeyDown = useVideoKeyHandler({
    isHtml5,
    videoRef,
    jumpSeconds,
    stepFrame,
    undoLastMark,
    startCycle,
    endCycle,
    markShot,
    setShotType,
  });

  const averageBps = calculateAverageBps(cycles, marks);

  const handleLoad = () => {
    if (loadFromUrl()) {
      clearAll();
    }
  };

  const handleLocalFileSelect = (file: File | null) => {
    if (loadFromFile(file)) {
      clearAll();
    }
  };

  return (
    <div className="min-h-screen pb-12 pt-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <Hero />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <VideoPanel
            isHtml5={isHtml5}
            isYouTube={isYouTube}
            videoUrl={videoUrl}
            selectedSource={selectedSource}
            onSourceChange={handleSourceChange}
            onVideoUrlChange={handleVideoUrlChange}
            onLoad={handleLoad}
            onLocalFileSelect={handleLocalFileSelect}
            localVideoLabel={loadedVideoLabel}
            error={error}
            loadedUrl={loadedUrl}
            onVideoKeyDown={handleVideoKeyDown}
            videoRef={videoRef}
            youtubeContainerRef={youtubeContainerRef}
          />
          <StatsPanel
            marks={marks}
            averageBps={averageBps}
            cycles={cycles}
            activeCycleStart={activeCycleStart}
            videoUrl={loadedVideoUrl}
            shotType={shotType}
            onShotTypeChange={setShotType}
            onClearMarks={clearAll}
            onRemoveMark={removeMark}
            onStartCycle={startCycle}
            onEndCycle={endCycle}
            onRemoveCycle={removeCycle}
          />
        </div>
      </div>
    </div>
  );
}
