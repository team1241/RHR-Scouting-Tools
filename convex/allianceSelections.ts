import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getFormattedTimestamp } from "./utils";

const teamValidator = v.object({
  teamNumber: v.number(),
  nameShort: v.string(),
  primaryColor: v.optional(v.string()),
  epaMean: v.optional(v.number()),
  city: v.optional(v.string()),
  stateProv: v.optional(v.string()),
  country: v.optional(v.string()),
});

const allianceRowValidator = v.object({
  id: v.string(),
  captain: v.optional(teamValidator),
  firstPick: v.optional(teamValidator),
  secondPick: v.optional(teamValidator),
  thirdPick: v.optional(teamValidator),
});

const allianceSelectionWithPermissionsValidator = v.object({
  _id: v.id("allianceSelections"),
  _creationTime: v.number(),
  name: v.string(),
  ownerSubject: v.optional(v.string()),
  eventCode: v.string(),
  eventTeams: v.array(teamValidator),
  trackedPicklistIds: v.array(v.id("picklists")),
  alliances: v.array(allianceRowValidator),
  includeThirdPick: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.string(),
  canEdit: v.boolean(),
});

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

type NormalizedAllianceSelection = {
  _id: Id<"allianceSelections">;
  _creationTime: number;
  name: string;
  ownerSubject?: string;
  eventCode: string;
  eventTeams: Team[];
  trackedPicklistIds: Id<"picklists">[];
  alliances: AllianceRow[];
  includeThirdPick: boolean;
  createdAt: string;
  updatedAt: string;
};

