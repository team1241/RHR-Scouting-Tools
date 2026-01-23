import type {
  Cycle,
  ShotMark,
} from "@/components/ball-counter/types";

export const calculateAverageBps = (cycles: Cycle[], marks: ShotMark[]) => {
  if (!cycles.length) return 0;
  const { totalDuration, totalMarks } = cycles.reduce(
    (acc, cycle) => {
      const duration = Math.max(0, cycle.endTime - cycle.startTime);
      if (duration <= 0) return acc;
      const markCount = marks.filter(
        (mark) => mark.time >= cycle.startTime && mark.time <= cycle.endTime,
      ).length;
      acc.totalDuration += duration;
      acc.totalMarks += markCount;
      return acc;
    },
    { totalDuration: 0, totalMarks: 0 },
  );
  if (!totalDuration) return 0;
  return totalMarks / totalDuration;
};
