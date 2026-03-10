"use client";

import { GENERAL_MATCH_CARD_CATEGORIES } from "@/components/match-card/components/general/categories";
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
import { useMatchCardData } from "@/hooks/use-match-card-data";
import { useTeamsInMatch } from "@/hooks/use-teams-in-match";
import { MatchCardData, TeamInMatch } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { useMatchCardStore } from "@/stores/use-match-card-store";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

export default function GeneralMatchCard() {
  const { eventId, matchNumber } = useMatchCardStore(
    useShallow((state) => ({
      eventId: state.eventId,
      matchNumber: state.matchNumber,
    }))
  );
  const { data: teamsData } = useTeamsInMatch({
    eventId,
    matchNumber,
  });

  const { data: scoutingData } = useMatchCardData();

  const buildFallbackTeamData = (teamNumber: number): MatchCardData =>
    ({
      team: teamNumber,
    } as MatchCardData);

  const teamDataByNumber = useMemo(
    () =>
      new Map<number, MatchCardData>(
        (scoutingData ?? []).map((teamData) => [
          teamData.team,
          teamData,
        ])
      ),
    [scoutingData]
  );

  const allianceFromTeams = (
    allianceTeams: TeamInMatch[] | undefined
  ): MatchCardData[] =>
    (allianceTeams ?? []).map(({ team }) => {
      const teamNumber = team.number;
      return (
        teamDataByNumber.get(teamNumber) ?? buildFallbackTeamData(teamNumber)
      );
    });

  const redAlliance = useMemo(
    () => allianceFromTeams(teamsData?.redAlliance),
    [teamDataByNumber, teamsData?.redAlliance]
  );
  const blueAlliance = useMemo(
    () => allianceFromTeams(teamsData?.blueAlliance),
    [teamDataByNumber, teamsData?.blueAlliance]
  );

  const columns = useMemo(
    () =>
      useMatchCardColumns({
        redAlliance,
        blueAlliance,
      }),
    [blueAlliance, redAlliance]
  );

  const data: MatchCardRow[] = useMemo(
    () =>
      GENERAL_MATCH_CARD_CATEGORIES.map((category) => ({
        label: category.label,
        dataKey: category.dataKey as keyof MatchCardData,
        showTotal: category.showTotal,
        red: redAlliance,
        blue: blueAlliance,
      })),
    [blueAlliance, redAlliance]
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
