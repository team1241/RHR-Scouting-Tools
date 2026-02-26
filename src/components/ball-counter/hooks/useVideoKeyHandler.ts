import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import type { ShotType } from "@/components/ball-counter/types";
import { isMarkShotKey } from "@/components/ball-counter/utils/shotKeys";

type UseVideoKeyHandlerOptions = {
  isHtml5: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  jumpSeconds: (delta: number) => void;
  stepFrame: (direction: number) => void;
  undoLastMark: () => void;
  startCycle: () => void;
  endCycle: () => void;
  markShot: () => void;
  setShotType: (shotType: ShotType) => void;
};

export default function useVideoKeyHandler({
  isHtml5,
  videoRef,
  jumpSeconds,
  stepFrame,
  undoLastMark,
  startCycle,
  endCycle,
  markShot,
  setShotType,
}: UseVideoKeyHandlerOptions) {
  const handleVideoKeyDown = (event: ReactKeyboardEvent<HTMLVideoElement>) => {
    if (!isHtml5) return;
    if (event.key === " ") {
      event.preventDefault();
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        void video.play();
      } else {
        video.pause();
      }
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      jumpSeconds(5);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      jumpSeconds(-5);
      return;
    }
    if (event.key === ".") {
      if (event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      stepFrame(1);
      return;
    }
    if (event.key === ",") {
      if (event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      stepFrame(-1);
      return;
    }
    if (event.key?.toLowerCase() === "u" || event.code === "KeyU") {
      event.preventDefault();
      undoLastMark();
      return;
    }
    if (event.key?.toLowerCase() === "q" || event.code === "KeyQ") {
      event.preventDefault();
      startCycle();
      return;
    }
    if (event.key?.toLowerCase() === "e" || event.code === "KeyE") {
      event.preventDefault();
      endCycle();
      return;
    }
    if (event.key?.toLowerCase() === "s" || event.code === "KeyS") {
      event.preventDefault();
      setShotType("shooting");
      return;
    }
    if (event.key?.toLowerCase() === "f" || event.code === "KeyF") {
      event.preventDefault();
      setShotType("feeding");
      return;
    }
    if (isMarkShotKey(event)) {
      event.preventDefault();
      markShot();
    }
  };

  return handleVideoKeyDown;
}
