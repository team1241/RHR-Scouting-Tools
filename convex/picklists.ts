import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getFormattedTimestamp } from "./utils";

const teamValidator = v.object({
  teamNumber: v.number(),
  nameShort: v.string(),
  primaryColor: v.optional(v.string()),
  epaMean: v.optional(v.number()),
  rank: v.optional(v.number()),
  city: v.optional(v.string()),
  stateProv: v.optional(v.string()),
  country: v.optional(v.string()),
});

const columnValidator = v.object({
  id: v.string(),
  name: v.string(),
  teams: v.array(teamValidator),
});

const teamEpaValidator = v.object({
  teamNumber: v.number(),
  epaMean: v.number(),
});

const teamRankValidator = v.object({
  teamNumber: v.number(),
  rank: v.number(),
});

function mergeTeamMetadata(
  columns: Array<{
    id: string;
    name: string;
    teams: Array<{
      teamNumber: number;
      nameShort: string;
      primaryColor?: string;
      epaMean?: number;
      rank?: number;
      city?: string;
      stateProv?: string;
      country?: string;
    }>;
  }>,
  eventTeams: Array<{
    teamNumber: number;
    nameShort: string;
    primaryColor?: string;
    epaMean?: number;
    rank?: number;
    city?: string;
    stateProv?: string;
    country?: string;
  }>
) {
  const teamsByNumber = new Map(
    eventTeams.map((team) => [team.teamNumber, team])
  );

  return columns.map((column) => ({
    ...column,
    teams: column.teams.map((team) => teamsByNumber.get(team.teamNumber) ?? team),
  }));
}

function mergeTeamEpa<T extends { teamNumber: number; epaMean?: number }>(
  teams: T[],
  epaValues: Array<{ teamNumber: number; epaMean: number }>
) {
  const epaByTeam = new Map(
    epaValues.map((team) => [team.teamNumber, team.epaMean])
  );

  return teams.map((team) => {
    const epaMean = epaByTeam.get(team.teamNumber);
    return epaMean === undefined ? team : { ...team, epaMean };
  });
}

function mergeTeamRank<T extends { teamNumber: number; rank?: number }>(
  teams: T[],
  rankValues: Array<{ teamNumber: number; rank: number }>
) {
  const rankByTeam = new Map(
    rankValues.map((team) => [team.teamNumber, team.rank])
  );

  return teams.map((team) => {
    const rank = rankByTeam.get(team.teamNumber);
    return rank === undefined ? team : { ...team, rank };
  });
}

const picklistWithPermissionsValidator = v.object({
  _id: v.id("picklists"),
  _creationTime: v.number(),
  name: v.string(),
  ownerSubject: v.optional(v.string()),
  eventCode: v.string(),
  eventTeams: v.array(teamValidator),
  columns: v.array(columnValidator),
  createdAt: v.string(),
  updatedAt: v.string(),
  canEdit: v.boolean(),
});

