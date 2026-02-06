"use no memo";
"use client";

import { GENERAL_MATCH_CARD_CATEGORIES } from "@/components/match-card/components/general/categories";
import {
  MatchCardRow,
  useMatchCardColumns,
} from "@/components/match-card/hooks/use-match-card-columns";
import { AllianceTeam } from "@/components/match-card/teams";
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
  SAMPLE_MATCH_CARD_DATA,
  SAMPLE_RED_ALLIANCE,
} from "@/lib/db/sample-match-card-data";
import { MatchCardData } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface GeneralMatchCardProps {
  eventId: string;
  matchNumber: string;
}

export default function GeneralMatchCard({
  eventId,
  matchNumber,
}: GeneralMatchCardProps) {
  const columns = useMatchCardColumns({
    redAlliance: SAMPLE_RED_ALLIANCE,
    blueAlliance: SAMPLE_BLUE_ALLIANCE,
  });

  const data: MatchCardRow[] = GENERAL_MATCH_CARD_CATEGORIES.map(
    (category) => ({
      label: category.label,
      dataKey: category.dataKey as keyof MatchCardData,
      showTotal: category.showTotal,
      red: SAMPLE_RED_ALLIANCE,
      blue: SAMPLE_BLUE_ALLIANCE,
    }),
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
                        "bg-blue-50 text-center text-blue-700 last:rounded-tr-lg",
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
