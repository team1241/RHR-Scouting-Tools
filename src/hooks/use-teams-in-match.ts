import { TeamsInMatchResponse } from "@/lib/db/types"
import { QueryKeys } from "@/lib/queries/query-keys"
import { fetchScoutingApi } from "@/lib/scouting-api"
import { useQuery } from "@tanstack/react-query"

const isPositiveInteger = (value: string | null) =>
  value !== null && /^[1-9]\d*$/.test(value)

export const useTeamsInMatch = ({ eventId, matchNumber }: { eventId: string | null, matchNumber: string | null }) => {
  const hasValidParams = isPositiveInteger(eventId) && isPositiveInteger(matchNumber)

  return useQuery({
    queryKey: [QueryKeys.TeamsInMatch, eventId, matchNumber],
    queryFn: async () => {
      if (!hasValidParams) {
        throw new Error("Teams-in-match query called without valid params.")
      }

      const params = new URLSearchParams()
      params.set('eventId', eventId!)
      params.set('matchNumber', matchNumber!)
      const teamsResponse = await fetchScoutingApi<TeamsInMatchResponse>('/teams?' + params.toString())

      return teamsResponse
    },
    enabled: hasValidParams
  })
}
