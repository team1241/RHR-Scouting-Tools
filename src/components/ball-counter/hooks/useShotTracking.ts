import { useState } from "react";
import type {
  Cycle,
  ShotMark,
  ShotType,
} from "@/components/ball-counter/types";

type UseShotTrackingOptions = {
  getCurrentTime: () => number | null;
  pickCycleTagColor: (usedColors: string[]) => string;
};

export default function useShotTracking({
  getCurrentTime,
  pickCycleTagColor,
}: UseShotTrackingOptions) {
  const [marks, setMarks] = useState<ShotMark[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycleStart, setActiveCycleStart] = useState<number | null>(null);
  const [shotType, setShotType] = useState<ShotType>("shooting");

  const markShot = () => {
    const time = getCurrentTime();
    if (time === null) return;
    setMarks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        time,
        shotType,
      },
    ]);
  };

  const undoLastMark = () => {
    setMarks((prev) => prev.slice(0, -1));
  };

  const startCycle = () => {
    if (activeCycleStart !== null) return;
    const now = getCurrentTime();
    if (now === null) return;
    setActiveCycleStart(now);
  };

  const endCycle = () => {
    if (activeCycleStart === null) return;
    const now = getCurrentTime();
    if (now === null) return;
    const endTime = Math.max(now, activeCycleStart);
    setCycles((prev) => {
      const tagColor = pickCycleTagColor(prev.map((cycle) => cycle.tagColor));
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          startTime: activeCycleStart,
          endTime,
          shotType,
          tagColor,
        },
      ];
    });
    setActiveCycleStart(null);
  };

  const clearAll = () => {
    setMarks([]);
    setCycles([]);
    setActiveCycleStart(null);
  };

  const removeMark = (id: string) => {
    setMarks((prev) => prev.filter((mark) => mark.id !== id));
  };

  const removeCycle = (id: string) => {
    setCycles((prev) => {
      const cycleIndex = prev.findIndex((cycle) => cycle.id === id);
      if (cycleIndex === -1) return prev;
      const cycle = prev[cycleIndex];
      setMarks((marksPrev) =>
        marksPrev.filter(
          (mark) => mark.time < cycle.startTime || mark.time > cycle.endTime,
        ),
      );
      return prev.filter((cycleItem) => cycleItem.id !== id);
    });
  };

  return {
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
  };
}
