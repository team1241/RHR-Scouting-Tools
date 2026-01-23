export const cycleTagColors = [
  "border-sky-200 bg-sky-100 text-sky-700",
  "border-emerald-200 bg-emerald-100 text-emerald-700",
  "border-amber-200 bg-amber-100 text-amber-700",
  "border-rose-200 bg-rose-100 text-rose-700",
  "border-violet-200 bg-violet-100 text-violet-700",
  "border-teal-200 bg-teal-100 text-teal-700",
] as const;

export const pickCycleTagColor = (usedColors: string[]) => {
  const available = cycleTagColors.filter(
    (color) => !usedColors.includes(color),
  );
  const palette = available.length ? available : cycleTagColors;
  return palette[Math.floor(Math.random() * palette.length)];
};
