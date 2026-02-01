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
import TeamMediaDialog from "@/components/match-card/components/TeamMediaDialog";

type AllianceTeam = {
  number: number;
  name: string;
};

type MatchCardHeaderProps = {
  eventId: string;
  matchNumber: string;
  onEventIdChange: (nextValue: string) => void;
  onMatchNumberChange: (nextValue: string) => void;
  redAlliance: AllianceTeam[];
  blueAlliance: AllianceTeam[];
  redMediaTeams: Array<{
    teamNumber: number | string;
    teamName: string;
    imageUrl: string | null;
  }>;
  blueMediaTeams: Array<{
    teamNumber: number | string;
    teamName: string;
    imageUrl: string | null;
  }>;
};

export default function MatchCardHeader({
  eventId,
  matchNumber,
  onEventIdChange,
  onMatchNumberChange,
  redAlliance,
  blueAlliance,
  redMediaTeams,
  blueMediaTeams,
}: MatchCardHeaderProps) {
  return (
    <>
      <FieldGroup className="flex flex-row gap-4">
        <Field orientation="vertical" className="w-48">
          <FieldLabel className="w-full flex-col items-start gap-2">
            <FieldTitle>Event ID</FieldTitle>
            <FieldContent>
              <Input
                placeholder="2026miket"
                value={eventId}
                onChange={(event) => onEventIdChange(event.target.value)}
              />
            </FieldContent>
          </FieldLabel>
        </Field>
        <Field orientation="vertical" className="w-36">
          <FieldLabel className="w-full flex-col items-start gap-2">
            <FieldTitle>Match Number</FieldTitle>
            <FieldContent>
              <Input
                min={1}
                type="number"
                value={matchNumber}
                onChange={(event) => onMatchNumberChange(event.target.value)}
              />
            </FieldContent>
          </FieldLabel>
        </Field>
      </FieldGroup>

      <div className="grid gap-2 md:grid-cols-12">
        <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 col-span-5">
          <div className="flex items-center justify-between gap-3 text-lg font-semibold uppercase tracking-wide text-red-600">
            <span>Red Alliance</span>
            <TeamMediaDialog allianceColour="red" teams={redMediaTeams} />
          </div>
          <Table className="text-slate-700">
            <TableHeader className="text-xs uppercase text-slate-500 text-center">
              <TableRow>
                {redAlliance.map((team, index) => (
                  <TableHead
                    key={`red-head-${team.number}`}
                    className="text-center"
                  >
                    Driver Station {index + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {redAlliance.map((team) => (
                  <TableCell
                    key={`red-${team.number}`}
                    className="text-center text-base font-semibold text-slate-900"
                  >
                    {team.number}
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
            <TeamMediaDialog allianceColour="blue" teams={blueMediaTeams} />
          </div>
          <Table className="text-slate-700">
            <TableHeader className="text-xs uppercase text-slate-500 text-center">
              <TableRow>
                {blueAlliance.map((team, index) => (
                  <TableHead
                    key={`blue-head-${team.number}`}
                    className="text-center"
                  >
                    Driver Station {index + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {blueAlliance.map((team) => (
                  <TableCell
                    key={`blue-${team.number}`}
                    className="text-center text-base font-semibold text-slate-900"
                  >
                    {team.number}
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
