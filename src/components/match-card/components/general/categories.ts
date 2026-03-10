
export const GENERAL_MATCH_CARD_CATEGORIES: {
  label: string;
  dataKey: string;
  type: "number" | "boolean" | "input";
  showTotal: boolean;
}[] = [
  {
    label: "Matches",
    dataKey: "matches",
    type: "number",
    showTotal: false,
  },
  {
    label: "Average Shooting Seconds",
    dataKey: "avgShootingSeconds",
    type: "number",
    showTotal: true,
  },
  {
    label: "Max Shooting Seconds",
    dataKey: "maxShootingSeconds",
    type: "number",
    showTotal: true,
  },
  {
    label: "Average Feeding Seconds",
    dataKey: "avgFeedingSeconds",
    type: "number",
    showTotal: true,
  },
  {
    label: "Auto Climbs",
    dataKey: "autoClimbs",
    type: "number",
    showTotal: true,
  },
  { label: "Trench", dataKey: "trench", type: "boolean", showTotal: false },
  { label: "Bump", dataKey: "bump", type: "boolean", showTotal: false },
  {
    label: "Feed (Half Field from Neutral)",
    dataKey: "halfFieldFromNeutral",
    type: "boolean",
    showTotal: false,
  },
  {
    label: "Feed (Half Field from Opponent)",
    dataKey: "halfFieldFromOpponent",
    type: "boolean",
    showTotal: false,
  },
  {
    label: "Feed (Full Field)",
    dataKey: "fullField",
    type: "boolean",
    showTotal: false,
  },
  { label: "L3 Count", dataKey: "L3Climbs", type: "number", showTotal: true },
  { label: "L2 Count", dataKey: "L2Climbs", type: "number", showTotal: true },
  { label: "L1 Count", dataKey: "L1Climbs", type: "number", showTotal: true },
];
