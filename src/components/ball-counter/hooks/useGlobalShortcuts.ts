import { useEffect } from "react";
import type { RefObject } from "react";
import type { ShotType } from "@/components/ball-counter/types";
import { isMarkShotKey } from "@/components/ball-counter/utils/shotKeys";

type UseGlobalShortcutsOptions = {
  isHtml5: boolean;
  isYouTube: boolean;
  markShot: () => void;
  undoLastMark: () => void;
  startCycle: () => void;
  endCycle: () => void;
  setShotType: (shotType: ShotType) => void;
  jumpSeconds: (delta: number) => void;
  stepFrame: (direction: number) => void;
  videoRef: RefObject<HTMLVideoElement>;
};

export default function useGlobalShortcuts({
  isHtml5,
  isYouTube,
  markShot,
  undoLastMark,
  startCycle,
  endCycle,
  setShotType,
  jumpSeconds,
  stepFrame,
  videoRef,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key?.toLowerCase() === "u" || event.code === "KeyU") {
        undoLastMark();
        return;
      }
      if (event.key?.toLowerCase() === "q" || event.code === "KeyQ") {
        startCycle();
        return;
      }
      if (event.key?.toLowerCase() === "e" || event.code === "KeyE") {
        endCycle();
        return;
      }
      if (event.key?.toLowerCase() === "s" || event.code === "KeyS") {
        setShotType("shooting");
        return;
      }
      if (event.key?.toLowerCase() === "f" || event.code === "KeyF") {
        setShotType("feeding");
        return;
      }
      if (isMarkShotKey(event)) {
        const active = document.activeElement;
        const wasVideoFocused = active === videoRef.current;
        markShot();
        if (wasVideoFocused && videoRef.current) {
          videoRef.current.focus();
        }
        return;
      }
      const canJump = isHtml5 || isYouTube;
      if (!canJump) return;
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
        event.preventDefault();
        stepFrame(1);
        return;
      }
      if (event.key === ",") {
        event.preventDefault();
        stepFrame(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    endCycle,
    isHtml5,
    isYouTube,
    jumpSeconds,
    markShot,
    setShotType,
    startCycle,
    stepFrame,
    undoLastMark,
    videoRef,
  ]);
}
