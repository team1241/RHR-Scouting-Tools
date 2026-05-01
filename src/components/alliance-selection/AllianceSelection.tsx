"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Hero from "@/components/common/Hero";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { scheduleDocumentScrollRestore } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const ALLIANCE_COUNT = 8;
const NAME_SAVE_DEBOUNCE_MS = 400;

type AllianceSlot = "captain" | "firstPick" | "secondPick" | "thirdPick";

type Team = {
  teamNumber: number;
  nameShort: string;
  primaryColor?: string;
  epaMean?: number;
  city?: string;
  stateProv?: string;
  country?: string;
};

type AllianceRow = {
  id: string;
  captain?: Team;
  firstPick?: Team;
  secondPick?: Team;
  thirdPick?: Team;
};

type PicklistColumn = {
  id: string;
  name: string;
  teams: Team[];
};

type TrackedPicklist = {
  _id: Id<"picklists">;
  name: string;
  columns: PicklistColumn[];
};

const slotLabels: Record<AllianceSlot, string> = {
  captain: "Captain",
  firstPick: "First pick",
  secondPick: "Second pick",
  thirdPick: "Third pick",
};

function createEmptyAlliances(): AllianceRow[] {
  return Array.from({ length: ALLIANCE_COUNT }, (_, index) => ({
    id: `alliance-${index + 1}`,
  }));
}

function normalizeEventCode(eventCode: string) {
  const normalized = eventCode.trim().toLowerCase();
  const match = normalized.match(/^(\d{4})([a-z0-9]+)$/);
  const code = match ? match[2] : normalized;
  const worldDivisions: Record<string, string> = {
    archimedes: "archimedes",
    archmedes: "archimedes",
    curie: "curie",
    daly: "daly",
    galileo: "galileo",
    hopper: "hopper",
    johnson: "johnson",
    milstein: "milstein",
    newton: "newton",
  };

  return worldDivisions[code] ?? normalized;
}

function normalizeAlliances(alliances: AllianceRow[]) {
  const normalized = alliances.slice(0, ALLIANCE_COUNT);

  while (normalized.length < ALLIANCE_COUNT) {
    normalized.push({ id: `alliance-${normalized.length + 1}` });
  }

  return normalized.map((row, index) => ({
    ...row,
    id: row.id || `alliance-${index + 1}`,
  }));
}

function getAllPickedTeamNumbers(alliances: AllianceRow[]) {
  const pickedTeamNumbers = new Set<number>();

  for (const row of alliances) {
    for (const slot of Object.keys(slotLabels) as AllianceSlot[]) {
      const team = row[slot];
      if (team) {
        pickedTeamNumbers.add(team.teamNumber);
      }
    }
  }

  return pickedTeamNumbers;
}

function clearThirdPickTeams(alliances: AllianceRow[]) {
  return alliances.map((row) => {
    if (!row.thirdPick) {
      return row;
    }

    const nextRow = { ...row };
    delete nextRow.thirdPick;
    return nextRow;
  });
}

function getPickedTeamNumbersExceptCell(
  alliances: AllianceRow[],
  rowId: string,
  slot: AllianceSlot,
) {
  const pickedTeamNumbers = new Set<number>();

  for (const row of alliances) {
    for (const currentSlot of Object.keys(slotLabels) as AllianceSlot[]) {
      if (row.id === rowId && currentSlot === slot) {
        continue;
      }

      const team = row[currentSlot];
      if (team) {
        pickedTeamNumbers.add(team.teamNumber);
      }
    }
  }

  return pickedTeamNumbers;
}

function flattenPicklistTeams(columns: PicklistColumn[]) {
  const teams: Team[] = [];
  const seenTeamNumbers = new Set<number>();

  for (const column of columns) {
    for (const team of column.teams) {
      if (seenTeamNumbers.has(team.teamNumber)) {
        continue;
      }

      seenTeamNumbers.add(team.teamNumber);
      teams.push(team);
    }
  }

  return teams;
}

function getTeamLabel(team: Team) {
  return `${team.teamNumber} - ${team.nameShort}`;
}

