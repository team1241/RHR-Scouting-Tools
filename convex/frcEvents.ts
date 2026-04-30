"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

const frcTeamValidator = v.object({
  teamNumber: v.number(),
  nameShort: v.string(),
  primaryColor: v.optional(v.string()),
  epaMean: v.optional(v.number()),
  city: v.optional(v.string()),
  stateProv: v.optional(v.string()),
  country: v.optional(v.string()),
});

const teamEpaValidator = v.object({
  teamNumber: v.number(),
  epaMean: v.number(),
});

type FrcTeam = {
  teamNumber: number;
  nameShort: string;
  primaryColor?: string;
  epaMean?: number;
  city?: string;
  stateProv?: string;
  country?: string;
};

const worldDivisionStatboticsCodes: Record<string, string> = {
  ARCHIMEDES: "arc",
  CURIE: "cur",
  DALY: "dal",
  GALILEO: "gal",
  HOPPER: "hop",
  JOHNSON: "joh",
  MILSTEIN: "mil",
  NEWTON: "new",
};

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeColor(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(value) || /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }

  if (/^[0-9a-fA-F]{3}$/.test(value) || /^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value}`;
  }

  return value;
}

function parseEventCode(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})([a-zA-Z0-9]+)$/);

  if (match) {
    return {
      season: Number(match[1]),
      eventCode: match[2].toUpperCase(),
    };
  }

  return {
    season: new Date().getFullYear(),
    eventCode: normalized.toUpperCase(),
  };
}

function getStatboticsEventCodeSuffix(eventCode: string) {
  return (
    worldDivisionStatboticsCodes[eventCode.toUpperCase()] ??
    eventCode.toLowerCase()
  );
}

function getStatboticsEventKey(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})([a-zA-Z0-9]+)$/);

  if (match) {
    return `${match[1]}${getStatboticsEventCodeSuffix(match[2])}`;
  }

  return `${new Date().getFullYear()}${getStatboticsEventCodeSuffix(normalized)}`;
}

function addFrcColorFromRecord(
  colorsByTeam: Map<number, string>,
  value: unknown,
  fallbackTeamNumber?: number
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  const record = value as Record<string, unknown>;
  const colors = record.colors;

  if (!colors || typeof colors !== "object" || Array.isArray(colors)) {
    return;
  }

  const teamNumber = getNumber(record, "teamNumber") ?? fallbackTeamNumber;
  const primaryHex = normalizeColor(
    getString(colors as Record<string, unknown>, "primaryHex")
  );

  if (teamNumber && primaryHex) {
    colorsByTeam.set(teamNumber, primaryHex);
  }
}

function addFrcColorsFromPayload(
  colorsByTeam: Map<number, string>,
  payload: unknown,
  fallbackTeamNumber?: number
) {
  if (!payload || typeof payload !== "object") {
    return;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      addFrcColorsFromPayload(colorsByTeam, item, fallbackTeamNumber);
    }
    return;
  }

  addFrcColorFromRecord(colorsByTeam, payload, fallbackTeamNumber);

  for (const [key, value] of Object.entries(payload)) {
    const teamNumber = Number(key);
    addFrcColorsFromPayload(
      colorsByTeam,
      value,
      Number.isFinite(teamNumber) ? teamNumber : fallbackTeamNumber
    );
  }
}

function normalizeFrcColors(payload: unknown) {
  const colorsByTeam = new Map<number, string>();
  addFrcColorsFromPayload(colorsByTeam, payload);

  return colorsByTeam;
}

function getCredentials() {
  const basicAuth = process.env.FRC_EVENTS_BASIC_AUTH;

  if (basicAuth) {
    return basicAuth;
  }

  const username =
    process.env.FRC_EVENTS_USERNAME ??
    process.env.FIRST_API_USERNAME ??
    process.env.FIRST_USERNAME;
  const token =
    process.env.FRC_EVENTS_AUTH_TOKEN ??
    process.env.FRC_EVENTS_API_TOKEN ??
    process.env.FIRST_API_AUTH_TOKEN ??
    process.env.FIRST_API_TOKEN ??
    process.env.FIRST_AUTH_TOKEN ??
    process.env.FRC_EVENTS_PASSWORD ??
    process.env.FIRST_API_PASSWORD;

  if (!username || !token) {
    throw new Error(
      "Missing FRC Events API credentials. Set FRC_EVENTS_USERNAME and FRC_EVENTS_API_TOKEN in the Convex environment."
    );
  }

  return `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`;
}

function normalizeTeam(value: unknown): FrcTeam | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const teamNumber = getNumber(record, "teamNumber");

  if (!teamNumber) {
    return null;
  }

  return {
    teamNumber,
    nameShort:
      getString(record, "nameShort") ??
      getString(record, "nameFull") ??
      `Team ${teamNumber}`,
    primaryColor: normalizeColor(
      getString(record, "primaryColor") ??
        getString(record, "primary_color") ??
        getString(record, "primaryColour") ??
        getString(record, "primary_colour")
    ),
    city: getString(record, "city"),
    stateProv: getString(record, "stateProv"),
    country: getString(record, "country"),
  };
}

function normalizeTeams(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const teams = Array.isArray(record.teams)
    ? record.teams
    : Array.isArray(record.Teams)
      ? record.Teams
      : [];

  return teams
    .map(normalizeTeam)
    .filter((team): team is FrcTeam => team !== null)
    .sort((a, b) => a.teamNumber - b.teamNumber);
}

function getPageTotal(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return 1;
  }

  const record = payload as Record<string, unknown>;

  return (
    getNumber(record, "pageTotal") ??
    getNumber(record, "PageTotal") ??
    getNumber(record, "totalPages") ??
    getNumber(record, "TotalPages") ??
    1
  );
}

async function fetchFrcTeamsPage({
  authorization,
  eventCode,
  page,
  season,
}: {
  authorization: string;
  eventCode: string;
  page: number;
  season: number;
}) {
  const url = new URL(
    `https://frc-api.firstinspires.org/v3.0/${season}/teams`
  );
  url.searchParams.set("eventCode", eventCode);
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    headers: {
      Authorization: authorization,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load teams for ${season}${eventCode}: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

async function getFrcTeamsByEvent(season: number, eventCode: string) {
  const authorization = getCredentials();
  const firstPage = await fetchFrcTeamsPage({
    authorization,
    eventCode,
    page: 1,
    season,
  });
  const teamsByNumber = new Map<number, FrcTeam>();

  for (const team of normalizeTeams(firstPage)) {
    teamsByNumber.set(team.teamNumber, team);
  }

  const pageTotal = getPageTotal(firstPage);

  for (let page = 2; page <= pageTotal; page += 1) {
    const payload = await fetchFrcTeamsPage({
      authorization,
      eventCode,
      page,
      season,
    });

    for (const team of normalizeTeams(payload)) {
      teamsByNumber.set(team.teamNumber, team);
    }
  }

  return [...teamsByNumber.values()].sort(
    (a, b) => a.teamNumber - b.teamNumber
  );
}

function normalizeStatboticsEpa(payload: unknown) {
  if (!Array.isArray(payload)) {
    return new Map<number, number>();
  }

  const epaByTeam = new Map<number, number>();

  for (const item of payload) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const teamNumber = getNumber(record, "team");
    const epa = record.epa;

    if (
      !teamNumber ||
      !epa ||
      typeof epa !== "object" ||
      Array.isArray(epa)
    ) {
      continue;
    }

    const totalPoints = (epa as Record<string, unknown>).total_points;

    if (
      !totalPoints ||
      typeof totalPoints !== "object" ||
      Array.isArray(totalPoints)
    ) {
      continue;
    }

    const mean = getNumber(totalPoints as Record<string, unknown>, "mean");

    if (mean !== undefined) {
      epaByTeam.set(teamNumber, mean);
    }
  }

  return epaByTeam;
}

