"use no memo";
"use client";

import { GENERAL_MATCH_CARD_CATEGORIES } from "@/components/match-card/components/general/categories";
import { MatchCardContext } from "@/components/match-card/context/MatchCardContext";
import {
  MatchCardRow,
  useMatchCardColumns,
} from "@/components/match-card/hooks/use-match-card-columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SAMPLE_BLUE_ALLIANCE,
  SAMPLE_MATCH_CARD_BY_TEAM,
  SAMPLE_RED_ALLIANCE,
} from "@/lib/db/sample-match-card-data";
import { MatchCardData } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useContext } from "react";

export default function GeneralMatchCard() {
  const { teamsInMatch } = useContext(MatchCardContext);

  const sampleAllianceFromContext = (
    teamNumbers: number[] | undefined,
    fallbackAlliance: MatchCardData[]
  ): MatchCardData[] =>
    fallbackAlliance.map((fallbackTeamData, index) => {
      const teamNumber = teamNumbers?.[index];
      if (!teamNumber) return fallbackTeamData;
      return {
        ...(SAMPLE_MATCH_CARD_BY_TEAM.get(teamNumber) ?? fallbackTeamData),
        team: teamNumber,
      };
    });

  const redAlliance = sampleAllianceFromContext(
    teamsInMatch?.redAlliance?.map((team) => team.team.number),
    SAMPLE_RED_ALLIANCE
  );
  const blueAlliance = sampleAllianceFromContext(
    teamsInMatch?.blueAlliance?.map((team) => team.team.number),
    SAMPLE_BLUE_ALLIANCE
  );

  const columns = useMatchCardColumns({
    redAlliance,
    blueAlliance,
  });

  const data: MatchCardRow[] = GENERAL_MATCH_CARD_CATEGORIES.map(
    (category) => ({
      label: category.label,
      dataKey: category.dataKey as keyof MatchCardData,
      showTotal: category.showTotal,
      red: redAlliance,
      blue: blueAlliance,
    })
  );

  const matchCardTable = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white/70">
      <Table className="text-slate-700">
        <TableHeader className="text-sm uppercase text-center">
          {matchCardTable.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isRed = header.id.includes("red");
                const isBlue = header.id.includes("blue");
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-center",
                      isRed &&
                        "bg-red-50 text-center text-red-700 first:rounded-tl-lg",
                      isBlue &&
                        "bg-blue-50 text-center text-blue-700 last:rounded-tr-lg"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="text-center">
          {matchCardTable.getRowModel().rows?.length ? (
            matchCardTable.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