function TeamSummaryCard({
  team,
  picked = false,
}: {
  team: Team;
  picked?: boolean;
}) {
  const teamNameRef = useRef<HTMLParagraphElement>(null);
  const [isNameOverflowing, setIsNameOverflowing] = useState(false);
  const cardStyle = team.primaryColor
    ? {
        background: `linear-gradient(135deg, ${team.primaryColor}33 0%, ${team.primaryColor}18 45%, transparent 100%)`,
      }
    : undefined;

  useEffect(() => {
    const teamName = teamNameRef.current;
    if (!teamName) {
      return;
    }

    const updateOverflowState = () => {
      setIsNameOverflowing(teamName.scrollWidth > teamName.clientWidth);
    };

    updateOverflowState();

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(teamName);

    return () => resizeObserver.disconnect();
  }, [team.nameShort]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-fit" tabIndex={0}>
          <Card
            style={cardStyle}
            className="min-w-44 max-w-60 gap-1 rounded-xl bg-background p-3 shadow-none"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div
                className={cn(
                  "flex min-w-0 items-center gap-2 text-lg font-bold leading-tight",
                  picked && "text-muted-foreground line-through",
                )}
              >
                <span className="shrink-0">{team.teamNumber}</span>
                <p ref={teamNameRef} className="min-w-0 truncate">
                  {team.nameShort}
                </p>
              </div>
              {team.epaMean !== undefined ? (
                <p className="text-xs font-medium text-muted-foreground">
                  EPA {team.epaMean.toFixed(1)}
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </TooltipTrigger>
      {isNameOverflowing ? (
        <TooltipContent>
          <p>{team.nameShort}</p>
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

function TeamCombobox({
  team,
  teams,
  pickedTeamNumbers,
  disabled,
  onChange,
}: {
  team?: Team;
  teams: Team[];
  pickedTeamNumbers: Set<number>;
  disabled: boolean;
  onChange: (team: Team | undefined) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredTeams = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return teams
      .filter((availableTeam) => {
        if (
          pickedTeamNumbers.has(availableTeam.teamNumber) &&
          availableTeam.teamNumber !== team?.teamNumber
        ) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        return (
          availableTeam.teamNumber.toString().includes(searchTerm) ||
          availableTeam.nameShort.toLowerCase().includes(searchTerm)
        );
      })
      .slice(0, 40);
  }, [pickedTeamNumbers, search, team?.teamNumber, teams]);

  return (
    <Combobox<Team>
      modal={false}
      value={team ?? null}
      onValueChange={(value) => {
        onChange(value ?? undefined);
        scheduleDocumentScrollRestore();
      }}
      onOpenChange={(open) => {
        if (!open) {
          scheduleDocumentScrollRestore();
        }
      }}
      onInputValueChange={setSearch}
      itemToStringLabel={(value) => getTeamLabel(value)}
      itemToStringValue={(value) => value.teamNumber.toString()}
      isItemEqualToValue={(itemValue, selectedValue) =>
        itemValue?.teamNumber === selectedValue?.teamNumber
      }
    >
      <ComboboxInput
        className="min-w-48"
        disabled={disabled}
        placeholder="Search teams..."
        showClear={Boolean(team) && !disabled}
      />
      <ComboboxContent>
        <ComboboxEmpty>No available teams</ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup>
            {filteredTeams.map((availableTeam) => (
              <ComboboxItem
                key={availableTeam.teamNumber}
                value={availableTeam}
              >
                <span className="font-medium">{availableTeam.teamNumber}</span>
                <span className="truncate text-muted-foreground">
                  {availableTeam.nameShort}
                </span>
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function TrackedPicklistCard({
  picklist,
  pickedTeamNumbers,
}: {
  picklist: TrackedPicklist;
  pickedTeamNumbers: Set<number>;
}) {
  const teams = useMemo(
    () => flattenPicklistTeams(picklist.columns),
    [picklist.columns],
  );
  const availableTeams = teams.filter(
    (team) => !pickedTeamNumbers.has(team.teamNumber),
  );
  const pickedTeams = teams.filter((team) =>
    pickedTeamNumbers.has(team.teamNumber),
  );

  return (
    <Card className="min-w-72 flex-1 rounded-xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">
              <Link
                href={`/picklist?picklistId=${picklist._id}`}
                className="flex min-w-0 items-center gap-1 hover:underline"
                target="_blank"
              >
                <span className="truncate">{picklist.name}</span>
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  className="size-4 shrink-0"
                  aria-hidden
                />
              </Link>
            </CardTitle>
            <CardDescription>
              {teams.length} {teams.length === 1 ? "team" : "teams"} in list
            </CardDescription>
          </div>
          <Badge variant="secondary">{availableTeams.length} available</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Top 5 available</p>
          {availableTeams.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableTeams.slice(0, 5).map((team) => (
                <TeamSummaryCard key={team.teamNumber} team={team} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No teams left from this picklist.
            </p>
          )}
        </div>
        {pickedTeams.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Picked from this list
            </p>
            <div className="flex flex-wrap gap-2">
              {pickedTeams.slice(0, 8).map((pickedTeam) => (
                <TeamSummaryCard
                  key={pickedTeam.teamNumber}
                  team={pickedTeam}
                  picked
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AllianceSelection() {
  const [allianceSelectionId, setAllianceSelectionId] = useQueryState(
    "allianceSelectionId",
  );
  const selectedAllianceSelectionId = allianceSelectionId
    ? (allianceSelectionId as Id<"allianceSelections">)
    : null;

  const allianceSelections = useQuery(api.allianceSelections.listAll, {});
  const selectedAllianceSelection = useQuery(
    api.allianceSelections.getById,
    selectedAllianceSelectionId
      ? { allianceSelectionId: selectedAllianceSelectionId }
      : "skip",
  );
  const createBlank = useMutation(api.allianceSelections.createBlank);
  const deleteAllianceSelection = useMutation(api.allianceSelections.remove);
  const renameAllianceSelection = useMutation(api.allianceSelections.rename);
  const replaceEventTeams = useMutation(
    api.allianceSelections.replaceEventTeams,
  );
  const setIncludeThirdPick = useMutation(
    api.allianceSelections.setIncludeThirdPick,
  );
  const setTrackedPicklists = useMutation(
    api.allianceSelections.setTrackedPicklists,
  );
  const replaceAlliances = useMutation(api.allianceSelections.replaceAlliances);
  const getTeamsByEvent = useAction(api.frcEvents.getTeamsByEvent);

  const [name, setName] = useState("Untitled alliance selection");
  const [eventCode, setEventCode] = useState("");
  const [eventTeams, setEventTeams] = useState<Team[]>([]);
  const [alliances, setAlliances] =
    useState<AllianceRow[]>(createEmptyAlliances);
  const [trackedPicklistIds, setLocalTrackedPicklistIds] = useState<
    Id<"picklists">[]
  >([]);
  const [includeThirdPick, setLocalIncludeThirdPick] = useState(false);
  const [pendingEventCode, setPendingEventCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEventChangeDialogOpen, setIsEventChangeDialogOpen] = useState(false);
  const [isThirdPickToggleDialogOpen, setIsThirdPickToggleDialogOpen] =
    useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastScrollRestoredAllianceSelectionIdRef = useRef<string | null>(null);

  const picklistsForEvent = useQuery(
    api.picklists.listByEventCode,
    eventCode.trim() ? { eventCode } : "skip",
  );

  const canEditAllianceSelection = Boolean(
    selectedAllianceSelection?.canEdit && selectedAllianceSelectionId,
  );
  const shouldShowEditActions =
    !selectedAllianceSelectionId || canEditAllianceSelection;
  const pickedTeamNumbers = useMemo(
    () => getAllPickedTeamNumbers(alliances),
    [alliances],
  );
  const selectedThirdPickCount = useMemo(
    () => alliances.filter((row) => row.thirdPick).length,
    [alliances],
  );
  const trackedPicklists = useMemo(
    () =>
      (picklistsForEvent ?? []).filter((picklist) =>
        trackedPicklistIds.includes(picklist._id),
      ),
    [picklistsForEvent, trackedPicklistIds],
  );
  const allianceSelectionItems = useMemo(
    () => [
      { value: "", label: "Select an alliance selection" },
      ...(allianceSelections ?? []).map((selection) => ({
        value: selection._id,
        label: selection.name,
      })),
    ],
    [allianceSelections],
  );
  const hasLoadedSelectedAllianceSelection =
    !selectedAllianceSelectionId || selectedAllianceSelection !== undefined;

  useEffect(() => {
    if (!selectedAllianceSelection) {
      return;
    }

    setName(selectedAllianceSelection.name);
    setEventCode(selectedAllianceSelection.eventCode);
    setEventTeams(selectedAllianceSelection.eventTeams);
    setAlliances(normalizeAlliances(selectedAllianceSelection.alliances));
    setLocalTrackedPicklistIds(selectedAllianceSelection.trackedPicklistIds);
    setLocalIncludeThirdPick(selectedAllianceSelection.includeThirdPick);
  }, [selectedAllianceSelection]);

  useEffect(() => {
    if (!selectedAllianceSelectionId) {
      lastScrollRestoredAllianceSelectionIdRef.current = null;
      scheduleDocumentScrollRestore();
      return;
    }

    if (
      allianceSelections === undefined ||
      selectedAllianceSelection === undefined
    ) {
      return;
    }

    if (
      lastScrollRestoredAllianceSelectionIdRef.current ===
      selectedAllianceSelectionId
    ) {
      return;
    }

    lastScrollRestoredAllianceSelectionIdRef.current =
      selectedAllianceSelectionId;
    scheduleDocumentScrollRestore();
  }, [
    allianceSelections,
    selectedAllianceSelection,
    selectedAllianceSelectionId,
  ]);

  useEffect(() => {
    if (
      !selectedAllianceSelectionId ||
      !canEditAllianceSelection ||
      !selectedAllianceSelection ||
      name === selectedAllianceSelection.name
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void renameAllianceSelection({
        allianceSelectionId: selectedAllianceSelectionId,
        name,
      }).catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to rename alliance selection",
        );
      });
    }, NAME_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [
    canEditAllianceSelection,
    name,
    renameAllianceSelection,
    selectedAllianceSelection,
    selectedAllianceSelectionId,
  ]);

  async function createAllianceSelection() {
    setIsCreating(true);

    try {
      const id = await createBlank({ name: "Untitled alliance selection" });
      await setAllianceSelectionId(id);
      setName("Untitled alliance selection");
      setEventCode("");
      setEventTeams([]);
      setAlliances(createEmptyAlliances());
      setLocalTrackedPicklistIds([]);
      setLocalIncludeThirdPick(false);
      toast.success("Alliance selection created");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create alliance selection",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function removeAllianceSelection() {
    if (!selectedAllianceSelectionId || !canEditAllianceSelection) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAllianceSelection({
        allianceSelectionId: selectedAllianceSelectionId,
      });
      await setAllianceSelectionId(null);
      setName("Untitled alliance selection");
      setEventCode("");
      setEventTeams([]);
      setAlliances(createEmptyAlliances());
      setLocalTrackedPicklistIds([]);
      setLocalIncludeThirdPick(false);
      setIsDeleteDialogOpen(false);
      toast.success("Alliance selection deleted");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete alliance selection",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function hasEventData() {
    return (
      eventTeams.length > 0 ||
      trackedPicklistIds.length > 0 ||
      alliances.some((row) =>
        Boolean(
          row.captain || row.firstPick || row.secondPick || row.thirdPick,
        ),
      )
    );
  }

  async function loadEventTeams(
    nextEventCode: string,
    clearSelections: boolean,
  ) {
    if (!selectedAllianceSelectionId || !canEditAllianceSelection) {
      return;
    }

    const normalizedEventCode = normalizeEventCode(nextEventCode);
    if (!normalizedEventCode) {
      return;
    }

    setIsLoadingTeams(true);

    try {
      const teams = await getTeamsByEvent({ eventCode: normalizedEventCode });
      const nextAlliances = clearSelections
        ? createEmptyAlliances()
        : alliances;
      const nextTrackedPicklistIds = clearSelections ? [] : trackedPicklistIds;

      await replaceEventTeams({
        allianceSelectionId: selectedAllianceSelectionId,
        eventCode: normalizedEventCode,
        eventTeams: teams,
        clearSelections,
      });
      setEventCode(normalizedEventCode);
      setEventTeams(teams);
      setAlliances(nextAlliances);
      setLocalTrackedPicklistIds(nextTrackedPicklistIds);
      toast.success(`Loaded ${teams.length} teams`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load teams",
      );
    } finally {
      setIsLoadingTeams(false);
      setPendingEventCode(null);
      setIsEventChangeDialogOpen(false);
    }
  }

  function submitEventCode() {
    if (!canEditAllianceSelection) {
      return;
    }

    const nextEventCode = normalizeEventCode(eventCode);
    if (!nextEventCode) {
      return;
    }

    if (
      selectedAllianceSelection?.eventCode &&
      selectedAllianceSelection.eventCode !== nextEventCode &&
      hasEventData()
    ) {
      setPendingEventCode(nextEventCode);
      setIsEventChangeDialogOpen(true);
      return;
    }

    void loadEventTeams(nextEventCode, false);
  }

  async function updateTrackedPicklists(nextPicklistIds: Id<"picklists">[]) {
    if (!selectedAllianceSelectionId || !canEditAllianceSelection) {
      return;
    }

    setLocalTrackedPicklistIds(nextPicklistIds);
    setIsSaving(true);

    try {
      await setTrackedPicklists({
        allianceSelectionId: selectedAllianceSelectionId,
        trackedPicklistIds: nextPicklistIds,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update picklists",
      );
    } finally {
      setIsSaving(false);
      scheduleDocumentScrollRestore();
    }
  }

  async function updateIncludeThirdPick(
    nextIncludeThirdPick: boolean,
    options?: { clearThirdPickTeams?: boolean },
  ) {
    if (!selectedAllianceSelectionId || !canEditAllianceSelection) {
      return;
    }

    const shouldClearThirdPickTeams = options?.clearThirdPickTeams ?? false;
    const previousAlliances = alliances;
    const previousIncludeThirdPick = includeThirdPick;
    const nextAlliances = shouldClearThirdPickTeams
      ? clearThirdPickTeams(alliances)
      : alliances;

    setLocalIncludeThirdPick(nextIncludeThirdPick);
    if (shouldClearThirdPickTeams) {
      setAlliances(nextAlliances);
    }
    setIsSaving(true);

    try {
      await setIncludeThirdPick({
        allianceSelectionId: selectedAllianceSelectionId,
        includeThirdPick: nextIncludeThirdPick,
        clearThirdPickSelections: shouldClearThirdPickTeams,
      });
      setIsThirdPickToggleDialogOpen(false);
    } catch (error) {
      setLocalIncludeThirdPick(previousIncludeThirdPick);
      if (shouldClearThirdPickTeams) {
        setAlliances(previousAlliances);
      }
      toast.error(
        error instanceof Error ? error.message : "Unable to update columns",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function requestIncludeThirdPickToggle() {
    if (includeThirdPick && selectedThirdPickCount > 0) {
      setIsThirdPickToggleDialogOpen(true);
      return;
    }

    void updateIncludeThirdPick(!includeThirdPick);
  }

  async function updateAllianceCell(
    rowId: string,
    slot: AllianceSlot,
    team: Team | undefined,
  ) {
    if (!selectedAllianceSelectionId || !canEditAllianceSelection) {
      return;
    }

    const nextAlliances = alliances.map((row) =>
      row.id === rowId ? { ...row, [slot]: team } : row,
    );

    setAlliances(nextAlliances);
    setIsSaving(true);

    try {
      await replaceAlliances({
        allianceSelectionId: selectedAllianceSelectionId,
        alliances: nextAlliances,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update alliances",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleTrackedPicklist(picklistId: Id<"picklists">) {
    const nextPicklistIds = trackedPicklistIds.includes(picklistId)
      ? trackedPicklistIds.filter((trackedId) => trackedId !== picklistId)
      : [...trackedPicklistIds, picklistId];

    void updateTrackedPicklists(nextPicklistIds);
  }

  async function selectAllianceSelection(value: string) {
    scheduleDocumentScrollRestore();

    try {
      await setAllianceSelectionId(value || null);
    } finally {
      scheduleDocumentScrollRestore();
    }
  }

  return (
    <div className="flex min-h-screen w-[calc(100vw-2rem)] max-w-[1800px] flex-col gap-4 pb-12 pt-10 [margin-left:calc(50%_-_50vw_+_1rem)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Hero text="Alliance Selection" />
          {selectedAllianceSelection && (
            <Badge variant={canEditAllianceSelection ? "default" : "secondary"}>
              {canEditAllianceSelection ? "Saved" : "View only"}
            </Badge>
          )}
          {isSaving && <Badge variant="outline">Saving...</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={allianceSelectionId ?? ""}
            items={allianceSelectionItems}
            onValueChange={(value) => {
              void selectAllianceSelection(value);
            }}
            onOpenChange={(open) => {
              if (!open) {
                scheduleDocumentScrollRestore();
              }
            }}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select an alliance selection" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">Select an alliance selection</SelectItem>
                {(allianceSelections ?? []).map((selection) => (
                  <SelectItem key={selection._id} value={selection._id}>
                    {selection.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {shouldShowEditActions && (
            <Button onClick={createAllianceSelection} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          )}
        </div>
      </div>

      {!hasLoadedSelectedAllianceSelection ? (
        <Card className="rounded-xl p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </Card>
      ) : !selectedAllianceSelectionId || !selectedAllianceSelection ? (
        <Card className="rounded-xl p-8">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No alliance selection selected</EmptyTitle>
              <EmptyDescription>
                Create or select an alliance selection to start tracking picks.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={createAllianceSelection} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create alliance selection"}
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      ) : (
        <>
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex flex-wrap items-end gap-4">
                <FieldGroup className="max-w-xl flex-1">
                  <Field>
                    <FieldLabel htmlFor="alliance-selection-name">
                      Picklist Name
                    </FieldLabel>
                    <Input
                      id="alliance-selection-name"
                      value={name}
                      disabled={!canEditAllianceSelection}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </Field>
                </FieldGroup>
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitEventCode();
                  }}
                >
                  <Field>
                    <FieldLabel htmlFor="alliance-selection-event">
                      Event code
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="alliance-selection-event"
                        value={eventCode}
                        disabled={!canEditAllianceSelection}
                        onChange={(event) => setEventCode(event.target.value)}
                        placeholder="2025onbar"
                        className="w-40"
                      />
                      {canEditAllianceSelection && (
                        <Button
                          type="submit"
                          disabled={isLoadingTeams || !eventCode.trim()}
                        >
                          {isLoadingTeams ? "Loading..." : "Load"}
                        </Button>
                      )}
                    </div>
                  </Field>
                </form>
              </div>
              {canEditAllianceSelection && (
                <CardAction>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Track picklists</p>
                  <p className="text-sm text-muted-foreground">
                    Picklists with the same event code can be tracked during
                    alliance selection.
                  </p>
                </div>
                {eventTeams.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {eventTeams.length} event teams loaded
                    </Badge>
                  </div>
                )}
              </div>
              {!eventCode.trim() ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No event loaded</EmptyTitle>
                    <EmptyDescription>
                      Enter an event code to find matching picklists.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : picklistsForEvent === undefined ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-48 rounded-4xl" />
                  ))}
                </div>
              ) : picklistsForEvent.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No matching picklists</EmptyTitle>
                    <EmptyDescription>
                      No picklists have been loaded for this event code yet.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex max-h-32 flex-wrap gap-4 overflow-y-auto pr-1">
                  {picklistsForEvent.map((picklist) => {
                    const isTracked = trackedPicklistIds.includes(picklist._id);
                    const teamCount = flattenPicklistTeams(
                      picklist.columns,
                    ).length;

                    return (
                      <div
                        key={picklist._id}
                        className="border-input bg-input/20 flex p-2 max-w-80 items-center gap-2 rounded-4xl border pl-3"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {picklist.name}
                        </span>
                        <Badge variant="outline">
                          {teamCount} {teamCount === 1 ? "team" : "teams"}
                        </Badge>
                        {canEditAllianceSelection && (
                          <Button
                            size="sm"
                            variant={isTracked ? "outline" : "default"}
                            onClick={() => toggleTrackedPicklist(picklist._id)}
                          >
                            {isTracked ? "Untrack" : "Track"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex min-h-48 flex-wrap gap-4">
            {trackedPicklists.length > 0 ? (
              trackedPicklists.map((picklist) => (
                <TrackedPicklistCard
                  key={picklist._id}
                  picklist={picklist}
                  pickedTeamNumbers={pickedTeamNumbers}
                />
              ))
            ) : (
              <Card className="flex-1 rounded-xl p-8">
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No tracked picklists</EmptyTitle>
                    <EmptyDescription>
                      Track picklists for this event to see top available picks.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Card>
            )}
          </div>

          <Card className="rounded-xl">
            <CardContent className="flex flex-col gap-3">
              {canEditAllianceSelection && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestIncludeThirdPickToggle}
                  >
                    {includeThirdPick ? "Hide third pick" : "Show third pick"}
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Alliance</TableHead>
                    <TableHead>Captain</TableHead>
                    <TableHead>First pick</TableHead>
                    <TableHead>Second pick</TableHead>
                    {includeThirdPick && <TableHead>Third pick</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alliances.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      {(["captain", "firstPick", "secondPick"] as const).map(
                        (slot) => (
                          <TableCell key={slot}>
                            <TeamCombobox
                              team={row[slot]}
                              teams={eventTeams}
                              pickedTeamNumbers={getPickedTeamNumbersExceptCell(
                                alliances,
                                row.id,
                                slot,
                              )}
                              disabled={
                                !canEditAllianceSelection ||
                                eventTeams.length === 0
                              }
                              onChange={(team) => {
                                void updateAllianceCell(row.id, slot, team);
                              }}
                            />
                          </TableCell>
                        ),
                      )}
                      {includeThirdPick && (
                        <TableCell>
                          <TeamCombobox
                            team={row.thirdPick}
                            teams={eventTeams}
                            pickedTeamNumbers={getPickedTeamNumbersExceptCell(
                              alliances,
                              row.id,
                              "thirdPick",
                            )}
                            disabled={
                              !canEditAllianceSelection ||
                              eventTeams.length === 0
                            }
                            onChange={(team) => {
                              void updateAllianceCell(
                                row.id,
                                "thirdPick",
                                team,
                              );
                            }}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {eventTeams.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Load an event before selecting teams.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog
        open={isEventChangeDialogOpen}
        onOpenChange={setIsEventChangeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change event and clear picks?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading a different event will clear tracked picklists and every
              alliance grid pick. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingEventCode) {
                  void loadEventTeams(pendingEventCode, true);
                }
              }}
            >
              Change event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete alliance selection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this alliance selection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                void removeAllianceSelection();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isThirdPickToggleDialogOpen}
        onOpenChange={setIsThirdPickToggleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hide third pick and unmark teams?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the third-pick column and unmark{" "}
              {selectedThirdPickCount}{" "}
              {selectedThirdPickCount === 1 ? "team" : "teams"} selected in that
              column.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={() => {
                void updateIncludeThirdPick(false, {
                  clearThirdPickTeams: true,
                });
              }}
            >
              {isSaving ? "Hiding..." : "Hide and unmark"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
