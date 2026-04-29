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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import Hero from "@/components/common/Hero";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAction, useMutation, useQuery } from "convex/react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import PicklistTeamCard from "./PicklistTeamCard";
import type { PicklistColumn, PicklistTeam } from "./types";

const SOURCE_PREFIX = "source:";
const TEAM_PREFIX = "team:";
const COLUMN_PREFIX = "column:";
const NAME_SAVE_DEBOUNCE_MS = 400;

type TeamSortMode = "teamNumberAsc" | "epaDesc";

const picklistCollisionDetection: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    return pointerWithin(args);
  }

  return closestCorners(args);
};

function createColumnId() {
  return `column-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTeamDragId(teamNumber: number) {
  return `${TEAM_PREFIX}${teamNumber}`;
}

function getSourceDragId(teamNumber: number) {
  return `${SOURCE_PREFIX}${teamNumber}`;
}

function getColumnDropId(columnId: string) {
  return `${COLUMN_PREFIX}${columnId}`;
}

function getPlacedTeamNumbers(columns: PicklistColumn[]) {
  return new Set(
    columns.flatMap((column) => column.teams.map((team) => team.teamNumber)),
  );
}

function findTeamInColumns(columns: PicklistColumn[], teamNumber: number) {
  for (const column of columns) {
    const teamIndex = column.teams.findIndex(
      (team) => team.teamNumber === teamNumber,
    );

    if (teamIndex !== -1) {
      return { team: column.teams[teamIndex], columnId: column.id, teamIndex };
    }
  }

  return null;
}

function mergeColumnsWithEventTeams(
  columns: PicklistColumn[],
  eventTeams: PicklistTeam[],
) {
  const teamsByNumber = new Map(
    eventTeams.map((team) => [team.teamNumber, team]),
  );

  return columns.map((column) => ({
    ...column,
    teams: column.teams.map(
      (team) => teamsByNumber.get(team.teamNumber) ?? team,
    ),
  }));
}

function mergeEpaIntoTeams(
  teams: PicklistTeam[],
  epaValues: Array<{ teamNumber: number; epaMean: number }>,
) {
  const epaByTeam = new Map(
    epaValues.map((team) => [team.teamNumber, team.epaMean]),
  );

  return teams.map((team) => {
    const epaMean = epaByTeam.get(team.teamNumber);
    return epaMean === undefined ? team : { ...team, epaMean };
  });
}

function mergeEpaIntoColumns(
  columns: PicklistColumn[],
  epaValues: Array<{ teamNumber: number; epaMean: number }>,
) {
  return columns.map((column) => ({
    ...column,
    teams: mergeEpaIntoTeams(column.teams, epaValues),
  }));
}

function sortTeams(teams: PicklistTeam[], sortMode: TeamSortMode) {
  return [...teams].sort((firstTeam, secondTeam) => {
    if (sortMode === "epaDesc") {
      const firstEpa = firstTeam.epaMean ?? Number.NEGATIVE_INFINITY;
      const secondEpa = secondTeam.epaMean ?? Number.NEGATIVE_INFINITY;

      if (firstEpa !== secondEpa) {
        return secondEpa - firstEpa;
      }
    }

    return firstTeam.teamNumber - secondTeam.teamNumber;
  });
}

function DraggableSourceTeam({
  team,
  disabled,
}: {
  team: PicklistTeam;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getSourceDragId(team.teamNumber),
    data: { team },
    disabled,
  });

  return (
    <PicklistTeamCard
      team={team}
      className="w-40"
      setNodeRef={setNodeRef}
      dragHandleProps={disabled ? undefined : { ...attributes, ...listeners }}
      dragging={isDragging}
    />
  );
}

function SortableColumnTeam({
  team,
  disabled,
  onRemove,
}: {
  team: PicklistTeam;
  disabled: boolean;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getTeamDragId(team.teamNumber),
    data: { team },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <PicklistTeamCard
      team={team}
      setNodeRef={setNodeRef}
      dragHandleProps={disabled ? undefined : { ...attributes, ...listeners }}
      onRemove={disabled ? undefined : onRemove}
      style={style}
      dragging={isDragging}
    />
  );
}

type PicklistColumnCardProps = {
  column: PicklistColumn;
  canEdit: boolean;
  onDelete: (columnId: string) => void;
  onRemoveTeam: (columnId: string, teamNumber: number) => void;
  onRename: (columnId: string, name: string) => void;
};

function PicklistColumnCard({
  column,
  canEdit,
  onDelete,
  onRemoveTeam,
  onRename,
}: PicklistColumnCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDropId(column.id),
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-72 min-w-60 flex-1 gap-3 overflow-visible rounded-xl bg-card/80 p-3",
        isOver && "ring-primary/50 ring-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Input
            value={column.name}
            onChange={(event) => onRename(column.id, event.target.value)}
            disabled={!canEdit}
            aria-label="Column name"
            className="font-semibold"
          />
          <p className="text-xs text-muted-foreground">
            {column.teams.length} teams
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!canEdit}
          onClick={() => onDelete(column.id)}
        >
          Delete
        </Button>
      </div>

      <SortableContext
        items={column.teams.map((team) => getTeamDragId(team.teamNumber))}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-40 flex-col gap-2 rounded-xl bg-muted/40 p-2">
          {column.teams.length > 0 ? (
            column.teams.map((team) => (
              <SortableColumnTeam
                key={team.teamNumber}
                team={team}
                disabled={!canEdit}
                onRemove={() => onRemoveTeam(column.id, team.teamNumber)}
              />
            ))
          ) : (
            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">
              Drop teams here
            </div>
          )}
        </div>
      </SortableContext>
    </Card>
  );
}

export default function Picklist() {
  const [picklistId, setPicklistId] = useQueryState("picklistId");
  const selectedPicklistId = picklistId
    ? (picklistId as Id<"picklists">)
    : null;

  const picklists = useQuery(api.picklists.listAll, {});
  const selectedPicklist = useQuery(
    api.picklists.getById,
    selectedPicklistId ? { picklistId: selectedPicklistId } : "skip",
  );
  const createBlank = useMutation(api.picklists.createBlank);
  const deletePicklist = useMutation(api.picklists.remove);
  const replaceColumns = useMutation(api.picklists.replaceColumns);
  const replaceEpaValues = useMutation(api.picklists.replaceEpaValues);
  const replaceEventTeams = useMutation(api.picklists.replaceEventTeams);
  const renamePicklist = useMutation(api.picklists.rename);
  const getEpaByEvent = useAction(api.frcEvents.getEpaByEvent);
  const getTeamsByEvent = useAction(api.frcEvents.getTeamsByEvent);

  const [name, setName] = useState("Untitled picklist");
  const [eventCode, setLocalEventCode] = useState("");
  const [eventTeams, setEventTeams] = useState<PicklistTeam[]>([]);
  const [columns, setColumns] = useState<PicklistColumn[]>([]);
  const [activeTeam, setActiveTeam] = useState<PicklistTeam | null>(null);
  const [pendingEventCode, setPendingEventCode] = useState<string | null>(null);
  const [pendingDeleteColumnId, setPendingDeleteColumnId] = useState<
    string | null
  >(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isRefreshingEpa, setIsRefreshingEpa] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameEditVersion, setNameEditVersion] = useState(0);
  const [columnNameEditVersion, setColumnNameEditVersion] = useState(0);
  const [teamSortMode, setTeamSortMode] =
    useState<TeamSortMode>("teamNumberAsc");
  const columnsDirtyRef = useRef(false);
  const eventCodeDirtyRef = useRef(false);
  const lastHydratedPicklistIdRef = useRef<string | null>(null);
  const latestColumnNameEditVersionRef = useRef(0);
  const latestNameEditVersionRef = useRef(0);
  const nameDirtyRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!selectedPicklist) return;

    const isDifferentPicklist =
      lastHydratedPicklistIdRef.current !== selectedPicklist._id;

    if (isDifferentPicklist) {
      lastHydratedPicklistIdRef.current = selectedPicklist._id;
      columnsDirtyRef.current = false;
      eventCodeDirtyRef.current = false;
      latestColumnNameEditVersionRef.current = 0;
      latestNameEditVersionRef.current = 0;
      nameDirtyRef.current = false;
      setColumnNameEditVersion(0);
      setEventTeams(selectedPicklist.eventTeams);
      setLocalEventCode(selectedPicklist.eventCode);
      setName(selectedPicklist.name);
      setNameEditVersion(0);
      setColumns(selectedPicklist.columns);
      return;
    }

    if (!nameDirtyRef.current) {
      setName(selectedPicklist.name);
    }

    if (!eventCodeDirtyRef.current) {
      setLocalEventCode(selectedPicklist.eventCode);
    }

    setEventTeams(selectedPicklist.eventTeams);

    if (!columnsDirtyRef.current) {
      setColumns(selectedPicklist.columns);
    }
  }, [selectedPicklist]);

  const placedTeamNumbers = useMemo(
    () => getPlacedTeamNumbers(columns),
    [columns],
  );
  const availableTeams = useMemo(
    () =>
      sortTeams(
        eventTeams.filter((team) => !placedTeamNumbers.has(team.teamNumber)),
        teamSortMode,
      ),
    [eventTeams, placedTeamNumbers, teamSortMode],
  );
  const canEditPicklist = selectedPicklist?.canEdit ?? false;

  async function createPicklist() {
    setIsCreating(true);

    try {
      const id = await createBlank({ name: "Untitled picklist" });
      await setPicklistId(id);
      setColumns([]);
      setEventTeams([]);
      toast.success("Created a blank picklist");
    } catch {
      toast.error("Unable to create picklist");
    } finally {
      setIsCreating(false);
    }
  }

  async function persistColumns(
    nextColumns: PicklistColumn[],
    editVersion?: number,
  ) {
    if (!selectedPicklistId || !canEditPicklist) return;

    setIsSaving(true);
    const isCurrentEdit = () =>
      editVersion === undefined ||
      latestColumnNameEditVersionRef.current === editVersion;

    try {
      await replaceColumns({
        picklistId: selectedPicklistId,
        columns: nextColumns,
      });
    } catch {
      if (isCurrentEdit()) {
        toast.error("Unable to save picklist changes");
      }

      if (selectedPicklist && isCurrentEdit()) {
        setColumns(selectedPicklist.columns);
      }
    } finally {
      if (isCurrentEdit()) {
        columnsDirtyRef.current = false;
        setIsSaving(false);
      }
    }
  }

  async function addColumn() {
    if (!canEditPicklist) return;

    const nextColumns = [
      ...columns,
      {
        id: createColumnId(),
        name: `Column ${columns.length + 1}`,
        teams: [],
      },
    ];

    columnsDirtyRef.current = true;
    setColumns(nextColumns);
    await persistColumns(nextColumns);
  }

  function renameColumn(columnId: string, columnName: string) {
    if (!canEditPicklist) return;

    const nextColumns = columns.map((column) =>
      column.id === columnId ? { ...column, name: columnName } : column,
    );

    columnsDirtyRef.current = true;
    latestColumnNameEditVersionRef.current += 1;
    setColumnNameEditVersion(latestColumnNameEditVersionRef.current);
    setColumns(nextColumns);
  }

  async function deleteColumn(columnId: string) {
    if (!canEditPicklist) return;

    const nextColumns = columns.filter((column) => column.id !== columnId);

    columnsDirtyRef.current = true;
    setColumns(nextColumns);
    await persistColumns(nextColumns);
  }

  function requestDeleteColumn(columnId: string) {
    if (!canEditPicklist) return;

    const column = columns.find((currentColumn) => currentColumn.id === columnId);
    if (!column) return;

    if (column.teams.length > 0) {
      setPendingDeleteColumnId(columnId);
      return;
    }

    void deleteColumn(columnId);
  }

  async function removeTeamFromColumn(columnId: string, teamNumber: number) {
    if (!canEditPicklist) return;

    const nextColumns = columns.map((column) =>
      column.id === columnId
        ? {
            ...column,
            teams: column.teams.filter(
              (team) => team.teamNumber !== teamNumber,
            ),
          }
        : column,
    );

    columnsDirtyRef.current = true;
    setColumns(nextColumns);
    await persistColumns(nextColumns);
  }

  async function removeSelectedPicklist() {
    if (!selectedPicklistId || !canEditPicklist) return;

    setIsSaving(true);

    try {
      await deletePicklist({ picklistId: selectedPicklistId });
      await setPicklistId(null);
      setColumns([]);
      setEventTeams([]);
      setIsDeleteDialogOpen(false);
      toast.success("Deleted picklist");
    } catch {
      toast.error("Unable to delete picklist");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (
      !selectedPicklistId ||
      !selectedPicklist ||
      !canEditPicklist ||
      !nameDirtyRef.current ||
      nameEditVersion === 0
    ) {
      return;
    }

    const editVersion = nameEditVersion;
    const timeout = window.setTimeout(() => {
      if (latestNameEditVersionRef.current !== editVersion) return;

      if (name.trim() === selectedPicklist.name) {
        nameDirtyRef.current = false;
        return;
      }

      setIsSaving(true);
      void renamePicklist({
        picklistId: selectedPicklistId,
        name,
      })
        .then(() => {
          if (latestNameEditVersionRef.current === editVersion) {
            nameDirtyRef.current = false;
          }
        })
        .catch(() => {
          if (latestNameEditVersionRef.current === editVersion) {
            nameDirtyRef.current = false;
            setName(selectedPicklist.name);
            toast.error("Unable to rename picklist");
          }
        })
        .finally(() => {
          if (latestNameEditVersionRef.current === editVersion) {
            setIsSaving(false);
          }
        });
    }, NAME_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [
    canEditPicklist,
    name,
    nameEditVersion,
    renamePicklist,
    selectedPicklist,
    selectedPicklistId,
  ]);

  useEffect(() => {
    if (
      !selectedPicklistId ||
      !selectedPicklist ||
      !canEditPicklist ||
      !columnsDirtyRef.current ||
      columnNameEditVersion === 0
    ) {
      return;
    }

    const editVersion = columnNameEditVersion;
    const timeout = window.setTimeout(() => {
      if (latestColumnNameEditVersionRef.current !== editVersion) return;

      void persistColumns(columns, editVersion);
    }, NAME_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [
    canEditPicklist,
    columnNameEditVersion,
    columns,
    selectedPicklist,
    selectedPicklistId,
  ]);

  function hasEventData() {
    return (
      eventTeams.length > 0 || columns.some((column) => column.teams.length > 0)
    );
  }

  function isChangingEvent(nextEventCode: string) {
    const savedEventCode = selectedPicklist?.eventCode.trim();

    return (
      Boolean(savedEventCode) &&
      savedEventCode?.toLowerCase() !== nextEventCode.trim().toLowerCase()
    );
  }

  async function loadEventTeamsForCode(
    nextEventCode: string,
    clearColumns: boolean,
  ) {
    if (!selectedPicklistId || !canEditPicklist || !nextEventCode.trim())
      return;

    setIsLoadingTeams(true);

    try {
      const teams = await getTeamsByEvent({ eventCode: nextEventCode });
      await replaceEventTeams({
        picklistId: selectedPicklistId,
        eventCode: nextEventCode,
        eventTeams: teams,
        clearColumns,
      });
      eventCodeDirtyRef.current = false;
      setEventTeams(teams);
      setLocalEventCode(nextEventCode);

      if (clearColumns) {
        columnsDirtyRef.current = false;
        setColumns([]);
      } else {
        setColumns((currentColumns) =>
          mergeColumnsWithEventTeams(currentColumns, teams),
        );
      }

      toast.success(`Loaded ${teams.length} teams`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load teams",
      );
    } finally {
      setIsLoadingTeams(false);
    }
  }

  async function refreshEpaValues() {
    if (!selectedPicklistId || !canEditPicklist || !eventCode.trim()) return;

    setIsRefreshingEpa(true);

    try {
      const epaValues = await getEpaByEvent({ eventCode });
      await replaceEpaValues({
        picklistId: selectedPicklistId,
        epaValues,
      });

      setEventTeams((currentTeams) =>
        mergeEpaIntoTeams(currentTeams, epaValues),
      );
      setColumns((currentColumns) =>
        mergeEpaIntoColumns(currentColumns, epaValues),
      );
      toast.success(`Refreshed EPA for ${epaValues.length} teams`);
    } catch {
      toast.error("Unable to refresh EPA values");
    } finally {
      setIsRefreshingEpa(false);
    }
  }

  function submitEventCode() {
    if (!canEditPicklist) return;

    const nextEventCode = eventCode.trim();
    if (!nextEventCode) return;

    if (isChangingEvent(nextEventCode) && hasEventData()) {
      setPendingEventCode(nextEventCode);
      return;
    }

    void loadEventTeamsForCode(nextEventCode, false);
  }

  function getTeamFromActiveId(activeId: string) {
    if (activeId.startsWith(SOURCE_PREFIX)) {
      const teamNumber = Number(activeId.slice(SOURCE_PREFIX.length));
      return eventTeams.find((team) => team.teamNumber === teamNumber) ?? null;
    }

    if (activeId.startsWith(TEAM_PREFIX)) {
      const teamNumber = Number(activeId.slice(TEAM_PREFIX.length));
      return findTeamInColumns(columns, teamNumber)?.team ?? null;
    }

    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTeam(getTeamFromActiveId(String(event.active.id)));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTeam(null);

    if (!event.over || !selectedPicklistId || !canEditPicklist) return;

    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    const draggedTeam = getTeamFromActiveId(activeId);

    if (!draggedTeam) return;

    const originalLocation = activeId.startsWith(TEAM_PREFIX)
      ? findTeamInColumns(columns, draggedTeam.teamNumber)
      : null;
    let destinationColumnId: string | null = null;
    let destinationIndex = 0;
    let overLocation: ReturnType<typeof findTeamInColumns> = null;

    if (overId.startsWith(COLUMN_PREFIX)) {
      destinationColumnId = overId.slice(COLUMN_PREFIX.length);
      const destinationColumn = columns.find(
        (column) => column.id === destinationColumnId,
      );
      destinationIndex = destinationColumn?.teams.length ?? 0;
    }

    if (overId.startsWith(TEAM_PREFIX)) {
      const overTeamNumber = Number(overId.slice(TEAM_PREFIX.length));
      overLocation = findTeamInColumns(columns, overTeamNumber);

      if (overLocation) {
        destinationColumnId = overLocation.columnId;
        destinationIndex = overLocation.teamIndex;
      }
    }

    if (!destinationColumnId || activeId === overId) return;

    if (originalLocation?.columnId === destinationColumnId && overLocation) {
      const nextColumns = columns.map((column) =>
        column.id === destinationColumnId
          ? {
              ...column,
              teams: arrayMove(
                column.teams,
                originalLocation.teamIndex,
                overLocation.teamIndex,
              ),
            }
          : column,
      );

      columnsDirtyRef.current = true;
      setColumns(nextColumns);
      await persistColumns(nextColumns);
      return;
    }

    const withoutDraggedTeam = columns.map((column) => ({
      ...column,
      teams: column.teams.filter(
        (team) => team.teamNumber !== draggedTeam.teamNumber,
      ),
    }));
    const nextColumns = withoutDraggedTeam.map((column) => {
      if (column.id !== destinationColumnId) return column;

      const teams = [...column.teams];
      teams.splice(destinationIndex, 0, draggedTeam);
      return { ...column, teams };
    });

    columnsDirtyRef.current = true;
    setColumns(nextColumns);
    await persistColumns(nextColumns);
  }

  const hasLoadedSelectedPicklist =
    !selectedPicklistId || selectedPicklist !== undefined;

  return (
    <div className="flex min-h-screen w-[calc(100vw-2rem)] max-w-[1800px] flex-col gap-4 pb-12 pt-10 [margin-left:calc(50%_-_50vw_+_1rem)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Hero text="Picklist" />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={picklistId ?? undefined}
            onValueChange={(value) => {
              void setPicklistId(value);
              setEventTeams([]);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a picklist" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {picklists?.length ? (
                  picklists.map((picklist) => (
                    <SelectItem key={picklist._id} value={picklist._id}>
                      {picklist.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-picklists" disabled>
                    No saved picklists
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button type="button" onClick={createPicklist} disabled={isCreating}>
            {isCreating ? "Creating..." : "New picklist"}
          </Button>
        </div>
      </div>

      {!hasLoadedSelectedPicklist ? (
        <Card className="rounded-xl p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </Card>
      ) : selectedPicklistId && selectedPicklist === null ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Picklist not found</EmptyTitle>
            <EmptyDescription>
              This link does not point to an existing picklist.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={createPicklist}>
              Create a new picklist
            </Button>
          </EmptyContent>
        </Empty>
      ) : selectedPicklistId ? (
        <DndContext
          sensors={sensors}
          collisionDetection={picklistCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
          onDragCancel={() => setActiveTeam(null)}
        >
          <div className="flex flex-col gap-4">
            <Card className="overflow-visible rounded-xl bg-white/80 p-4 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-64 flex-col gap-3 md:w-1/2">
                    <FieldGroup className="gap-3">
                      <Field>
                        <FieldLabel htmlFor="picklist-name">
                          Picklist name
                        </FieldLabel>
                        <Input
                          id="picklist-name"
                          value={name}
                          disabled={!canEditPicklist}
                          onChange={(event) => {
                            nameDirtyRef.current = true;
                            latestNameEditVersionRef.current += 1;
                            setNameEditVersion(
                              latestNameEditVersionRef.current,
                            );
                            setName(event.target.value);
                          }}
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {canEditPicklist
                        ? isSaving
                          ? "Saving..."
                          : "Saved to Convex"
                        : "View only"}
                    </Badge>
                    {canEditPicklist ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        Delete picklist
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="rounded-xl bg-white/80 p-4 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Picklist board</CardTitle>
                    <CardDescription>
                      Add columns, then drag teams into the order you want.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addColumn}
                    disabled={!canEditPicklist}
                  >
                    Add column
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                {columns.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto px-1 pb-3 pt-1">
                    {columns.map((column) => (
                      <PicklistColumnCard
                        key={column.id}
                        column={column}
                        canEdit={canEditPicklist}
                        onRename={renameColumn}
                        onDelete={requestDeleteColumn}
                        onRemoveTeam={(columnId, teamNumber) => {
                          void removeTeamFromColumn(columnId, teamNumber);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty className="min-h-72 border">
                    <EmptyHeader>
                      <EmptyTitle>No columns yet</EmptyTitle>
                      <EmptyDescription>
                        Start with a blank board, then add columns for your
                        alliance selection tiers.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button
                        type="button"
                        onClick={addColumn}
                        disabled={!canEditPicklist}
                      >
                        Add first column
                      </Button>
                    </EmptyContent>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl bg-white/80 p-4 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col items-start gap-2">
                    <CardTitle>Event teams</CardTitle>
                    <Select
                      value={teamSortMode}
                      onValueChange={(value) =>
                        setTeamSortMode(value as TeamSortMode)
                      }
                    >
                      <SelectTrigger className="w-auto min-w-56">
                        <SelectValue placeholder="Sort teams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="teamNumberAsc">
                            Team number ascending
                          </SelectItem>
                          <SelectItem value="epaDesc">
                            EPA descending
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <form
                    className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitEventCode();
                    }}
                  >
                    <label htmlFor="event-code" className="sr-only">
                      Event code
                    </label>
                    <Input
                      id="event-code"
                      value={eventCode}
                      disabled={!canEditPicklist}
                      onChange={(event) => {
                        eventCodeDirtyRef.current = true;
                        setLocalEventCode(event.target.value);
                      }}
                      placeholder="2025onbar"
                      className="w-36"
                    />
                    <Button
                      type="submit"
                      disabled={
                        !canEditPicklist || isLoadingTeams || !eventCode.trim()
                      }
                    >
                      {isLoadingTeams ? "Loading..." : "Load"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        !canEditPicklist ||
                        isRefreshingEpa ||
                        !eventCode.trim() ||
                        eventTeams.length === 0
                      }
                      onClick={() => {
                        void refreshEpaValues();
                      }}
                    >
                      {isRefreshingEpa ? "Refreshing..." : "Refresh EPA"}
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="px-0">
                {isLoadingTeams ? (
                  <div className="grid max-h-72 grid-cols-[repeat(auto-fill,minmax(10rem,10rem))] gap-2 overflow-y-auto py-px pl-px pr-2">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : eventTeams.length === 0 ? (
                  <Empty className="min-h-48 border">
                    <EmptyHeader>
                      <EmptyTitle>No teams loaded</EmptyTitle>
                      <EmptyDescription>
                        Load an event to make its teams available for dragging.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : availableTeams.length > 0 ? (
                  <div className="grid max-h-72 grid-cols-[repeat(auto-fill,minmax(10rem,10rem))] gap-2 overflow-y-auto py-px pl-px pr-2">
                    {availableTeams.map((team) => (
                      <DraggableSourceTeam
                        key={team.teamNumber}
                        team={team}
                        disabled={!canEditPicklist}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty className="min-h-48 border">
                    <EmptyHeader>
                      <EmptyTitle>All teams are placed</EmptyTitle>
                      <EmptyDescription>
                        Every loaded team is already in a picklist column.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>
          <DragOverlay>
            {activeTeam ? <PicklistTeamCard team={activeTeam} /> : null}
          </DragOverlay>
          <AlertDialog
            open={pendingEventCode !== null}
            onOpenChange={(open) => {
              if (!open) {
                setPendingEventCode(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Change event and clear columns?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Loading teams for a different event will remove every team
                  from every picklist column. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    if (!pendingEventCode) return;

                    void loadEventTeamsForCode(pendingEventCode, true);
                    setPendingEventCode(null);
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
                <AlertDialogTitle>Delete this picklist?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the picklist, its columns, and
                  saved event teams. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    void removeSelectedPicklist();
                  }}
                >
                  Delete picklist
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog
            open={pendingDeleteColumnId !== null}
            onOpenChange={(open) => {
              if (!open) {
                setPendingDeleteColumnId(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete column and return teams to the pool?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Deleting this column with teams still in it will cause all of
                  its teams to return back to the team pool.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    if (!pendingDeleteColumnId) return;

                    void deleteColumn(pendingDeleteColumnId);
                    setPendingDeleteColumnId(null);
                  }}
                >
                  Delete column
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DndContext>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Create or select a picklist</EmptyTitle>
            <EmptyDescription>
              New picklists open as blank boards and get a shareable URL.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={createPicklist}>
              Create blank picklist
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
