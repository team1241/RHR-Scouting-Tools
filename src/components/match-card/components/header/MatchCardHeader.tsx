"use client";

import TeamMediaDialog from "@/components/match-card/components/header/TeamMediaDialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveSeasonEvents } from "@/hooks/use-active-season-events";
import { cn } from "@/lib/utils";
import { useMatchCardStore } from "@/stores/use-match-card-store";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTeamsInMatch } from "@/hooks/use-teams-in-match";

export default function MatchCardHeader() {
  const { eventId, matchNumber, setMatchSelection } = useMatchCardStore(
    useShallow((state) => ({
      eventId: state.eventId,
      matchNumber: state.matchNumber,
      setMatchSelection: state.setMatchSelection,
    }))
  );
  const { data: eventsData } = useActiveSeasonEvents();
  const { data: teamsData, isFetching } = useTeamsInMatch({
    eventId,
    matchNumber,
  });
  const [draftEventId, setDraftEventId] = useState(eventId);
  const [draftMatchNumber, setDraftMatchNumber] = useState(matchNumber);

  const redAlliance = teamsData?.redAlliance;
  const blueAlliance = teamsData?.blueAlliance;

  useEffect(() => {
    setDraftEventId(eventId);
    setDraftMatchNumber(matchNumber);
  }, [eventId, matchNumber]);

  const handleSubmit = () => {
    setMatchSelection({
      eventId: draftEventId,
      matchNumber: draftMatchNumber,
    });
  };

  return (
    <div
      className={cn(
        "transition-opacity duration-200 flex flex-col gap-4",
        isFetching && "opacity-80"
      )}
    >
      <FieldGroup className="flex flex-row flex-wrap items-end gap-4">
        <Field orientation="vertical" className="max-w-fit">
          <FieldLabel className="w-full flex-col items-start gap-2">
            <FieldTitle>Event</FieldTitle>
            <FieldContent>
              <Select
                value={draftEventId}
                onValueChange={setDraftEventId}
              >
                <SelectTrigger className="w-100">
                  <SelectValue placeholder={"Select an event..."} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {eventsData?.events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {`${eventsData?.year} - ${event.name}`}
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
                value={draftMatchNumber}
                onChange={(event) => setDraftMatchNumber(event.target.value)}
              />
            </FieldContent>
          </FieldLabel>
        </Field>
        <Button onClick={handleSubmit}>Load Match</Button>
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