async function getStatboticsEpa(eventCode: string) {
  const url = new URL("https://api.statbotics.io/v3/team_events");
  url.searchParams.set("event", getStatboticsEventKey(eventCode));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return new Map<number, number>();
  }

  return normalizeStatboticsEpa(await response.json());
}

async function getFrcColorsByEvent(eventCode: string) {
  const url = new URL(
    `https://api.frc-colors.com/v1/event/${getStatboticsEventKey(eventCode)}`
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return new Map<number, string>();
  }

  return normalizeFrcColors(await response.json());
}

export const getEpaByEvent = action({
  args: {
    eventCode: v.string(),
  },
  returns: v.array(teamEpaValidator),
  handler: async (_ctx, args) => {
    const epaByTeam = await getStatboticsEpa(args.eventCode);

    return [...epaByTeam.entries()].map(([teamNumber, epaMean]) => ({
      teamNumber,
      epaMean,
    }));
  },
});

export const getTeamsByEvent = action({
  args: {
    eventCode: v.string(),
  },
  returns: v.array(frcTeamValidator),
  handler: async (_ctx, args) => {
    const { season, eventCode } = parseEventCode(args.eventCode);

    if (!eventCode) {
      return [];
    }

    const teams = await getFrcTeamsByEvent(season, eventCode);
    const [epaByTeam, colorsByTeam] = await Promise.all([
      getStatboticsEpa(args.eventCode.trim()),
      getFrcColorsByEvent(args.eventCode.trim()),
    ]);

    return teams.map((team) => ({
      ...team,
      primaryColor: colorsByTeam.get(team.teamNumber) ?? team.primaryColor,
      epaMean: epaByTeam.get(team.teamNumber),
    }));
  },
});
