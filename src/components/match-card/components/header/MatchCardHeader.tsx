"use client";

import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import TeamMediaDialog from "@/components/match-card/components/header/TeamMediaDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { debounce } from "nuqs";
import { useMatchCardParams } from "@/components/match-card/hooks/use-match-card-params";
import { useContext, useEffect, useState, useTransition } from "react";
import { MatchCardContext } from "@/components/match-card/context/MatchCardContext";
import { cn } from "@/lib/utils";

type MatchCardHeaderProps = {
  onPendingChange?: (isPending: boolean) => void;
};

export default function MatchCardHeader({
  onPendingChange,
}: MatchCardHeaderProps) {
  const { teamsInMatch, events, year } = useContext(MatchCardContext);

  const [{ eventId, matchNumber }, setMatchCardParams] = useMatchCardParams();
  const [matchNumberInput, setMatchNumberInput] = useState(matchNumber);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    setMatchNumberInput(matchNumber);
  }, [matchNumber]);

  const updateMatchCardParams = (
    params: Partial<{ eventId: string | null; matchNumber: string | null }>,
    options?: Parameters<typeof setMatchCardParams>[1]
  ) => {
    startTransition(() => {
      void setMatchCardParams(params, options);
    });
  };

  const redAlliance = teamsInMatch?.redAlliance;
  const blueAlliance = teamsInMatch?.blueAlliance;

  return (
    <div
      className={cn(
        "transition-opacity duration-200 flex flex-col gap-4",
        isPending && "opacity-80"
      )}
    >
      <FieldGroup className="flex flex-row gap-4">
        <Field orientation="vertical" className="max-w-fit">
          <FieldLabel className="w-full flex-col items-start gap-2">
            <FieldTitle>Event</FieldTitle>
            <FieldContent>
              <Select
                value={eventId}
                onValueChange={(nextValue) =>
                  updateMatchCardParams({ eventId: nextValue })
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-100">
                  <SelectValue placeholder={"Select an event..."} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {`${year} - ${event.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </FieldLabel>
        </Field>
        <Field orientation="vertical" className="w-25">
          <FieldLabel className="w-full flex-col items-start gap-2">
            <FieldTitle>Match Number</FieldTitle>
            <FieldContent>
              <Input
                min={1}
                type="number"
                value={matchNumberInput}
                onChange={(event) => {
                  const nextMatchNumber = event.target.value;
                  setMatchNumberInput(nextMatchNumber);
                  updateMatchCardParams(
                    { matchNumber: nextMatchNumber },
                    { limitUrlUpdates: debounce(300) }
                  );
                }}
              />
            </FieldContent>
          </FieldLabel>
        </Field>
      </FieldGroup>

      <div className="grid gap-2 md:grid-cols-12">
        <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 col-span-5">
          <div className="flex items-center justify-between gap-3 text-lg font-semibold uppercase tracking-wide text-red-600">
            <span>Red Alliance</span>
            <TeamMediaDialog allianceColour="red" teams={redAlliance ?? []} />
          </div>
          <Table className="text-slate-700">
            <TableHeader className="text-xs uppercase text-slate-500 text-center">
              <TableRow>
                {redAlliance?.map((team, index) => (
                  <TableHead
                    key={`red-head-${team.team.number}`}
                    className="text-center"
                  >
                    Driver Station {index + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {redAlliance?.map((team) => (
                  <TableCell
                    key={`red-${team.team.number}`}
                    className="text-center text-base font-semibold text-slate-900"
                  >
                    {team.team.number}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="col-span-2" />
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 col-span-5">
          <div className="flex items-center justify-between gap-3 text-lg font-semibold uppercase tracking-wide text-blue-600">
            <span>Blue Alliance</span>
            <TeamMediaDialog allianceColour="blue" teams={blueAlliance ?? []} />
          </div>
          <Table className="text-slate-700">
            <TableHeader className="text-xs uppercase text-slate-500 text-center">
              <TableRow>
                {blueAlliance?.map((team, index) => (
                  <TableHead
                    key={`blue-head-${team.team.number}`}
                    className="text-center"
                  >
                    Driver Station {index + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {blueAlliance?.map((team) => (
                  <TableCell
                    key={`blue-${team.team.number}`}
                    className="text-center text-base font-semibold text-slate-900"
                  >
                    {team.team.number}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
