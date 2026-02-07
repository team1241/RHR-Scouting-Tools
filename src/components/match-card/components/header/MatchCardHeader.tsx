"use client";
"use no memo";

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
import { useActiveSeasonEvents } from "@/hooks/use-active-season-events";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeamsInMatch } from "@/hooks/use-teams-in-match";
import { parseAsString, useQueryState } from "nuqs";
import { useDebounceValue } from "usehooks-ts";

interface MatchCardHeaderProps {
  eventId: string;
  setEventId: (value: string) => void;
  matchNumber: string;
  setMatchNumber: (value: string) => void;
}

export default function MatchCardHeader({
  eventId,
  setEventId,
  matchNumber,
  setMatchNumber,
}: MatchCardHeaderProps) {
  const [debouncedEventId] = useDebounceValue(eventId, 250);
  const [debouncedMatchNumber] = useDebounceValue(matchNumber, 250);
  const { data, isLoading: isEventsLoading } = useActiveSeasonEvents();
  const year = data?.year;

  const { data: teamsInMatchResponse, isLoading: isTeamsLoading } =
    useTeamsInMatch({
      eventId: debouncedEventId,
      matchNumber: debouncedMatchNumber,
    });

  const redAlliance = teamsInMatchResponse?.redAlliance;
  const blueAlliance = teamsInMatchResponse?.blueAlliance;
  const driverStations = [1, 2, 3];
  const showRedFallback =
    !isTeamsLoading && (!redAlliance || redAlliance.length === 0);
  const showBlueFallback =
    !isTeamsLoading && (!blueAlliance || blueAlliance.length === 0);

  return (
    <>
      <FieldGroup className="flex flex-row gap-4">
        <Field orientation="vertical" className="max-w-fit">
          <FieldLabel className="w-full flex-col items-start gap-2">
            <FieldTitle>Event</FieldTitle>
            <FieldContent>
              <Select
                value={eventId ?? ""}
                onValueChange={(nextValue) => setEventId(nextValue)}
              >
                <SelectTrigger
                  disabled={!data || isEventsLoading}
                  className="w-100"
                >
                  <SelectValue
                    placeholder={
                      isEventsLoading
                        ? "Loading events..."
                        : "Select an event..."
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  {data?.events.map((event) => (
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
                value={matchNumber ?? ""}
                onChange={(event) => setMatchNumber(event.target.value)}
                disabled={isEventsLoading}
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
                {isTeamsLoading || showRedFallback
                  ? driverStations.map((station) => (
                      <TableHead
                        key={`red-head-loading-${station}`}
                        className="text-center"
                      >
                        Driver Station {station}
                      </TableHead>
                    ))
                  : redAlliance?.map((team, index) => (
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
                {isTeamsLoading
                  ? driverStations.map((station) => (
                      <TableCell
                        key={`red-loading-${station}`}
                        className="text-center"
                      >
                        <div className="mx-auto h-5 w-12 rounded bg-slate-200 animate-pulse" />
                      </TableCell>
                    ))
                  : showRedFallback
                    ? driverStations.map((station) => (
                        <TableCell
                          key={`red-empty-${station}`}
                          className="text-center text-base font-semibold text-slate-500"
                        >
                          -
                        </TableCell>
                      ))
                    : redAlliance?.map((team) => (
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
                {isTeamsLoading || showBlueFallback
                  ? driverStations.map((station) => (
                      <TableHead
                        key={`blue-head-loading-${station}`}
                        className="text-center"
                      >
                        Driver Station {station}
                      </TableHead>
                    ))
                  : blueAlliance?.map((team, index) => (
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
                {isTeamsLoading
                  ? driverStations.map((station) => (
                      <TableCell
                        key={`blue-loading-${station}`}
                        className="text-center"
                      >
                        <div className="mx-auto h-5 w-12 rounded bg-slate-200 animate-pulse" />
                      </TableCell>
                    ))
                  : showBlueFallback
                    ? driverStations.map((station) => (
                        <TableCell
                          key={`blue-empty-${station}`}
                          className="text-center text-base font-semibold text-slate-500"
                        >
                          -
                        </TableCell>
                      ))
                    : blueAlliance?.map((team) => (
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
    </>
  );
}
