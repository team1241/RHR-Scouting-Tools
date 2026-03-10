import { getMatchCard } from "@/lib/db/queries/match-card"
import { MatchCardData } from "@/lib/db/types"
import { QueryKeys } from "@/lib/queries/query-keys"
import { useMatchCardStore } from "@/stores/use-match-card-store"
import { useQuery } from "@tanstack/react-query"
import { useShallow } from "zustand/react/shallow"

export const useMatchCardData = () => {
  const { eventId, matchNumber } = useMatchCardStore(useShallow((state) => ({
    eventId: state.eventId,
    matchNumber: state.matchNumber,
  })))
  return useQuery<MatchCardData[]>({
    queryKey: [QueryKeys.MatchCard, eventId, matchNumber],
    queryFn: async () => {
      const data = await getMatchCard(Number(eventId), Number(matchNumber))
      return Array.isArray(data) ? data : []
    },
    enabled: !!eventId && !!matchNumber
  })
}
