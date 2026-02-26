import type { RefObject } from "react";
import { DEFAULT_FPS } from "@/components/ball-counter/constants";
import type { YouTubePlayer } from "./useYouTubePlayer";

type UsePlaybackControlsOptions = {
  isHtml5: boolean;
  isYouTube: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  youtubePlayerRef: RefObject<YouTubePlayer | null>;
};

export default function usePlaybackControls({
  isHtml5,
  isYouTube,
  videoRef,
  youtubePlayerRef,
}: UsePlaybackControlsOptions) {
  const getCurrentTime = () => {
    if (isYouTube && youtubePlayerRef.current) {
      return youtubePlayerRef.current.getCurrentTime();
    }
    if (isHtml5 && videoRef.current) {
      return videoRef.current.currentTime;
    }
    return null;
  };

  const stepFrame = (direction: number) => {
    if (isHtml5) {
      const video = videoRef.current;
      if (!video) return;
      const step = 1 / Math.max(1, DEFAULT_FPS);
      video.pause();
      video.currentTime = Math.max(0, video.currentTime + step * direction);
      return;
    }
    if (isYouTube && youtubePlayerRef.current) {
      const current = youtubePlayerRef.current.getCurrentTime();
      const step = 1 / DEFAULT_FPS;
      youtubePlayerRef.current.pauseVideo();
      youtubePlayerRef.current.seekTo(
        Math.max(0, current + step * direction),
        false,
      );
    }
  };

  const jumpSeconds = (delta: number) => {
    if (isYouTube && youtubePlayerRef.current) {
      const current = youtubePlayerRef.current.getCurrentTime();
      youtubePlayerRef.current.seekTo(Math.max(0, current + delta), true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime + delta);
  };

  return { getCurrentTime, jumpSeconds, stepFrame };
}