type NormalizedPicklist = {
  _id: Id<"picklists">;
  _creationTime: number;
  name: string;
  ownerSubject?: string;
  eventCode: string;
  eventTeams: Array<{
    teamNumber: number;
    nameShort: string;
    primaryColor?: string;
    epaMean?: number;
    rank?: number;
    city?: string;
    stateProv?: string;
    country?: string;
  }>;
  columns: Array<{
    id: string;
    name: string;
    teams: Array<{
      teamNumber: number;
      nameShort: string;
      primaryColor?: string;
      epaMean?: number;
      rank?: number;
      city?: string;
      stateProv?: string;
      country?: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
};

function normalizePicklist(picklist: {
  _id: Id<"picklists">;
  _creationTime: number;
  name: string;
  ownerSubject?: string;
  eventCode?: string;
  eventTeams?: NormalizedPicklist["eventTeams"];
  columns?: NormalizedPicklist["columns"];
  createdAt: string;
  updatedAt: string;
}): NormalizedPicklist {
  return {
    ...picklist,
    eventCode: picklist.eventCode ?? "",
    eventTeams: picklist.eventTeams ?? [],
    columns: picklist.columns ?? [],
  };
}

async function getNormalizedPicklist(ctx: QueryCtx, picklistId: Id<"picklists">) {
  const picklist = await ctx.db.get(picklistId);

  if (!picklist) {
    return null;
  }

  return normalizePicklist(picklist);
}

function withPermissions(
  picklist: NormalizedPicklist,
  viewerSubject: string | undefined
) {
  return {
    ...picklist,
    canEdit: Boolean(viewerSubject && picklist.ownerSubject === viewerSubject),
  };
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

async function requirePicklistOwner(
  ctx: MutationCtx,
  picklistId: Id<"picklists">
) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  const picklist = await ctx.db.get(picklistId);

  if (!picklist) {
    throw new Error("Picklist not found");
  }

  if (picklist.ownerSubject !== identity.subject) {
    throw new Error("Unauthorized");
  }

  return picklist;
}

export const listAll = query({
  args: {},
  returns: v.array(picklistWithPermissionsValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    const picklists = await ctx.db
      .query("picklists")
      .order("desc")
      .collect();

    return picklists.map((picklist) =>
      withPermissions(normalizePicklist(picklist), identity?.subject)
    );
  },
});

export const listByEventCode = query({
  args: {
    eventCode: v.string(),
  },
  returns: v.array(picklistWithPermissionsValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const eventCode = normalizeEventCode(args.eventCode);

    if (!eventCode) {
      return [];
    }

    const picklists = await ctx.db
      .query("picklists")
      .withIndex("by_event_code", (q) => q.eq("eventCode", eventCode))
      .order("desc")
      .collect();

    return picklists.map((picklist) =>
      withPermissions(normalizePicklist(picklist), identity?.subject)
    );
  },
});

export const getById = query({
  args: {
    picklistId: v.id("picklists"),
  },
  returns: v.union(picklistWithPermissionsValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const picklist = await getNormalizedPicklist(ctx, args.picklistId);

    if (!picklist) {
      return null;
    }

    return withPermissions(picklist, identity?.subject);
  },
});

export const createBlank = mutation({
  args: {
    name: v.optional(v.string()),
  },
  returns: v.id("picklists"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const timestamp = getFormattedTimestamp();

    return await ctx.db.insert("picklists", {
      name: args.name?.trim() || "Untitled picklist",
      ownerSubject: identity.subject,
      eventCode: "",
      eventTeams: [],
      columns: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const rename = mutation({
  args: {
    picklistId: v.id("picklists"),
    name: v.string(),
  },
  returns: v.id("picklists"),
  handler: async (ctx, args) => {
    await requirePicklistOwner(ctx, args.picklistId);

    await ctx.db.patch(args.picklistId, {
      name: args.name.trim() || "Untitled picklist",
      updatedAt: getFormattedTimestamp(),
    });

    return args.picklistId;
  },
});

export const replaceEventTeams = mutation({
  args: {
    picklistId: v.id("picklists"),
    eventCode: v.string(),
    eventTeams: v.array(teamValidator),
    clearColumns: v.boolean(),
  },
  returns: v.id("picklists"),
  handler: async (ctx, args) => {
    const picklist = await requirePicklistOwner(ctx, args.picklistId);

    const columns = args.clearColumns
      ? []
      : mergeTeamMetadata(picklist.columns ?? [], args.eventTeams);

    await ctx.db.patch(args.picklistId, {
      eventCode: normalizeEventCode(args.eventCode),
      eventTeams: args.eventTeams,
      columns,
      updatedAt: getFormattedTimestamp(),
    });

    return args.picklistId;
  },
});

export const replaceColumns = mutation({
  args: {
    picklistId: v.id("picklists"),
    columns: v.array(columnValidator),
  },
  returns: v.id("picklists"),
  handler: async (ctx, args) => {
    await requirePicklistOwner(ctx, args.picklistId);

    await ctx.db.patch(args.picklistId, {
      columns: args.columns,
      updatedAt: getFormattedTimestamp(),
    });

    return args.picklistId;
  },
});

export const replaceEpaValues = mutation({
  args: {
    picklistId: v.id("picklists"),
    epaValues: v.array(teamEpaValidator),
  },
  returns: v.id("picklists"),
  handler: async (ctx, args) => {
    const picklist = await requirePicklistOwner(ctx, args.picklistId);

    await ctx.db.patch(args.picklistId, {
      eventTeams: mergeTeamEpa(picklist.eventTeams ?? [], args.epaValues),
      columns: (picklist.columns ?? []).map((column) => ({
        ...column,
        teams: mergeTeamEpa(column.teams, args.epaValues),
      })),
      updatedAt: getFormattedTimestamp(),
    });

    return args.picklistId;
  },
});

export const replaceRankValues = mutation({
  args: {
    picklistId: v.id("picklists"),
    rankValues: v.array(teamRankValidator),
  },
  returns: v.id("picklists"),
  handler: async (ctx, args) => {
    const picklist = await requirePicklistOwner(ctx, args.picklistId);

    await ctx.db.patch(args.picklistId, {
      eventTeams: mergeTeamRank(picklist.eventTeams ?? [], args.rankValues),
      columns: (picklist.columns ?? []).map((column) => ({
        ...column,
        teams: mergeTeamRank(column.teams, args.rankValues),
      })),
      updatedAt: getFormattedTimestamp(),
    });

    return args.picklistId;
  },
});

export const remove = mutation({
  args: {
    picklistId: v.id("picklists"),
  },
  returns: v.id("picklists"),
  handler: async (ctx, args) => {
    await requirePicklistOwner(ctx, args.picklistId);
    await ctx.db.delete(args.picklistId);

    return args.picklistId;
  },
});
