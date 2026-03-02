import { createLoader, parseAsString, UrlKeys } from 'nuqs/server'

export const matchCardSearchParams = {
  eventId: parseAsString.withDefault(""),
  matchNumber: parseAsString.withDefault("")
} as const

export const urlKeys: UrlKeys<typeof matchCardSearchParams> = {
  eventId: "eventId",
  matchNumber: "matchNum"
} as const

export const loadMatchCardParams = createLoader(matchCardSearchParams, { urlKeys })
