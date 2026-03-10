"use client";

import { MatchCardData } from "@/lib/db/types";
import { ColumnDef } from "@tanstack/react-table";

export type MatchCardTeamData = Partial<MatchCardData> &
  Pick<MatchCardData, "team">;

export type MatchCardRow = {
  label: string;
  dataKey: keyof MatchCardData;
  showTotal: boolean;
  red: MatchCardTeamData[];
  blue: MatchCardTeamData[];
};

type UseMatchCardColumnsArgs = {
  redAlliance: MatchCardTeamData[];
  blueAlliance: MatchCardTeamData[];
};

const formatValue = (value: MatchCardData[keyof MatchCardData] | undefined) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "-";
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  return value ?? "-";
};

export const useMatchCardColumns = ({
  redAlliance,
  blueAlliance,
}: UseMatchCardColumnsArgs) => {
  const redCols: ColumnDef<MatchCardRow>[] = redAlliance.map((team) => ({
    id: `red-${team.team}`,
    header: () => team.team,
    cell: ({ row }) => {
      const val = row.original.red.find((t) => t.team === team.team)?.[
        row.original.dataKey
      ];
      return formatValue(val);
    },
  }));

  const blueCols: ColumnDef<MatchCardRow>[] = blueAlliance.map((team) => ({
    id: `blue-${team.team}`,
    header: () => team.team,
    cell: ({ row }) => {
      const val = row.original.blue.find((t) => t.team === team.team)?.[
        row.original.dataKey
      ];
      return formatValue(val);
    },
  }));

  const totalCol = (
    id: string,
    side: "red" | "blue",
  ): ColumnDef<MatchCardRow> => ({
    id,
    header: () => "Total",
    cell: ({ row }) => {
      if (!row.original.showTotal) return "-";
      const values = row.original[side]
        .map((t) => t[row.original.dataKey])
        .filter((v): v is number => typeof v === "number");
      const total = values.length ? values.reduce((a, b) => a + b, 0) : null;
      return (
        <span className="text-md font-semibold">
          {total !== null ? formatValue(total) : "-"}
        </span>
      );
    },
  });

  const dataLabel: ColumnDef<MatchCardRow> = {
    id: "category-label",
    header: () => "",
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.label}</span>
    ),
  };

  return [
    ...redCols,
    totalCol("red-total", "red"),
    dataLabel,
    totalCol("blue-total", "blue"),
    ...blueCols,
  ];
};