function createEmptyAlliances(): AllianceRow[] {
  return Array.from({ length: 8 }, (_, index) => ({
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

function normalizeAlliances(alliances: AllianceRow[] | undefined) {
  const rows = alliances ?? [];
  const normalized = rows.slice(0, 8);

  while (normalized.length < 8) {
    normalized.push({ id: `alliance-${normalized.length + 1}` });
  }

  return normalized.map((row, index) => ({
    ...row,
    id: row.id || `alliance-${index + 1}`,
  }));
}

function normalizeAllianceSelection(allianceSelection: {
  _id: Id<"allianceSelections">;
  _creationTime: number;
  name: string;
  ownerSubject?: string;
  eventCode?: string;
  eventTeams?: Team[];
  trackedPicklistIds?: Id<"picklists">[];
  alliances?: AllianceRow[];
  includeThirdPick?: boolean;
  createdAt: string;
  updatedAt: string;
}): NormalizedAllianceSelection {
  return {
    ...allianceSelection,
    eventCode: allianceSelection.eventCode ?? "",
    eventTeams: allianceSelection.eventTeams ?? [],
    trackedPicklistIds: allianceSelection.trackedPicklistIds ?? [],
    alliances: normalizeAlliances(allianceSelection.alliances),
    includeThirdPick: allianceSelection.includeThirdPick ?? false,
  };
}

function withPermissions(
  allianceSelection: NormalizedAllianceSelection,
  viewerSubject: string | undefined
) {
  return {
    ...allianceSelection,
    canEdit: Boolean(
      viewerSubject && allianceSelection.ownerSubject === viewerSubject
    ),
  };
}

function mergeTeamMetadata(team: Team | undefined, teamsByNumber: Map<number, Team>) {
  if (!team) {
    return undefined;
  }

  return teamsByNumber.get(team.teamNumber) ?? team;
}

function mergeAllianceMetadata(alliances: AllianceRow[], eventTeams: Team[]) {
  const teamsByNumber = new Map(
    eventTeams.map((team) => [team.teamNumber, team])
  );

  return alliances.map((row) => ({
    ...row,
    captain: mergeTeamMetadata(row.captain, teamsByNumber),
    firstPick: mergeTeamMetadata(row.firstPick, teamsByNumber),
    secondPick: mergeTeamMetadata(row.secondPick, teamsByNumber),
    thirdPick: mergeTeamMetadata(row.thirdPick, teamsByNumber),
  }));
}

function clearThirdPickSelections(alliances: AllianceRow[]) {
  return alliances.map((row) => {
    if (!row.thirdPick) {
      return row;
    }

    const nextRow = { ...row };
    delete nextRow.thirdPick;
    return nextRow;
  });
}

async function getNormalizedAllianceSelection(
  ctx: QueryCtx,
  allianceSelectionId: Id<"allianceSelections">
) {
  const allianceSelection = await ctx.db.get(allianceSelectionId);

  if (!allianceSelection) {
    return null;
  }

  return normalizeAllianceSelection(allianceSelection);
}

async function requireAllianceSelectionOwner(
  ctx: MutationCtx,
  allianceSelectionId: Id<"allianceSelections">
) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  const allianceSelection = await ctx.db.get(allianceSelectionId);

  if (!allianceSelection) {
    throw new Error("Alliance selection not found");
  }

  if (allianceSelection.ownerSubject !== identity.subject) {
    throw new Error("Unauthorized");
  }

  return allianceSelection;
}

export const listAll = query({
  args: {},
  returns: v.array(allianceSelectionWithPermissionsValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    const allianceSelections = await ctx.db
      .query("allianceSelections")
      .order("desc")
      .collect();

    return allianceSelections.map((allianceSelection) =>
      withPermissions(
        normalizeAllianceSelection(allianceSelection),
        identity?.subject
      )
    );
  },
});

export const getById = query({
  args: {
    allianceSelectionId: v.id("allianceSelections"),
  },
  returns: v.union(allianceSelectionWithPermissionsValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const allianceSelection = await getNormalizedAllianceSelection(
      ctx,
      args.allianceSelectionId
    );

    if (!allianceSelection) {
      return null;
    }

    return withPermissions(allianceSelection, identity?.subject);
  },
});

export const createBlank = mutation({
  args: {
    name: v.optional(v.string()),
  },
  returns: v.id("allianceSelections"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const timestamp = getFormattedTimestamp();

    return await ctx.db.insert("allianceSelections", {
      name: args.name?.trim() || "Untitled alliance selection",
      ownerSubject: identity.subject,
      eventCode: "",
      eventTeams: [],
      trackedPicklistIds: [],
      alliances: createEmptyAlliances(),
      includeThirdPick: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const rename = mutation({
  args: {
    allianceSelectionId: v.id("allianceSelections"),
    name: v.string(),
  },
  returns: v.id("allianceSelections"),
  handler: async (ctx, args) => {
    await requireAllianceSelectionOwner(ctx, args.allianceSelectionId);

    await ctx.db.patch(args.allianceSelectionId, {
      name: args.name.trim() || "Untitled alliance selection",
      updatedAt: getFormattedTimestamp(),
    });

    return args.allianceSelectionId;
  },
});

export const replaceEventTeams = mutation({
  args: {
    allianceSelectionId: v.id("allianceSelections"),
    eventCode: v.string(),
    eventTeams: v.array(teamValidator),
    clearSelections: v.boolean(),
  },
  returns: v.id("allianceSelections"),
  handler: async (ctx, args) => {
    const allianceSelection = await requireAllianceSelectionOwner(
      ctx,
      args.allianceSelectionId
    );
    const alliances = args.clearSelections
      ? createEmptyAlliances()
      : mergeAllianceMetadata(
          normalizeAlliances(allianceSelection.alliances),
          args.eventTeams
        );

    await ctx.db.patch(args.allianceSelectionId, {
      eventCode: normalizeEventCode(args.eventCode),
      eventTeams: args.eventTeams,
      trackedPicklistIds: args.clearSelections
        ? []
        : allianceSelection.trackedPicklistIds,
      alliances,
      updatedAt: getFormattedTimestamp(),
    });

    return args.allianceSelectionId;
  },
});

export const setTrackedPicklists = mutation({
  args: {
    allianceSelectionId: v.id("allianceSelections"),
    trackedPicklistIds: v.array(v.id("picklists")),
  },
  returns: v.id("allianceSelections"),
  handler: async (ctx, args) => {
    await requireAllianceSelectionOwner(ctx, args.allianceSelectionId);

    await ctx.db.patch(args.allianceSelectionId, {
      trackedPicklistIds: Array.from(new Set(args.trackedPicklistIds)),
      updatedAt: getFormattedTimestamp(),
    });

    return args.allianceSelectionId;
  },
});

export const replaceAlliances = mutation({
  args: {
    allianceSelectionId: v.id("allianceSelections"),
    alliances: v.array(allianceRowValidator),
  },
  returns: v.id("allianceSelections"),
  handler: async (ctx, args) => {
    await requireAllianceSelectionOwner(ctx, args.allianceSelectionId);

    await ctx.db.patch(args.allianceSelectionId, {
      alliances: normalizeAlliances(args.alliances),
      updatedAt: getFormattedTimestamp(),
    });

    return args.allianceSelectionId;
  },
});

export const setIncludeThirdPick = mutation({
  args: {
    allianceSelectionId: v.id("allianceSelections"),
    includeThirdPick: v.boolean(),
    clearThirdPickSelections: v.optional(v.boolean()),
  },
  returns: v.id("allianceSelections"),
  handler: async (ctx, args) => {
    const allianceSelection = await requireAllianceSelectionOwner(
      ctx,
      args.allianceSelectionId
    );
    const shouldClearThirdPickSelections =
      !args.includeThirdPick && args.clearThirdPickSelections;
    const updatedAlliances = shouldClearThirdPickSelections
      ? clearThirdPickSelections(normalizeAlliances(allianceSelection.alliances))
      : undefined;

    await ctx.db.patch(args.allianceSelectionId, {
      includeThirdPick: args.includeThirdPick,
      ...(updatedAlliances ? { alliances: updatedAlliances } : {}),
      updatedAt: getFormattedTimestamp(),
    });

    return args.allianceSelectionId;
  },
});

export const remove = mutation({
  args: {
    allianceSelectionId: v.id("allianceSelections"),
  },
  returns: v.id("allianceSelections"),
  handler: async (ctx, args) => {
    await requireAllianceSelectionOwner(ctx, args.allianceSelectionId);
    await ctx.db.delete(args.allianceSelectionId);

    return args.allianceSelectionId;
  },
});
